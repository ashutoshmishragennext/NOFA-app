import { apiService } from '@/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Modal,
  PanResponder,
  SafeAreaView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import RenderHtml from "react-native-render-html";
import { WebView } from 'react-native-webview';
import CommentsSection from './CommentsPage';
import { AdClickData, AdData, AdDisplayState, dummyAds, NewsDetailScreenProps } from './DummyAds';

const { width, height } = Dimensions.get('window');

const NewsDetailScreen: React.FC<NewsDetailScreenProps> = ({
  article,
  onBack,
  onNext,
  hasNext,
  onPrev,
  hasPrev = false,
  currentIndex,
  allArticles = []
}) => {
  const [fontsLoaded] = useFonts({
    'NeuePlakExtended-SemiBold': require('../../assets/fonts/Neue Plak Extended SemiBold.ttf'),
    'Montserrat-Medium': require('../../assets/fonts/Montserrat-Medium.ttf'),
    'Newsreader-Italic-VariableFont_opsz': require('../../assets/fonts/Newsreader-Italic-VariableFont_opsz,wght.ttf')
  });

  // ========================================
  // SIMPLIFIED ADVERTISEMENT LOGIC WITH BINARY ARRAY
  // ========================================
  
  // Advertisement configuration
  const AD_CONFIG = {
    ARRAY_LENGTH: 100,                // Pre-generate for 100 positions
    AD_PROBABILITY: 0.3,             // 30% chance for each position
    MIN_GAP_BETWEEN_ADS: 2,          // Minimum 2 articles between ads
    MAX_ADS_PER_SESSION: 3,          // Maximum 3 ads per session
    STORAGE_KEY: 'ad_binary_array'
  };

  // Pre-generated binary array for ad positions
  const [adBinaryArray, setAdBinaryArray] = useState<number[]>([]);
  const [adsShownCount, setAdsShownCount] = useState(0);
  const [sessionId, setSessionId] = useState<string>('');

  // Ad state
  const [adState, setAdState] = useState<AdDisplayState>({
    shouldShowAd: false,
    currentAdIndex: 0,
    articlesViewedCount: 0,
    nextAdAfter: 2,
    adQueue: [],
  });

  // Content determination state
  const [contentMap, setContentMap] = useState({
    current: { type: 'article', data: article, shouldShowAd: false },
    next: { type: 'article', data: null, shouldShowAd: false },
    prev: { type: 'article', data: null, shouldShowAd: false }
  });

  // Article and UI state
  const [showComments, setShowComments] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(article.likeCount || 0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);
  const swipeIndicatorOpacity = useRef(new Animated.Value(0.6)).current;
  const [showWebView, setShowWebView] = useState(false);
  const [webViewUrl, setWebViewUrl] = useState('');

  // User and animation state
  const [pendingLikeAction, setPendingLikeAction] = useState(null);
  const currentUser = useAuth().user;
  const pan = useRef(new Animated.ValueXY()).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const likeUpdateTimer = useRef(null);

  // Constants
  const LIKE_BATCH_DELAY = 1 * 60 * 1000;
  const LIKE_STORAGE_KEY = `article_likes_${article.id}`;

  // Animation state
  const [isTransitioning, setIsTransitioning] = useState(false);
  const likeScale = useRef(new Animated.Value(1)).current;
  const commentScale = useRef(new Animated.Value(1)).current;
  const shareScale = useRef(new Animated.Value(1)).current;
  const bookmarkScale = useRef(new Animated.Value(1)).current;

  // ========================================
  // BINARY ARRAY GENERATION LOGIC
  // ========================================

  // Generate smart binary array with proper gaps
  const generateAdBinaryArray = useCallback((): number[] => {
    const array = new Array(AD_CONFIG.ARRAY_LENGTH).fill(0);
    let adsPlaced = 0;
    let lastAdPosition = -AD_CONFIG.MIN_GAP_BETWEEN_ADS;

    console.log('Generating ad binary array...');

    for (let i = 0; i < AD_CONFIG.ARRAY_LENGTH && adsPlaced < AD_CONFIG.MAX_ADS_PER_SESSION; i++) {
      // Check if minimum gap is maintained
      const gapMaintained = (i - lastAdPosition) >= AD_CONFIG.MIN_GAP_BETWEEN_ADS;
      
      // Random probability check
      const shouldPlaceAd = Math.random() < AD_CONFIG.AD_PROBABILITY;
      
      if (gapMaintained && shouldPlaceAd) {
        array[i] = 1;
        lastAdPosition = i;
        adsPlaced++;
        console.log(`Ad placed at position ${i}`);
      }
    }

    console.log('Generated binary array:', array.slice(0, 20), '...'); // Show first 20 positions
    console.log(`Total ads placed: ${adsPlaced}`);
    
    return array;
  }, []);

  // Initialize or load binary array
  const initializeAdArray = useCallback(async () => {
    try {
      const currentSessionId = Date.now().toString();
      const storedData = await AsyncStorage.getItem(AD_CONFIG.STORAGE_KEY);
      
      if (storedData) {
        const parsed = JSON.parse(storedData);
        
        // Check if session is less than 24 hours old
        const isValidSession = (Date.now() - parseInt(parsed.sessionId)) < (24 * 60 * 60 * 1000);
        
        if (isValidSession && parsed.array && Array.isArray(parsed.array)) {
          console.log('Using stored ad binary array');
          setAdBinaryArray(parsed.array);
          setAdsShownCount(parsed.adsShown || 0);
          setSessionId(parsed.sessionId);
          return;
        }
      }

      // Generate new array for new session
      console.log('Generating new ad binary array');
      const newArray = generateAdBinaryArray();
      const sessionData = {
        array: newArray,
        sessionId: currentSessionId,
        adsShown: 0
      };

      setAdBinaryArray(newArray);
      setAdsShownCount(0);
      setSessionId(currentSessionId);
      
      await AsyncStorage.setItem(AD_CONFIG.STORAGE_KEY, JSON.stringify(sessionData));
      
    } catch (error) {
      console.error('Error initializing ad array:', error);
      // Fallback to generated array
      const fallbackArray = generateAdBinaryArray();
      setAdBinaryArray(fallbackArray);
    }
  }, [generateAdBinaryArray]);

  // ========================================
  // SIMPLIFIED AD DISPLAY LOGIC
  // ========================================

  // Simple check using binary array
  const shouldShowAdForIndex = useCallback((articleIndex: number): boolean => {
    // Ensure index is within array bounds
    const safeIndex = articleIndex % adBinaryArray.length;
    
    // Check binary array value
    const shouldShow = adBinaryArray[safeIndex] === 1;
    
    // Additional check: don't exceed session limit
    const withinSessionLimit = adsShownCount < AD_CONFIG.MAX_ADS_PER_SESSION;
    
    const result = shouldShow && withinSessionLimit;
    
    if (shouldShow) {
      console.log(`Index ${articleIndex} (array pos ${safeIndex}): Should show ad = ${result}, ads shown = ${adsShownCount}`);
    }
    
    return result;
  }, [adBinaryArray, adsShownCount]);

  // Update ads shown count
  const updateAdsShownCount = useCallback(async () => {
    try {
      const newCount = adsShownCount + 1;
      setAdsShownCount(newCount);
      
      // Update stored data
      const storedData = await AsyncStorage.getItem(AD_CONFIG.STORAGE_KEY);
      if (storedData) {
        const parsed = JSON.parse(storedData);
        parsed.adsShown = newCount;
        await AsyncStorage.setItem(AD_CONFIG.STORAGE_KEY, JSON.stringify(parsed));
      }
      
      console.log(`Ads shown count updated to: ${newCount}`);
    } catch (error) {
      console.error('Error updating ads shown count:', error);
    }
  }, [adsShownCount]);

  // ========================================
  // CONTENT MAPPING WITH BINARY ARRAY LOGIC
  // ========================================

  const calculateContentMap = useCallback(() => {
    const getArticleAtIndex = (index: number) => {
      if (allArticles.length === 0) return null;
      const normalizedIndex = ((index % allArticles.length) + allArticles.length) % allArticles.length;
      return allArticles[normalizedIndex];
    };

    // Use binary array to determine ad placement
    const currentShouldShowAd = shouldShowAdForIndex(currentIndex);
    const nextShouldShowAd = shouldShowAdForIndex(currentIndex + 1);
    const prevShouldShowAd = shouldShowAdForIndex(currentIndex - 1);

    const currentContent = currentShouldShowAd && adState.adQueue.length > 0
      ? { type: 'ad', data: adState.adQueue[adState.currentAdIndex], shouldShowAd: true }
      : { type: 'article', data: article, shouldShowAd: false };

    const nextContent = nextShouldShowAd && adState.adQueue.length > 0
      ? { type: 'ad', data: adState.adQueue[(adState.currentAdIndex + 1) % adState.adQueue.length], shouldShowAd: true }
      : { type: 'article', data: getArticleAtIndex(currentIndex + 1), shouldShowAd: false };

    const prevContent = prevShouldShowAd && adState.adQueue.length > 0
      ? { type: 'ad', data: adState.adQueue[(adState.currentAdIndex - 1 + adState.adQueue.length) % adState.adQueue.length], shouldShowAd: true }
      : { type: 'article', data: getArticleAtIndex(currentIndex - 1), shouldShowAd: false };

    return {
      current: currentContent,
      next: nextContent,
      prev: prevContent
    };
  }, [currentIndex, allArticles, article, adState.adQueue, adState.currentAdIndex, shouldShowAdForIndex]);

  // ========================================
  // LIKE SYSTEM LOGIC
  // ========================================

  // Initialize like state
  useEffect(() => {
    const initializeLikeState = async () => {
      try {
        if (currentUser && article.id) {
          setLikeLoading(true);

          // Check for pending likes in AsyncStorage FIRST
          const localLikeData = await AsyncStorage.getItem(LIKE_STORAGE_KEY);

          if (localLikeData) {
            const parsedData = JSON.parse(localLikeData);

            if (parsedData.userId === currentUser.id && parsedData.articleId === article.id) {
              console.log('Found pending likes, syncing to server first...');
              await syncPendingLikesToServer(parsedData);
            } else {
              await AsyncStorage.removeItem(LIKE_STORAGE_KEY);
            }
          }

          await loadServerLikeState();

          const bookmarked = await apiService.isArticleBookmarked(currentUser.id, article.id);
          setIsBookmarked(bookmarked);

          setLikeLoading(false);
        }
      } catch (error) {
        console.error('Error initializing like state:', error);
        setLikeLoading(false);
      }
    };

    if (article.id) {
      initializeLikeState();
    }

    return () => {
      if (likeUpdateTimer.current) {
        clearTimeout(likeUpdateTimer.current);
      }
    };
  }, [article.id, currentUser?.id]);

  // Load server state
  const loadServerLikeState = async () => {
    try {
      const status = await apiService.getArticleLikes(article.id, currentUser?.id);
      setLiked(status.userLiked);
      setLikeCount(status.likeCount);
      console.log('Loaded server state:', status);
    } catch (error) {
      console.error('Error loading server like state:', error);
    }
  };

  // Sync pending likes
  const syncPendingLikesToServer = async (pendingData = null) => {
    try {
      let dataToSync = pendingData;

      if (!dataToSync) {
        const localLikeData = await AsyncStorage.getItem(LIKE_STORAGE_KEY);
        if (!localLikeData) return;
        dataToSync = JSON.parse(localLikeData);
      }

      console.log('Syncing pending data:', dataToSync);

      const currentServerState = await apiService.getArticleLikes(article.id, currentUser?.id);
      console.log('Current server state:', currentServerState);

      if (dataToSync.finalLikedState !== currentServerState.userLiked) {
        console.log('States differ, making API call...');

        const result = await apiService.toggleArticleLike(article.id, currentUser ? currentUser.id : '');
        console.log('API result:', result);

        setLiked(result.liked);
        setLikeCount(result.likeCount);
      } else {
        console.log('States match, no API call needed');
        setLiked(currentServerState.userLiked);
        setLikeCount(currentServerState.likeCount);
      }

      await AsyncStorage.removeItem(LIKE_STORAGE_KEY);
      setPendingLikeAction(null);

      console.log('Pending likes synced and cleared');

    } catch (error) {
      console.error('Error syncing pending likes:', error);
      throw error;
    }
  };

  // Schedule like sync
  const scheduleLikeSync = () => {
    if (likeUpdateTimer.current) {
      clearTimeout(likeUpdateTimer.current);
    }

    likeUpdateTimer.current = setTimeout(() => {
      syncLikesToServer();
    }, LIKE_BATCH_DELAY);
  };

  // Handle like
  const handleLike = async () => {
    try {
      if (!currentUser) {
        Alert.alert('Login Required', 'Please login to like articles');
        return;
      }

      const newLiked = !liked;
      const newCount = newLiked ? likeCount + 1 : likeCount - 1;
      const timestamp = Date.now();

      setLiked(newLiked);
      setLikeCount(newCount);
      setPendingLikeAction('pending');

      const localLikeData = {
        userId: currentUser.id,
        articleId: article.id,
        finalLikedState: newLiked,
        finalCount: newCount,
        timestamp: timestamp,
        needsSync: true
      };

      await AsyncStorage.setItem(LIKE_STORAGE_KEY, JSON.stringify(localLikeData));
      scheduleLikeSync();

    } catch (error) {
      console.error('Error handling like:', error);
      setLiked(!liked);
      setLikeCount(!liked ? likeCount - 1 : likeCount + 1);
      Alert.alert('Error', 'Failed to update like status');
    }
  };

  // Sync likes to server
  const syncLikesToServer = async () => {
    try {
      await syncPendingLikesToServer();
    } catch (error) {
      console.error('Error in scheduled sync:', error);
      setTimeout(() => {
        syncLikesToServer();
      }, 30000);
    }
  };

  // ========================================
  // AD INTERACTION HANDLERS
  // ========================================

  const handleAdClick = (adData: AdData): void => {
    console.log('Ad clicked:', adData);
    
    const clickData: AdClickData = {
      adId: adData.id,
      adType: adData.type,
      advertiser: adData.advertiser,
      timestamp: Date.now()
    };
  };

  const handleAdClose = (): void => {
    console.log('Ad closed');
    
    // Update ads shown count
    updateAdsShownCount();
    
    // Move to next ad in queue
    setAdState(prev => ({
      ...prev,
      currentAdIndex: prev.currentAdIndex >= prev.adQueue.length - 1 ? 0 : prev.currentAdIndex + 1
    }));
    
    // Recalculate content map
    setTimeout(() => {
      const newContentMap = calculateContentMap();
      setContentMap(newContentMap);
    }, 100);
  };

  // ========================================
  // NAVIGATION AND INTERACTION HANDLERS
  // ========================================

  const handleBack = () => {
    if (!isTransitioning && onBack) {
      setIsTransitioning(true);
      onBack();
      setTimeout(() => setIsTransitioning(false), 100);
    }
  };

  const handleRedirectToIframe = (articleData: any) => {
    if ((articleData.sourceUrl || "https://apartmenttimes.in/active-citizen-team-submits-memorandum-to-jewar-mla-demanding-government-hospitals-over-private-healthcare-projects/")) {
      console.log("Redirecting to:", articleData.sourceUrl);
      setWebViewUrl(articleData.sourceUrl || "https://apartmenttimes.in/active-citizen-team-submits-memorandum-to-jewar-mla-demanding-government-hospitals-over-private-healthcare-projects/");
      setShowWebView(true);
    }
  };

  // Bookmark handler
  const handleBookmark = async () => {
    if (bookmarkLoading) return;

    try {
      setBookmarkLoading(true);

      if (!currentUser) {
        Alert.alert('Login Required', 'Please login to bookmark articles');
        return;
      }

      setIsBookmarked(!isBookmarked);
      const result = await apiService.toggleBookmark(currentUser.id, article.id);
      setIsBookmarked(result.bookmarked);

    } catch (error) {
      setIsBookmarked(!isBookmarked);
      console.error('Error toggling bookmark:', error);
      Alert.alert('Error', 'Failed to update bookmark');
    } finally {
      setBookmarkLoading(false);
    }
  };

  // Share handler
  const handleShare = async () => {
    if (shareLoading) return;

    try {
      setShareLoading(true);

      const shareOptions = {
        message: `Check out this amazing article: "${article.title}"\n\nRead more: https://nofa-sepia.vercel.app/article/${article.id}`,
        url: `https://nofa-sepia.vercel.app/article/${article.id}`,
        title: article.title,
      };

      const result = await Share.share(shareOptions);

      if (result.action === Share.sharedAction) {
        let platform = 'other';

        if (result.activityType) {
          const activityType = result.activityType.toLowerCase();
          if (activityType.includes('twitter') || activityType.includes('com.twitter')) platform = 'twitter';
          else if (activityType.includes('facebook') || activityType.includes('com.facebook')) platform = 'facebook';
          else if (activityType.includes('whatsapp') || activityType.includes('net.whatsapp')) platform = 'whatsapp';
          else if (activityType.includes('linkedin') || activityType.includes('com.linkedin')) platform = 'linkedin';
          else if (activityType.includes('mail') || activityType.includes('message')) platform = 'email';
          else if (activityType.includes('copy') || activityType.includes('pasteboard')) platform = 'copy_link';
          else platform = 'other';
        }
      }
    } catch (error) {
      console.error('Error sharing article:', error);
      Alert.alert('Error', 'Failed to share article');
    } finally {
      setShareLoading(false);
    }
  };

  // ========================================
  // ANIMATION AND GESTURE HANDLERS
  // ========================================

  // Swipe indicator animation
  useEffect(() => {
    const animateIndicator = () => {
      Animated.sequence([
        Animated.timing(swipeIndicatorOpacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(swipeIndicatorOpacity, {
          toValue: 0.6,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setTimeout(animateIndicator, 2000);
      });
    };

    const timer = setTimeout(animateIndicator, 3000);
    return () => clearTimeout(timer);
  }, [swipeIndicatorOpacity]);

  // Enhanced pan responder that shows correct content during swipe
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        if (isTransitioning) return false;
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && Math.abs(gestureState.dy) > 10;
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value,
        });
      },
      onPanResponderMove: (evt, gestureState) => {
        pan.y.setValue(gestureState.dy);
        const progress = Math.min(Math.abs(gestureState.dy) / height, 0.3);
        opacity.setValue(1 - progress);
      },
      onPanResponderRelease: (evt, gestureState) => {
        pan.flattenOffset();

        const swipeThreshold = height * 0.12;
        const velocityThreshold = 0.15;

        const shouldGoNext = (gestureState.dy < -swipeThreshold || gestureState.vy < -velocityThreshold) && gestureState.dy < 0;
        const shouldGoPrev = (gestureState.dy > swipeThreshold || gestureState.vy > velocityThreshold) && gestureState.dy > 0;

        if (shouldGoNext && allArticles.length > 1) {
          setIsTransitioning(true);
          Animated.timing(pan.y, {
            toValue: -height,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            pan.setValue({ x: 0, y: 0 });
            opacity.setValue(1);
            if (onNext) {
              onNext();
            }
            setIsTransitioning(false);
          });
        } else if (shouldGoPrev && allArticles.length > 1) {
          setIsTransitioning(true);
          Animated.timing(pan.y, {
            toValue: height,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            pan.setValue({ x: 0, y: 0 });
            opacity.setValue(1);
            if (onPrev) {
              onPrev();
            }
            setIsTransitioning(false);
          });
        } else {
          Animated.parallel([
            Animated.spring(pan.y, {
              toValue: 0,
              tension: 120,
              friction: 8,
              useNativeDriver: true,
            }),
            Animated.spring(opacity, {
              toValue: 1,
              tension: 120,
              friction: 8,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    })
  ).current;

  // ========================================
  // INITIALIZATION
  // ========================================

  // Initialize everything
  useEffect(() => {
    const initialize = async () => {
      console.log('Initializing NewsDetailScreen...');
      
      // Initialize ad binary array first
      await initializeAdArray();
      
      // Initialize ads
      const shuffledAds = [...dummyAds].sort(() => Math.random() - 0.5);
      
      // Preload ad images
      const preloadPromises = shuffledAds.slice(0, 3).map(async (ad) => {
        if (ad.imageUrl) {
          try {
            await Image.prefetch(ad.imageUrl);
          } catch (error) {
            console.log('Failed to preload ad image:', ad.id);
          }
        }
        return ad;
      });

      await Promise.allSettled(preloadPromises);
      
      setAdState(prev => ({
        ...prev,
        adQueue: shuffledAds
      }));

      console.log('Initialization complete');
    };

    if (fontsLoaded) {
      initialize();
    }
  }, [fontsLoaded, initializeAdArray]);

  // Update content map when binary array or dependencies change
  useEffect(() => {
    if (adBinaryArray.length > 0 && adState.adQueue.length > 0) {
      const newContentMap = calculateContentMap();
      setContentMap(newContentMap);
    }
  }, [calculateContentMap, adBinaryArray, adState.adQueue]);

  // ========================================
  // DEBUG HELPER (Remove in production)
  // ========================================
  
  // Log current ad status for debugging
  useEffect(() => {
    if (adBinaryArray.length > 0) {
      const currentAdStatus = shouldShowAdForIndex(currentIndex);
      const nextAdStatus = shouldShowAdForIndex(currentIndex + 1);
      const prevAdStatus = shouldShowAdForIndex(currentIndex - 1);
      
      console.log('=== AD STATUS DEBUG ===');
      console.log(`Current Index: ${currentIndex}`);
      console.log(`Current Ad Status: ${currentAdStatus ? 'AD' : 'ARTICLE'}`);
      console.log(`Next Ad Status: ${nextAdStatus ? 'AD' : 'ARTICLE'}`);
      console.log(`Prev Ad Status: ${prevAdStatus ? 'AD' : 'ARTICLE'}`);
      console.log(`Binary Array [${currentIndex-2}-${currentIndex+2}]:`, 
        adBinaryArray.slice(Math.max(0, currentIndex-2), currentIndex+3));
      console.log(`Ads Shown: ${adsShownCount}/${AD_CONFIG.MAX_ADS_PER_SESSION}`);
      console.log('=====================');
    }
  }, [currentIndex, adBinaryArray, adsShownCount, shouldShowAdForIndex]);

  // ========================================
  // COMPONENT DEFINITIONS
  // ========================================

  // WebView Modal Component
  const WebViewModal = ({ visible, url, onClose }) => {
    const webviewRef = useRef(null);

    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <SafeAreaView style={styles.webViewContainer}>
          <WebView
            ref={webviewRef}
            source={{ uri: url }}
            style={styles.webView}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.webViewLoading}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.webViewLoadingText}>Loading...</Text>
              </View>
            )}
            onError={() => {
              Alert.alert('Error', 'Failed to load the webpage');
            }}
          />
        </SafeAreaView>
      </Modal>
    );
  };

  const EnhancedAdComponent = ({ adData, onAdClick, onAdClose, visible }) => {
    if (!visible || !adData) return null;
    
    const title = adData?.title || 'Default Title';
    const description = adData?.description || 'Default Description';
    const advertiser = adData?.advertiser || 'Unknown Advertiser';
    const ctaText = adData?.ctaText || 'Click Here';
    
    return (
      <View style={styles.adContainer}>
        <TouchableOpacity onPress={() => onAdClick(adData)} style={styles.adContent}>
          <Image
            source={{ 
              uri: adData?.imageUrl || 'https://via.placeholder.com/300x200',
              cache: 'force-cache'
            }}
            style={styles.adImage}
            resizeMode="cover"
          />
          <View style={styles.adTextContainer}>
            <Text style={styles.adTitle}>{title}</Text>
            <Text style={styles.adDescription}>{description}</Text>
            <Text style={styles.adAdvertiser}>Sponsored by {advertiser}</Text>
            <TouchableOpacity style={styles.adCtaButton}>
              <Text style={styles.adCtaText}>{ctaText}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={onAdClose} style={styles.adCloseButton}>
          <Text style={styles.adAdvertiser2}>Skip</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderContentByType = (contentInfo, isActive = false, position = 'current') => {
    if (!contentInfo.data) return null;

    if (contentInfo.type === 'ad') {
      return (
        <EnhancedAdComponent
          adData={contentInfo.data}
          onAdClick={handleAdClick}
          onAdClose={handleAdClose}
          visible={true}
        />
      );
    }

    // Render article
    const articleData = contentInfo.data;
    
    const handleArticleShowMoreClick = () => {
      handleRedirectToIframe(articleData);
    };

    return (
      <View style={[styles.newsContainer]}>
        <View style={[styles.articleImageContainer]}>
          <Image
            source={{ 
              uri: articleData.featuredImage || 'https://via.placeholder.com/800x400',
              cache: 'force-cache'
            }}
            style={styles.articleImage}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.4)']}
            style={styles.articleImageGradient}
          />

          {isActive && (
            <View style={[styles.ArticleButtonStyle]}>
              <View style={[styles.ArticleButtonStyleGroup]}>
                <Animated.View style={{ transform: [{ scale: likeScale }] }}>
                  <TouchableOpacity
                    style={[styles.footerActionButton]}
                    onPress={handleLike}
                    disabled={likeLoading}
                  >
                      <Ionicons
                        name={liked ? "heart" : "heart-outline"}
                        size={16}
                        color={liked ? "#ff4757" : "#fff"}
                      />
                    <Text style={[
                      styles.footerActionText,
                      liked && styles.activeFooterText
                    ]}>
                      {likeCount > 0 ? likeCount : 'Like'}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>

                <Animated.View style={{ transform: [{ scale: commentScale }] }}>
                  <TouchableOpacity
                    style={styles.footerActionButton}
                    onPress={() => setShowComments(true)}
                  >
                    <Ionicons name="chatbubble-outline" size={16} color="#fff" />
                    <Text style={styles.footerActionText}>
                      {articleData.commentCount > 0 ? articleData.commentCount : '0'}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>

                <Animated.View style={{ transform: [{ scale: shareScale }] }}>
                  <TouchableOpacity
                    style={styles.footerActionButton}
                    onPress={handleShare}
                    disabled={shareLoading}
                  >
                    {shareLoading ? (
                      <ActivityIndicator size={16} color="#999" />
                    ) : (
                      <Ionicons name="share-social-outline" size={16} color="#fff" />
                    )}
                    <Text style={styles.footerActionText}>{'Share'}</Text>
                  </TouchableOpacity>
                </Animated.View>

                <Animated.View style={{ transform: [{ scale: bookmarkScale }] }}>
                  <TouchableOpacity
                    style={[styles.footerActionButton]}
                    onPress={handleBookmark}
                    disabled={bookmarkLoading}
                  >
                    {bookmarkLoading ? (
                      <ActivityIndicator size={16} color="#999" />
                    ) : (
                      <Ionicons
                        name={isBookmarked ? "bookmark" : "bookmark-outline"}
                        size={16}
                        color={isBookmarked ? "#4CAF50" : "#fff"}
                      />
                    )}
                    <Text style={[
                      styles.footerActionText,
                      isBookmarked && styles.activeBookmarkText
                    ]}>
                      {isBookmarked ? 'Saved' : 'Save'}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </View>
          )}
        </View>

        <View style={[styles.articleContentContainer]}>
          <Text style={styles.articleSource}>R. Republic TV</Text>

          <TouchableOpacity disabled={!showFullContent}>
            <Text style={[styles.articleTitle]}>
              {articleData.title}
            </Text>
          </TouchableOpacity>

          <View style={styles.htmlContentContainer}>
            {showFullContent ? (
              <RenderHtml
                contentWidth={width - 40}
                source={{ html: articleData.content || '<p>No content available</p>' }}
                tagsStyles={{
                  p: {
                    fontSize: 14,
                    lineHeight: 20,
                    color: '#666',
                    marginBottom: 12,
                    textAlign: 'left',
                    fontFamily: 'Montserrat-Medium'
                  },
                  h1: {
                    fontSize: 20,
                    fontWeight: 'bold',
                    color: '#333',
                    marginBottom: 12,
                    marginTop: 8,
                    fontFamily: 'NeuePlakExtended-SemiBold'
                  },
                  h2: {
                    fontSize: 18,
                    fontWeight: 'bold',
                    color: '#333',
                    marginBottom: 10,
                    marginTop: 6,
                    fontFamily: 'NeuePlakExtended-SemiBold'
                  },
                  h3: {
                    fontSize: 16,
                    fontWeight: 'bold',
                    color: '#333',
                    marginBottom: 8,
                    fontFamily: 'NeuePlakExtended-SemiBold'
                  },
                  img: {
                    marginVertical: 8
                  }
                }}
              />
            ) : (
              <Text style={styles.articlePreview}>
                {articleData.summary || '".'}
              </Text>
            )}
          </View>
        </View>

        <View style={[styles.bottomShowMore]}>
          <TouchableOpacity
            style={styles.showMoreButton}
            onPress={() => handleArticleShowMoreClick()}
          >
            <Text style={styles.showMoreText}>
              {showFullContent ? 'Show Less' : 'Show More'}
            </Text>
          </TouchableOpacity>

          {isActive && (
            <Animated.View style={[styles.swipeIndicator, { opacity: swipeIndicatorOpacity }]}>
              <Text style={styles.swipeHint}>Swipe up for next news</Text>
              <Ionicons name="arrow-up" size={16} color={"#000000b6"} />
            </Animated.View>
          )}
        </View>
      </View>
    );
  };

  // ========================================
  // MAIN RENDER
  // ========================================

  if (!fontsLoaded || adBinaryArray.length === 0) {
    return null; // Only show when fully initialized
  }

  const containerStyle = contentMap.current.type === 'ad' ? styles.container2 : styles.container;
  const animatedContainerStyle = contentMap.current.type === 'ad' ? styles.container3 : styles.container;

  return (
    <SafeAreaView style={containerStyle}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <Animated.View
        style={[
          animatedContainerStyle,
          {
            transform: [{ translateX: pan.x }],
            opacity: opacity,
          }
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={16} color="#000" />
        </TouchableOpacity>

        <View style={styles.newsStackContainer}>
          {/* Previous Content */}
          {contentMap.prev.data && (
            <Animated.View
              style={[
                styles.newsStackItem,
                styles.prevNewsItem,
                {
                  transform: [{ translateY: pan.y }],
                  opacity: opacity,
                }
              ]}
            >
              {renderContentByType(contentMap.prev, false, 'prev')}
            </Animated.View>
          )}

          {/* Current Content */}
          <Animated.View
            style={[
              styles.newsStackItem,
              styles.currentNewsItem,
              {
                transform: [{ translateY: pan.y }],
                opacity: opacity,
              }
            ]}
            {...panResponder.panHandlers}
          >
            {renderContentByType(contentMap.current, true, 'current')}
          </Animated.View>

          {/* Next Content */}
          {contentMap.next.data && (
            <Animated.View
              style={[
                styles.newsStackItem,
                styles.nextNewsItem,
                {
                  transform: [{ translateY: pan.y }],
                  opacity: opacity,
                }
              ]}
            >
              {renderContentByType(contentMap.next, false, 'next')}
            </Animated.View>
          )}
        </View>
      </Animated.View>

      <WebViewModal
        visible={showWebView}
        url={webViewUrl}
        onClose={() => {
          setShowWebView(false);
          setWebViewUrl('');
        }}
      />

      <CommentsSection
        visible={showComments}
        onClose={() => setShowComments(false)}
        articleId={article.id}
      />
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container2: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  container3: {
    backgroundColor: 'rgba(0,0,0,0.9)',
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  backButton: {
    position: 'absolute',
    top: 30,
    left: 30,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 8,
    elevation: 3,
    shadowColor: '#000',
    // shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  articleImageContainer: {
    position: 'relative',
    height: 240,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 10,
    overflow: 'hidden',
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
  htmlContentContainer: {
    marginBottom: 20,
  },
  swipeIndicator: {
    alignItems: 'center',
    paddingVertical: 4
  },
  swipeDots: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  swipeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ddd',
    marginHorizontal: 3,
  },
  swipeDotActive: {
    backgroundColor: '#8B5CF6',
  },
  newsStackItem: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
  },
  articleContentContainer: {
    padding: 20,
    paddingTop: 5,
    paddingBottom: 20, // Extra space to prevent overlap with footer
  },
  currentNewsItem: {
    zIndex: 3,
  },
  nextNewsItem: {
    zIndex: 2,
    transform: [{ translateY: height }],
  },
  prevNewsItem: {
    zIndex: 1,
    transform: [{ translateY: -height }],
  },
  newsContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingBottom: 0
  },

  articleSource: {
    fontSize: 12, // Reduced from 14
    color: '#666',
    fontWeight: '400',
    marginBottom: 12,
    fontFamily: 'Montserrat-Medium',
  },

  articleTitle: {
    fontSize: 18, // Reduced from 24
    fontWeight: 'bold',
    color: '#000',
    lineHeight: 26, // Reduced from 30
    marginBottom: 16,
    fontFamily: 'NeuePlakExtended-SemiBold',
  },

  articlePreview: {
    fontSize: 16, // Reduced from 16
    lineHeight: 20, // Reduced from 24
    color: '#666', // Changed from #989898
    fontWeight : 600,
    textAlign: 'left',
        fontStyle: 'normal',

    // fontFamily: 'Montserrat-Medium',
        fontFamily: 'Newsreader-Italic-VariableFont_opsz',
        

  },

  showMoreButton: {
    backgroundColor: '#000',
    paddingTop: 8, // Reduced from 15
    paddingBottom: 12,
    paddingHorizontal: 40, // Reduced from 60
    borderRadius: 16, // Reduced from 18
    alignSelf: 'center',
    marginTop: 0,
    marginBottom: 10,
    minWidth: 150, // Reduced from 200
  },

  showMoreText: {
    color: '#fff',
    fontSize: 14, // Reduced from 16
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'NeuePlakExtended-SemiBold',
  },

  swipeHint: {
    fontSize: 11, // Reduced from 12
    color: '#999',
    fontFamily: 'Montserrat-Medium',
  },
  // Ad Component Styles
  adContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    zIndex: 100,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  adContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    height: "100%",
    width: '95%',
    maxWidth: 400,
  },
  adImage: {
    width: '100%',
    height: 200,
  },
  adTextContainer: {
    padding: 16,
  },
  adTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
  },
  adDescription: {
    fontSize: 14,
    marginBottom: 8,
    color: '#666',
  },
  adAdvertiser2: {
    fontSize: 12,
    color: '#ffffffff',
    fontStyle: 'normal',
    marginBottom: 8,
  },
  adAdvertiser: {
    fontSize: 12,
    fontWeight : '500',
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  adCtaButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  adCtaText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  adCloseButton: {
    position: 'absolute',
    bottom: 40,
    margin : "auto",
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius:16,
    paddingHorizontal: 40,
    paddingTop : 8
  },
  newsStackContainer: {
    flex: 1,
    position: 'relative',
  },

  webViewContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webView: {
    flex: 1,
  },
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  webViewLoadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontFamily: 'Montserrat-Medium',
  },
  clickableTitle: {
    textDecorationLine: 'underline',
    textDecorationColor: '#4CAF50',
    color: '#2196F3',
  },
  ArticleButtonStyle: {
    position: 'absolute',
    right: 15,
    bottom: 4,
    zIndex: 5,
    elevation: 5,
  },

  ArticleButtonStyleGroup: {
    width: "90%",
    flexDirection: "row",
    justifyContent: 'space-between',
  },

  footerActionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 50,
    marginBottom: 10, // Add spacing between buttons instead of gap
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Slightly darker for better visibility
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.8, // Increased shadow opacity
    shadowRadius: 4,
    elevation: 8, // Increased elevation for Android
  },

  footerActionText: {
    fontSize: 8, // Slightly smaller for better fit
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'Montserrat-Medium',
  },
  activeFooterText: {
    color: '#ff4757',
    textShadowColor: 'transparent',
    fontWeight: '700',
  },
  activeBookmarkText: {
    color: '#4CAF50',
    textShadowColor: 'transparent',
    fontWeight: '700',
  },
  bottomShowMore: {
    position: "absolute",
    bottom: 10,
    left: 100,
  }
});

export default NewsDetailScreen;