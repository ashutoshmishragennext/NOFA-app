import NewsDetailScreen from "@/components/Users/DetailsPage";
import ExploreScreen from "@/components/Users/Explore";
import HomeScreen from "@/components/Users/Home";
import ProfileScreen from "@/components/Users/Profile";
import SavedScreen from "@/components/Users/Save";
import TrendingScreen from "@/components/Users/Trending";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const NewsApp = () => {
  const [currentTab, setCurrentTab] = useState("Home");
  const [currentView, setCurrentView] = useState("main");
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  
  // NEW: Track articles list and current position
  const [articlesList, setArticlesList] = useState([]);
  const [currentArticleIndex, setCurrentArticleIndex] = useState(0);
  const [sourceTab, setSourceTab] = useState("Home"); // Track where articles came from

  const bottomTabs = [
    { name: "Home", icon: "home", activeIcon: "home" },
    { name: "Explore", icon: "search-outline", activeIcon: "search" },
    {
      name: "Trending",
      icon: "trending-up-outline",
      activeIcon: "trending-up",
    },
    { name: "Saved", icon: "bookmark-outline", activeIcon: "bookmark" },
    { name: "Profile", icon: "person-outline", activeIcon: "person" },
  ];

  // UPDATED: Handle article press with articles list context
  const handleArticlePress = (article, articlesList = [], articleIndex = 0) => {
    setSelectedArticle(article);
    setArticlesList(articlesList);
    setCurrentArticleIndex(articleIndex);
    setSourceTab(currentTab); // Remember which tab we came from
    setCurrentView("detail");
  };

  // UPDATED: Handle back press
  const handleBackPress = () => {
    setCurrentView("main");
    setSelectedArticle(null);
    setArticlesList([]);
    setCurrentArticleIndex(0);
  };

  // NEW: Handle next article navigation
// In your parent component (NewsApp), update handleNextArticle:
const handleNextArticle = () => {
  console.log('=== NEXT ARTICLE DEBUG ===');
  console.log('Current Index:', currentArticleIndex);
  console.log('Articles List Length:', articlesList.length);
  console.log('Has Next:', currentArticleIndex < articlesList.length - 1);
  
  if (currentArticleIndex < articlesList.length - 1) {
    const nextIndex = currentArticleIndex + 1;
    const nextArticle = articlesList[nextIndex];
    
    console.log('Next Index:', nextIndex);
    console.log('Next Article:', nextArticle);
    
    setSelectedArticle(nextArticle);
    setCurrentArticleIndex(nextIndex);
  } else {
    console.log('No next article available');
  }
};

  // NEW: Handle previous article navigation (optional, if you want both directions)
  const handlePrevArticle = () => {
    if (currentArticleIndex > 0) {
      const prevIndex = currentArticleIndex - 1;
      const prevArticle = articlesList[prevIndex];
      
      setSelectedArticle(prevArticle);
      setCurrentArticleIndex(prevIndex);
    }
  };

  const handleTabPress = (tabName) => {
    setCurrentTab(tabName);
  };

  const renderCurrentScreen = () => {
    switch (currentTab) {
      case "Home":
        return <HomeScreen onArticlePress={handleArticlePress} />;
      case "Explore":
        return <ExploreScreen onArticlePress={handleArticlePress} />;
      case "Trending":
        return <TrendingScreen onArticlePress={handleArticlePress} />;
      case "Saved":
        return <SavedScreen onArticlePress={handleArticlePress} />;
      case "Profile":
        return <ProfileScreen />;
      default:
        return <HomeScreen onArticlePress={handleArticlePress} />;
    }
  };

  // Show Detail Screen if article is selected
// In your NewsApp component, update the detail screen render:
if (currentView === "detail" && selectedArticle) {
  const hasNext = currentArticleIndex < articlesList.length - 1;
  const hasPrev = currentArticleIndex > 0;

  return (
    <NewsDetailScreen 
      key={selectedArticle.id} // 👈 ADD THIS KEY PROP
      article={selectedArticle} 
      onBack={handleBackPress}
      onNext={hasNext ? handleNextArticle : null}
      hasNext={hasNext}
      currentIndex={currentArticleIndex}
      totalArticles={articlesList.length}
      sourceTab={sourceTab}
    />
  );
}

  // MAIN APP SCREEN
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.logo1}
          />
        </View>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setMenuVisible(!menuVisible)}
        >
          <Ionicons name="menu" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Menu Dropdown */}
      {menuVisible && (
        <View style={styles.menuDropdown}>
          {["Notifications", "Settings", "About"].map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => setMenuVisible(false)}
            >
              <Text style={styles.menuItemText}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Current Screen Content */}
      {renderCurrentScreen()}

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {bottomTabs.map((tab, index) => (
          <TouchableOpacity
            key={index}
            style={styles.bottomTab}
            onPress={() => handleTabPress(tab.name)}
          >
            <Ionicons
              name={
                currentTab === tab.name
                  ? (tab.activeIcon as any)
                  : (tab.icon as any)
              }
              size={24}
              color={currentTab === tab.name ? "#4CAF50" : "#999"}
            />
            <Text
              style={[
                styles.bottomTabText,
                currentTab === tab.name && styles.activeBottomTabText,
              ]}
            >
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
    backgroundColor: "#fff",
  },
  // HEADER STYLES
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    // paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo1: {
    width: 200,
    height: 60,
    resizeMode: "contain",
  },
  menuButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
  },
  menuDropdown: {
    position: "absolute",
    top: 90,
    right: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000,
    minWidth: 150,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuItemText: {
    fontSize: 14,
    color: "#333",
  },

  // CONTENT STYLES
  content: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },

  // BOTTOM NAVIGATION STYLES
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  bottomTab: {
    alignItems: "center",
    flex: 1,
    paddingVertical: 5,
  },
  bottomTabText: {
    fontSize: 11,
    color: "#999",
    marginTop: 4,
    fontWeight: "500",
  },
  activeBottomTabText: {
    color: "#4CAF50",
    fontWeight: "600",
  },
});

export default NewsApp;
