import { apiService } from '@/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
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
     'Newsreader-Italic-VariableFont_opsz' : require('../../assets/fonts/Newsreader-Italic-VariableFont_opsz,wght.ttf')

  });

  const getRandomAdInterval = (): number => {
    return Math.floor(Math.random() * 3) + 2;
  };

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

  const currentUser = useAuth().user;
  const pan = useRef(new Animated.ValueXY()).current;
  const opacity = useRef(new Animated.Value(1)).current;

  // Timer ref for batching like updates
  const likeUpdateTimer = useRef(null);

  const LIKE_BATCH_DELAY = 1 * 60 * 1000; // 1 minute in milliseconds
  const LIKE_STORAGE_KEY = `article_likes_${article.id}`;

  // Add these state variables
  const [isTransitioning, setIsTransitioning] = useState(false);
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

  const handleRedirectToIframe = (articleData: any) => {
    if (showFullContent && (articleData.sourceUrl || "https://apartmenttimes.in/active-citizen-team-submits-memorandum-to-jewar-mla-demanding-government-hospitals-over-private-healthcare-projects/")) {
      console.log("HELOOOOOOOOOOOOOOOOOOOOOOOOOOOOO", articleData.sourceUrl);

      setWebViewUrl(articleData.sourceUrl || "https://apartmenttimes.in/active-citizen-team-submits-memorandum-to-jewar-mla-demanding-government-hospitals-over-private-healthcare-projects/");
      setShowWebView(true);
    }
  }

  // Call preloadNextAd when component mounts and when ad changes
  useEffect(() => {
    preloadNextAd();
  }, [adState.currentAdIndex, adState.adQueue]);
  useEffect(() => {
  const updateArticleCount = () => {
    // Don't show ads during transitions
    if (isTransitioning) return;
    
    setAdState(prev => {
      const showAd = Math.random();
      if (showAd >= 0.5) {
        console.log('Should show ad now!');
        return {
          ...prev,
          shouldShowAd: true,
          articlesViewedCount: 0,
          nextAdAfter: getRandomAdInterval(),
        };
      }
      return prev;
    });
  };

  // Add a small delay to prevent immediate state change during navigation
  const timer = setTimeout(() => {
    if (article.id) {
      updateArticleCount();
    }
  }, 100); // Small delay to let animations settle

  return () => clearTimeout(timer);
}, [article.id, isTransitioning]); // Add isTransitioning dependency
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

  const handleBack = () => {
    if (!isTransitioning && onBack) {
      setIsTransitioning(true);
      onBack();
      setTimeout(() => setIsTransitioning(false), 100);
    }
  };

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
          {/* WebView */}
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

  // Add subtle animation to swipe indicator Needs Checking for the animation
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

  // Vertical swipe panResponder for Instagram reels-like functionality
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
        // Direct movement - no resistance for immediate feedback
        pan.y.setValue(gestureState.dy);

        // Dynamic opacity change based on swipe distance
        const progress = Math.min(Math.abs(gestureState.dy) / height, 0.3);
        opacity.setValue(1 - progress);
      },
      onPanResponderRelease: (evt, gestureState) => {
        pan.flattenOffset();

        const swipeThreshold = height * 0.12;
        const velocityThreshold = 0.15;

        const shouldGoNext = (gestureState.dy < -swipeThreshold || gestureState.vy < -velocityThreshold) && gestureState.dy < 0;
        const shouldGoPrev = (gestureState.dy > swipeThreshold || gestureState.vy > velocityThreshold) && gestureState.dy > 0;

        // For circular navigation, always allow navigation if there are multiple articles
        if (shouldGoNext && allArticles.length > 1) {
          setIsTransitioning(true);
          Animated.timing(pan.y, {
            toValue: -height,
            duration: 200, // Add proper duration
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
            duration: 200, // Add proper duration  
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
          // Return to original position
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

  // Get next and previous articles for preview
  const getNextArticle = () => {
    if (allArticles.length > 0) {
      return allArticles[(currentIndex + 1) % allArticles.length];
    }
    return null;
  };

  const getPrevArticle = () => {
    if (allArticles.length > 0) {
      return allArticles[(currentIndex - 1 + allArticles.length) % allArticles.length];
    }
    return null;
  };

  const nextArticle = getNextArticle();
  const prevArticle = getPrevArticle();

  const EnhancedAdComponent = ({ adData, onAdClick, onAdClose, visible }) => {
  if (!visible) return null;
  
  // Add safety checks for your text content
  const title = adData?.title || 'Default Title';
  const description = adData?.description || 'Default Description';
  const advertiser = adData?.advertiser || 'Unknown Advertiser';
  const ctaText = adData?.ctaText || 'Click Here';
  
  return (
    <View style={styles.adContainer}>
      <TouchableOpacity onPress={() => onAdClick(adData)} style={styles.adContent}>
        <Image
          source={{ uri: adData?.imageUrl || 'https://via.placeholder.com/300x200' }}
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
        {/* <Ionicons name="close" size={24} color="#fff" /> */}
            <Text style={styles.adAdvertiser2}>Skip</Text>
      </TouchableOpacity>
    </View>
  );
};

  const renderNewsArticle = (articleData, isActive = false, isAd: boolean = true) => {
    const handleArticleShowMoreClick = () => {
      if ((articleData.sourceUrl || "https://apartmenttimes.in/active-citizen-team-submits-memorandum-to-jewar-mla-demanding-government-hospitals-over-private-healthcare-projects/")) {
        console.log("HELOOOOOOOOOOOOOOOOOOOOOOOOOOOOO", articleData.sourceUrl);

        setWebViewUrl(articleData.sourceUrl || "https://apartmenttimes.in/active-citizen-team-submits-memorandum-to-jewar-mla-demanding-government-hospitals-over-private-healthcare-projects/");
        setShowWebView(true);
      }
    }
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
      <View style={[styles.newsContainer]}>
        {/* Article Image - Clean without overlay buttons */}
        {/* Article Image - Clean without overlay buttons */}
        <View style={[styles.articleImageContainer]}>
          <Image
            source={{ uri: articleData.featuredImage || 'https://via.placeholder.com/800x400' }}
            style={styles.articleImage}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.4)']}
            style={styles.articleImageGradient}
          />

          {/* Move the action buttons here - overlaid on the image */}
          <View style={[styles.ArticleButtonStyle]}>
            <View style={[styles.ArticleButtonStyleGroup]}>
              <Animated.View style={{ transform: [{ scale: likeScale }] }}>
                <TouchableOpacity
                  style={[
                    styles.footerActionButton,
                  ]}
                  onPress={handleLike}
                  disabled={likeLoading}
                >
                  {likeLoading ? (
                    <ActivityIndicator size={16} color="#999" />
                  ) : (
                    <Ionicons
                      name={liked ? "heart" : "heart-outline"}
                      size={16}
                      color={liked ? "#ff4757" : "#fff"}
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
                  <Ionicons name="chatbubble-outline" size={16} color="#fff" />
                  <Text style={styles.footerActionText}>
                    {articleData.commentCount > 0 ? articleData.commentCount : '0'}
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
                    <ActivityIndicator size={16} color="#999" />
                  ) : (
                    <Ionicons name="share-social-outline" size={16} color="#fff" />
                  )}
                  <Text style={styles.footerActionText}>
                    {'Share'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>

              {/* Bookmark Button */}
              <Animated.View style={{ transform: [{ scale: bookmarkScale }] }}>
                <TouchableOpacity
                  style={[
                    styles.footerActionButton,
                  ]}
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
        </View>

        {/* Remove the old button container from here - it was after the image container */}

        {/* Article Content */}
        <View style={[styles.articleContentContainer]}>
          {/* Source */}
          <Text style={styles.articleSource}>R. Republic TV</Text>

          <TouchableOpacity

            disabled={!showFullContent}
          >
            <Text style={[
              styles.articleTitle,
            ]}>
              {articleData.title}
            </Text>
          </TouchableOpacity>

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
        {/* Show More Button - moved to bottom */}
        <View style={[styles.bottomShowMore]}>
          <TouchableOpacity
            style={styles.showMoreButton}
            // onPress={() => setShowFullContent(!showFullContent)}
            onPress={() => handleArticleShowMoreClick()}
          >
            <Text style={styles.showMoreText}>
              {showFullContent ? 'Show Less' : 'Show More'}
            </Text>
          </TouchableOpacity>
          {/* Swipe Indicator - only show on active article */}
          {isActive && (
            <Animated.View style={[styles.swipeIndicator, { opacity: swipeIndicatorOpacity }]}>

              <Text style={styles.swipeHint}>Swipe up for next news</Text>
              <Ionicons
                name="arrow-up"
                size={16}
                color={"#000000b6"}
              />
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
    <SafeAreaView style={[((!adState.shouldShowAd) ? styles.container : styles.container2)]}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <Animated.View
        style={[
          ((!adState.shouldShowAd) ? styles.container : styles.container3),
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
                {renderNewsArticle(adState.adQueue[adState.currentAdIndex], true, true)}
              </>
            ) : (
              <>
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

      <WebViewModal
        visible={showWebView}
        url={webViewUrl}
        onClose={() => {
          setShowWebView(false);
          setWebViewUrl('');
        }}
      />

      {/* Comments Section Component */}
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
    top: 40,
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