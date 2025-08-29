import NewsDetailScreen from '@/components/Users/DetailsPage';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');



// MAIN HOME PAGE COMPONENT
const NewsApp = () => {
  const [currentView, setCurrentView] = useState('home'); // State for navigation
  const [selectedArticle, setSelectedArticle] = useState(null);
  
  const trendingTabs = ['Trending', 'My Topic', 'Local News', 'Crime', 'Political'];
  
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

  const bottomTabs = [
    { name: 'Home', icon: '🏠', active: true },
    { name: 'Explore', icon: '🔍', active: false },
    { name: 'Trending', icon: '📈', active: false },
    { name: 'Save', icon: '🔖', active: false },
    { name: 'Bryan', icon: '👤', active: false }
  ];

  // Navigation Functions
  const handleArticlePress = (article :any) => {
    setSelectedArticle(article);
    setCurrentView('detail');
  };

  const handleBackPress = () => {
    setCurrentView('home');
    setSelectedArticle(null);
  };

  // Show Detail Screen if article is selected
  if (currentView === 'detail' && selectedArticle) {
    return <NewsDetailScreen article={selectedArticle} onBack={handleBackPress} />;
  }

  // HOME SCREEN
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>🏠</Text>
          </View>
          {/* <Text style={styles.headerTitle}>Apartment Times</Text> */}
          <Image
                            source={require("../../assets/images/logo.png")}
                            style={styles.logo1}
                          />
        </View>
        <TouchableOpacity style={styles.menuButton}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
      </View>

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
        <TouchableOpacity 
          style={styles.mainNewsCard}
          onPress={() => handleArticlePress(mainNews)}
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
        </TouchableOpacity>

        {/* Trending Collection */}
        <Text style={styles.sectionTitle}>Trending Collection</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.trendingContainer}>
          {trendingNews.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.trendingItem}
              onPress={() => handleArticlePress(item)}
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
        <Text style={styles.sectionTitle}>Trending Collection</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.trendingContainer}>
          {bottomNews.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.trendingItem}
              onPress={() => handleArticlePress(item)}
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

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {bottomTabs.map((tab, index) => (
          <TouchableOpacity key={index} style={styles.bottomTab}>
            <Text style={[styles.bottomTabIcon, tab.active && styles.activeBottomTab]}>
              {tab.icon}
            </Text>
            <Text style={[styles.bottomTabText, tab.active && styles.activeBottomTabText]}>
              {tab.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // paddingTop:22,
    backgroundColor: '#fff',
  },
  // HOME SCREEN STYLES
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    // paddingVertical: 15,
    backgroundColor: '#fff',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
   logo1: {
    width: 250,
    height: 80,
    resizeMode: "contain",
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  logoText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  menuButton: {
    padding: 5,
  },
  menuIcon: {
    fontSize: 20,
    color: '#333',
  },
  content: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
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
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  bottomTab: {
    alignItems: 'center',
    flex: 1,
  },
  bottomTabIcon: {
    fontSize: 20,
    marginBottom: 4,
    color: '#999',
  },
  activeBottomTab: {
    color: '#4CAF50',
  },
  bottomTabText: {
    fontSize: 12,
    color: '#999',
  },
  activeBottomTabText: {
    color: '#4CAF50',
    fontWeight: '600',
  },

  // DETAIL SCREEN STYLES
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: 10,
    borderRadius: 25,
    backgroundColor: '#f8f9fa',
  },
  backIcon: {
    fontSize: 18,
    color: '#333',
    fontWeight: 'bold',
  },
  detailHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  shareButton: {
    padding: 10,
    borderRadius: 25,
    backgroundColor: '#f8f9fa',
  },
  shareIcon: {
    fontSize: 16,
  },
  detailContent: {
    flex: 1,
    backgroundColor: '#fff',
  },
  articleImageContainer: {
    position: 'relative',
    height: 300,
  },
  articleImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  articleImageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
  },
  exclusiveTagDetail: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#FF4444',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  articleContentContainer: {
    padding: 20,
  },
  articleMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  articleSource: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  articleTime: {
    fontSize: 12,
    color: '#999',
  },
  articleTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    lineHeight: 34,
    marginBottom: 15,
  },
  authorSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  authorText: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
  locationText: {
    fontSize: 12,
    color: '#999',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 25,
  },
  tag: {
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  tagText: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '600',
  },
  articleLead: {
    fontSize: 18,
    lineHeight: 26,
    color: '#333',
    marginBottom: 25,
    fontWeight: '500',
    textAlign: 'justify',
  },
  articleBody: {
    fontSize: 16,
    lineHeight: 24,
    color: '#444',
    marginBottom: 20,
    textAlign: 'justify',
  },
  articleSubheading: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
    marginBottom: 15,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    paddingVertical: 20,
    marginVertical: 25,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  relatedSection: {
    marginTop: 30,
    paddingTop: 25,
    borderTopWidth: 2,
    borderTopColor: '#f0f0f0',
  },
  relatedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  relatedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginBottom: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  relatedImage: {
    width: 80,
    height: 60,
    borderRadius: 8,
    marginRight: 15,
  },
  relatedTextContainer: {
    flex: 1,
  },
  relatedItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    lineHeight: 18,
  },
  relatedItemSource: {
    fontSize: 12,
    color: '#999',
  },
  relatedArrow: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  actionIcon: {
    fontSize: 16,
    marginRight: 5,
  },
  actionText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  saveButton: {
    padding: 12,
    borderRadius: 25,
    backgroundColor: '#4CAF50',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  saveIcon: {
    fontSize: 18,
    color: '#fff',
  },
});

export default NewsApp;