import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  PanResponder,
  SafeAreaView,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import RenderHtml from "react-native-render-html";
import Navbar from '../Navbar';
import { apiService } from '@/api';
import { useAuth } from '@/context/AuthContext';

const { width } = Dimensions.get('window');

const NewsDetailScreen = ({ article, onBack, onNext, hasNext = true }) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
const [liked, setLiked] = useState(false);
const [likeCount, setLikeCount] = useState(article.likeCount || 0);
const [shareCount, setShareCount] = useState(article.shareCount || 0);
  const currentUser = useAuth().user;
  console.warn(commentText);
  
  const pan = useRef(new Animated.ValueXY()).current;
  const opacity = useRef(new Animated.Value(1)).current;

  // Add at the top with other state
const [isBookmarked, setIsBookmarked] = useState(false);
const [bookmarkLoading, setBookmarkLoading] = useState(false);

// Add useEffect to load initial bookmark status
useEffect(() => {
  const loadBookmarkStatus = async () => {
    try {
      if (currentUser && article.id) {
        const bookmarked = await apiService.isArticleBookmarked(currentUser.id, article.id);
        setIsBookmarked(bookmarked);
      }
    } catch (error) {
      console.error('Error loading bookmark status:', error);
    }
  };

  if (article.id) {
    loadBookmarkStatus();
  }
}, [article.id]);


  // Fetch comments when component mounts or when comments modal opens
  useEffect(() => {
    if (showComments && article.id) {
      fetchComments();
    }
  }, [showComments, article.id]);

  useEffect(() => {
  const loadShareCount = async () => {
    try {
      if (article.id) {
        const shareData = await apiService.getArticleShares(article.id);
        setShareCount(shareData.shareCount);
      }
    } catch (error) {
      console.error('Error loading share count:', error);
    }
  };

  if (article.id) {
    loadShareCount();
  }
}, [article.id]);
  // Add this useEffect after your existing useEffect
useEffect(() => {
  const loadLikeStatus = async () => {
    try {
      if (currentUser && article.id) {
        const status = await apiService.getArticleLikes(article.id, currentUser.id);
        setLiked(status.userLiked);
        setLikeCount(status.likeCount);
      }
    } catch (error) {
      console.error('Error loading like status:', error);
    }
  };

  if (article.id) {
    loadLikeStatus();
  }
}, [article.id]);


// Add handleBookmark function
const handleBookmark = async () => {
  if (bookmarkLoading) return;
  
  try {
    setBookmarkLoading(true);
    
    if (!currentUser) {
      Alert.alert('Login Required', 'Please login to bookmark articles');
      return;
    }

    // Optimistic UI update
    setIsBookmarked(!isBookmarked);

    // Make API call
    const result = await apiService.toggleBookmark(currentUser.id, article.id);
    
    // Update with actual server response
    setIsBookmarked(result.bookmarked);
    
    // Remove the Alert.alert - no success message needed

  } catch (error) {
    // Revert optimistic update on error
    setIsBookmarked(!isBookmarked);
    
    console.error('Error toggling bookmark:', error);
    Alert.alert('Error', 'Failed to update bookmark');
  } finally {
    setBookmarkLoading(false);
  }
};

const fetchComments = async () => {
  try {
    const response = await apiService.getComments({
      "articleId":article.id
    });
    
    // Check if response has the expected structure
    if (response && response.comments) {
      const organizedComments = organizeComments(response.comments);
      setComments(organizedComments);
    } else {
      console.error('Unexpected response format:', response);
      setComments([]);
    }
  } catch (error) {
    console.error("Error fetching comments:", error);
    Alert.alert('Error', 'Failed to fetch comments');
  }
};

const organizeComments = (commentsData) => {
  const commentMap = {};
  const rootComments = [];

  // First pass: create a map of all comments
  commentsData.forEach(comment => {
    commentMap[comment.id] = { ...comment, replies: [] };
  });

  // Second pass: organize into parent-child structure
  commentsData.forEach(comment => {
    if (comment.parentId && commentMap[comment.parentId]) {
      // This is a reply, add it to its parent's replies array
      commentMap[comment.parentId].replies.push(commentMap[comment.id]);
    } else {
      // This is a root-level comment
      rootComments.push(commentMap[comment.id]);
    }
  });

  return rootComments;
};

// Replace the existing handleLike function with this:
const handleLike = async () => {
  try {
    
    if (!currentUser) {
      Alert.alert('Login Required', 'Please login to like articles');
      return;
    }

    // Optimistic UI update
    const newLiked = !liked;
    const newCount = newLiked ? likeCount + 1 : likeCount - 1;
    setLiked(newLiked);
    setLikeCount(newCount);

    // Make API call
    const result = await apiService.toggleArticleLike(article.id, currentUser.id);
    
    // Update with actual server response
    setLiked(result.liked);
    setLikeCount(result.likeCount);

  } catch (error) {
    // Revert optimistic update on error
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
    
    console.error('Error toggling like:', error);
    Alert.alert('Error', 'Failed to update like status');
  }
};
// Add this with your other state declarations:
const [shareLoading, setShareLoading] = useState(false);
const handleShare = async () => {
  if (shareLoading) return;
  
  try {
    setShareLoading(true);
    
    const shareOptions = {
      message: `Check out this amazing article: "${article.title}"\n\nRead more: https://nofa-sepia.vercel.app/article/${article.id}`,
      url: `https://nofa-sepia.vercel.app/article/${article.id}`,
      title: article.title,
    };

    const result = await Share.share(shareOptions);
    
    // Only record share if user actually completed the share action
    if (result.action === Share.sharedAction) {
      
      let platform = 'other';
      
      if (result.activityType) {
        const activityType = result.activityType.toLowerCase();
        if (activityType.includes('twitter') || activityType.includes('com.twitter')) platform = 'twitter';
        else if (activityType.includes('facebook') || activityType.includes('com.facebook')) platform = 'facebook';
        else if (activityType.includes('whatsapp') || activityType.includes('net.whatsapp')) platform = 'whatsapp';
        else if (activityType.includes('linkedin') || activityType.includes('com.linkedin')) platform = 'linkedin';
        else if (activityType.includes('mail') || activityType.includes('message')) platform = 'email';
        else if (activityType.includes('copy') || activityType.includes('pasteboard')) platform = 'copy_link';
        else platform = 'other';
      }

      // Record the share after completion
      try {
        const shareResult = await apiService.recordArticleShare(
          article.id, 
          platform, 
          currentUser?.id
        );
        setShareCount(shareResult.shareCount);
        
        // Remove the success alert or make it generic
        // Alert.alert('Success', 'Article shared successfully!');
      } catch (error) {
        console.error('Error recording share:', error);
        setShareCount(prev => prev + 1);
      }
    }
    
  } catch (error) {
    console.error('Error sharing article:', error);
    Alert.alert('Error', 'Failed to share article');
  } finally {
    setShareLoading(false);
  }
};

// Update the handleAddComment function
const handleAddComment = async () => {
  if (commentText.trim() === '') {
    Alert.alert('Error', 'Please enter a comment');
    return;
  }

  if (commentText.trim().length < 3) {
    Alert.alert('Error', 'Comment must be at least 3 characters long');
    return;
  }

  if (commentText.length > 500) {
    Alert.alert('Error', 'Comment must be less than 500 characters');
    return;
  }

  setIsLoading(true);
  try {
    
    if (!currentUser) {
      Alert.alert('Login Required', 'Please login to add comments');
      return;
    }

    const commentData = {
      articleId: article.id,
      content: commentText.trim(),
      authorName: currentUser.name  || 'Anonymous User',
      authorEmail: currentUser.email || '',
      userId: currentUser.id,
    };

    const result = await apiService.createComment(commentData);

    if (result.success) {
      setCommentText('');
      await fetchComments(); // Refresh comments
      
    } else {
      Alert.alert('Error', 'Failed to add comment');
    }
  } catch (error) {
    console.error('Error adding comment:', error);
    Alert.alert('Error', error.message || 'Failed to add comment');
  } finally {
    setIsLoading(false);
  }
};

// Update the handleAddReply function
const handleAddReply = async (parentId) => {
  if (replyText.trim() === '') {
    Alert.alert('Error', 'Please enter a reply');
    return;
  }

  if (replyText.trim().length < 3) {
    Alert.alert('Error', 'Reply must be at least 3 characters long');
    return;
  }

  if (replyText.length > 500) {
    Alert.alert('Error', 'Reply must be less than 500 characters');
    return;
  }

  setIsLoading(true);
  try {
    
    if (!currentUser) {
      Alert.alert('Login Required', 'Please login to reply to comments');
      return;
    }

    const replyData = {
      articleId: article.id,
      content: replyText.trim(),
      parentId: parentId,
      authorName: currentUser.name || 'Anonymous User',
      authorEmail: currentUser.email || '',
      userId: currentUser.id,
    };

    const result = await apiService.createComment(replyData);

    if (result.success) {
      setReplyText('');
      setReplyingTo(null);
      await fetchComments(); // Refresh comments
      
    } else {
      Alert.alert('Error', 'Failed to add reply');
    }
  } catch (error) {
    console.error('Error adding reply:', error);
    Alert.alert('Error', error.message || 'Failed to add reply');
  } finally {
    setIsLoading(false);
  }
};

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value,
        });
      },
      onPanResponderMove: (evt, gestureState) => {
        pan.setValue({ x: gestureState.dx, y: 0 });
        const progress = Math.abs(gestureState.dx) / width;
        opacity.setValue(1 - progress * 0.3);
      },
      onPanResponderRelease: (evt, gestureState) => {
        pan.flattenOffset();
        
        const shouldGoBack = gestureState.dx > width * 0.3 && gestureState.vx > 0;
        const shouldGoNext = gestureState.dx < -width * 0.3 && gestureState.vx < 0;

        if (shouldGoBack) {
          Animated.parallel([
            Animated.timing(pan.x, {
              toValue: width,
              duration: 300,
              useNativeDriver: false,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 300,
              useNativeDriver: false,
            }),
          ]).start(() => {
            if (onBack) onBack();
          });
        } else if (shouldGoNext && hasNext) {
          Animated.parallel([
            Animated.timing(pan.x, {
              toValue: -width,
              duration: 300,
              useNativeDriver: false,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 300,
              useNativeDriver: false,
            }),
          ]).start(() => {
            if (onNext) onNext();
          });
        } else {
          Animated.parallel([
            Animated.spring(pan.x, {
              toValue: 0,
              useNativeDriver: false,
            }),
            Animated.spring(opacity, {
              toValue: 1,
              useNativeDriver: false,
            }),
          ]).start();
        }
      },
    })
  ).current;

  const renderReply = (reply, depth = 1) => (
    <View key={reply.id} style={[styles.replyItem, { marginLeft: depth * 20 }]}>
      <View style={styles.commentHeader}>
        <Text style={styles.commentAuthor}>{reply.authorName}</Text>
        <Text style={styles.commentTime}>
          {new Date(reply.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <Text style={styles.commentText}>{reply.content}</Text>
      <View style={styles.commentActions}>
        <TouchableOpacity
          style={styles.commentReplyButton}
          onPress={() => setReplyingTo(reply.id)}
        >
          <Text style={styles.commentReply}>Reply</Text>
        </TouchableOpacity>
      </View>
      
      {reply.replies && reply.replies.length > 0 && (
        <View style={styles.repliesContainer}>
          {reply.replies.map(nestedReply => renderReply(nestedReply, depth + 1))}
        </View>
      )}
      
      {replyingTo === reply.id && (
        <View style={styles.replyInputContainer}>
          <TextInput
            style={styles.replyInput}
            placeholder={`Reply to ${reply.authorName}...`}
            value={replyText}
            onChangeText={setReplyText}
            multiline
            maxLength={500}
          />
          <View style={styles.replyActions}>
            <TouchableOpacity
              style={styles.cancelReplyButton}
              onPress={() => {
                setReplyingTo(null);
                setReplyText('');
              }}
            >
              <Text style={styles.cancelReplyText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sendReplyButton}
              onPress={() => handleAddReply(reply.id)}
              disabled={isLoading}
            >
              <Text style={styles.sendReplyText}>
                {isLoading ? 'Sending...' : 'Send'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  const renderCommentItem = ({ item }) => (
    <View style={styles.commentItem}>
      <View style={styles.commentHeader}>
        <Text style={styles.commentAuthor}>{item.authorName}</Text>
        <Text style={styles.commentTime}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <Text style={styles.commentText}>{item.content}</Text>
      <View style={styles.commentActions}>
        <TouchableOpacity
          style={styles.commentReplyButton}
          onPress={() => setReplyingTo(item.id)}
        >
          <Text style={styles.commentReply}>Reply</Text>
        </TouchableOpacity>
        {item.replies && item.replies.length > 0 && (
          <Text style={styles.replyCount}>
            {item.replies.length} {item.replies.length === 1 ? 'reply' : 'replies'}
          </Text>
        )}
      </View>

      {/* Render replies */}
      {item.replies && item.replies.length > 0 && (
        <View style={styles.repliesContainer}>
          {item.replies.map(reply => renderReply(reply))}
        </View>
      )}

      {/* Reply input for main comment */}
      {replyingTo === item.id && (
        <View style={styles.replyInputContainer}>
          <TextInput
            style={styles.replyInput}
            placeholder={`Reply to ${item.authorName}...`}
            value={replyText}
            onChangeText={setReplyText}
            multiline
            maxLength={500}
          />
          <View style={styles.replyActions}>
            <TouchableOpacity
              style={styles.cancelReplyButton}
              onPress={() => {
                setReplyingTo(null);
                setReplyText('');
              }}
            >
              <Text style={styles.cancelReplyText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sendReplyButton}
              onPress={() => handleAddReply(item.id)}
              disabled={isLoading}
            >
              <Text style={styles.sendReplyText}>
                {isLoading ? 'Sending...' : 'Send'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  // Function to process tags - handle both string and array formats
  const processTags = (tags) => {
    if (!tags) return [];
    
    if (typeof tags === 'string') {
      return tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }
    
    if (Array.isArray(tags)) {
      return tags.filter(tag => tag && tag.trim());
    }
    
    return [];
  };

  // Function to process keywords similarly
  const processKeywords = (keywords) => {
    if (!keywords) return [];
    
    if (typeof keywords === 'string') {
      return keywords.split(',').map(keyword => keyword.trim()).filter(keyword => keyword);
    }
    
    if (Array.isArray(keywords)) {
      return keywords.filter(keyword => keyword && keyword.trim());
    }
    
    return [];
  };

  const tagsArray = processTags(article.tags);
  const keywordsArray = processKeywords(article.keywords);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <Animated.View 
        style={[
          styles.container, 
          {
            transform: [{ translateX: pan.x }],
            opacity: opacity,
          }
        ]}
        {...panResponder.panHandlers}
      >
        <Navbar/>

        <ScrollView style={styles.detailContent} showsVerticalScrollIndicator={false}>
          {/* Article Image */}
          <View style={styles.articleImageContainer}>
            <Image 
              source={{ uri: article.featuredImage || 'https://via.placeholder.com/800x400' }} 
              style={styles.articleImage} 
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.3)']}
              style={styles.articleImageGradient}
            />
            {article.isTrending && (
              <View style={styles.exclusiveTagDetail}>
                <Text style={styles.exclusiveText}>TRENDING</Text>
              </View>
            )}
            
            <View style={styles.swipeIndicators}>
              <View style={styles.swipeIndicator}>
                <Text style={styles.swipeText}>← Swipe to go back</Text>
              </View>
            </View>
          </View>

          {/* Article Content */}
          <View style={styles.articleContentContainer}>
            {/* Source and Time */}
            <View style={styles.articleMeta}>
              <Text style={styles.articleSource}>📺 {article.authorName || "Unknown Author"}</Text>
              <Text style={styles.articleTime}>
                {article.publicationDate ? 
                  new Date(article.publicationDate).toLocaleDateString() : 
                  'Recently'
                }
              </Text>
            </View>

            {/* Title */}
            <Text style={styles.articleTitle}>{article.title}</Text>

            {/* Author and Location */}
            <View style={styles.authorSection}>
              <Text style={styles.authorText}>By {article.authorName}</Text>
              <Text style={styles.locationText}>📍 {article.location || "Global"}</Text>
            </View>

            {/* Tags */}
            {tagsArray.length > 0 && (
              <View style={styles.tagsContainer}>
                {tagsArray.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Keywords */}
            {keywordsArray.length > 0 && (
              <View style={styles.keywordsContainer}>
                <Text style={styles.keywordsLabel}>Keywords:</Text>
                <View style={styles.keywordsWrapper}>
                  {keywordsArray.map((keyword, index) => (
                    <View key={index} style={styles.keyword}>
                      <Text style={styles.keywordText}>{keyword}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Article Summary */}
            {article.summary && (
              <Text style={styles.articleLead}>{article.summary}</Text>
            )}

            {/* Article Body - HTML Content */}
            <View style={styles.htmlContentContainer}>
              <RenderHtml
                contentWidth={width - 40}
                source={{ html: article.content || '<p>No content available</p>' }}
                tagsStyles={{
                  p: { 
                    fontSize: 16, 
                    lineHeight: 24, 
                    color: '#444',
                    marginBottom: 15,
                    textAlign: 'justify'
                  },
                  h1: { 
                    fontSize: 24, 
                    fontWeight: 'bold', 
                    color: '#333',
                    marginBottom: 15,
                    marginTop: 10
                  },
                  h2: { 
                    fontSize: 20, 
                    fontWeight: 'bold', 
                    color: '#333',
                    marginBottom: 12,
                    marginTop: 8
                  },
                  h3: { 
                    fontSize: 18, 
                    fontWeight: 'bold', 
                    color: '#333',
                    marginBottom: 10
                  },
                  img: {
                    marginVertical: 10
                  }
                }}
              />
            </View>

        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{article.viewCount || 0}</Text>
            <Text style={styles.statLabel}>Views</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{likeCount}</Text>
            <Text style={styles.statLabel}>Likes</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{shareCount}</Text>
            <Text style={styles.statLabel}>Shares</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{comments.length}</Text>
            <Text style={styles.statLabel}>Comments</Text>
          </View>
        </View>

          </View>
        </ScrollView>
<View style={styles.actionBar}>
  <TouchableOpacity 
    style={[styles.actionButton, liked && styles.likedButton]}
    onPress={handleLike}
  >
    <Text style={[styles.actionIcon, liked && styles.likedIcon]}>
      {liked ? '♥' : '♡'}
    </Text>
    <Text style={[styles.actionText, liked && styles.likedText]}>
      {likeCount}
    </Text>
  </TouchableOpacity>

  <TouchableOpacity 
    style={styles.actionButton}
    onPress={() => setShowComments(true)}
  >
    <Text style={styles.actionIcon}>💬</Text>
    <Text style={styles.actionText}>{comments.length}</Text>
  </TouchableOpacity>

  <TouchableOpacity 
    style={[styles.actionButton, shareLoading && styles.shareButtonLoading]}
    onPress={handleShare}
    disabled={shareLoading}
  >
    <Text style={styles.actionIcon}>
      {shareLoading ? '⏳' : '⬆️'}
    </Text>
    <Text style={styles.actionText}>
      {shareLoading ? 'Sharing...' : `Share${shareCount > 0 ? ` (${shareCount})` : ''}`}
    </Text>
  </TouchableOpacity>

  <TouchableOpacity 
    style={[styles.saveButton, isBookmarked && styles.bookmarkedButton]}
    onPress={handleBookmark}
    disabled={bookmarkLoading}
  >
    <Text style={[styles.saveIcon, isBookmarked && styles.bookmarkedIcon]}>
      {bookmarkLoading ? '⏳' : (isBookmarked ? '★' : '☆')}
    </Text>
  </TouchableOpacity>
</View>

      </Animated.View>

      {/* Enhanced Comments Modal with Nested Replies */}
      <Modal
        visible={showComments}
        animationType="slide"
        onRequestClose={() => setShowComments(false)}
      >
        <SafeAreaView style={styles.commentsModal}>
          <View style={styles.commentsHeader}>
            <Text style={styles.commentsTitle}>Comments ({comments.length})</Text>
            <TouchableOpacity onPress={() => setShowComments(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text>Loading comments...</Text>
            </View>
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderCommentItem}
              style={styles.commentsList}
              showsVerticalScrollIndicator={false}
              refreshing={isLoading}
              onRefresh={fetchComments}
            />
          )}
<View style={styles.commentInputContainer}>
  <TextInput
    style={styles.commentInput}
    placeholder="Add a comment..."
    value={commentText}
    onChangeText={setCommentText}
    multiline
    maxLength={500}
  />
  <View style={styles.commentInputFooter}>
    <Text style={styles.characterCount}>
      {commentText.length}/500
    </Text>
    <TouchableOpacity 
      style={[
        styles.sendButton, 
        (commentText.trim().length < 3 || isLoading) && styles.sendButtonDisabled
      ]} 
      onPress={handleAddComment}
      disabled={commentText.trim().length < 3 || isLoading}
    >
      <Text style={styles.sendButtonText}>
        {isLoading ? 'Sending...' : 'Send'}
      </Text>
    </TouchableOpacity>
  </View>
</View>

        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  detailContent: {
    flex: 1,
    backgroundColor: '#fff',
  },
  articleImageContainer: {
    position: 'relative',
    height: 300,
  },
  articleImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  articleImageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
  },
  exclusiveTagDetail: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#FF4444',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  exclusiveText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  swipeIndicators: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  swipeIndicator: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  swipeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  articleContentContainer: {
    padding: 20,
  },
  articleMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  articleSource: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  articleTime: {
    fontSize: 12,
    color: '#999',
  },
  articleTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    lineHeight: 34,
    marginBottom: 15,
  },
  authorSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  authorText: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
  locationText: {
    fontSize: 12,
    color: '#999',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  tag: {
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  tagText: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '600',
  },
  keywordsContainer: {
    marginBottom: 20,
  },
  keywordsLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  keywordsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  keyword: {
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  keywordText: {
    fontSize: 10,
    color: '#2196F3',
    fontWeight: '500',
  },
  articleLead: {
    fontSize: 18,
    lineHeight: 26,
    color: '#333',
    marginBottom: 25,
    fontWeight: '500',
    textAlign: 'justify',
  },
  htmlContentContainer: {
    marginBottom: 25,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    paddingVertical: 20,
    marginVertical: 25,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  // Enhanced Professional Action Bar Styles
  // actionBar: {
  //   flexDirection: 'row',
  //   justifyContent: 'space-between',
  //   alignItems: 'center',
  //   paddingHorizontal: 15,
  //   paddingVertical: 12,
  //   backgroundColor: '#fff',
  //   borderTopWidth: 1,
  //   borderTopColor: '#e0e0e0',
  //   elevation: 8,
  //   shadowColor: '#000',
  //   shadowOffset: { width: 0, height: -3 },
  //   shadowOpacity: 0.15,
  //   shadowRadius: 5,
  // },
  // actionButton: {
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   paddingHorizontal: 14,
  //   paddingVertical: 10,
  //   borderRadius: 25,
  //   backgroundColor: '#f5f5f5',
  //   minWidth: 65,
  //   justifyContent: 'center',
  //   elevation: 2,
  //   shadowColor: '#000',
  //   shadowOffset: { width: 0, height: 1 },
  //   shadowOpacity: 0.1,
  //   shadowRadius: 2,
  //   borderWidth: 0, // Add this to ensure no border
  // },
  // likedButton: {
  //   backgroundColor: '#ffe6e6',
  //   borderColor: '#ff6b6b',
  //   borderWidth: 1,
  // },
  shareActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: '#2196F3',
    elevation: 3,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  actionIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  likedIcon: {
    fontSize: 16,
  },
  shareIcon: {
    fontSize: 14,
    marginRight: 6,
    color: '#fff',
  },
  actionText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },
  likedText: {
    color: '#ff6b6b',
  },
  shareText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  // Enhanced Comments Modal Styles
  commentsModal: {
    flex: 1,
    backgroundColor: '#fff',
  },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fafafa',
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 20,
    color: '#666',
    fontWeight: 'bold',
    padding: 5,
  },
  commentsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  commentItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  commentTime: {
    fontSize: 12,
    color: '#999',
  },
  commentText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
    marginBottom: 10,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  commentReplyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f8ff',
    borderRadius: 15,
  },
  commentReply: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '600',
  },
  replyCount: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  // Nested Replies Styles
  repliesContainer: {
    marginTop: 10,
    paddingLeft: 0,
  },
  replyItem: {
    paddingVertical: 12,
    paddingLeft: 15,
    marginTop: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#e0e0e0',
  },
  replyInputContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  replyInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
    fontSize: 14,
    maxHeight: 80,
  },
  replyActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelReplyButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
  },
  cancelReplyText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '500',
  },
  sendReplyButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    backgroundColor: '#4CAF50',
  },
  sendReplyText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // commentInputContainer: {
  //   flexDirection: 'row',
  //   alignItems: 'flex-end',
  //   paddingHorizontal: 20,
  //   paddingVertical: 15,
  //   borderTopWidth: 1,
  //   borderTopColor: '#f0f0f0',
  //   backgroundColor: '#fff',
  // },
  // commentInput: {
  //   flex: 1,
  //   borderWidth: 1,
  //   borderColor: '#ddd',
  //   borderRadius: 20,
  //   paddingHorizontal: 15,
  //   paddingVertical: 10,
  //   marginRight: 10,
  //   maxHeight: 100,
  //   fontSize: 14,
  //   backgroundColor: '#f9f9f9',
  // },
  // sendButton: {
  //   backgroundColor: '#4CAF50',
  //   paddingHorizontal: 20,
  //   paddingVertical: 12,
  //   borderRadius: 20,
  //   elevation: 2,
  //   shadowColor: '#4CAF50',
  //   shadowOffset: { width: 0, height: 1 },
  //   shadowOpacity: 0.3,
  //   shadowRadius: 2,
  // },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  enhancedShareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#848e96ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    marginHorizontal: 4,
    minWidth: 80,
    justifyContent: 'center',
  },
  
  shareButtonLoading: {
    backgroundColor: '#90CAF9',
    elevation: 1,
  },
  
  enhancedShareIcon: {
    fontSize: 16,
    marginRight: 6,
    fontWeight: 'bold',
    transform: [{ rotate: '0deg' }], // You can animate this
  },
  
  enhancedShareText: {
    fontSize: 12,
    color: '#000',
    fontWeight: '600',
  },
  
  // Enhanced Bookmark/Save Button
  saveButton: {
    padding: 10,
    borderRadius: 25,
    backgroundColor: '#f8f9fa',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#e9ecef',
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  bookmarkedButton: {
    backgroundColor: '#FFF3CD',
    borderColor: '#FFEAA7',
    shadowColor: '#FDCB6E',
    shadowOpacity: 0.3,
    elevation: 3,
    transform: [{ scale: 1.05 }], // Slight scale up when bookmarked
  },
  
  saveIcon: {
    fontSize: 20,
    color: '#6c757d',
    textAlign: 'center',
  },
  
  bookmarkedIcon: {
    color: '#F39C12',
    textShadowColor: '#E67E22',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  
  // Updated Action Bar for better spacing
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  
  shareButtonModern: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#6c757d',
    minWidth: 75,
    justifyContent: 'center',
  },
  
  shareIconModern: {
    fontSize: 16,
    marginRight: 5,
    color: '#6c757d',
  },
  
  shareTextModern: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: '#f8f9fa',
    minWidth: 65,
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  
  likedButton: {
    backgroundColor: '#FFEBEE',
    borderColor: '#F8BBD9',
    shadowColor: '#E91E63',
    shadowOpacity: 0.2,
  },
  commentInputContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  commentInputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
  },
  sendButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
    elevation: 0,
    shadowOpacity: 0,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 14,
    backgroundColor: '#f9f9f9',
  },
});

export default NewsDetailScreen;