import { apiService } from '@/api';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
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

// FIXED: Updated prop type to support navigation
const HomeScreen = ({ onArticlePress }: { onArticlePress: (article: any, articles: any[], index: number) => void }) => {
  const [articles, setArticles] = useState<any>([]);
  const [trending, setTrending] = useState<any>([]);
  const [categories, setCategories] = useState<any>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [filteredArticles, setFilteredArticles] = useState<any>([]);
  const [categoryTrendingArticles, setCategoryTrendingArticles] = useState<any>([]);
  const [categoryLatestArticles, setCategoryLatestArticles] = useState<any>([]);
  const [isLoading, setIsLoading] = useState(true);

  // FIXED: Create combined articles array for navigation
  const getAllCurrentArticles = () => {
    const allArticles = [];
    
    try {
      // Add main/filtered articles first
      if (filteredArticles && Array.isArray(filteredArticles) && filteredArticles.length > 0) {
        allArticles.push(...filteredArticles);
      }
      
      // Add trending articles
      const trendingToAdd = selectedCategoryId ? categoryTrendingArticles : trending;
      if (trendingToAdd && Array.isArray(trendingToAdd) && trendingToAdd.length > 0) {
        // Filter out articles that are already in allArticles
        const newTrending = trendingToAdd.filter(article => 
          article && article.id && !allArticles.find(existing => existing.id === article.id)
        );
        allArticles.push(...newTrending);
      }
      
      // Add latest articles
      const latestToAdd = selectedCategoryId ? categoryLatestArticles : articles.slice(-5);
      if (latestToAdd && Array.isArray(latestToAdd) && latestToAdd.length > 0) {
        // Filter out articles that are already in allArticles
        const newLatest = latestToAdd.filter(article => 
          article && article.id && !allArticles.find(existing => existing.id === article.id)
        );
        allArticles.push(...newLatest);
      }
      
      return allArticles.filter(article => article && article.id); // Ensure valid articles only
      
    } catch (error) {
      console.error('Error in getAllCurrentArticles:', error);
      return [];
    }
  };

  // FIXED: Handle article press with proper navigation context
  const handleArticlePress = (article: any, section: 'main' | 'trending' | 'latest' | 'more', sectionIndex: number) => {
    const allArticles = getAllCurrentArticles();
    
    // Find the actual index of this article in the combined array
    const globalIndex = allArticles.findIndex(a => a.id === article.id);
    
    console.log(`Article pressed: ${article.title}, Section: ${section}, Global Index: ${globalIndex}`);
    
    if (globalIndex !== -1) {
      onArticlePress(article, allArticles, globalIndex);
    } else {
      // Fallback: if not found, just pass the article with its section
      console.warn('Article not found in combined list, using fallback');
      onArticlePress(article, [article], 0);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await apiService.getCategories();
      const categories = response.data; 
      setCategories(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchArticles = async () => {
    try {
      const response = await apiService.getDocuments();
      const articles = response.data; 
      setArticles(articles);
      if (articles && articles.length > 0) {
        setFilteredArticles(articles);
      }
    } catch (error) {
      console.error("Error fetching articles:", error);
    }
  };

  const fetchTrendingArticles = async () => {
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

  const fetchArticlesByCategory = async (categoryId: number | null) => {
    try {
      setIsLoading(true);
      
      if (categoryId === null) {
        // Show all articles when no category is selected
        const response = await apiService.getDocuments();
        const articles = response.data;
        setFilteredArticles(articles);
        
        // Fetch trending articles from all categories
        const trendingResponse = await apiService.getDocuments({
          isTrending: true
        });
        setCategoryTrendingArticles(trendingResponse.data || []);
        
        // Use all articles as latest updates
        setCategoryLatestArticles(articles.slice(-5));
      } else {
        // Show articles for specific category
        const response = await apiService.getDocuments({
          categoryId: categoryId
        });
        
        const articles = response.data;
        setFilteredArticles(articles);
        
        // Fetch trending articles for this category
        const trendingResponse = await apiService.getDocuments({
          categoryId: categoryId,
          isTrending: true
        });
        setCategoryTrendingArticles(trendingResponse.data || []);

        // Use remaining articles as latest updates for this category
        if (articles && articles.length > 1) {
          setCategoryLatestArticles(articles.slice(-5));
        } else {
          setCategoryLatestArticles([]);
        }
      }
    } catch (error) {
      console.error("Error fetching articles by category:", error);
      setFilteredArticles([]);
      setCategoryTrendingArticles([]);
      setCategoryLatestArticles([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryPress = (category: any) => {
    if (selectedCategoryId === category.id) {
      // If clicking the already selected category, show all articles
      setSelectedCategoryId(null);
      fetchArticlesByCategory(null);
    } else {
      setSelectedCategoryId(category.id);
      fetchArticlesByCategory(category.id);
    }
  };

  const handleAllCategoryPress = () => {
    setSelectedCategoryId(null);
    fetchArticlesByCategory(null);
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchCategories(),
        fetchArticles(),
        fetchTrendingArticles()
      ]);
      setIsLoading(false);
    };
    
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loaderText}>Loading Articles...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {/* Category Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
      >
        <TouchableOpacity 
          style={[
            styles.tab, 
            selectedCategoryId === null && styles.activeTab
          ]}
          onPress={handleAllCategoryPress}
        >
          <Text style={[
            styles.tabText, 
            selectedCategoryId === null && styles.activeTabText
          ]}>
            All
          </Text>
        </TouchableOpacity>
        
        {categories.map((category) => (
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
     
      {/* Main News Card - FIXED */}
      {isLoading ? (
        <View style={styles.placeholderContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      ) : filteredArticles && filteredArticles.length > 0 ? (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.mainNewsContainer}
          pagingEnabled={true}
        >
          {filteredArticles.slice(0, 3).map((article, index) => (
            <TouchableOpacity 
              key={article.id || index}
              onPress={() => handleArticlePress(article, 'main', index)} 
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

                <Text  numberOfLines={3} ellipsizeMode="tail" style={styles.mainNewsTitle}>{article.title}</Text>
                <Text style={styles.mainNewsSource}>{article.authorName || article.source}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.noNewsFullScreen}>
          <Text style={styles.noNewsFullScreenText}>
            No news available for {selectedCategoryId ? categories.find(cat => cat.id === selectedCategoryId)?.name : 'selected category'}
          </Text>
        </View>
      )}

       {/* Trending Collection - FIXED */}
      {!isLoading && (
        <>
          <Text style={styles.sectionTitle}>
            {selectedCategoryId 
              ? `${categories.find(cat => cat.id === selectedCategoryId)?.name} Trending` 
              : 'Trending Collection'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.trendingContainer}>
            {(selectedCategoryId ? categoryTrendingArticles : trending).map((item, index) => (
              <TouchableOpacity 
                key={item.id || index} 
                style={styles.trendingItem}
                onPress={() => handleArticlePress(item, 'trending', index)}
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

      {/* Latest Updates - FIXED */}
      {!isLoading && (
        <>
          <Text style={styles.sectionTitle}>
            {selectedCategoryId 
              ? `${categories.find(cat => cat.id === selectedCategoryId)?.name} Latest Updates` 
              : 'Latest Updates'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.trendingContainer}>
            {(selectedCategoryId ? categoryLatestArticles : articles.slice(-5)).map((item, index) => (
              <TouchableOpacity 
                key={item.id || index} 
                style={styles.trendingItem}
                onPress={() => handleArticlePress(item, 'latest', index)}
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

      {/* Category Filtered Articles - FIXED */}
      {!isLoading && filteredArticles.length > 3 && (
        <>
          <Text style={styles.sectionTitle}>
            {selectedCategoryId 
              ? `More ${categories.find(cat => cat.id === selectedCategoryId)?.name || 'Category'} Articles` 
              : 'More Articles'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.trendingContainer}>
            {filteredArticles.slice(3).map((item, index) => (
              <TouchableOpacity 
                key={item.id || index} 
                style={styles.trendingItem}
                onPress={() => handleArticlePress(item, 'more', index + 3)}
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loaderText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
  placeholderContainer: {
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 15,
    backgroundColor: '#e0e0e0',
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
  noNewsFullScreen: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  noNewsFullScreenText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
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
    paddingLeft: 10,
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
});

export default HomeScreen;