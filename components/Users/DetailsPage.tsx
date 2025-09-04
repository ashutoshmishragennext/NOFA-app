import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  PanResponder,
  SafeAreaView,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import RenderHtml from "react-native-render-html";
import Navbar from '../Navbar';
import CommentsSection from './CommentsPage';
import { apiService } from '@/api';
import { useAuth } from '@/context/AuthContext';

const { width } = Dimensions.get('window');

const NewsDetailScreen = ({ article, onBack, onNext, hasNext = true }) => {
  const [showComments, setShowComments] = useState(false);
  const [commentsCount, setCommentsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(article.likeCount || 0);
  const [shareCount, setShareCount] = useState(article.shareCount || 0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  
  // Local state for pending likes
  const [pendingLikeAction, setPendingLikeAction] = useState(null);
  const [lastLikeUpdate, setLastLikeUpdate] = useState(null);
  
  const currentUser = useAuth().user;
  const pan = useRef(new Animated.ValueXY()).current;
  const opacity = useRef(new Animated.Value(1)).current;
  
  // Timer ref for batching like updates
  const likeUpdateTimer = useRef(null);

  const LIKE_BATCH_DELAY = 1 * 60 * 1000; // 1 minute in milliseconds
  const LIKE_STORAGE_KEY = `article_likes_${article.id}`;

  // Load initial states including local like state
  useEffect(() => {
    const initializeLikeState = async () => {
      try {
        if (currentUser && article.id) {
          setLikeLoading(true);
          
          // STEP 1: Check for pending likes in AsyncStorage FIRST
          const localLikeData = await AsyncStorage.getItem(LIKE_STORAGE_KEY);
          
          if (localLikeData) {
            const parsedData = JSON.parse(localLikeData);
            
            // Verify this is for the same user and article
            if (parsedData.userId === currentUser.id && parsedData.articleId === article.id) {
              console.log('Found pending likes, syncing to server first...');
              
              // STEP 2: Sync pending likes to server immediately
              await syncPendingLikesToServer(parsedData);
            } else {
              // Different user/article, clear stale data
              await AsyncStorage.removeItem(LIKE_STORAGE_KEY);
            }
          }
          
          // STEP 3: Now load fresh server state
          await loadServerLikeState();
          
          // Load bookmark status
          const bookmarked = await apiService.isArticleBookmarked(currentUser.id, article.id);
          setIsBookmarked(bookmarked);
          
          setLikeLoading(false);
        }
      } catch (error) {
        console.error('Error initializing like state:', error);
        setLikeLoading(false);
      }
    };

    if (article.id) {
      initializeLikeState();
    }

    // Cleanup timer on unmount
    return () => {
      if (likeUpdateTimer.current) {
        clearTimeout(likeUpdateTimer.current);
      }
    };
  }, [article.id, currentUser?.id]);

  // Separate function to load server state
  const loadServerLikeState = async () => {
    try {
      const status = await apiService.getArticleLikes(article.id, currentUser.id);
      setLiked(status.userLiked);
      setLikeCount(status.likeCount);
      console.log('Loaded server state:', status);
    } catch (error) {
      console.error('Error loading server like state:', error);
    }
  };

  // Updated sync function for pending likes
  const syncPendingLikesToServer = async (pendingData = null) => {
    try {
      let dataToSync = pendingData;
      
      if (!dataToSync) {
        const localLikeData = await AsyncStorage.getItem(LIKE_STORAGE_KEY);
        if (!localLikeData) return;
        dataToSync = JSON.parse(localLikeData);
      }

      console.log('Syncing pending data:', dataToSync);

      // Get current server state
      const currentServerState = await apiService.getArticleLikes(article.id, currentUser?.id);
      console.log('Current server state:', currentServerState);

      // Compare final local state with server state
      if (dataToSync.finalLikedState !== currentServerState.userLiked) {
        console.log('States differ, making API call...');
        
        const result = await apiService.toggleArticleLike(article.id, currentUser ? currentUser.id : '');
        console.log('API result:', result);
        
        // Update UI with server response
        setLiked(result.liked);
        setLikeCount(result.likeCount);
      } else {
        console.log('States match, no API call needed');
        // States match, just update UI with server data
        setLiked(currentServerState.userLiked);
        setLikeCount(currentServerState.likeCount);
      }
      
      // Clear AsyncStorage after successful sync
      await AsyncStorage.removeItem(LIKE_STORAGE_KEY);
      setPendingLikeAction(null);
      setLastLikeUpdate(null);
      
      console.log('Pending likes synced and cleared');
      
    } catch (error) {
      console.error('Error syncing pending likes:', error);
      throw error; // Re-throw to handle in caller
    }
  };

  // Load share count
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

  // Schedule like sync with server
  const scheduleLikeSync = () => {
    if (likeUpdateTimer.current) {
      clearTimeout(likeUpdateTimer.current);
    }

    likeUpdateTimer.current = setTimeout(() => {
      syncLikesToServer();
    }, LIKE_BATCH_DELAY);
  };

  // Updated handleLike with better data structure
  const handleLike = async () => {
    try {
      if (!currentUser) {
        Alert.alert('Login Required', 'Please login to like articles');
        return;
      }

      // Calculate new state
      const newLiked = !liked;
      const newCount = newLiked ? likeCount + 1 : likeCount - 1;
      const timestamp = Date.now();

      // Immediate UI update
      setLiked(newLiked);
      setLikeCount(newCount);
      setLastLikeUpdate(timestamp);
      setPendingLikeAction('pending');

      // Store in AsyncStorage with proper structure
      const localLikeData = {
        userId: currentUser.id,
        articleId: article.id,
        finalLikedState: newLiked,
        finalCount: newCount,
        timestamp: timestamp,
        needsSync: true
      };

      await AsyncStorage.setItem(LIKE_STORAGE_KEY, JSON.stringify(localLikeData));
      console.log('Stored pending like data:', localLikeData);

      // Schedule sync
      scheduleLikeSync();

    } catch (error) {
      console.error('Error handling like:', error);
      // Revert on error
      setLiked(!liked);
      setLikeCount(!liked ? likeCount - 1 : likeCount + 1);
      Alert.alert('Error', 'Failed to update like status');
    }
  };

  // Updated regular sync (called by timer)
  const syncLikesToServer = async () => {
    try {
      await syncPendingLikesToServer();
    } catch (error) {
      console.error('Error in scheduled sync:', error);
      // Retry after delay
      setTimeout(() => {
        syncLikesToServer();
      }, 30000);
    }
  };

  // Force sync likes (can be called manually if needed)
  const forceSyncLikes = async () => {
    if (pendingLikeAction) {
      if (likeUpdateTimer.current) {
        clearTimeout(likeUpdateTimer.current);
      }
      await syncLikesToServer();
    }
  };

  // Callback to update comments count from CommentsSection
  const handleCommentsCountChange = (count) => {
    setCommentsCount(count);
  };

  // Updated bookmark handler
  const handleBookmark = async () => {
    if (bookmarkLoading) return;
    
    try {
      setBookmarkLoading(true);
      
      if (!currentUser) {
        Alert.alert('Login Required', 'Please login to bookmark articles');
        return;
      }

      setIsBookmarked(!isBookmarked);
      const result = await apiService.toggleBookmark(currentUser.id, article.id);
      setIsBookmarked(result.bookmarked);

    } catch (error) {
      setIsBookmarked(!isBookmarked);
      console.error('Error toggling bookmark:', error);
      Alert.alert('Error', 'Failed to update bookmark');
    } finally {
      setBookmarkLoading(false);
    }
  };

  // Share handler
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

        try {
          const shareResult = await apiService.recordArticleShare(
            article.id, 
            platform, 
            currentUser?.id
          );
          setShareCount(shareResult.shareCount);
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

  // Pan responder for swipe gestures
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
          // Force sync likes before navigation
          forceSyncLikes();
          
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
          // Force sync likes before navigation
          forceSyncLikes();
          
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

  // Helper functions for processing tags and keywords
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
                <Text style={styles.statNumber}>{commentsCount}</Text>
                <Text style={styles.statLabel}>Comments</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Updated Action Bar with clean icon design */}
        <View style={styles.actionBar}>
          {/* Like Button */}
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleLike}
            disabled={likeLoading}
          >
            {likeLoading ? (
              <Ionicons name="hourglass-outline" size={24} color="#999" />
            ) : (
              <Ionicons 
                name={liked ? "heart" : "heart-outline"} 
                size={24} 
                color={liked ? "#ae0202ff" : "#999"} 
              />
            )}
            <Text style={[
              styles.actionText,
              liked && styles.activeActionTextRed,
            ]}>
              {likeCount}
            </Text>
          </TouchableOpacity>

          {/* Comment Button */}
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowComments(true)}
          >
            <Ionicons name="chatbubble-outline" size={24} color="#999" />
            <Text style={styles.actionText}>{commentsCount}</Text>
          </TouchableOpacity>

          {/* Share Button */}
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleShare}
            disabled={shareLoading}
          >
            {shareLoading ? (
              <Ionicons name="hourglass-outline" size={24} color="#999" />
            ) : (
              <Ionicons name="share-outline" size={24} color="#999" />
            )}
            <Text style={styles.actionText}>
              {shareLoading ? 'Sharing...' : shareCount > 0 ? shareCount : 'Share'}
            </Text>
          </TouchableOpacity>

          {/* Bookmark Button */}
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleBookmark}
            disabled={bookmarkLoading}
          >
            {bookmarkLoading ? (
              <Ionicons name="hourglass-outline" size={24} color="#999" />
            ) : (
              <Ionicons 
                name={isBookmarked ? "bookmark" : "bookmark-outline"} 
                size={24} 
                color={isBookmarked ? "#4CAF50" : "#999"} 
              />
            )}
            <Text style={[
              styles.actionText,
              isBookmarked && styles.activeActionText
            ]}>
              Saved
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Comments Section Component */}
      <CommentsSection
        visible={showComments}
        onClose={() => setShowComments(false)}
        articleId={article.id}
        onCommentsCountChange={handleCommentsCountChange}
      />
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
  // Updated Action Bar styles - clean like bottom navigation
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontWeight: '500',
  },
  activeActionText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  activeActionTextRed: {
    color: '#ae0202ff',
    fontWeight: '600',
  },
});

export default NewsDetailScreen;
