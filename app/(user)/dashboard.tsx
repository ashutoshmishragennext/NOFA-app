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

  // Navigation Functions
  const handleArticlePress = (article: any) => {
    setSelectedArticle(article);
    setCurrentView("detail");
  };

  const handleBackPress = () => {
    setCurrentView("main");
    setSelectedArticle(null);
  };

  const handleTabPress = (tabName: string) => {
    setCurrentTab(tabName);
  };

  const renderCurrentScreen = () => {
    switch (currentTab) {
      case "Home":
        return <HomeScreen onArticlePress={handleArticlePress} />;
      case "Explore":
        return <ExploreScreen />;
      case "Trending":
        return <TrendingScreen />;
      case "Saved":
        return <SavedScreen />;
      case "Profile":
        return <ProfileScreen />;
      default:
        return <HomeScreen onArticlePress={handleArticlePress} />;
    }
  };

  // Show Detail Screen if article is selected
  if (currentView === "detail" && selectedArticle) {
    return (
      <NewsDetailScreen article={selectedArticle} onBack={handleBackPress} />
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

      {/* Header */}
      {/* <Navbar/> */}

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
