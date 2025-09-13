import HamburgerIcon from "@/components/HamburgerMenu";
import NewsDetailScreen from "@/components/Users/DetailsPage";
import ExploreScreen from "@/components/Users/Explore";
import HomeScreen from "@/components/Users/Home";
import OnboardingScreen from "@/components/Users/OnboardingScreen"; // Add this import
import PasswordChangeScreen from "@/components/Users/PasswordChangeScreen";
import ProfileScreen from "@/components/Users/Profile";
import FeedScreen from "@/components/Users/Save";
import TrendingScreen from "@/components/Users/Trending";
import CategorySelectionScreen from "@/components/Users/categorySelection";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  BackHandler,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const NewsApp = () => {
  const { logout, user } = useAuth();

  const [currentTab, setCurrentTab] = useState("Home");
  const [currentView, setCurrentView] = useState<"main" | "detail" | "passwordChange" | "categoryChange">("main");
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false); // ✅ Added flag
  const insets = useSafeAreaInsets();

  const [drawerVisible, setDrawerVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(300)).current; // Start off-screen
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get('window').width;
  const drawerWidth = screenWidth * 0.8; // 80% of screen width
  // Update your state to include the new screens

// Update your handler functions in the drawer
const handlePasswordChange = () => {
  closeDrawer();
  setCurrentView("passwordChange");
};

const handleCategoryChange = () => {
  closeDrawer();
  setCurrentView("categoryChange");
};

const handleBackToMain = () => {
  setCurrentView("main");
};

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            logout();
          },
        },
      ]
    );
  };

  // Article navigation states
  const [articlesList, setArticlesList] = useState<never[] | any[]>([]);
  const [currentArticleIndex, setCurrentArticleIndex] = useState(0);
  const [sourceTab, setSourceTab] = useState("Home");

  const bottomTabs = [
    { name: "Home", icon: "home", activeIcon: "home" },
    { name: "Explore", icon: "search-outline", activeIcon: "search" },
    { name: "Feed", icon: "newspaper-outline", activeIcon: "newspaper" },
    {
      name: "Trending",
      icon: "trending-up-outline",
      activeIcon: "trending-up",
    },
    { name: "Profile", icon: "person-outline", activeIcon: "person" },
  ];

  // ✅ Updated: Check if onboarding should be shown with flag protection
  useEffect(() => {
    if (user && Number(user.loginTime) === 0 && !onboardingCompleted) {
      setShowOnboarding(true);
    } else if (user && Number(user.loginTime) > 0) {
      setShowOnboarding(false);
      setOnboardingCompleted(true); // Set flag when user has completed onboarding
    }
  }, [user]); // ✅ Removed onboardingCompleted from dependencies

useEffect(() => {
  const backAction = () => {

     if (drawerVisible) {
      closeDrawer();
      return true;
    }

    // If we're in password change or category change, go back to main
    if (currentView === "passwordChange" || currentView === "categoryChange") {
      handleBackToMain();
      return true;
    }

    // If we're in onboarding, don't allow back navigation
    if (showOnboarding) {
      return true;
    }

    // If we're in detail view, close it instead of exiting app
    if (currentView === "detail" && selectedArticle) {
      handleBackPress();
      return true;
    }

    // If we're on main screen, show exit confirmation
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
    return true;
  };

  const backHandler = BackHandler.addEventListener(
    "hardwareBackPress",
    backAction
  );

  return () => backHandler.remove();
}, [currentView, selectedArticle, showOnboarding, drawerVisible]);

  // Add these functions after your existing handler functions

const openDrawer = () => {
  setDrawerVisible(true);
  
  Animated.parallel([
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }),
    Animated.timing(overlayOpacity, {
      toValue: 0.5,
      duration: 300,
      useNativeDriver: true,
    }),
  ]).start();
};

const closeDrawer = () => {
  Animated.parallel([
    Animated.timing(slideAnim, {
      toValue: drawerWidth,
      duration: 250,
      useNativeDriver: true,
    }),
    Animated.timing(overlayOpacity, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }),
  ]).start(() => {
    setDrawerVisible(false);
  });
};

const handleLogoutFromDrawer = () => {
  closeDrawer();
  setTimeout(() => {
    handleLogout();
  }, 300); // Wait for drawer to close
};

  // ✅ Updated: Handle onboarding completion with flag
  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setOnboardingCompleted(true); // ✅ Set the flag to prevent re-showing
    console.log('Onboarding completed, flag set to prevent re-render');
    // The actual loginTime will be updated to 1 later in the onboarding flow when categories are selected
  };
const handleArticlePress = (article: any, articles: any[], index: number) => {
  setSelectedArticle(article);
  setArticlesList(articles);
  setCurrentArticleIndex(index);
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

const handleNextArticle = () => {
  // Circular navigation: wrap to index 0 when reaching the end
  const nextIndex = (currentArticleIndex + 1) % articlesList.length;
  const nextArticle = articlesList[nextIndex];
  
  setSelectedArticle(nextArticle);
  setCurrentArticleIndex(nextIndex);
  
};

const handlePrevArticle = () => {
  // Circular navigation: wrap to last index when going before 0
  const prevIndex = (currentArticleIndex - 1 + articlesList.length) % articlesList.length;
  const prevArticle = articlesList[prevIndex];
  
  setSelectedArticle(prevArticle);
  setCurrentArticleIndex(prevIndex);
  
};

  const handleTabPress = (tabName:string) => {
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

  // Show onboarding screen if user's loginTime is 0 AND flag is not set
  if (showOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  if (currentView === "passwordChange") {
  return (
    <View style={[styles.container, {
      paddingTop: insets.top,
      paddingBottom: insets.bottom
    }]}>
      <StatusBar style="dark" />
      <PasswordChangeScreen onBack={handleBackToMain} />
    </View>
  );
}

if (currentView === "categoryChange") {
  return (
    <View style={[styles.container, {
      paddingTop: insets.top,
      paddingBottom: insets.bottom
    }]}>
      <StatusBar style="dark" />
      <CategorySelectionScreen 
        onBack={handleBackToMain}
        mode="settings"
        title="Select Categories"
        description="We'll recommend news according to your interests and familiarity."
      />
    </View>
  );
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
          onNext={ handleNextArticle}
          onPrev={ handlePrevArticle}
          hasNext={articlesList.length > 1}
          hasPrev={articlesList.length > 1}
          currentIndex={currentArticleIndex}
          totalArticles={articlesList.length}
          sourceTab={sourceTab}
          allArticles={articlesList}
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
          {/* <View style={styles.logoContainer}>
            <View style={styles.logoIcon} />
            <Text style={styles.appName}>Apartment Times</Text>
          </View> */}
            <Image
              source={require("../../assets/images/logo.png")}
              style={styles.logo1}
            />
        </View>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={openDrawer} // Changed from setMenuVisible toggle
        >
          {/* <Ionicons name="menu" size={24} color="#333" /> */}
          <HamburgerIcon size={22} />
        </TouchableOpacity>
      </View>

      {/* Menu Dropdown */}
      {/* Remove the old menuDropdown and replace with this sliding drawer */}
{drawerVisible && (
  <>
    {/* Overlay */}
    <Animated.View
      style={[
        styles.overlay,
        {
          opacity: overlayOpacity,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.overlayTouchable}
        onPress={closeDrawer}
        activeOpacity={1}
      />
    </Animated.View>

    {/* Sliding Drawer */}
    <Animated.View
      style={[
        styles.drawer,
        {
          width: drawerWidth,
          transform: [{ translateX: slideAnim }],
        },
      ]}
    >
      {/* Drawer Header */}
      <View style={[styles.drawerHeader,{paddingTop: insets.top + 20,
}]}>
        <View style={styles.drawerHeaderContent}>
          <View style={styles.userInfo}>
            <View style={styles.userAvatar}>
              <Ionicons name="person" size={24} color="#4CAF50" />
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user?.name || 'User Name'}</Text>
              <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={closeDrawer} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Drawer Menu Items */}
      <View style={styles.drawerContent}>
        <TouchableOpacity style={styles.drawerMenuItem} onPress={handlePasswordChange}>
          <View style={styles.menuItemIcon}>
            <Ionicons name="lock-closed-outline" size={22} color="#555" />
          </View>
          <Text style={styles.drawerMenuItemText}>Change Password</Text>
          <Ionicons name="chevron-forward" size={18} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.drawerMenuItem} onPress={handleCategoryChange}>
          <View style={styles.menuItemIcon}>
            <Ionicons name="options-outline" size={22} color="#555" />
          </View>
          <Text style={styles.drawerMenuItemText}>Change Categories</Text>
          <Ionicons name="chevron-forward" size={18} color="#999" />
        </TouchableOpacity>


        <TouchableOpacity style={styles.drawerMenuItem} onPress={handleLogoutFromDrawer}>
          <View style={styles.menuItemIcon}>
            <Ionicons name="log-out-outline" size={22} color="#e74c3c" />
          </View>
          <Text style={[styles.drawerMenuItemText, styles.logoutMenuItem]}>Logout</Text>
          <Ionicons name="chevron-forward" size={18} color="#e74c3c" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  </>
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


// Styles remain the same
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
    paddingHorizontal: 15,
    paddingTop: 5,
    paddingBottom: 8,
    backgroundColor: "#fff",
    elevation: 0,
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: -5,
  },
  logoIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#4CAF50",
    marginRight: 8,
  },
  appName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  logo1: {
    width: 200,
    height: 60,
    resizeMode: "contain",
  },
  menuButton: {
    padding: 6,
    borderRadius: 16,
    // backgroundColor: "#f8f9fa",
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
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    zIndex: 998,
  },
  overlayTouchable: {
    flex: 1,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    zIndex: 999,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  drawerHeader: {
    backgroundColor: '#f8f9fa',
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  drawerHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e8f5e8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  closeButton: {
    padding: 8,
    marginLeft: 12,
  },
  drawerContent: {
    flex: 1,
    paddingTop: 10,
  },
  drawerMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemIcon: {
    width: 40,
    alignItems: 'center',
    marginRight: 12,
  },
  drawerMenuItemText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  logoutMenuItem: {
    color: '#e74c3c',
  },
  divider: {
    height: 1,
    backgroundColor: '#e9ecef',
    marginVertical: 10,
    marginHorizontal: 20,
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
