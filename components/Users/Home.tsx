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
  const trendingTabs = ['Trending', 'My Topic', 'Local News', 'Crime', 'Political'];
  const [articals,setArticals]= useState<any>()
   
  
   const fetchArtical = async () => {
  try {
    const response = await apiService.getDocuments();

    // response itself has data
    console.log("Full response:", response);

    // Access the array
    const articles = response.data; 
    console.log("Articles:", articles);

    // If you want to store them in state
    setArticals(articles[0]);

  } catch (error) {
    console.error("Error fetching articles:", error);
    
  }
};


       
  
  useEffect(()=>{
    fetchArtical()
  },[])
 
  
  const mainNews = {
    title: "Trump Dials PM Modi, shares insight on Alaska summit",
    source: "Republic TV",
    image: "https://fortune.com/img-assets/wp-content/uploads/2024/11/GettyImages-1203050488-e1730968620314.jpg?w=1440&q=75",
    isExclusive: true
  };

  const trendingNews = [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?w=200&h=150&fit=crop",
      title: "International Summit Meeting",
      source: "Global News",
      isExclusive: false
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1586880244406-556ebe35f282?w=200&h=150&fit=crop",
      title: "War Zone Updates",
      source: "World Today",
      isExclusive: true
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1586880244406-556ebe35f282?w=200&h=150&fit=crop",
      title: "Economic Crisis Analysis",
      source: "Financial Times",
      isExclusive: false
    }
  ];

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
      {/* Trending Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
      >
        {trendingTabs.map((tab, index) => (
          <TouchableOpacity 
            key={index} 
            style={[styles.tab, index === 0 && styles.activeTab]}
          >
            <Text style={[styles.tabText, index === 0 && styles.activeTabText]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Main News Card - CLICKABLE */}
      {/* <TouchableOpacity 
        style={styles.mainNewsCard}
        onPress={() => onArticlePress(mainNews)}
      >
        <Image source={{ uri: mainNews.image }} style={styles.mainNewsImage} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.mainNewsGradient}
        >
          {mainNews.isExclusive && (
            <View style={styles.exclusiveTag}>
              <Text style={styles.exclusiveText}>EXCLUSIVE</Text>
            </View>
          )}
          <Text style={styles.mainNewsTitle}>{mainNews.title}</Text>
          <Text style={styles.mainNewsSource}>📺 {mainNews.source}</Text>
        </LinearGradient>
      </TouchableOpacity> */}
      {articals && (
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
      {mainNews.isExclusive && (
        <View style={styles.exclusiveTag}>
          <Text style={styles.exclusiveText}>EXCLUSIVE</Text>
        </View>
      )}

      {/* ✅ Show title and source */}
      <Text style={styles.mainNewsTitle}>{articals.title}</Text>
      <Text style={styles.mainNewsSource}>{articals.authorName}</Text>
    </LinearGradient>
  </TouchableOpacity>
)}



      {/* Trending Collection */}
      <Text style={styles.sectionTitle}>Trending Collection</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.trendingContainer}>
        {trendingNews.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            style={styles.trendingItem}
            onPress={() => onArticlePress(item)}
          >
            <Image source={{ uri: item.image }} style={styles.trendingImage} />
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

      {/* Second Trending Collection */}
      <Text style={styles.sectionTitle}>Latest Updates</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.trendingContainer}>
        {bottomNews.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            style={styles.trendingItem}
            onPress={() => onArticlePress(item)}
          >
            <Image source={{ uri: item.image }} style={styles.trendingImage} />
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
  mainNewsCard: {
    margin: 20,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  activeTab: {
    backgroundColor: '#f0f0f0',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#333',
    fontWeight: '600',
  },
});

export default HomeScreen;