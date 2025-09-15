import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

// TRENDING SCREEN COMPONENT - Updated with navigation support
const TrendingScreen = ({ onArticlePress }: { onArticlePress: (article: any, articles: any[], index: number) => void }) => {
  // Load custom fonts
  const [fontsLoaded] = useFonts({
    'NeuePlakExtended-SemiBold': require('../../assets/fonts/Neue Plak Extended SemiBold.ttf'),
    'Montserrat-SemiBold': require('../../assets/fonts/Montserrat-SemiBold.ttf'),
  });

  const [trendingArticles, setTrendingArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('7d');
  const [error, setError] = useState(null);

  // Replace with your actual API base URL
  const API_BASE_URL = 'https://nofa-sepia.vercel.app'; 

  // ADDED: Handle article press with navigation context
  const handleArticlePress = (article: any, index: number) => {
    console.log('Trending article pressed:', article.title, 'Index:', index);
    
    // Pass all trending articles for navigation
    const allTrendingArticles = [...trendingArticles];
    
    console.log('Trending articles for navigation:', allTrendingArticles.length);
    console.log('Selected article index:', index);
    
    onArticlePress(article, allTrendingArticles, index);
  };

  const fetchTrendingArticles = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await fetch(
        `${API_BASE_URL}/api/trending?limit=11&timeRange=${timeRange}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // Add any authentication headers if needed
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiI5MzI4ZmRjNC03ZThmLTQ1NTgtOTA4MS0xNjE3MDc4YTMyMDYiLCJleHAiOjE3NTYyNzYwNTl9.8T7NYohV7U3QROwubIyptIjDBbB49zVVMwE-0foZ6j0`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.trendingArticles) {
        // Sort articles by trendingScore in descending order and filter valid articles
        const sortedArticles = data.trendingArticles
          .filter(article => article && article.id) // Filter out invalid articles
          .sort((a, b) => {
            return (b.trendingScore || 0) - (a.trendingScore || 0);
          });
        
        console.log('Fetched trending articles:', sortedArticles.length);
        setTrendingArticles(sortedArticles);
      } else {
        setTrendingArticles([]);
      }
    } catch (err) {
      console.error('Error fetching trending articles:', err);
      setError(err.message || 'Failed to load trending articles');
      Alert.alert(
        'Error',
        'Failed to load trending articles. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // REMOVED: This fetchComments function seems to be mistakenly added and isn't related to trending screen
  // const fetchComments = async () => { ... }

  useEffect(() => {
    fetchTrendingArticles();
  }, [timeRange]);

  const onRefresh = () => {
    fetchTrendingArticles(true);
  };

  const changeTimeRange = (newTimeRange) => {
    if (newTimeRange !== timeRange) {
      setTimeRange(newTimeRange);
    }
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatTrendingScore = (score) => {
    if (!score) return '0.00';
    return score.toFixed(3);
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const publishDate = new Date(dateString);
    const diffInHours = Math.floor((now - publishDate) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return `${Math.floor(diffInDays / 7)}w ago`;
  };

  const renderTimeRangeButtons = () => (
    <View style={styles.timeRangeContainer}>
      {[
        { key: '24h', label: '24H' },
        { key: '7d', label: '7D' },
        { key: '30d', label: '30D' }
      ].map((range) => (
        <TouchableOpacity
          key={range.key}
          style={[
            styles.timeRangeButton,
            timeRange === range.key && styles.timeRangeButtonActive
          ]}
          onPress={() => changeTimeRange(range.key)}
        >
          <Text
            style={[
              styles.timeRangeText,
              timeRange === range.key && styles.timeRangeTextActive
            ]}
          >
            {range.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color="#4CAF50" />
      <Text style={styles.loadingText}>Loading trending articles...</Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.centerContainer}>
      <Ionicons name="trending-down" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No Trending Articles</Text>
      <Text style={styles.emptySubtitle}>
        {error ? error : 'No articles found in the selected time range'}
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={() => fetchTrendingArticles()}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  // UPDATED: renderTrendingItem to use handleArticlePress with proper index
  const renderTrendingItem = (article, index) => (
    <TouchableOpacity 
      key={article.id} 
      style={styles.trendingListItem}
      onPress={() => handleArticlePress(article, index)} // ✅ Updated to pass index
    >
      {article.featuredImage && (
        <Image 
          source={{ uri: article.featuredImage }} 
          style={styles.articleImage}
          resizeMode="cover"
        />
      )}
      
      <View style={styles.trendingItemContent}>
        <View style={styles.titleScoreContainer}>
          <Text style={styles.trendingItemTitle} numberOfLines={2}>
            {article.title}
          </Text>
          <View style={styles.trendingScoreContainer}>
            <Ionicons name="trending-up" size={16} color="#4CAF50" />
            <Text style={styles.trendingScore}>
              {formatTrendingScore(article.trendingScore)}
            </Text>
          </View>
        </View>
        <Text style={styles.trendingItemAuthor}>by {article.authorName}</Text>
        
        <View style={styles.metricsTimeContainer}>
          <Text style={styles.trendingItemTime}>
            {getTimeAgo(article.publicationDate)}
          </Text>
          
          <View style={styles.metricsContainer}>
            <View style={styles.metricItem}>
              <Ionicons name="eye" size={14} color="#1E88E5" />
              <Text style={styles.metricText}>{formatNumber(article.viewCount)}</Text>
            </View>
            <View style={styles.metricItem}>
              <Ionicons name="heart" size={14} color={article.likeCount > 0 ? "#E91E63" : "#999"} />
              <Text style={styles.metricText}>{formatNumber(article.likeCount)}</Text>
            </View>
            <View style={styles.metricItem}>
              <Ionicons name="chatbubble" size={14} color="#4CAF50" />
              <Text style={styles.metricText}>{formatNumber(article.commentCount)}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.trendingScreenContainer}>
          <View style={styles.headerContainer}>
            <Text style={styles.trendingScreenTitle}>Trending Now</Text>
            <Ionicons name="trending-up" size={24} color="#4CAF50" />
          </View>

          {renderTimeRangeButtons()}

          {(loading && !refreshing) || !fontsLoaded ? (
            renderLoadingState()
          ) : trendingArticles.length === 0 ? (
            renderEmptyState()
          ) : (
            <View style={styles.trendingList}>
              {/* UPDATED: map function to pass index */}
              {trendingArticles.map((article, index) => renderTrendingItem(article, index))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Keep all your existing styles unchanged
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
  },
  trendingScreenContainer: {
    padding: 10,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom:2,
  },
  trendingScreenTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginRight: 12,
    fontFamily: 'NeuePlakExtended-SemiBold',
  },
  trendingScreenSubtitle: {
    fontSize: 15,
    color: '#5F5F5F',
    marginBottom: 10,
    lineHeight: 22,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    padding: 4,
  },
  timeRangeButton: {
    paddingHorizontal: 40,
    paddingVertical: 6,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  timeRangeButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  timeRangeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#5F5F5F',
  },
  timeRangeTextActive: {
    color: '#fff',
  },
  trendingList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  trendingListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  articleImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
  },
  trendingItemContent: {
    flex: 1,
    justifyContent: 'center',
  },
  titleScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  trendingItemTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
    lineHeight: 24,
    flex: 1,
    marginRight: 12,
  },
  trendingItemAuthor: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '500',
    marginBottom: 10,
  },
  metricsTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trendingItemTime: {
    fontSize: 12,
    color: '#999',
  },
  metricsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  metricText: {
    fontSize: 12,
    color: '#5F5F5F',
    marginLeft: 6,
    fontWeight: '500',
  },
  trendingScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  trendingScore: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 6,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#5F5F5F',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#5F5F5F',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 24,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default TrendingScreen;
