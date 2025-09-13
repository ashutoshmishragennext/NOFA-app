import { apiService } from '@/api';
import { useAuth } from '@/context/AuthContext';
import { Montserrat_500Medium, Montserrat_600SemiBold, useFonts } from '@expo-google-fonts/montserrat';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
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
import CommentsSection from './CommentsPage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  totalArticles,
  sourceTab,
  allArticles = []
}) => {
  // Load custom fonts
  const [fontsLoaded] = useFonts({
    Montserrat_500Medium,
    Montserrat_600SemiBold,
  });

  const insets = useSafeAreaInsets();

  const getRandomAdInterval = (): number => {
    return Math.floor(Math.random() * 3) + 2;
  };

  const [showComments, setShowComments] = useState(false);
  const [commentsCount, setCommentsCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(article.likeCount || 0);
  const [shareCount, setShareCount] = useState(article.shareCount || 0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);
  const swipeIndicatorOpacity = useRef(new Animated.Value(0.6)).current;
  
  // Ad state management
  const [adState, setAdState] = useState<AdDisplayState>({
    shouldShowAd: false,
    currentAdIndex: 0,
    articlesViewedCount: 0,
    nextAdAfter: getRandomAdInterval(),
    adQueue: [],
  });

  // Local state for pending likes
  const [pendingLikeAction, setPendingLikeAction] = useState(null);
  const [lastLikeUpdate, setLastLikeUpdate] = useState(null);
  
  const currentUser = useAuth().user;
  const pan = useRef(new Animated.ValueXY()).current;
  const opacity = useRef(new Animated.Value(1)).current;
  
  // Timer ref for batching like updates
  const likeUpdateTimer = useRef(null);

  const LIKE_BATCH_DELAY = 1 * 60 * 1000; // 1 minute in milliseconds
  const LIKE_STORAGE_KEY = `article_likes_${article.id}`;

  // Add these state variables
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [viewRecorded, setViewRecorded] = useState(false);
  const [viewCount, setViewCount] = useState(article.viewCount || 0);
  const likeScale = useRef(new Animated.Value(1)).current;
  const commentScale = useRef(new Animated.Value(1)).current;
  const shareScale = useRef(new Animated.Value(1)).current;
  const bookmarkScale = useRef(new Animated.Value(1)).current;

  // Add this useEffect to initialize ad queue:
  useEffect(() => {
    // Shuffle ads array and set initial queue
    const shuffledAds: AdData[] = [...dummyAds].sort(() => Math.random() - 0.5);
    setAdState(prev => ({ ...prev, adQueue: shuffledAds }));
  }, []);

  // Add this useEffect to track article views and determine when to show ads:
  useEffect(() => {
    // Only increment on article navigation, not on initial load
    if (article.id && !viewRecorded) {
      const newCount = adState.articlesViewedCount + 1;
      
      // Check if we should show an ad
      if (newCount >= adState.nextAdAfter) {
        setAdState(prev => ({
          ...prev,
          shouldShowAd: true,
          articlesViewedCount: 0,
          nextAdAfter: getRandomAdInterval(),
        }));
      } else {
        setAdState(prev => ({ ...prev, articlesViewedCount: newCount }));
      }
    }
  }, [article.id, viewRecorded, adState.nextAdAfter]);

  // Add these handler functions:
  const handleAdClick = (adData: AdData): void => {
    console.log('Ad clicked:', adData);
    
    // You can add analytics tracking here
    const clickData: AdClickData = {
      adId: adData.id,
      adType: adData.type,
      advertiser: adData.advertiser,
      timestamp: Date.now()
    };
    
  };
  
  const handleAdClose = (): void => {
    setAdState(prev => ({
      ...prev,
      shouldShowAd: false,
      currentAdIndex: prev.currentAdIndex >= prev.adQueue.length - 1 ? 0 : prev.currentAdIndex + 1
    }));
  };

  // Preload next ad image
  const preloadNextAd = () => {
    if (adState.adQueue.length > 0) {
      const nextAdIndex = adState.currentAdIndex >= adState.adQueue.length - 1 ? 0 : adState.currentAdIndex + 1;
      const nextAd = adState.adQueue[nextAdIndex];
      
      // Preload the ad image
      if (nextAd.imageUrl) {
        Image.prefetch(nextAd.imageUrl).catch(() => {
          console.log('Failed to preload ad image');
        });
      }
    }
  };

  // Call preloadNextAd when component mounts and when ad changes
  useEffect(() => {
    preloadNextAd();
  }, [adState.currentAdIndex, adState.adQueue]);
useEffect(() => {
  // Track article changes for ad display
  const updateArticleCount = () => {
    setAdState(prev => {
      const newCount = prev.articlesViewedCount + 1;
      console.log(`Article viewed count: ${newCount}, Next ad after: ${prev.nextAdAfter}`);
      
      // Check if we should show an ad
      if (newCount >= prev.nextAdAfter) {
        console.log('Should show ad now!');
        return {
          ...prev,
          shouldShowAd: true,
          articlesViewedCount: 0, // Reset counter
          nextAdAfter: getRandomAdInterval(), // Set next interval
        };
      }
      
      return {
        ...prev,
        articlesViewedCount: newCount
      };
    });
  };

  // Only update count when article ID changes (not on initial load)
  if (article.id) {
    updateArticleCount();
  }
}, [article.id]);
  // Add smooth transition for ad display
  const adTransitionOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (adState.shouldShowAd) {
      Animated.timing(adTransitionOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      adTransitionOpacity.setValue(0);
    }
  }, [adState.shouldShowAd]);

  // Load initial states including local like state
  useEffect(() => {
    const initializeLikeState = async () => {
      try {
        if (currentUser && article.id) {
          setLikeLoading(true);
          
          // STEP 1: Check for pending likes in AsyncStorage FIRST
          const localLikeData = await AsyncStorage.getItem(LIKE_STORAGE_KEY);
          
          if (localLikeData) {
            const parsedData = JSON.parse(localLikeData);
            
            // Verify this is for the same user and article
            if (parsedData.userId === currentUser.id && parsedData.articleId === article.id) {
              console.log('Found pending likes, syncing to server first...');
              
              // STEP 2: Sync pending likes to server immediately
              await syncPendingLikesToServer(parsedData);
            } else {
              // Different user/article, clear stale data
              await AsyncStorage.removeItem(LIKE_STORAGE_KEY);
            }
          }
          
          // STEP 3: Now load fresh server state
          await loadServerLikeState();
          
          // Load bookmark status
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

    // Cleanup timer on unmount
    return () => {
      if (likeUpdateTimer.current) {
        clearTimeout(likeUpdateTimer.current);
      }
    };
  }, [article.id, currentUser?.id]);

  // Separate function to load server state
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

  // Updated sync function for pending likes
  const syncPendingLikesToServer = async (pendingData = null) => {
    try {
      let dataToSync = pendingData;
      
      if (!dataToSync) {
        const localLikeData = await AsyncStorage.getItem(LIKE_STORAGE_KEY);
        if (!localLikeData) return;
        dataToSync = JSON.parse(localLikeData);
      }

      console.log('Syncing pending data:', dataToSync);

      // Get current server state
      const currentServerState = await apiService.getArticleLikes(article.id, currentUser?.id);
      console.log('Current server state:', currentServerState);

      // Compare final local state with server state
      if (dataToSync.finalLikedState !== currentServerState.userLiked) {
        console.log('States differ, making API call...');
        
        const result = await apiService.toggleArticleLike(article.id, currentUser ? currentUser.id : '');
        console.log('API result:', result);
        
        // Update UI with server response
        setLiked(result.liked);
        setLikeCount(result.likeCount);
      } else {
        console.log('States match, no API call needed');
        // States match, just update UI with server data
        setLiked(currentServerState.userLiked);
        setLikeCount(currentServerState.likeCount);
      }
      
      // Clear AsyncStorage after successful sync
      await AsyncStorage.removeItem(LIKE_STORAGE_KEY);
      setPendingLikeAction(null);
      setLastLikeUpdate(null);
      
      console.log('Pending likes synced and cleared');
      
    } catch (error) {
      console.error('Error syncing pending likes:', error);
      throw error; // Re-throw to handle in caller
    }
  };

  useEffect(() => {
    // Only run cleanup, the article-specific initialization is handled above
    return () => {
      if (likeUpdateTimer.current) {
        clearTimeout(likeUpdateTimer.current);
      }
    };
  }, []);

  // Load share count
  useEffect(() => {
    const loadShareCount = async () => {
      try {
        if (article.id) {
          const shareData = await apiService.getArticleShares(article.id);
          setShareCount(shareData.shareCount);
        }
      } catch (error) {
        console.error('Error loading share count:', error);
      }
    };

    if (article.id) {
      loadShareCount();
    }
  }, [article.id]);

  // Schedule like sync with server
  const scheduleLikeSync = () => {
    if (likeUpdateTimer.current) {
      clearTimeout(likeUpdateTimer.current);
    }

    likeUpdateTimer.current = setTimeout(() => {
      syncLikesToServer();
    }, LIKE_BATCH_DELAY);
  };

  // Updated handleLike with better data structure
  const handleLike = async () => {
    try {
      if (!currentUser) {
        Alert.alert('Login Required', 'Please login to like articles');
        return;
      }

      // Calculate new state
      const newLiked = !liked;
      const newCount = newLiked ? likeCount + 1 : likeCount - 1;
      const timestamp = Date.now();

      // Immediate UI update
      setLiked(newLiked);
      setLikeCount(newCount);
      setLastLikeUpdate(timestamp);
      setPendingLikeAction('pending');

      // Store in AsyncStorage with proper structure
      const localLikeData = {
        userId: currentUser.id,
        articleId: article.id,
        finalLikedState: newLiked,
        finalCount: newCount,
        timestamp: timestamp,
        needsSync: true
      };

      await AsyncStorage.setItem(LIKE_STORAGE_KEY, JSON.stringify(localLikeData));
      // Schedule sync
      scheduleLikeSync();

    } catch (error) {
      console.error('Error handling like:', error);
      // Revert on error
      setLiked(!liked);
      setLikeCount(!liked ? likeCount - 1 : likeCount + 1);
      Alert.alert('Error', 'Failed to update like status');
    }
  };

  // Updated regular sync (called by timer)
  const syncLikesToServer = async () => {
    try {
      await syncPendingLikesToServer();
    } catch (error) {
      console.error('Error in scheduled sync:', error);
      // Retry after delay
      setTimeout(() => {
        syncLikesToServer();
      }, 30000);
    }
  };

  // Force sync likes (can be called manually if needed)
  const forceSyncLikes = async () => {
    if (pendingLikeAction) {
      if (likeUpdateTimer.current) {
        clearTimeout(likeUpdateTimer.current);
      }
      await syncLikesToServer();
    }
  };

  // Callback to update comments count from CommentsSection
  const handleCommentsCountChange = (count) => {
    setCommentsCount(count);
  };

  // Optimized navigation handlers for instant transitions
  const handleNext = () => {
    if (hasNext && !isTransitioning) {
      setIsTransitioning(true);
      onNext();
      setTimeout(() => setIsTransitioning(false), 100);
    }
  };

  const handlePrev = () => {
    if (hasPrev && !isTransitioning) {
      setIsTransitioning(true);
      onPrev();
      setTimeout(() => setIsTransitioning(false), 100);
    }
  };

  const handleBack = () => {
    if (!isTransitioning && onBack) {
      setIsTransitioning(true);
      onBack();
      setTimeout(() => setIsTransitioning(false), 100);
    }
  };

  // Updated bookmark handler
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

  // Load comment count
  useEffect(() => {
    const loadCommentCount = async () => {
      try {      
        if (article.id) {
          const commentData = await apiService.getArticleCommentCount(article.id);
          setCommentsCount(commentData.commentCount);
        }
      } catch (error) {
        console.error('Error loading comment count:', error);
      }
    };

    if (article.id) {
      loadCommentCount();
    }
  }, [article.id]);
  useEffect(() => {
  const checkAndRecordUniqueView = async () => {
    if (!article.id || viewRecorded) return;

    try {
      if (likeLoading || bookmarkLoading) {
        return;
      }

      const viewedArticlesJson = await AsyncStorage.getItem('viewed_articles');
      const viewedArticles = viewedArticlesJson ? JSON.parse(viewedArticlesJson) : [];

      if (viewedArticles.includes(article.id)) {
        setViewRecorded(true);
        return;
      }

      const userId = currentUser?.id || null;
      const referrer = sourceTab ? `app://${sourceTab}` : 'app://direct';
      
      const result = await apiService.recordArticleView(article.id, userId, referrer);
      
      if (result.success) {
        const updatedViewedArticles = [...viewedArticles, article.id];
        await AsyncStorage.setItem('viewed_articles', JSON.stringify(updatedViewedArticles));
        
        setViewRecorded(true);
        
        if (result.incrementedCount) {
          setViewCount(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error('Failed to record unique view:', error);
      setViewRecorded(true);
    }
  };

  const timer = setTimeout(() => {
    checkAndRecordUniqueView();
  }, 1000);

  return () => clearTimeout(timer);
}, [article.id, likeLoading, bookmarkLoading, currentUser?.id, viewRecorded, sourceTab]);

  // Add subtle animation to swipe indicator
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
        // Repeat animation after a delay
        setTimeout(animateIndicator, 2000);
      });
    };

    // Start animation after a delay
    const timer = setTimeout(animateIndicator, 3000);
    return () => clearTimeout(timer);
  }, [swipeIndicatorOpacity]);

  // Load initial view count
  useEffect(() => {
    const loadInitialViewCount = async () => {
      try {
        if (article.id) {
          const viewData = await apiService.getArticleViews(article.id);
          setViewCount(viewData.viewCount);
          console.log('Initial view count loaded:', viewData.viewCount);
        }
      } catch (error) {
        console.error('Error loading initial view count:', error);
      }
    };

    if (article.id) {
      loadInitialViewCount();
    }
  }, [article.id]);

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

        try {
          const shareResult = await apiService.recordArticleShare(
            article.id, 
            platform, 
            currentUser?.id
          );
          setShareCount(shareResult.shareCount);
        } catch (error) {
          console.error('Error recording share:', error);
          setShareCount(prev => prev + 1);
        }
      }
      
    } catch (error) {
      console.error('Error sharing article:', error);
      Alert.alert('Error', 'Failed to share article');
    } finally {
      setShareLoading(false);
    }
  };

  // Vertical swipe panResponder for Instagram reels-like functionality
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond to vertical swipes with minimal movement
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && Math.abs(gestureState.dy) > 10;
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value,
        });
      },
      onPanResponderMove: (evt, gestureState) => {
        // Direct movement - no resistance for immediate feedback
        pan.y.setValue(gestureState.dy);
        
        // Dynamic opacity change based on swipe distance
        const progress = Math.min(Math.abs(gestureState.dy) / height, 0.3);
        opacity.setValue(1 - progress);
      },
      onPanResponderRelease: (evt, gestureState) => {
        pan.flattenOffset();
        
        // More sensitive thresholds for better UX
        const swipeThreshold = height * 0.12;
        const velocityThreshold = 0.15;
        
        const shouldGoNext = (gestureState.dy < -swipeThreshold || gestureState.vy < -velocityThreshold) && gestureState.dy < 0;
        const shouldGoPrev = (gestureState.dy > swipeThreshold || gestureState.vy > velocityThreshold) && gestureState.dy > 0;

        if (shouldGoNext && hasNext) {
          // Swipe up - complete the transition to next article
          setIsTransitioning(true);
          Animated.timing(pan.y, {
            toValue: -height,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            // Reset position and navigate
            pan.setValue({ x: 0, y: 0 });
            opacity.setValue(1);
            if (onNext) {
              onNext();
            }
            setIsTransitioning(false);
          });
        } else if (shouldGoPrev && hasPrev) {
          // Swipe down - complete the transition to previous article
          setIsTransitioning(true);
          Animated.timing(pan.y, {
            toValue: height,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            // Reset position and navigate
            pan.setValue({ x: 0, y: 0 });
            opacity.setValue(1);
            if (onPrev) {
              onPrev();
            }
            setIsTransitioning(false);
          });
        } else {
          // Return to original position with smooth spring animation
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

  // Helper functions for processing tags and keywords
  const processTags = (tags) => {
    if (!tags) return [];
    if (typeof tags === 'string') {
      return tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }
    if (Array.isArray(tags)) {
      return tags.filter(tag => tag && tag.trim());
    }
    return [];
  };

  const processKeywords = (keywords) => {
    if (!keywords) return [];
    if (typeof keywords === 'string') {
      return keywords.split(',').map(keyword => keyword.trim()).filter(keyword => keyword);
    }
    if (Array.isArray(keywords)) {
      return keywords.filter(keyword => keyword && keyword.trim());
    }
    return [];
  };

  const tagsArray = processTags(article.tags);
  const keywordsArray = processKeywords(article.keywords);

  // Get next and previous articles for preview
  const getNextArticle = () => {
    if (hasNext && allArticles.length > 0) {
      return allArticles[currentIndex + 1];
    }
    return null;
  };

  const insights = useSafeAreaInsets();
  const getPrevArticle = () => {
    if (hasPrev && allArticles.length > 0) {
      return allArticles[currentIndex - 1];
    }
    return null;
  };

  const nextArticle = getNextArticle();
  const prevArticle = getPrevArticle();

  // Enhanced Ad Component with smooth transitions
  const EnhancedAdComponent = ({ adData, onAdClick, onAdClose, visible }) => {
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      if (visible) {
        Animated.timing(opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      }
    }, [visible]);

    if (!visible) return null;

    return (
      <Animated.View style={[styles.adContainer, { opacity }]}>
        <TouchableOpacity onPress={() => onAdClick(adData)} style={styles.adContent}>
          <Image 
            source={{ uri: adData.imageUrl }} 
            style={styles.adImage}
            resizeMode="cover"
          />
          <View style={styles.adTextContainer}>
            <Text style={styles.adTitle}>{adData.title}</Text>
            <Text style={styles.adDescription}>{adData.description}</Text>
            <Text style={styles.adAdvertiser}>Sponsored by {adData.advertiser}</Text>
            <TouchableOpacity style={styles.adCtaButton}>
              <Text style={styles.adCtaText}>{adData.ctaText}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={onAdClose} style={styles.adCloseButton}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </Animated.View>
    );
  };

const renderNewsArticle = (articleData, isActive = false, isAd: boolean = true) => {
    if (isAd) {
      return (
        <EnhancedAdComponent
          adData={articleData as AdData}
          onAdClick={handleAdClick}
          onAdClose={handleAdClose}
          visible={true}
        />
      );
    }
    
    return (
      <View style={[styles.newsContainer, isActive && styles.activeNewsContainer]}>
        {/* Article Image - Clean without overlay buttons */}
        <View style={styles.articleImageContainer}>
          <Image 
            source={{ uri: articleData.featuredImage || 'https://via.placeholder.com/800x400' }} 
            style={styles.articleImage} 
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.4)']}
            style={styles.articleImageGradient}
          />
        </View>

        {/* Article Content */}
        <View style={styles.articleContentContainer}>
          {/* Source */}
          <Text style={styles.articleSource}>R. Republic TV</Text>

          {/* Title */}
          <Text style={styles.articleTitle}>{articleData.title}</Text>

          {/* Article Body - Limited Content */}
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
                    fontFamily: 'Montserrat_500Medium'
                  },
                  h1: { 
                    fontSize: 20, 
                    fontWeight: 'bold', 
                    color: '#333',
                    marginBottom: 12,
                    marginTop: 8,
                    fontFamily: 'Montserrat_600SemiBold'
                  },
                  h2: { 
                    fontSize: 18, 
                    fontWeight: 'bold', 
                    color: '#333',
                    marginBottom: 10,
                    marginTop: 6,
                    fontFamily: 'Montserrat_600SemiBold'
                  },
                  h3: { 
                    fontSize: 16, 
                    fontWeight: 'bold', 
                    color: '#333',
                    marginBottom: 8,
                    fontFamily: 'Montserrat_600SemiBold'
                  },
                  img: {
                    marginVertical: 8
                  }
                }}
              />
            ) : (
              <Text style={styles.articlePreview}>
                {articleData.summary || 'Russian President Vladimir Putin called Prime Minister Narendra Modi on Monday and briefed him about the Alaska Summit. Putin went to Alaska for a summit with US President Donald Trump on Friday. The war in Ukraine was at the top of the summit\'s agenda. In a post on X, Modi thanked Putin for "sharing insights on his recent meeting with President Trump in Alaska".'}
              </Text>
            )}
          </View>

          {/* Show More Button - moved to bottom */}
          <TouchableOpacity 
            style={styles.showMoreButton} 
            onPress={() => setShowFullContent(!showFullContent)}
          >
            <Text style={styles.showMoreText}>
              {showFullContent ? 'Show Less' : 'Show More'}
            </Text>
          </TouchableOpacity>
          {/* Swipe Indicator - only show on active article */}
          {isActive && (
            <Animated.View style={[styles.swipeIndicator, { opacity: swipeIndicatorOpacity }]}>
              <View style={styles.swipeDots}>
                <View style={[styles.swipeDot, styles.swipeDotActive]} />
                <View style={styles.swipeDot} />
                <View style={styles.swipeDot} />
              </View>
              <Text style={styles.swipeHint}>Swipe up for next news</Text>
            </Animated.View>
          )}

        </View>
      </View>
    );
  };

  // Don't render until fonts are loaded
  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
  <SafeAreaView style={[ ((!adState.shouldShowAd) ? styles.container : styles.container2), {paddingBottom: insets.bottom}]}>
    <StatusBar barStyle="light-content" backgroundColor="#000" />
    
    <Animated.View 
      style={[
        ((!adState.shouldShowAd) ? styles.container : styles.container2), 
        {
          transform: [{ translateX: pan.x }],
          opacity: opacity,
        }
      ]}
      {...panResponder.panHandlers}
    >
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Ionicons name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>

      {/* Stacked News Articles Container */}
      <View style={styles.newsStackContainer}>
        {/* Previous Article (behind current) */}
        {prevArticle && (
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
            {renderNewsArticle(prevArticle, false)}
          </Animated.View>
        )}

        {/* Current Article (on top) */}
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
          {adState.shouldShowAd && adState.adQueue.length > 0 ? (
            <>
              {console.log('Rendering ad:', adState.adQueue[adState.currentAdIndex])}
              {renderNewsArticle(adState.adQueue[adState.currentAdIndex], true, true)}
            </>
          ) : (
            <>
              {console.log('Rendering article:', article.title)}
              {renderNewsArticle(article, true, false)}
            </>
          )}
        </Animated.View>

        {/* Next Article (behind current) */}
        {nextArticle && (
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
            {renderNewsArticle(nextArticle, false)}
          </Animated.View>
        )}
      </View>
    </Animated.View>

    {/* Fixed Footer with Action Buttons */}
    {!adState.shouldShowAd && (
    <View style={styles.fixedActionFooter}>
      {/* Like Button */}
      <Animated.View style={{ transform: [{ scale: likeScale }] }}>
        <TouchableOpacity 
          style={[
            styles.footerActionButton,
            liked && styles.activeFooterButton
          ]}
          onPress={handleLike}
          disabled={likeLoading}
        >
          {likeLoading ? (
            <ActivityIndicator size={20} color="#999" />
          ) : (
            <Ionicons 
              name={liked ? "heart" : "heart-outline"} 
              size={24} 
              color={liked ? "#ff4757" : "#666"} 
            />
          )}
          <Text style={[
            styles.footerActionText,
            liked && styles.activeFooterText
          ]}>
            {likeCount > 0 ? likeCount : 'Like'}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Comment Button */}
      <Animated.View style={{ transform: [{ scale: commentScale }] }}>
        <TouchableOpacity 
          style={styles.footerActionButton}
          onPress={() => setShowComments(true)}
        >
          <Ionicons name="chatbubble-outline" size={24} color="#666" />
          <Text style={styles.footerActionText}>
            {commentsCount > 0 ? commentsCount : '0'}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Share Button */}
      <Animated.View style={{ transform: [{ scale: shareScale }] }}>
        <TouchableOpacity 
          style={styles.footerActionButton}
          onPress={handleShare}
          disabled={shareLoading}
        >
          {shareLoading ? (
            <ActivityIndicator size={20} color="#999" />
          ) : (
            <Ionicons name="share-social-outline" size={24} color="#666" />
          )}
          <Text style={styles.footerActionText}>
            {shareCount > 0 ? shareCount : 'Share'}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Bookmark Button */}
      <Animated.View style={{ transform: [{ scale: bookmarkScale }] }}>
        <TouchableOpacity 
          style={[
            styles.footerActionButton,
            isBookmarked && styles.activeFooterButton
          ]}
          onPress={handleBookmark}
          disabled={bookmarkLoading}
        >
          {bookmarkLoading ? (
            <ActivityIndicator size={20} color="#999" />
          ) : (
            <Ionicons 
              name={isBookmarked ? "bookmark" : "bookmark-outline"} 
              size={24} 
              color={isBookmarked ? "#4CAF50" : "#666"} 
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
)}
    {/* Comments Section Component */}
    <CommentsSection
      visible={showComments}
      onClose={() => setShowComments(false)}
      articleId={article.id}
    />

    {/* Loading Overlay during transitions */}
    {isTransitioning && (
      <View style={styles.loadingOverlay}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 30,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  detailContent: {
    flex: 1,
    backgroundColor: '#fff',
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
    marginTop: 20,
    borderRadius: 28,
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
  exclusiveTagDetail: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#FF0000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  exclusiveText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  htmlContentContainer: {
    marginBottom: 20,
  },
  swipeIndicator: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
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
    paddingBottom: 100, // Extra space to prevent overlap with footer
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
  },
  activeNewsContainer: {
    // Additional styles for active news if needed
  },
  // Updated Action Bar styles
  actionBar: {
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
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
    paddingVertical: 1,
  },
  actionText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontWeight: '500',
  },
  activeActionText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  leftActionButtons: {
    position: 'absolute',
    bottom: 15,
    left: 15,
    flexDirection: 'column',
    alignItems: 'center',
  },
  
  rightActionButtons: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    flexDirection: 'column',
    alignItems: 'center',
  },
  
  overlayActionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 25,
    padding: 8,
    minWidth: 50,
    minHeight: 50,
  },
  
  overlayActionText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
    fontWeight: '600',
  },

  articleSource: {
    fontSize: 12, // Reduced from 14
    color: '#666',
    fontWeight: '400',
    marginBottom: 12,
    fontFamily: 'Montserrat_500Medium',
  },

  articleTitle: {
    fontSize: 20, // Reduced from 24
    fontWeight: 'bold',
    color: '#000',
    lineHeight: 26, // Reduced from 30
    marginBottom: 16,
    fontFamily: 'Montserrat_600SemiBold',
  },

  articlePreview: {
    fontSize: 14, // Reduced from 16
    lineHeight: 20, // Reduced from 24
    color: '#666', // Changed from #989898
    textAlign: 'left',
    fontFamily: 'Montserrat_500Medium',
  },

  showMoreButton: {
    backgroundColor: '#000',
    paddingVertical: 12, // Reduced from 15
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
    fontFamily: 'Montserrat_600SemiBold',
  },

  swipeHint: {
    fontSize: 11, // Reduced from 12
    color: '#999',
    fontFamily: 'Montserrat_500Medium',
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
    height : "100%",
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
  adAdvertiser: {
    fontSize: 12,
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
    top: 40,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  newsStackContainer: {
    flex: 1,
    position: 'relative',
    marginBottom: 80, // Space for fixed footer
  },

  // Fixed Footer Styles
  fixedActionFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 0,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    zIndex: 10,
  },

  footerActionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },

  activeFooterButton: {
    backgroundColor: '#f8f9fa',
    // borderWidth: 1,
    borderColor: '#e9ecef',
  },

  footerActionText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontWeight: '500',
    textAlign: 'center',
    fontFamily: 'Montserrat_500Medium',
  },

  activeFooterText: {
    color: '#ff4757',
    fontWeight: '600',
  },

  activeBookmarkText: {
    color: '#4CAF50',
    fontWeight: '600',
  },

});

export default NewsDetailScreen;