import HamburgerIcon from "@/components/HamburgerMenu";
import NewsDetailScreen from "@/components/Users/DetailsPage";
import ExploreScreen from "@/components/Users/Explore";
import HomeScreen from "@/components/Users/Home";
import OnboardingScreen from "@/components/Users/OnboardingScreen";
import PasswordChangeScreen from "@/components/Users/PasswordChangeScreen";
import ProfileScreen from "@/components/Users/Profile";
import FeedScreen from "@/components/Users/Save";
import TrendingScreen from "@/components/Users/Trending";
import CategorySelectionScreen from "@/components/Users/categorySelection";
import { dummyAds, AdData, AdDisplayState, AdClickData } from "@/components/Users/DummyAds";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from "react";
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

// Enhanced content interface to support ads
interface ContentItem {
  type: 'article' | 'ad';
  data: any;
  id: string;
  index: number;
}

const NewsApp = () => {
  const { logout, user } = useAuth();

  const [currentTab, setCurrentTab] = useState("Home");
  const [currentView, setCurrentView] = useState<"main" | "detail" | "passwordChange" | "categoryChange">("main");
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const insets = useSafeAreaInsets();

  const [drawerVisible, setDrawerVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(300)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get('window').width;
  const drawerWidth = screenWidth * 0.8;

  // Enhanced state for content management with ads
  const [contentList, setContentList] = useState<ContentItem[]>([]);
  const [currentContentIndex, setCurrentContentIndex] = useState(0);
  const [sourceTab, setSourceTab] = useState("Home");
  const [prerenderedContent, setPrerenderedContent] = useState(new Map());
  
  // Ad management state
  const [adDisplayState, setAdDisplayState] = useState<AdDisplayState>({
    shouldShowAd: false,
    currentAdIndex: 0,
    articlesViewedCount: 0,
    nextAdAfter: 3, // Show ad after every 3 articles
    adQueue: [...dummyAds]
  });

  const [contentTransition, setContentTransition] = useState({
    isTransitioning: false,
    direction: null,
    nextContent: null
  });

  // Article navigation states (keep for backward compatibility)
  const [articlesList, setArticlesList] = useState<never[] | any[]>([]);
  const [currentArticleIndex, setCurrentArticleIndex] = useState(0);

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

  // ========================================
  // AD MANAGEMENT FUNCTIONS
  // ========================================

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const getNextAd = useCallback((): AdData => {
    const currentAd = adDisplayState.adQueue[adDisplayState.currentAdIndex];
    
    setAdDisplayState(prev => ({
      ...prev,
      currentAdIndex: (prev.currentAdIndex + 1) % prev.adQueue.length
    }));

    return currentAd;
  }, [adDisplayState.adQueue, adDisplayState.currentAdIndex]);

  const shouldShowAdNow = useCallback((viewedCount: number): boolean => {
    return viewedCount > 0 && viewedCount % adDisplayState.nextAdAfter === 0;
  }, [adDisplayState.nextAdAfter]);

  const createContentList = useCallback((articles: any[]): ContentItem[] => {
    if (!articles || articles.length === 0) return [];

    const content: ContentItem[] = [];
    let contentIndex = 0;

    articles.forEach((article, idx) => {
      // Add the article
      content.push({
        type: 'article',
        data: article,
        id: `article_${article.id}_${idx}`,
        index: contentIndex++
      });

      // Check if we should add an ad after this article
      if (shouldShowAdNow(idx + 1)) {
        const ad = getNextAd();
        content.push({
          type: 'ad',
          data: ad,
          id: `ad_${ad.id}_${idx}`,
          index: contentIndex++
        });
      }
    });

    return content;
  }, [shouldShowAdNow, getNextAd]);

  const prerenderAdjacentContent = useCallback((currentContent: ContentItem, contentList: ContentItem[], currentIdx: number) => {
    if (!contentList || contentList.length <= 1) return;
    
    const prerenderedMap = new Map();
    
    // Prerender current, next, and previous content
    const indices = [
      currentIdx,
      (currentIdx + 1) % contentList.length,
      (currentIdx - 1 + contentList.length) % contentList.length
    ];
    
    indices.forEach(idx => {
      const content = contentList[idx];
      if (content) {
        prerenderedMap.set(content.id, {
          content,
          index: idx,
          isActive: idx === currentIdx
        });
      }
    });
    
    setPrerenderedContent(prerenderedMap);
  }, []);

  // ========================================
  // NAVIGATION HANDLERS
  // ========================================

  const handleArticlePress = useCallback((article, articles, index) => {
    // Create content list with ads integrated
    const enhancedContent = createContentList(articles);
    
    // Find the corresponding content item for the selected article
    const articleContentItem = enhancedContent.find(item => 
      item.type === 'article' && item.data.id === article.id
    );
    
    if (!articleContentItem) return;

    const contentIndex = enhancedContent.findIndex(item => item.id === articleContentItem.id);
    
    setContentList(enhancedContent);
    setCurrentContentIndex(contentIndex);
    setSelectedArticle(article);
    setSourceTab(currentTab);
    setCurrentView("detail");
    
    // Also set legacy states for backward compatibility
    setArticlesList(articles);
    setCurrentArticleIndex(index);
    
    // Prerender adjacent content
    prerenderAdjacentContent(articleContentItem, enhancedContent, contentIndex);
    
    // Update ad view count
    setAdDisplayState(prev => ({
      ...prev,
      articlesViewedCount: prev.articlesViewedCount + 1
    }));
  }, [currentTab, createContentList, prerenderAdjacentContent]);

const handleNextContent = useCallback(() => {
  if (contentTransition.isTransitioning || contentList.length <= 1) return;
  
  const nextIndex = (currentContentIndex + 1) % contentList.length;
  const nextContent = contentList[nextIndex];
  
  setContentTransition({
    isTransitioning: true,
    direction: 'next',
    nextContent: nextContent
  });
  
  // Immediate state update - no setTimeout delay (consistent with handlePrevContent)
  setCurrentContentIndex(nextIndex);
  
  // Update selected article if next content is an article
  if (nextContent.type === 'article') {
    setSelectedArticle(nextContent.data);
    // Update legacy article index
    const articleOnlyList = contentList.filter(item => item.type === 'article');
    const articleIndex = articleOnlyList.findIndex(item => item.data.id === nextContent.data.id);
    if (articleIndex !== -1) {
      setCurrentArticleIndex(articleIndex);
    }
  }
  
  // Immediately prerender new adjacent content
  prerenderAdjacentContent(nextContent, contentList, nextIndex);
  
  // Reset transition state after a brief moment
  setTimeout(() => {
    setContentTransition({
      isTransitioning: false,
      direction: null,
      nextContent: null
    });
  }, 100);

  // Update view count for articles
  if (nextContent.type === 'article') {
    setAdDisplayState(prev => ({
      ...prev,
      articlesViewedCount: prev.articlesViewedCount + 1
    }));
  }
}, [contentTransition.isTransitioning, contentList, currentContentIndex, prerenderAdjacentContent]);

  const handlePrevContent = useCallback(() => {
    if (contentTransition.isTransitioning || contentList.length <= 1) return;
    
    const prevIndex = (currentContentIndex - 1 + contentList.length) % contentList.length;
    const prevContent = contentList[prevIndex];
    
    setContentTransition({
      isTransitioning: true,
      direction: 'prev',
      nextContent: prevContent
    });
    
    // Immediate state update - no setTimeout delay
    setCurrentContentIndex(prevIndex);
    
    // Update selected article if previous content is an article
    if (prevContent.type === 'article') {
      setSelectedArticle(prevContent.data);
      // Update legacy article index
      const articleOnlyList = contentList.filter(item => item.type === 'article');
      const articleIndex = articleOnlyList.findIndex(item => item.data.id === prevContent.data.id);
      if (articleIndex !== -1) {
        setCurrentArticleIndex(articleIndex);
      }
    }
    
    // Immediately prerender new adjacent content
    prerenderAdjacentContent(prevContent, contentList, prevIndex);
    
    // Reset transition state after a brief moment
    setTimeout(() => {
      setContentTransition({
        isTransitioning: false,
        direction: null,
        nextContent: null
      });
    }, 100);
  }, [contentTransition.isTransitioning, contentList, currentContentIndex, prerenderAdjacentContent]);

  // ========================================
  // AD INTERACTION HANDLERS
  // ========================================

  const handleAdClick = useCallback((adData: AdData) => {
    const clickData: AdClickData = {
      adId: adData.id,
      adType: adData.type,
      advertiser: adData.advertiser,
      timestamp: Date.now()
    };
    
  }, [handleNextContent]);

  const handleAdClose = useCallback(() => {
    handleNextContent();
  }, [handleNextContent]);

  // ========================================
  // EXISTING HANDLERS (unchanged)
  // ========================================

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

  const handleLogoutFromDrawer = () => {
    closeDrawer();
    setTimeout(() => {
      handleLogout();
    }, 300);
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setOnboardingCompleted(true);
  };

  const handleBackPress = () => {
    setCurrentView("main");
    setSelectedArticle(null);
    setContentList([]);
    setArticlesList([]);
    setCurrentContentIndex(0);
    setCurrentArticleIndex(0);
    setPrerenderedContent(new Map());
  };

  const handleTabPress = (tabName: string) => {
    setCurrentTab(tabName);
  };

  // ========================================
  // EFFECTS
  // ========================================

  useEffect(() => {
    if (user && Number(user.loginTime) === 0 && !onboardingCompleted) {
      setShowOnboarding(true);
    } else if (user && Number(user.loginTime) > 0) {
      setShowOnboarding(false);
      setOnboardingCompleted(true);
    }
  }, [user]);

  useEffect(() => {
    const backAction = () => {
      if (drawerVisible) {
        closeDrawer();
        return true;
      }

      if (currentView === "passwordChange" || currentView === "categoryChange") {
        handleBackToMain();
        return true;
      }

      if (showOnboarding) {
        return true;
      }

      if (currentView === "detail" && selectedArticle) {
        handleBackPress();
        return true;
      }

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

  // Initialize ad queue with shuffled ads
  useEffect(() => {
    setAdDisplayState(prev => ({
      ...prev,
      adQueue: shuffleArray(dummyAds)
    }));
  }, []);


  const renderCurrentScreen = () => {
    switch (currentTab) {
      case "Home":
        return <HomeScreen onArticlePress={handleArticlePress} />;
      case "Explore":
        return <ExploreScreen onArticlePress={handleArticlePress} />;
      case "Feed":
        return <FeedScreen onArticlePress={handleArticlePress} />;
      case "Trending":
        return <TrendingScreen onArticlePress={handleArticlePress} />;
      case "Profile":
        return <ProfileScreen onArticlePress={handleArticlePress}/>;
      default:
        return <HomeScreen onArticlePress={handleArticlePress} />;
    }
  };

  // Helper function to get content for rendering
  const getContentForRendering = () => {
    if (contentList.length === 0) return { current: null, next: null, prev: null };
    
    const current = contentList[currentContentIndex];
    const next = contentList[(currentContentIndex + 1) % contentList.length];
    const prev = contentList[(currentContentIndex - 1 + contentList.length) % contentList.length];
    
    return {
      current: current || null,
      next: contentList.length > 1 ? next : null,
      prev: contentList.length > 1 ? prev : null
    };
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

  // Show Detail Screen if content is selected
  if (currentView === "detail" && contentList.length > 0) {
    const { current, next, prev } = getContentForRendering();
    
    return (
      <View style={[styles.container, {
        paddingTop: insets.top,
        paddingBottom: insets.bottom
      }]}>
        <StatusBar style="dark" />
        <NewsDetailScreen
          key={`${current?.id}-${currentContentIndex}`}
          article={selectedArticle}
          onBack={handleBackPress}
          onNext={handleNextContent}
          onPrev={handlePrevContent}
          hasNext={contentList.length > 1}
          hasPrev={contentList.length > 1}
          currentIndex={currentContentIndex}
          allArticles={articlesList}
          // Enhanced props for ad support
          currentContent={current}
          nextContent={next}
          prevContent={prev}
          onAdClick={handleAdClick}
          onAdClose={handleAdClose}
          prerenderedNextArticle={prerenderedContent.get(next?.id)?.content?.data}
          prerenderedPrevArticle={prerenderedContent.get(prev?.id)?.content?.data}
          isTransitioning={contentTransition.isTransitioning}
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
          onPress={openDrawer}
        >
          <HamburgerIcon size={22} />
        </TouchableOpacity>
      </View>

      {/* Sliding Drawer */}
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
            <View style={[styles.drawerHeader,{paddingTop: insets.top + 20}]}>
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

// Styles remain the same as in your original code
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
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
  },
  content: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
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