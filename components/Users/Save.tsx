// components/Users/FeedScreen.tsx
import { apiService } from '@/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons'; // Add icons for likes/views/shares
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface FeedScreenProps {
  onArticlePress: (article: any, articlesList?: any[], articleIndex?: number) => void;
}

const FeedScreen = ({ onArticlePress }: { onArticlePress: (article: any, articles: any[], index: number) => void }) => {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feedArticles, setFeedArticles] = useState<any>([])
  const { user } = useAuth();

  useEffect(() => {
    fetchFeed()
  }, [])

  const fetchFeed = async () => {
    try {
      const response = await apiService.getFeedBack({
        "userId": user?.id
      });
      const articles = response.data;
      setFeedArticles(articles.articles);
      if (articles && articles.length > 0) {
        setFeedArticles(articles.articles);
      }
    } catch (error) {
      console.error("Error fetching articles:", error);
    }
  };

  const fetchArticles = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setArticles(feedArticles);
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [feedArticles]);

  const onRefresh = () => {
    fetchArticles(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const renderArticleItem = ({ item, index }: { item: any; index: number }) => (
    <TouchableOpacity
      style={styles.articleCard}
      onPress={() => onArticlePress(item, articles, index)}
    >
      <Image source={{ uri: item.featuredImage }} style={styles.articleImage} />
      <View style={styles.articleContent}>
        <Text style={styles.articleCategory}>{item.categoryName}</Text>
        <Text style={styles.articleTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.articleMeta}>
          <Text style={styles.articleAuthor}>{item.authorName}</Text>
          <Text style={styles.articleDate}>{formatDate(item.publicationDate)}</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="eye-outline" size={16} color="#666" />
            <Text style={styles.statText}>{item.viewCount}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="heart-outline" size={16} color="#e63946" />
            <Text style={styles.statText}>{item.likeCount}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="share-social-outline" size={16} color="#666" />
            <Text style={styles.statText}>{item.shareCount ?? 0}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading your feed...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={articles}
        renderItem={renderArticleItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  listContent: {
    padding: 16,
  },
  articleCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  articleImage: {
    width: '100%',
    height: 200,
  },
  articleContent: {
    padding: 16,
  },
  articleCategory: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  articleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 12,
    lineHeight: 24,
  },
  articleMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  articleAuthor: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  articleDate: {
    fontSize: 12,
    color: '#999',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 20,
    marginTop: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontSize: 13,
    color: '#333',
    marginLeft: 6,
  },
});

export default FeedScreen;
