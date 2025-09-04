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
} from 'react-native';
import { apiService } from '@/api';
import { useAuth } from '@/context/AuthContext';

const CommentsSection = ({ 
  visible, 
  onClose, 
  articleId, 
  onCommentsCountChange 
}) => {
  const [commentText, setCommentText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const currentUser = useAuth().user;

  // Fetch comments when component mounts or when modal opens
  useEffect(() => {
    if (visible && articleId) {
      fetchComments();
    }
  }, [visible, articleId]);

  const fetchComments = async () => {
    try {
      const response = await apiService.getComments({
        "articleId": articleId
      });
      
      if (response && response.comments) {
        const organizedComments = organizeComments(response.comments);
        setComments(organizedComments);
        // Notify parent component about comments count change
        onCommentsCountChange && onCommentsCountChange(organizedComments.length);
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
        articleId: articleId,
        content: commentText.trim(),
        authorName: currentUser.name || 'Anonymous User',
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
        articleId: articleId,
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

        {isLoading && comments.length === 0 ? (
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
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});

export default CommentsSection;
