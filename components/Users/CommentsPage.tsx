import React, { useState, useEffect } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { apiService } from '@/api';
import { useAuth } from '@/context/AuthContext';

const CommentsSection = ({
  visible,
  onClose,
  articleId,
  onCommentsCountChange
}) => {
  const [inputText, setInputText] = useState(''); // Single input for all
  const [replyingTo, setReplyingTo] = useState(null); // Who we're replying to
  const [comments, setComments] = useState([]);
  const [loadedReplies, setLoadedReplies] = useState({});
  const [loadingReplies, setLoadingReplies] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const currentUser = useAuth().user;

  useEffect(() => {
    if (visible && articleId) {
      fetchRootComments();
    } else {
      // Reset state when modal closes
      setComments([]);
      setLoadedReplies({});
      setLoadingReplies({});
      setReplyingTo(null);
      setInputText('');
    }
  }, [visible, articleId]);

  const fetchRootComments = async () => {
    setIsInitialLoading(true);
    try {
      const response = await apiService.getComments({
        articleId: articleId
      });

      if (response && response.comments) {
        console.log('First comment structure:', JSON.stringify(response.comments[0], null, 2));
        setComments(response.comments);
        onCommentsCountChange && onCommentsCountChange(response.count);
      } else {
        console.error('Unexpected response format:', response);
        setComments([]);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
      Alert.alert('Error', 'Failed to fetch comments');
    } finally {
      setIsInitialLoading(false);
    }
  };

  const loadReplies = async (commentId) => {
    if (loadedReplies[commentId] || loadingReplies[commentId]) return;

    setLoadingReplies(prev => ({ ...prev, [commentId]: true }));

    try {
      const response = await apiService.getCommentReplies(commentId);

      if (response && response.comments) {
        setComments(prevComments =>
          prevComments.map(comment =>
            comment.id === commentId
              ? { ...comment, replies: response.comments }
              : comment
          )
        );
        setLoadedReplies(prev => ({ ...prev, [commentId]: true }));
      }
    } catch (error) {
      console.error("Error loading replies:", error);
      Alert.alert('Error', 'Failed to load replies');
    } finally {
      setLoadingReplies(prev => ({ ...prev, [commentId]: false }));
    }
  };

  const handleSubmit = async () => {
    if (inputText.trim() === '') {
      Alert.alert('Error', 'Please enter a comment');
      return;
    }

    if (inputText.trim().length < 3) {
      Alert.alert('Error', 'Comment must be at least 3 characters long');
      return;
    }

    if (inputText.length > 500) {
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
        articleId: articleId,
        content: inputText.trim(),
        authorName: currentUser.name || 'Anonymous User',
        authorEmail: currentUser.email || '',
        userId: currentUser.id,
        ...(replyingTo && { parentId: replyingTo.id }) // Add parentId if replying
      };

      const result = await apiService.createComment(commentData);

      if (result.success) {
        setInputText('');

        if (replyingTo) {
  // Handle reply
  setComments(prevComments => 
    prevComments.map(comment => {
      if (comment.id === replyingTo.id) {
        const currentCount = parseInt(comment.replyCount) || 0;
        const updatedComment = { 
          ...comment, 
          replyCount: (currentCount + 1).toString() // Keep as string to match API format
        };
        
        // If replies are loaded, add the new reply
        if (loadedReplies[replyingTo.id] && comment.replies) {
          updatedComment.replies = [...comment.replies, result.comment];
        }
        
        return updatedComment;
      }
      return comment;
    })
  );
  setReplyingTo(null);
}

        else {
          // Handle new comment
          const newComment = { ...result.comment, replyCount: 0 };
          setComments(prev => [newComment, ...prev]);
          onCommentsCountChange && onCommentsCountChange(comments.length + 1);
        }
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

  const handleReply = (comment) => {
    setReplyingTo(comment);
    setInputText(''); // Clear input when starting reply
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setInputText('');
  };

  const renderReply = (reply) => (
    <View key={reply.id} style={styles.replyItem}>
      <View style={styles.commentHeader}>
        <Text style={styles.commentAuthor}>{reply.authorName}</Text>
        <Text style={styles.commentTime}>
          {new Date(reply.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <Text style={styles.commentText}>{reply.content}</Text>
      <TouchableOpacity
        style={styles.replyButton}
        onPress={() => handleReply(reply)}
      >
        <Text style={styles.replyButtonText}>Reply</Text>
      </TouchableOpacity>
    </View>
  );

const renderCommentItem = ({ item }) => {
  // Convert string to number for proper comparison
  const replyCount = parseInt(item.replyCount) || 0;
  
  return (
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
          style={styles.replyButton}
          onPress={() => handleReply(item)}
        >
          <Text style={styles.replyButtonText}>Reply</Text>
        </TouchableOpacity>
      </View>

      {/* Fix: Convert string replyCount to number */}
      {replyCount > 0 && (
        <TouchableOpacity
          style={styles.viewRepliesButton}
          onPress={() => loadReplies(item.id)}
          disabled={loadedReplies[item.id] || loadingReplies[item.id]}
        >
          {loadingReplies[item.id] ? (
            <View style={styles.loadingReplies}>
              <ActivityIndicator size="small" color="#2196F3" />
              <Text style={styles.loadingText}>Loading replies...</Text>
            </View>
          ) : (
            <Text style={styles.viewRepliesText}>
              {loadedReplies[item.id] 
                ? `Hide ${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}`
                : `View ${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}`
              }
            </Text>
          )}
        </TouchableOpacity>
      )}

      {/* Show loaded replies */}
      {loadedReplies[item.id] && item.replies && item.replies.length > 0 && (
        <View style={styles.repliesContainer}>
          {item.replies.map(reply => renderReply(reply))}
        </View>
      )}
    </View>
  );
};

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.commentsModal}>
        <View style={styles.commentsHeader}>
          <Text style={styles.commentsTitle}>Comments ({comments.length})</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        {isInitialLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Loading comments...</Text>
          </View>
        ) : (
          <FlatList
            data={comments}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderCommentItem}
            style={styles.commentsList}
            showsVerticalScrollIndicator={false}
            refreshing={false}
            onRefresh={fetchRootComments}
            extraData={comments} // Add this to force re-render
          />
        )}

        {/* Single Input Section - Instagram Style */}
        <View style={styles.inputSection}>
          {/* Show reply context if replying */}
          {replyingTo && (
            <View style={styles.replyContext}>
              <Text style={styles.replyContextText}>
                Replying to @{replyingTo.authorName}
              </Text>
              <TouchableOpacity onPress={cancelReply} style={styles.cancelReplyBtn}>
                <Text style={styles.cancelReplyText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder={replyingTo ? `Reply to ${replyingTo.authorName}...` : "Add a comment..."}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (inputText.trim().length < 3 || isLoading) && styles.sendButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={inputText.trim().length < 3 || isLoading}
            >
              <Text style={styles.sendButtonText}>
                {isLoading ? 'Posting...' : (replyingTo ? 'Reply' : 'Post')}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.characterCount}>
            {inputText.length}/500
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    marginBottom: 8,
  },
  replyButton: {
    marginRight: 15,
  },
  replyButtonText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '600',
  },
  viewRepliesButton: {
    paddingVertical: 5,
  },
  viewRepliesText: {
    fontSize: 13,
    color: '#2196F3',
    fontWeight: '500',
  },
  loadingReplies: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  repliesContainer: {
    marginTop: 10,
    paddingLeft: 20,
    borderLeftWidth: 2,
    borderLeftColor: '#e0e0e0',
  },
  replyItem: {
    paddingVertical: 10,
    paddingLeft: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    marginLeft: 8,
    fontSize: 12,
    color: '#666',
  },

  // Instagram-style input section
  inputSection: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  replyContext: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#e8f4f8',
    borderRadius: 8,
    marginBottom: 10,
  },
  replyContextText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '500',
  },
  cancelReplyBtn: {
    padding: 4,
  },
  cancelReplyText: {
    fontSize: 14,
    color: '#999',
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 100,
    fontSize: 14,
    backgroundColor: '#f9f9f9',
  },
  sendButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  characterCount: {
    fontSize: 11,
    color: '#999',
    textAlign: 'right',
    marginTop: 5,
  },
});

export default CommentsSection;
