// components/Users/FeedScreen.tsx
import { Ionicons } from '@expo/vector-icons';
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

const FeedScreen = ({ onArticlePress }: FeedScreenProps) => {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // const [feedArticles, setFeedArticles] = useState([])

  // Sample feed data
  const feedArticles = [
    {
      id: '1',
      title: 'Latest Technology Trends in 2024',
      image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop',
      category: 'Technology',
      author: 'Tech Insider',
      date: '2024-01-15T10:30:00Z',
      readTime: '4 min read'
    },
    {
      id: '2',
      title: 'Sustainable Living: Small Changes, Big Impact',
      image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&h=300&fit=crop',
      category: 'Lifestyle',
      author: 'Eco Warrior',
      date: '2024-01-14T15:20:00Z',
      readTime: '6 min read'
    },
    {
      id: '3',
      title: 'The Future of Remote Work',
      image: 'https://images.unsplash.com/photo-1495465798138-718f86d1a4f1?w=400&h=300&fit=crop',
      category: 'Business',
      author: 'Work Trends',
      date: '2024-01-13T09:15:00Z',
      readTime: '5 min read'
    },
    {
      id: '4',
      title: 'Healthy Eating Habits for Busy Professionals',
      image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=300&fit=crop',
      category: 'Health',
      author: 'Nutrition Expert',
      date: '2024-01-12T14:45:00Z',
      readTime: '7 min read'
    },
    {
      id: '5',
      title: 'AI Revolution: What to Expect Next',
      image: 'https://images.unsplash.com/photo-1677442135135-416f8aa26a5b?w=400&h=300&fit=crop',
      category: 'AI',
      author: 'Tech Future',
      date: '2024-01-11T11:30:00Z',
      readTime: '8 min read'
    }
  ];

  const fetchArticles = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      // Simulate API call
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
  }, []);

  const onRefresh = () => {
    fetchArticles(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const renderArticleItem = ({ item, index }: { item: any; index: number }) => (
    <TouchableOpacity 
      style={styles.articleCard}
      onPress={() => onArticlePress(item, articles, index)}
    >
      <Image source={{ uri: item.image }} style={styles.articleImage} />
      <View style={styles.articleContent}>
        <Text style={styles.articleCategory}>{item.category}</Text>
        <Text style={styles.articleTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.articleMeta}>
          <Text style={styles.articleAuthor}>{item.author}</Text>
          <Text style={styles.articleDate}>{formatDate(item.date)}</Text>
        </View>
        <View style={styles.articleFooter}>
          <Text style={styles.readTime}>{item.readTime}</Text>
          <Ionicons name="bookmark-outline" size={16} color="#666" />
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
      {/* <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Feed</Text>
        <TouchableOpacity>
          <Ionicons name="filter-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View> */}

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
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
  articleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  readTime: {
    fontSize: 12,
    color: '#666',
  },
});

export default FeedScreen;