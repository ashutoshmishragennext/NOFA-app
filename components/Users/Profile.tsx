import { apiService } from '@/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { uploadImageFromPicker } from '../uploadHelper';

const { width } = Dimensions.get('window');

const ProfileScreen = ({ onArticlePress }: { onArticlePress?: (article: any, articles: any[], index: number) => void }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [bookmarkedArticles, setBookmarkedArticles] = useState<any[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProfileViewer, setShowProfileViewer] = useState(false);
  const { user, logout, updateUser } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            logout();
          },
        },
      ]
    );
  };

  const uploadProfileIcon = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User not found');
      return;
    }

    try {
      setIsUploading(true);
      
      // Upload image
      const uploadData = await uploadImageFromPicker();
      
      if (uploadData?.url) {
        // Update profile picture in database
        const response = await apiService.updateProfilePicture(user.id, uploadData.url);
        
        if (response.success && response.data.image) {
          // Update user context with new image
          await updateUser({ image: response.data.image });
          Alert.alert('Success', 'Profile picture updated successfully!');
        }
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      Alert.alert('Error', 'Failed to update profile picture. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Camera icon press - directly update profile
  const handleCameraIconPress = () => {
    uploadProfileIcon();
  };

  // Profile photo press - view profile
  const handleProfilePhotoPress = () => {
    setShowProfileViewer(true);
  };

  const fetchBookmarkedArticles = async (userID: string) => {
    try {
      setArticlesLoading(true);
      setError(null);
      const response = await apiService.getBookMark({userId : userID});
      const bookmarks = response.data;
      
      // Extract the articles from the response objects
      const articles = bookmarks.map((item: any) => ({
        ...item.article,
        bookmarkId: item.bookmarkId // Keep the bookmark ID for potential removal
      })).filter((article: any) => article && article.id); // Filter out invalid articles
      
      console.log('Fetched bookmarked articles:', articles.length);
      setBookmarkedArticles(articles);
    } catch (err) {
      console.error("Error fetching bookmarked articles:", err);
      setError("Failed to load saved articles");
    } finally {
      setArticlesLoading(false);
    }
  };

  const handleArticlePress = (article: any, index: number) => {
    if (onArticlePress) {
      console.log('Profile article pressed:', article.title);
      onArticlePress(article, bookmarkedArticles, index);
    }
  };

  // Refresh when the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (user?.id) {
        fetchBookmarkedArticles(user.id);
      }
    }, [user?.id])
  );

  const renderSavedArticles = () => {
    if (articlesLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading saved articles...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => user?.id && fetchBookmarkedArticles(user.id)}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (bookmarkedArticles.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="bookmark-outline" size={60} color="#ccc" />
          <Text style={styles.emptyText}>No saved articles yet</Text>
          <Text style={styles.emptySubText}>Save articles to read them later</Text>
        </View>
      );
    }

    return (
      <View style={styles.articlesGrid}>
        {bookmarkedArticles.map((article, index) => (
          <TouchableOpacity
            key={article.id}
            style={styles.articleItem}
            onPress={() => handleArticlePress(article, index)}
            activeOpacity={0.8}
          >
            <Image
              source={{ uri: article.featuredImage || article.image }}
              style={styles.articleImage}
              resizeMode="cover"
            />
            
            {/* Exclusive tag */}
            {article.isExclusive && (
              <View style={styles.exclusiveOverlay}>
                <View style={styles.exclusiveTag}>
                  <Text style={styles.exclusiveText}>EXCLUSIVE</Text>
                </View>
              </View>
            )}
            
            {/* Article info overlay */}
            <View style={styles.articleInfoOverlay}>
              <Text style={styles.articleTitle} numberOfLines={2}>
                {article.title}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileImageWrapper}>
            <TouchableOpacity 
              onPress={handleProfilePhotoPress} // Changed to view profile
              disabled={isUploading}
              style={styles.profileImageContainer}
            >
              {isUploading ? (
                <View style={styles.uploadingContainer}>
                  <ActivityIndicator size="large" color="#4CAF50" />
                </View>
              ) : user?.image ? (
                <Image
                  source={{ uri: user.image }}
                  style={styles.profileImage}
                  onError={(error) => {
                    console.error('Image load error:', error);
                    updateUser({ image: undefined });
                  }}
                />
              ) : (
                <View style={styles.defaultProfileContainer}>
                  <Ionicons name="person" size={50} color="#4CAF50" />
                </View>
              )}
            </TouchableOpacity>
            
            {/* Camera/Edit Icon - Direct upload */}
            <TouchableOpacity 
              style={styles.editIconContainer}
              onPress={handleCameraIconPress} // Changed to direct upload
              disabled={isUploading}
            >
              <Ionicons 
                name={isUploading ? "time-outline" : "camera"} 
                size={16} 
                color="#fff" 
              />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.profileName}>{user?.name || 'User Name'}</Text>
          <Text style={styles.profileEmail}>{user?.email || 'user@email.com'}</Text>
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="bookmark" size={20} color="#4CAF50" />
            <Text style={styles.sectionTitle}>Your Saved Articles</Text>
          </View>
        </View>

        {/* Saved Articles Grid */}
        {renderSavedArticles()}
      </ScrollView>

      {/* Profile Viewer Modal - Only this modal remains */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showProfileViewer}
        onRequestClose={() => setShowProfileViewer(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.profileViewerModal}>
            {/* Close button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowProfileViewer(false)}
            >
              <Ionicons name="close" size={30} color="#fff" />
            </TouchableOpacity>

            {/* Large profile image */}
            <View style={styles.largeImageContainer}>
              {user?.image ? (
                <Image
                  source={{ uri: user.image }}
                  style={styles.largeProfileImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.largeDefaultProfile}>
                  <Ionicons name="person" size={150} color="#4CAF50" />
                </View>
              )}
            </View>

            {/* User info */}
            <View style={styles.userInfoContainer}>
              <Text style={styles.largeProfileName}>{user?.name || 'User Name'}</Text>
              <Text style={styles.largeProfileEmail}>{user?.email || 'user@email.com'}</Text>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFE5E5',
  },
  logoutText: {
    fontSize: 14,
    color: '#FF4444',
    fontWeight: '600',
    marginLeft: 5,
  },
  profileHeader: {
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingTop: 30,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  profileImageWrapper: {
    position: 'relative',
    marginBottom: 20,
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    borderWidth: 3,
    borderColor: '#4CAF50',
  },
  defaultProfileContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    borderWidth: 3,
    borderColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    borderWidth: 3,
    borderColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#4CAF50',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  savedCountContainer: {
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  savedCountNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  savedCountLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#fff',
    marginTop: 10,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  // Grid Layout for saved articles (3 columns)
  articlesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 1,
    backgroundColor: '#fff',
  },
  articleItem: {
    width: (width - 3) / 3, // Exactly 3 columns
    height: (width - 3) / 3, // Square aspect ratio
    margin: 0.1,
    position: 'relative',
    backgroundColor: '#f5f5f5',
    borderRadius: 2,
    overflow: 'hidden',
  },
  articleImage: {
    width: '100%',
    height: '100%',
  },
  exclusiveOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 2,
  },
  exclusiveTag: {
    backgroundColor: 'rgba(255, 68, 68, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  exclusiveText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  articleInfoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
  },
  articleTitle: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 12,
  },
  // Loading and Error States
  loadingContainer: {
    padding: 50,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    padding: 50,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 16,
    color: '#FF4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyContainer: {
    padding: 50,
    alignItems: 'center',
    backgroundColor: '#fff',
    minHeight: 300,
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Profile Viewer Modal Styles
  profileViewerModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    padding: 10,
    borderRadius: 25,
  },
  largeImageContainer: {
    width: width * 0.8,
    height: width * 0.8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  largeProfileImage: {
    width: '100%',
    height: '100%',
    borderRadius: (width * 0.8) / 2,
    borderWidth: 4,
    borderColor: '#4CAF50',
  },
  largeDefaultProfile: {
    width: '100%',
    height: '100%',
    borderRadius: (width * 0.8) / 2,
    backgroundColor: '#f0f0f0',
    borderWidth: 4,
    borderColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfoContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  largeProfileName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  largeProfileEmail: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
  },
});

export default ProfileScreen;