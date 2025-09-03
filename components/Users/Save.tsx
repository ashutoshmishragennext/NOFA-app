import { apiService } from '@/api';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width } = Dimensions.get('window');

const BookmarkedScreen = ({ onArticlePress }: { onArticlePress: (article: any) => void }) => {
  const [bookmarkedArticles, setBookmarkedArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookmarkedArticles = async (userID: any) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getBookMark(userID);
      const bookmarks = response.data;
      
      // Extract the articles from the response objects
      const articles = bookmarks.map((item: any) => ({
        ...item.article,
        bookmarkId: item.bookmarkId // Keep the bookmark ID for potential removal
      }));
      
      setBookmarkedArticles(articles);
    } catch (err) {
      console.error("Error fetching bookmarked articles:", err);
      setError("Failed to load bookmarked articles");
    } finally {
      setLoading(false);
    }
  };

  // Refresh when the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const id = '10d73cdb-0d37-4655-941a-65954e67a9ae';
      fetchBookmarkedArticles(id);
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading your bookmarks...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={() => {
            const id = '10d73cdb-0d37-4655-941a-65954e67a9ae';
            fetchBookmarkedArticles(id);
          }}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (bookmarkedArticles.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Image 
          source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3514/3514491.png' }} 
          style={styles.emptyIcon}
        />
        <Text style={styles.noBookmarksText}>You haven&apos;t saved any articles yet</Text>
        <Text style={styles.noBookmarksSubText}>Bookmark articles to read them later</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header Section */}
      {/* <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Your Bookmarked Articles</Text>
        <Text style={styles.headerSubtitle}>{bookmarkedArticles.length} saved stories</Text>
      </View> */}

      {/* Main Bookmarked Articles - Horizontal Scroll */}
      <Text style={styles.sectionTitle}>Featured Bookmarks</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.mainNewsContainer}
      >
        {bookmarkedArticles.slice(0, 3).map((article, index) => (
          <TouchableOpacity 
            key={article.id || index}
            onPress={() => onArticlePress(article)} 
            style={styles.mainNewsCard}
          >
            <Image 
              source={{ uri: article.featuredImage || article.image }} 
              style={styles.mainNewsImage} 
            />

            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={styles.mainNewsGradient}
            >
              {article.isExclusive && (
                <View style={styles.exclusiveTag}>
                  <Text style={styles.exclusiveText}>EXCLUSIVE</Text>
                </View>
              )}

              <Text style={styles.mainNewsTitle}>{article.title}</Text>
              <Text style={styles.mainNewsSource}>{article.authorName || article.source}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* All Bookmarked Articles - Grid Layout */}
      <Text style={styles.sectionTitle}>All Saved Articles</Text>
      <View style={styles.gridContainer}>
        {bookmarkedArticles.map((article, index) => (
          <TouchableOpacity 
            key={article.id || index} 
            style={styles.gridItem}
            onPress={() => onArticlePress(article)}
          >
            <Image 
              source={{ uri: article.featuredImage || article.image }} 
              style={styles.gridImage} 
            />
            
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={styles.gridGradient}
            />
            
            <View style={styles.gridContent}>
              {article.isExclusive && (
                <View style={styles.exclusiveTagSmall}>
                  <Text style={styles.exclusiveTextSmall}>EXCLUSIVE</Text>
                </View>
              )}
              
              <Text style={styles.gridTitle} numberOfLines={2}>
                {article.title}
              </Text>
              
              <View style={styles.gridMeta}>
                <Text style={styles.gridSource} numberOfLines={1}>
                  {article.authorName || article.source}
                </Text>
                <Text style={styles.gridDate}>
                  {article.publishedDate ? new Date(article.publishedDate).toLocaleDateString() : ''}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  headerContainer: {
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  // Main News Styles (similar to home screen)
  mainNewsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  mainNewsCard: {
    width: width - 40,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    marginRight: 15,
  },
  mainNewsImage: {
    width: '100%',
    height: 250,
  },
  mainNewsGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    justifyContent: 'flex-end',
    padding: 20,
  },
  exclusiveTag: {
    backgroundColor: '#FF4444',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  exclusiveText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  mainNewsTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 28,
  },
  mainNewsSource: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
  },
  // Section Title
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginLeft: 20,
    marginTop: 25,
    marginBottom: 15,
  },
  // Grid Layout for all bookmarks
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  gridItem: {
    width: (width - 40) / 2,
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 15,
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  gridContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  exclusiveTagSmall: {
    backgroundColor: '#FF4444',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  exclusiveTextSmall: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  gridTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    lineHeight: 16,
  },
  gridMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gridSource: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
    marginRight: 5,
  },
  gridDate: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
  },
  // Loading and Error States
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#FF4444',
    textAlign: 'center',
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  noBookmarksText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
    marginTop: 15,
  },
  noBookmarksSubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    opacity: 0.5,
  },
});

export default BookmarkedScreen;