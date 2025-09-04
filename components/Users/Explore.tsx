import { apiService } from '@/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const { width } = Dimensions.get('window');

const ExploreScreen = ({ onArticlePress }: { onArticlePress: (article: any) => void }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [pagination, setPagination] = useState<any>(null);
 
  
  // Debounce search to avoid too many API calls
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length > 1) {
        performSearch(searchQuery);
      } else if (searchQuery.trim().length === 0) {
        setSearchResults([]);
        setHasSearched(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    setHasSearched(true);
    
    try {
      const response = await apiService.searchArticles({'q':query});
       console.warn(response.articles);
      setSearchResults(response.articles || []);
      // setPagination(response.data.pagination || null);
    } catch (error) {
      console.error("Error searching articles:", error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
    Keyboard.dismiss();
  };

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for news, topics, or articles..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus={true}
            returnKeyType="search"
            onSubmitEditing={() => performSearch(searchQuery)}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search Results */}
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loaderText}>Searching Articles...</Text>
        </View>
      ) : hasSearched && searchQuery.length > 0 ? (
        <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
          {searchResults.length > 0 ? (
            <>
              <Text style={styles.resultsCount}>
                Found {pagination?.totalItems || searchResults.length} results for "{searchQuery}"
              </Text>
              
              {/* Main Featured Result */}
              {searchResults[0] && (
                <TouchableOpacity 
                  onPress={() => onArticlePress(searchResults[0])} 
                  style={styles.featuredResult}
                >
                  <Image 
                    source={{ uri: searchResults[0].featuredImage }} 
                    style={styles.featuredImage} 
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.featuredGradient}
                  >
                    <View style={styles.categoryTag}>
                      <Text style={styles.categoryText}>{searchResults[0].categoryName}</Text>
                    </View>
                    <Text style={styles.featuredTitle}>{searchResults[0].title}</Text>
                    <Text style={styles.featuredSummary} numberOfLines={2}>
                      {searchResults[0].summary}
                    </Text>
                    <View style={styles.featuredMeta}>
                      <Text style={styles.featuredSource}>{searchResults[0].authorName}</Text>
                      <Text style={styles.featuredSource}>• {searchResults[0].readingTime} min read</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              {/* Other Results */}
              <Text style={styles.sectionTitle}>More Results</Text>
              {searchResults.slice(1).map((article, index) => (
                <TouchableOpacity 
                  key={article.id || index} 
                  style={styles.resultItem}
                  onPress={() => onArticlePress(article)}
                >
                  <View style={styles.resultContent}>
                    <View style={styles.resultText}>
                      <Text style={styles.resultTitle} numberOfLines={2}>
                        {article.title}
                      </Text>
                      <Text style={styles.resultSummary} numberOfLines={2}>
                        {article.summary}
                      </Text>
                      <View style={styles.resultMeta}>
                        <Text style={styles.resultCategory}>{article.categoryName}</Text>
                        <Text style={styles.resultSource}>• {article.readingTime} min read</Text>
                      </View>
                    </View>
                    {article.featuredImage && (
                      <Image 
                        source={{ uri: article.featuredImage }} 
                        style={styles.resultImage} 
                      />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </>
          ) : (
            <View style={styles.noResultsContainer}>
              <Ionicons name="search-outline" size={60} color="#ccc" />
              <Text style={styles.noResultsTitle}>No results found</Text>
              <Text style={styles.noResultsText}>
                We couldn't find any articles matching "{searchQuery}"
              </Text>
              <Text style={styles.noResultsTip}>
                Try different keywords or more general terms
              </Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={styles.initialStateContainer}>
          {/* <Ionicons name="search-outline" size={50} color="#e0e0e0" /> */}
          <Text style={styles.initialStateTitle}>Search for articles</Text>
          <Text style={styles.initialStateText}>
            Find news, topics, and stories by typing in the search bar above
          </Text>
          
          <View style={styles.searchTips}>
            <Text style={styles.tipsTitle}>Search tips:</Text>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.tipText}>Try using specific keywords</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.tipText}>Search by category or author</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.tipText}>Keep it simple for better results</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  searchHeader: {
    backgroundColor: '#fff',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
    borderRadius: 40,
    paddingHorizontal: 15,
    height: 50,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 5,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
    padding: 15,
  },
  resultsCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  featuredResult: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  featuredImage: {
    width: '100%',
    height: 200,
  },
  featuredGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
    padding: 15,
    justifyContent: 'flex-end',
  },
  categoryTag: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  featuredTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
    lineHeight: 22,
  },
  featuredSummary: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 18,
  },
  featuredMeta: {
    flexDirection: 'row',
  },
  featuredSource: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  resultItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    padding: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  resultContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resultText: {
    flex: 1,
    marginRight: 10,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    lineHeight: 20,
  },
  resultSummary: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 18,
  },
  resultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultCategory: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  resultSource: {
    fontSize: 12,
    color: '#999',
    marginLeft: 5,
  },
  resultImage: {
    width: 80,
    height: 80,
    borderRadius: 6,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noResultsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
  noResultsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 5,
    lineHeight: 22,
  },
  noResultsTip: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  initialStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  initialStateTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
  initialStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  searchTips: {
    width: '100%',
    maxWidth: 300,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
  },
});

export default ExploreScreen;