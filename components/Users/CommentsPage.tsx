import { apiService } from '@/api';
import { useAuth } from '@/context/AuthContext';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Modal,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const CommentsSection = ({
  visible,
  onClose,
  articleId,
  // onCommentsCountChange
}) => {
  
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [comments, setComments] = useState([]);
  const [loadedReplies, setLoadedReplies] = useState({});
  const [loadingReplies, setLoadingReplies] = useState({});
  const [expandedComments, setExpandedComments] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const currentUser = useAuth().user;
    console.log('Current user image:', currentUser?.image);
  console.log('Image component available:', typeof Image);
const getInitials = (name: string) => {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};
  useEffect(() => {
    if (visible && articleId) {
      fetchRootComments();
    } else {
      // Reset state when modal closes
      setComments([]);
      setLoadedReplies({});
      setLoadingReplies({});
      setExpandedComments(new Set());
      setReplyingTo(null);
      setInputText('');
    }
  }, [visible, articleId]);

  // Helper function to parse dates safely
  const parseDateSafe = (dateStr) => {
    if (!dateStr) return new Date();
    // Handle both ISO format and space-separated format
    if (dateStr.includes('T')) {
      return new Date(dateStr); // Already ISO format
    }
    return new Date(dateStr.replace(' ', 'T')); // Convert space to T
  };

  const fetchRootComments = async () => {
    setIsInitialLoading(true);
    try {
      const response = await apiService.getComments({
        articleId: articleId
      });

      if (response && response.comments) {
        console.log('First comment structure:', JSON.stringify(response.comments[0], null, 2));
        console.log('=== COMMENT AUTHOR DATA ===');
      console.log('Comment keys:', Object.keys(response.comments[0] || {}));
      console.log('Full first comment:', response.comments[0]);
      console.log('=== END COMMENT DATA ===');
        setComments(response.comments);
        // onCommentsCountChange && onCommentsCountChange(response.count);
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

  // Toggle replies visibility
  const toggleRepliesVisibility = (commentId) => {
    setExpandedComments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId); // Hide replies
      } else {
        newSet.add(commentId);    // Show replies
      }
      return newSet;
    });
  };

  // Load replies with new API parameter
  const loadReplies = async (commentId) => {
    if (loadedReplies[commentId] || loadingReplies[commentId]) return;

    setLoadingReplies(prev => ({ ...prev, [commentId]: true }));

    try {
      const response = await apiService.getComments({ 
        articleId: articleId,
        loadReplies: commentId
      });

      if (response && response.comments) {
        setComments(prevComments =>
          prevComments.map(comment =>
            comment.id === commentId
              ? { ...comment, replies: response.comments }
              : comment
          )
        );
        setLoadedReplies(prev => ({ ...prev, [commentId]: true }));
        toggleRepliesVisibility(commentId); // Show replies after loading
      }
    } catch (error) {
      console.error("Error loading replies:", error);
      Alert.alert('Error', 'Failed to load replies');
    } finally {
      setLoadingReplies(prev => ({ ...prev, [commentId]: false }));
    }
  };

  // UPDATED: Fixed handleSubmit to handle API response correctly
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
        ...(replyingTo && { parentId: replyingTo.id })
      };

      const result = await apiService.createComment(commentData);

      if (result.success) {
        setInputText('');

        if (replyingTo) {
          // Handle reply - update parent comment's reply count and add to replies if expanded
          setComments(prevComments => 
            prevComments.map(comment => {
              if (comment.id === replyingTo.id) {
                const currentCount = parseInt(comment.reply_count || 0);
                const updatedComment = { 
                  ...comment, 
                  reply_count: currentCount + 1 // Use snake_case to match API
                };
                
                // If replies are loaded and expanded, add the new reply
                if (loadedReplies[replyingTo.id] && comment.replies && expandedComments.has(replyingTo.id)) {
                  // Transform the API response to match expected format
                  const transformedReply = {
                    ...result.comment,
                    author_name: result.comment.authorName,
                    created_at: result.comment.createdAt,
                    updated_at: result.comment.updatedAt,
                    parent_id: result.comment.parentId,
                    article_id: result.comment.articleId,
                    user_id: result.comment.userId,
                    level: 1 // First level reply
                  };
                  updatedComment.replies = [...comment.replies, transformedReply];
                }
                
                return updatedComment;
              }
              return comment;
            })
          );
          setReplyingTo(null);
        } else {
          // Handle new comment - transform API response to match expected format
          const newComment = {
            ...result.comment,
            author_name: result.comment.authorName,
            created_at: result.comment.createdAt,
            updated_at: result.comment.updatedAt,
            parent_id: result.comment.parentId,
            article_id: result.comment.articleId,
            user_id: result.comment.userId,
            reply_count: 0
          };
          setComments(prev => [newComment, ...prev]);
          // onCommentsCountChange && onCommentsCountChange(comments.length + 1);
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
    setInputText('');
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setInputText('');
  };

  // UPDATED: Render reply with proper indentation and parent author display
  // const renderReply = (reply, index) => (
  //   <View 
  //     key={reply.id} 
  //     style={[
  //       styles.replyItem, 
  //       { marginLeft: (reply.level - 1) * 15 }
  //     ]}
  //   >
  //     <View style={styles.commentHeader}>
  //       <Text style={styles.commentAuthor}>{reply.author_name}</Text>
  //       <Text style={styles.commentTime}>
  //         {parseDateSafe(reply.created_at).toLocaleDateString()}
  //       </Text>
  //     </View>
      
  //     {/* Show parent author name for nested replies */}
  //     {reply.parent_author_name && reply.level > 1 && (
  //       <Text style={styles.replyingToText}>
  //         Replying to @{reply.parent_author_name}
  //       </Text>
  //     )}
      
  //     <Text style={styles.commentText}>{reply.content}</Text>
      
  //     <TouchableOpacity
  //       style={styles.replyButton}
  //       onPress={() => handleReply(reply)}
  //     >
  //       <Text style={styles.replyButtonText}>Reply</Text>
  //     </TouchableOpacity>
  //   </View>
  // );
  const renderReply = (reply, index) => (
  <View 
    key={reply.id} 
    style={[
      styles.replyItem, 
      { marginLeft: (reply.level - 1) * 15 }
    ]}
  >
    <View style={styles.commentWithAvatar}>
      {/* Profile Photo */}
      <View style={styles.avatarContainer}>
        {reply.user_image ? (
          <Image source={{ uri: reply.user_image }} style={styles.profilePhoto} />
        ) : (
          <View style={styles.defaultAvatar}>
            <Text style={styles.avatarText}>{getInitials(reply.author_name)}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentAuthor}>{reply.author_name}</Text>
          <Text style={styles.commentTime}>
            {parseDateSafe(reply.created_at).toLocaleDateString()}
          </Text>
        </View>
        
        {/* Show parent author name for nested replies */}
        {reply.parent_author_name && reply.level > 1 && (
          <Text style={styles.replyingToText}>
            Replying to @{reply.parent_author_name}
          </Text>
        )}
        
        <Text style={styles.commentText}>{reply.content}</Text>
        
        <TouchableOpacity
          style={styles.replyButton}
          onPress={() => handleReply(reply)}
        >
          <Text style={styles.replyButtonText}>Reply</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

  // UPDATED: Render comment item with proper hide/show logic
  // const renderCommentItem = ({ item }) => {
  //   const replyCount = parseInt(item.reply_count || 0);
    
  //   return (
  //     <View style={styles.commentItem}>
  //       <View style={styles.commentHeader}>
  //         <Text style={styles.commentAuthor}>{item.author_name}</Text>
  //         <Text style={styles.commentTime}>
  //           {parseDateSafe(item.created_at).toLocaleDateString()}
  //         </Text>
  //       </View>
  //       <Text style={styles.commentText}>{item.content}</Text>
        
  //       <View style={styles.commentActions}>
  //         <TouchableOpacity
  //           style={styles.replyButton}
  //           onPress={() => handleReply(item)}
  //         >
  //           <Text style={styles.replyButtonText}>Reply</Text>
  //         </TouchableOpacity>
  //       </View>

  //       {/* View/Hide replies button */}
  //       {replyCount > 0 && (
  //         <TouchableOpacity
  //           style={styles.viewRepliesButton}
  //           onPress={() => {
  //             if (expandedComments.has(item.id)) {
  //               toggleRepliesVisibility(item.id); // Hide replies
  //             } else {
  //               if (!loadedReplies[item.id]) {
  //                 loadReplies(item.id); // Load and show
  //               } else {
  //                 toggleRepliesVisibility(item.id); // Just show
  //               }
  //             }
  //           }}
  //           disabled={loadingReplies[item.id]}
  //         >
  //           {loadingReplies[item.id] ? (
  //             <View style={styles.loadingReplies}>
  //               <ActivityIndicator size="small" color="#2196F3" />
  //               <Text style={styles.loadingText}>Loading replies...</Text>
  //             </View>
  //           ) : (
  //             <Text style={styles.viewRepliesText}>
  //               {expandedComments.has(item.id)
  //                 ? `Hide ${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}`
  //                 : `View ${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}`
  //               }
  //             </Text>
  //           )}
  //         </TouchableOpacity>
  //       )}

  //       {/* UPDATED: Conditionally show replies based on expanded state */}
  //       {expandedComments.has(item.id) && item.replies && item.replies.length > 0 && (
  //         <View style={styles.repliesContainer}>
  //           {item.replies.map((reply, index) => renderReply(reply, index))}
  //         </View>
  //       )}
  //     </View>
  //   );
  // };
  const renderCommentItem = ({ item }) => {
  const replyCount = parseInt(item.reply_count || 0);
  
  return (
    <View style={styles.commentItem}>
      <View style={styles.commentWithAvatar}>
        {/* Profile Photo */}
        <View style={styles.avatarContainer}>
          {item.user_image ? (
            <Image source={{ uri: item.user_image }} style={styles.profilePhoto} />
          ) : (
            <View style={styles.defaultAvatar}>
              <Text style={styles.avatarText}>{getInitials(item.author_name)}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.commentContent}>
          <View style={styles.commentHeader}>
            <Text style={styles.commentAuthor}>{item.author_name}</Text>
            <Text style={styles.commentTime}>
              {parseDateSafe(item.created_at).toLocaleDateString()}
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
        </View>
      </View>

      {/* View/Hide replies button - keep your existing logic */}
      {replyCount > 0 && (
        <TouchableOpacity
          style={styles.viewRepliesButton}
          onPress={() => {
            if (expandedComments.has(item.id)) {
              toggleRepliesVisibility(item.id);
            } else {
              if (!loadedReplies[item.id]) {
                loadReplies(item.id);
              } else {
                toggleRepliesVisibility(item.id);
              }
            }
          }}
          disabled={loadingReplies[item.id]}
        >
          {loadingReplies[item.id] ? (
            <View style={styles.loadingReplies}>
              <ActivityIndicator size="small" color="#2196F3" />
              <Text style={styles.loadingText}>Loading replies...</Text>
            </View>
          ) : (
            <Text style={styles.viewRepliesText}>
              {expandedComments.has(item.id)
                ? `Hide ${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}`
                : `View ${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}`
              }
            </Text>
          )}
        </TouchableOpacity>
      )}

      {/* Replies container - keep existing */}
      {expandedComments.has(item.id) && item.replies && item.replies.length > 0 && (
        <View style={styles.repliesContainer}>
          {item.replies.map((reply, index) => renderReply(reply, index))}
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
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.commentsModal}>
        <View style={styles.commentsHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.commentsTitle}>Comments</Text>
            <Text style={styles.commentsSubtitle}>{comments.length} comments</Text>
          </View>
          <TouchableOpacity 
            style={styles.closeButtonContainer}
            onPress={onClose}
          >
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
            extraData={[comments, expandedComments]} // Force re-render on expansion change
          />
        )}

        {/* Single Input Section - Instagram Style */}
        {/* <View style={styles.inputSection}>
          {replyingTo && (
            <View style={styles.replyContext}>
              <Text style={styles.replyContextText}>
                Replying to @{replyingTo.author_name}
              </Text>
              <TouchableOpacity onPress={cancelReply} style={styles.cancelReplyBtn}>
                <Text style={styles.cancelReplyText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder={replyingTo ? `Reply to ${replyingTo.author_name}...` : "Add a comment..."}
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
        </View> */}
        {/* Single Input Section - Instagram Style */}
<View style={styles.inputSection}>
  {replyingTo && (
    <View style={styles.replyContext}>
      <Text style={styles.replyContextText}>
        Replying to @{replyingTo.author_name}
      </Text>
      <TouchableOpacity onPress={cancelReply} style={styles.cancelReplyBtn}>
        <Text style={styles.cancelReplyText}>✕</Text>
      </TouchableOpacity>
    </View>
  )}

  {/* Replace your existing inputContainer with this */}
{/* Replace your existing inputContainer with this */}
<View style={styles.inputContainer}>
  {/* Your actual avatar */}
  <View style={{
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center'
  }}>
    {currentUser?.image ? (
      <Image 
        source={{ uri: currentUser.image }} 
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          marginBottom: 10,
        }}
      />
    ) : (
      <View style={{
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Text style={{color: 'white', fontSize: 12, fontWeight: 'bold'}}>
          {getInitials(currentUser?.name)}
        </Text>
      </View>
    )}
  </View>
  
  <TextInput
    style={styles.input}
    placeholder={replyingTo ? `Reply to ${replyingTo.author_name}...` : "Add a comment..."}
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
  replyingToText: {
    fontSize: 11,
    color: '#2196F3',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerLeft: {
    flex: 1,
  },
  commentsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  commentsSubtitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  closeButtonContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
  },
  commentsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  commentItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  commentWithAvatar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarContainer: {
    marginRight: 12,
    marginTop: 4,
  },
  profilePhoto: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  defaultAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  commentAuthor: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  commentTime: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  commentText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 8,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  replyButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  replyButtonText: {
    fontSize: 13,
    color: '#4CAF50',
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
  inputSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f8f9fa',
    borderRadius: 24,
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    maxHeight: 100,
    minHeight: 44,
  },
  sendButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginLeft: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
    elevation: 0,
    shadowOpacity: 0,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 6,
    marginRight: 8,
    fontWeight: '500',
  },
  replyContext: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  replyContextText: {
    fontSize: 13,
    color: '#4CAF50',
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
});

export default CommentsSection;



