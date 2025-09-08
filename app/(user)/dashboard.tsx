import NewsDetailScreen from "@/components/Users/DetailsPage";
import ExploreScreen from "@/components/Users/Explore";
import HomeScreen from "@/components/Users/Home";
import ProfileScreen from "@/components/Users/Profile";
import FeedScreen from "@/components/Users/Save";
import TrendingScreen from "@/components/Users/Trending";
import OnboardingScreen from "@/components/Users/OnboardingScreen"; // Add this import
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from "react";
import {
  Alert,
  BackHandler,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from "@/context/AuthContext";
// import { StatusBar } from 'expo-status-bar';
// import FeedScreen from "@/components/Users/Save";
const NewsApp = () => {
  const [currentTab, setCurrentTab] = useState("Home");
  const [currentView, setCurrentView] = useState("main");
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false); // Add onboarding state
  const insets = useSafeAreaInsets();
  const user = useAuth().user;
  
  // Article navigation states
  const [articlesList, setArticlesList] = useState([]);
  const [currentArticleIndex, setCurrentArticleIndex] = useState(0);
  const [sourceTab, setSourceTab] = useState("Home");

  const bottomTabs = [
    { name: "Home", icon: "home", activeIcon: "home" },
    { name: "Explore", icon: "search-outline", activeIcon: "search" },
    { name: "Feed", icon: "newspaper-outline", activeIcon: "newspaper" },
    { name: "Trending",icon: "trending-up-outline",activeIcon: "trending-up",},
    { name: "Profile", icon: "person-outline", activeIcon: "person" },
  ];

  // Check if onboarding should be shown
  useEffect(() => {
    if (user && Number(user.loginTime) === 0) {
      setShowOnboarding(true);
    }
  }, [user]);

  // Custom back button handler
  useEffect(() => {
    const backAction = () => {
      // If we're in onboarding, don't allow back navigation
      if (showOnboarding) {
        return true; // Prevent default behavior
      }

      // If we're in detail view, close it instead of exiting app
      if (currentView === "detail" && selectedArticle) {
        handleBackPress();
        return true; // Prevent default behavior (app exit)
      }

      // If we're on main screen, show exit confirmation (optional)
      Alert.alert(
        "Exit App",
        "Do you want to exit the app?",
        [
          {
            text: "Cancel",
            onPress: () => null,
            style: "cancel"
          },
          {
            text: "Exit",
            onPress: () => BackHandler.exitApp()
          }
        ]
      );
      return true; // Prevent default behavior
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [currentView, selectedArticle, showOnboarding]); // Add showOnboarding to dependencies

  // Handle onboarding completion
  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    // Optional: You can update the user's loginTime here to mark onboarding as completed
    // This would prevent the onboarding from showing again
    // updateUserLoginTime(); // You'll need to implement this function
  };

  // Handle article press with articles list context
  const handleArticlePress = (article, articlesList = [], articleIndex = 0) => {
    setSelectedArticle(article);
    setArticlesList(articlesList);
    setCurrentArticleIndex(articleIndex);
    setSourceTab(currentTab);
    setCurrentView("detail");
  };

  // Handle back press
  const handleBackPress = () => {
    setCurrentView("main");
    setSelectedArticle(null);
    setArticlesList([]);
    setCurrentArticleIndex(0);
  };

  // Handle next article navigation
  const handleNextArticle = () => {
    if (currentArticleIndex < articlesList.length - 1) {
      const nextIndex = currentArticleIndex + 1;
      const nextArticle = articlesList[nextIndex];

      setSelectedArticle(nextArticle);
      setCurrentArticleIndex(nextIndex);
    }
  };

  // Handle previous article navigation
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
         case "Feed": // Changed from Saved to Feed
        return <FeedScreen onArticlePress={handleArticlePress} />;
      case "Trending":
        return <TrendingScreen onArticlePress={handleArticlePress} />;
    
      case "Profile":
        return <ProfileScreen onArticlePress={handleArticlePress}/>;
      default:
        return <HomeScreen onArticlePress={handleArticlePress} />;
    }
  };

  // Show onboarding screen if user's loginTime is 0
  if (showOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  // Show Detail Screen if article is selected
  if (currentView === "detail" && selectedArticle) {
    const hasNext = currentArticleIndex < articlesList.length - 1;
    const hasPrev = currentArticleIndex > 0;

    return (
      <View style={[styles.container, {
        paddingTop: insets.top,
        paddingBottom: insets.bottom
      }]}>
        <StatusBar style="dark" />
        <NewsDetailScreen
          key={selectedArticle.id}
          article={selectedArticle}
          onBack={handleBackPress}
          onNext={hasNext ? handleNextArticle : null}
          onPrev={hasPrev ? handlePrevArticle : handleBackPress}
          hasNext={hasNext}
          hasPrev={hasPrev}
          currentIndex={currentArticleIndex}
          totalArticles={articlesList.length}
          sourceTab={sourceTab}
        />
      </View>
    );
  }

  // MAIN APP SCREEN
  return (
    <View style={[styles.container, {
      paddingTop: insets.top,
      paddingBottom: insets.bottom
    }]}>
      <StatusBar style="dark" />
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

      {/* Menu Dropdown */}
      {menuVisible && (
        <View style={[styles.menuDropdown, { top: 90 + insets.top }]}>
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
    </View>
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
    paddingVertical: 4,     
    paddingBottom: 4,       
    borderTopWidth: 1,       
    borderTopColor: "#f0f0f0",
    elevation: 1,          
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