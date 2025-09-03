import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';

import { apiService } from '@/api';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width } = Dimensions.get('window');

const HomeScreen = ({ onArticlePress }: { onArticlePress: (article: any) => void }) => {
  const [articals, setArticals] = useState<any>();
  const [trending, setTrending] = useState<any>([]);
  const [categories, setCategories] = useState<any>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [filteredArticles, setFilteredArticles] = useState<any>([]);
  const [categoryTrendingArticles, setCategoryTrendingArticles] = useState<any>([]);
  const [categoryLatestArticles, setCategoryLatestArticles] = useState<any>([]);

  const fetchgetCategories = async () => {
    try {
      const response = await apiService.getCategories();
      const Categories = response.data; 
      setCategories(Categories);
      
      // Set first category as selected by default
      if (Categories && Categories.length > 0) {
        setSelectedCategoryId(Categories[0].id);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchArtical = async () => {
    try {
      const response = await apiService.getDocuments();
      const articles = response.data; 
      setArticals(articles[0]);
    } catch (error) {
      console.error("Error fetching articles:", error);
    }
  };

  const fetchTrendingArtical = async () => {
    try {
      const response = await apiService.getDocuments({
        'isTrending': true
      });
      
      const articles = response.data; 
      setTrending(articles);
    } catch (error) {
      console.error("Error fetching trending articles:", error);
    }
  };

  const fetchArticlesByCategory = async (categoryId: number) => {
    try {
      const response = await apiService.getDocuments({
        categoryId: categoryId
      });
      
      const articles = response.data;
      setFilteredArticles(articles);
      
      // Update main article to first article of selected category
      if (articles && articles.length > 0) {
        setArticals(articles[0]);
      }

      // Fetch trending articles for this category
      const trendingResponse = await apiService.getDocuments({
        categoryId: categoryId,
        isTrending: true
      });
      setCategoryTrendingArticles(trendingResponse.data || []);

      // Use remaining articles as latest updates for this category
      if (articles && articles.length > 1) {
        setCategoryLatestArticles(articles.slice(-5)); // Last 5 articles as latest
      }
    } catch (error) {
      console.error("Error fetching articles by category:", error);
      setFilteredArticles([]);
      setCategoryTrendingArticles([]);
      setCategoryLatestArticles([]);
    }
  };

  const handleCategoryPress = (category: any) => {
    setSelectedCategoryId(category.id);
    fetchArticlesByCategory(category.id);
  };

  useEffect(() => {
    fetchArtical();
    fetchTrendingArtical();
    fetchgetCategories();
  }, []);

  // Fetch articles when selectedCategoryId changes
  useEffect(() => {
    if (selectedCategoryId !== null) {
      fetchArticlesByCategory(selectedCategoryId);
    }
  }, [selectedCategoryId]);

  const mainNews = {
    title: "Trump Dials PM Modi, shares insight on Alaska summit",
    source: "Republic TV",
    image: "https://fortune.com/img-assets/wp-content/uploads/2024/11/GettyImages-1203050488-e1730968620314.jpg?w=1440&q=75",
    isExclusive: true
  };

  const bottomNews = [
    {
      id: 4,
      image: "https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=200&h=150&fit=crop",
      title: "Political Leader Updates",
      source: "Political Times",
      isExclusive: false
    },
    {
      id: 5,
      image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=150&fit=crop",
      title: "Government Assembly",
      source: "Capitol News",
      isExclusive: false
    }
  ];
 
  return (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {/* Category Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
      >
        {categories.map((category, index) => (
          <TouchableOpacity 
            key={category.id} 
            style={[
              styles.tab, 
              selectedCategoryId === category.id && styles.activeTab
            ]}
            onPress={() => handleCategoryPress(category)}
          >
            <Text style={[
              styles.tabText, 
              selectedCategoryId === category.id && styles.activeTabText
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Main News Card */}
      {filteredArticles && filteredArticles.length > 0 ? (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.mainNewsContainer}
          pagingEnabled={true}
        >
          {filteredArticles.slice(0, 3).map((article, index) => (
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
      ) : selectedCategoryId !== null ? (
        <View style={styles.noNewsFullScreen}>
          <Text style={styles.noNewsFullScreenText}>
            No news available for {categories.find(cat => cat.id === selectedCategoryId)?.name || 'this category'}
          </Text>
        </View>
      ) : articals ? (
        <TouchableOpacity 
          onPress={() => onArticlePress(articals)} 
          style={styles.mainNewsCard}
        >
          <Image 
            source={{ uri: articals.featuredImage }} 
            style={styles.mainNewsImage} 
          />

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.mainNewsGradient}
          >
            {articals.isExclusive && (
              <View style={styles.exclusiveTag}>
                <Text style={styles.exclusiveText}>EXCLUSIVE</Text>
              </View>
            )}

            <Text style={styles.mainNewsTitle}>{articals.title}</Text>
            <Text style={styles.mainNewsSource}>{articals.authorName}</Text>
          </LinearGradient>
        </TouchableOpacity>
      ) : null}

      {/* Category Filtered Articles - Only show if there are more than 3 articles */}
      {filteredArticles.length > 3 && (
        <>
          <Text style={styles.sectionTitle}>
            More {categories.find(cat => cat.id === selectedCategoryId)?.name || 'Category'} Articles
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.trendingContainer}>
            {filteredArticles.slice(3).map((item, index) => (
              <TouchableOpacity 
                key={item.id || index} 
                style={styles.trendingItem}
                onPress={() => onArticlePress(item)}
              >
                <Image 
                  source={{ uri: item.featuredImage || item.image }} 
                  style={styles.trendingImage} 
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.6)']}
                  style={styles.trendingGradient}
                />
                <View style={styles.trendingTextOverlay}>
                  <Text style={styles.trendingTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}

      {/* Trending Collection */}
      <Text style={styles.sectionTitle}>
        {selectedCategoryId ? `${categories.find(cat => cat.id === selectedCategoryId)?.name} Trending` : 'Trending Collection'}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.trendingContainer}>
        {(selectedCategoryId ? categoryTrendingArticles : trending).map((item, index) => (
          <TouchableOpacity 
            key={item.id || index} 
            style={styles.trendingItem}
            onPress={() => onArticlePress(item)}
          >
            <Image 
              source={{ uri: item.featuredImage || item.image }} 
              style={styles.trendingImage} 
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.6)']}
              style={styles.trendingGradient}
            />
            <View style={styles.trendingTextOverlay}>
              <Text style={styles.trendingTitle} numberOfLines={2}>
                {item.title}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Latest Updates */}
      <Text style={styles.sectionTitle}>
        {selectedCategoryId ? `${categories.find(cat => cat.id === selectedCategoryId)?.name} Latest Updates` : 'Latest Updates'}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.trendingContainer}>
        {(selectedCategoryId ? categoryLatestArticles : bottomNews).map((item, index) => (
          <TouchableOpacity 
            key={item.id || index} 
            style={styles.trendingItem}
            onPress={() => onArticlePress(item)}
          >
            <Image 
              source={{ uri: item.featuredImage || item.image }} 
              style={styles.trendingImage} 
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.6)']}
              style={styles.trendingGradient}
            />
            <View style={styles.trendingTextOverlay}>
              <Text style={styles.trendingTitle} numberOfLines={2}>
                {item.title}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  // HOME SCREEN STYLES
  mainNewsContainer: {
    marginHorizontal: 20,
    marginVertical: 10,
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
  noNewsFullScreen:{
    marginHorizontal: 'auto',
    marginVertical:'auto'
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 20,
    marginTop: 25,
    marginBottom: 15,
  },
  trendingContainer: {
    paddingLeft: 20,
    marginBottom: 10,
  },
  trendingItem: {
    width: 160,
    height: 120,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    position: 'relative',
  },
  trendingImage: {
    width: '100%',
    height: '100%',
  },
  trendingGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
  },
  trendingTextOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
  },
  trendingTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 14,
  },
  // TAB STYLES
  tabsContainer: {
    backgroundColor: '#fff',
    paddingVertical: 15,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 4,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  activeTab: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: '600',
  },
  noNewsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    marginHorizontal: 20,
  },
  noNewsText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
});

export default HomeScreen;