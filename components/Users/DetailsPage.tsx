import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { apiService } from '@/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';
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

const { width, height } = Dimensions.get('window');

// Simplified props interface
interface OptimizedNewsDetailProps {
  article: any;
  onBack: () => void;
  onNext: () => void;
  onPrev: () => void;
  hasNext: boolean;
  hasPrev: boolean;
  currentIndex: number;
  allArticles: any[];
  // Ad logic moved to parent
  currentContent: { type: 'article' | 'ad'; data: any };
  nextContent?: { type: 'article' | 'ad'; data: any };
  prevContent?: { type: 'article' | 'ad'; data: any };
  onAdClick?: (adData: any) => void;
  onAdClose?: () => void;
  // Prerendering props
  prerenderedNextArticle?: any;
  prerenderedPrevArticle?: any;
  isTransitioning?: boolean;
}

const OptimizedNewsDetailScreen: React.FC<OptimizedNewsDetailProps> = ({
  article,
  onBack,
  onNext,
  onPrev,
  hasNext,
  hasPrev,
  currentIndex,
  allArticles,
  currentContent,
  nextContent,
  prevContent,
  onAdClick,
  onAdClose,
  prerenderedNextArticle,
  prerenderedPrevArticle,
  isTransitioning = false
}) => {
  const [fontsLoaded] = useFonts({
    'NeuePlakExtended-SemiBold': require('../../assets/fonts/Neue Plak Extended SemiBold.ttf'),
    'Montserrat-Medium': require('../../assets/fonts/Montserrat-Medium.ttf'),
    'Newsreader-Italic-VariableFont_opsz': require('../../assets/fonts/Newsreader-Italic-VariableFont_opsz,wght.ttf')
  });

  // Simplified state management
  const [showComments, setShowComments] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(article.likeCount || 0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const [webViewUrl, setWebViewUrl] = useState('');

  // Animation refs
  const pan = useRef(new Animated.ValueXY()).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const swipeIndicatorOpacity = useRef(new Animated.Value(0.6)).current;
  const transitionOpacity = useRef(new Animated.Value(1)).current;
  const likeUpdateTimer = useRef<NodeJS.Timeout | null>(null);

  const currentUser = useAuth().user;
  const LIKE_BATCH_DELAY = 60 * 1000;
  const LIKE_STORAGE_KEY = `article_likes_${article.id}`;

  // Memoized content to prevent unnecessary re-renders
  const memoizedCurrentContent = useMemo(() => currentContent, [currentContent]);
  const memoizedNextContent = useMemo(() => nextContent, [nextContent]);
  const memoizedPrevContent = useMemo(() => prevContent, [prevContent]);

  // ========================================
  // LIKE SYSTEM (Simplified)
  // ========================================
  const loadServerLikeState = useCallback(async () => {
    if (!currentUser || !article.id) return;
    
    try {
      const status = await apiService.getArticleLikes(article.id, currentUser.id);
      setLiked(status.userLiked);
      setLikeCount(status.likeCount);
    } catch (error) {
      console.error('Error loading like state:', error);
    }
  }, [article.id, currentUser?.id]);

  const syncPendingLikesToServer = useCallback(async () => {
    if (!currentUser) return;

    try {
      const localLikeData = await AsyncStorage.getItem(LIKE_STORAGE_KEY);
      if (!localLikeData) return;

      const pendingData = JSON.parse(localLikeData);
      const currentServerState = await apiService.getArticleLikes(article.id, currentUser.id);

      if (pendingData.finalLikedState !== currentServerState.userLiked) {
        const result = await apiService.toggleArticleLike(article.id, currentUser.id);
        setLiked(result.liked);
        setLikeCount(result.likeCount);
      }

      await AsyncStorage.removeItem(LIKE_STORAGE_KEY);
    } catch (error) {
      console.error('Error syncing likes:', error);
    }
  }, [article.id, currentUser]);

  const handleLike = useCallback(async () => {
    if (!currentUser) {
      Alert.alert('Login Required', 'Please login to like articles');
      return;
    }

    const newLiked = !liked;
    const newCount = newLiked ? likeCount + 1 : likeCount - 1;

    // Optimistic update
    setLiked(newLiked);
    setLikeCount(newCount);

    try {
      const localLikeData = {
        userId: currentUser.id,
        articleId: article.id,
        finalLikedState: newLiked,
        finalCount: newCount,
        timestamp: Date.now(),
      };

      await AsyncStorage.setItem(LIKE_STORAGE_KEY, JSON.stringify(localLikeData));
      
      // Clear existing timer and set new one
      if (likeUpdateTimer.current) {
        clearTimeout(likeUpdateTimer.current);
      }
      
      likeUpdateTimer.current = setTimeout(() => {
        syncPendingLikesToServer();
      }, LIKE_BATCH_DELAY);

    } catch (error) {
      // Revert on error
      setLiked(!newLiked);
      setLikeCount(newLiked ? newCount - 1 : newCount + 1);
      console.error('Error handling like:', error);
    }
  }, [liked, likeCount, currentUser, syncPendingLikesToServer]);

  // ========================================
  // OTHER INTERACTIONS (Simplified)
  // ========================================
  const handleBookmark = useCallback(async () => {
    if (bookmarkLoading || !currentUser) {
      if (!currentUser) {
        Alert.alert('Login Required', 'Please login to bookmark articles');
      }
      return;
    }

    setBookmarkLoading(true);
    const optimisticBookmark = !isBookmarked;
    setIsBookmarked(optimisticBookmark);

    try {
      const result = await apiService.toggleBookmark(currentUser.id, article.id);
      setIsBookmarked(result.bookmarked);
    } catch (error) {
      setIsBookmarked(!optimisticBookmark);
      console.error('Error toggling bookmark:', error);
      Alert.alert('Error', 'Failed to update bookmark');
    } finally {
      setBookmarkLoading(false);
    }
  }, [bookmarkLoading, isBookmarked, currentUser, article.id]);

  const handleShare = useCallback(async () => {
    if (shareLoading) return;
    
    setShareLoading(true);
    try {
      await Share.share({
        message: `Check out this article: "${article.title}"\n\nRead more: https://nofa-sepia.vercel.app/article/${article.id}`,
        url: `https://nofa-sepia.vercel.app/article/${article.id}`,
        title: article.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share article');
    } finally {
      setShareLoading(false);
    }
  }, [shareLoading, article]);

  const handleRedirectToIframe = useCallback((articleData: any) => {
    const url = articleData.sourceUrl || "https://apartmenttimes.in/active-citizen-team-submits-memorandum-to-jewar-mla-demanding-government-hospitals-over-private-healthcare-projects/";
    setWebViewUrl(url);
    setShowWebView(true);
  }, []);

  // ========================================
  // GESTURE HANDLING (Optimized)
  // ========================================
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      if (isTransitioning) return false;
      return Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && Math.abs(gestureState.dy) > 10;
    },
    onPanResponderGrant: () => {
      pan.setOffset({
        x: pan.x._value,
        y: pan.y._value,
      });
    },
    onPanResponderMove: (_, gestureState) => {
      pan.y.setValue(gestureState.dy);
      const progress = Math.min(Math.abs(gestureState.dy) / height, 0.3);
      opacity.setValue(1 - progress);
    },
    onPanResponderRelease: (_, gestureState) => {
      pan.flattenOffset();
      const swipeThreshold = height * 0.1;
      const velocityThreshold = 0.1;

      const shouldGoNext = (gestureState.dy < -swipeThreshold || gestureState.vy < -velocityThreshold) && hasNext;
      const shouldGoPrev = (gestureState.dy > swipeThreshold || gestureState.vy > velocityThreshold) && hasPrev;

      if (shouldGoNext) {
        Animated.timing(pan.y, {
          toValue: -height,
          duration: 250,
          useNativeDriver: true,
        }).start(() => {
          pan.setValue({ x: 0, y: 0 });
          opacity.setValue(1);
          onNext();
        });
      } else if (shouldGoPrev) {
        Animated.timing(pan.y, {
          toValue: height,
          duration: 250,
          useNativeDriver: true,
        }).start(() => {
          pan.setValue({ x: 0, y: 0 });
          opacity.setValue(1);
          onPrev();
        });
      } else {
        Animated.parallel([
          Animated.spring(pan.y, {
            toValue: 0,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.spring(opacity, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
        ]).start();
      }
    },
  }), [isTransitioning, hasNext, hasPrev, onNext, onPrev, pan, opacity]);

  // ========================================
  // COMPONENT INITIALIZATION
  // ========================================
  useEffect(() => {
    const initializeComponent = async () => {
      if (currentUser && article.id) {
        setLikeLoading(true);
        
        // Sync any pending likes first
        await syncPendingLikesToServer();
        
        // Load current state
        await loadServerLikeState();
        
        // Check bookmark status
        try {
          const bookmarked = await apiService.isArticleBookmarked(currentUser.id, article.id);
          setIsBookmarked(bookmarked);
        } catch (error) {
          console.error('Error checking bookmark:', error);
        }
        
        setLikeLoading(false);
      }
    };

    if (fontsLoaded && article.id) {
      initializeComponent();
    }

    return () => {
      if (likeUpdateTimer.current) {
        clearTimeout(likeUpdateTimer.current);
      }
    };
  }, [fontsLoaded, article.id, currentUser, loadServerLikeState, syncPendingLikesToServer]);

  // Handle transition animations
  useEffect(() => {
    if (isTransitioning) {
      Animated.timing(transitionOpacity, {
        toValue: 0.7,
        duration: 150,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(transitionOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isTransitioning, transitionOpacity]);

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
  }, []);

  // ========================================
  // RENDER COMPONENTS
  // ========================================
  const AdComponent = React.memo(({ adData, onAdClick, onAdClose }: any) => (
    <View style={styles.adContainer}>
      <TouchableOpacity onPress={() => onAdClick?.(adData)} style={styles.adContent}>
        <Image
          source={{ uri: adData?.imageUrl || 'https://via.placeholder.com/300x200' }}
          style={styles.adImage}
          resizeMode="cover"
        />
        <View style={styles.adTextContainer}>
          <Text style={styles.adTitle}>{adData?.title || 'Default Title'}</Text>
          <Text style={styles.adDescription}>{adData?.description || 'Default Description'}</Text>
          <Text style={styles.adAdvertiser}>Sponsored by {adData?.advertiser || 'Unknown'}</Text>
          <TouchableOpacity style={styles.adCtaButton}>
            <Text style={styles.adCtaText}>{adData?.ctaText || 'Click Here'}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={onAdClose} style={styles.adCloseButton}>
        <Text style={styles.adAdvertiser2}>Skip</Text>
      </TouchableOpacity>
    </View>
  ));

  const ArticleContent = React.memo(({ articleData, isActive = false }: any) => (
    <View style={styles.newsContainer}>
      <View style={styles.articleImageContainer}>
        <Image
          source={{ 
            uri: articleData.featuredImage || 'https://via.placeholder.com/800x400'
          }}
          style={styles.articleImage}
          loadingIndicatorSource={{ uri: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' }}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.4)']}
          style={styles.articleImageGradient}
        />

        {isActive && (
          <View style={styles.ArticleButtonStyle}>
            <View style={styles.ArticleButtonStyleGroup}>
              <TouchableOpacity style={styles.footerActionButton} onPress={handleLike} disabled={likeLoading}>
                <Ionicons name={liked ? "heart" : "heart-outline"} size={16} color={liked ? "#ff4757" : "#fff"} />
                <Text style={[styles.footerActionText, liked && styles.activeFooterText]}>
                  {likeCount > 0 ? likeCount : 'Like'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.footerActionButton} onPress={() => setShowComments(true)}>
                <Ionicons name="chatbubble-outline" size={16} color="#fff" />
                <Text style={styles.footerActionText}>
                  {articleData.commentCount > 0 ? articleData.commentCount : '0'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.footerActionButton} onPress={handleShare} disabled={shareLoading}>
                {shareLoading ? (
                  <ActivityIndicator size={16} color="#999" />
                ) : (
                  <Ionicons name="share-social-outline" size={16} color="#fff" />
                )}
                <Text style={styles.footerActionText}>Share</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.footerActionButton} onPress={handleBookmark} disabled={bookmarkLoading}>
                {bookmarkLoading ? (
                  <ActivityIndicator size={16} color="#999" />
                ) : (
                  <Ionicons name={isBookmarked ? "bookmark" : "bookmark-outline"} size={16} color={isBookmarked ? "#4CAF50" : "#fff"} />
                )}
                <Text style={[styles.footerActionText, isBookmarked && styles.activeBookmarkText]}>
                  {isBookmarked ? 'Saved' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <View style={styles.articleContentContainer}>
        <Text style={styles.articleSource}>R. Republic TV</Text>
        <Text style={styles.articleTitle}>{articleData.title}</Text>
        
        <View style={styles.htmlContentContainer}>
          <Text style={styles.articlePreview}>
            {articleData.summary || articleData.content?.replace(/<[^>]*>/g, '').substring(0, 200) + '...' || 'No content available'}
          </Text>
        </View>
      </View>

      <View style={styles.bottomShowMore}>
        <TouchableOpacity style={styles.showMoreButton} onPress={() => handleRedirectToIframe(articleData)}>
          <Text style={styles.showMoreText}>Show More</Text>
        </TouchableOpacity>

        {isActive && (
          <Animated.View style={[styles.swipeIndicator, { opacity: swipeIndicatorOpacity }]}>
            <Text style={styles.swipeHint}>Swipe up for next news</Text>
            <Ionicons name="arrow-up" size={16} color="#000000b6" />
          </Animated.View>
        )}
      </View>
    </View>
  ));

  const renderContent = useCallback((contentInfo: any, isActive = false) => {
    if (!contentInfo?.data) return null;

    if (contentInfo.type === 'ad') {
      return <AdComponent adData={contentInfo.data} onAdClick={onAdClick} onAdClose={onAdClose} />;
    }

    return <ArticleContent articleData={contentInfo.data} isActive={isActive} />;
  }, [onAdClick, onAdClose]);

  // ========================================
  // RENDER
  // ========================================
  if (!fontsLoaded) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </SafeAreaView>
    );
  }

  const containerStyle = memoizedCurrentContent.type === 'ad' ? styles.container2 : styles.container;

  return (
    <SafeAreaView style={containerStyle}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Ionicons name="arrow-back" size={16} color="#000" />
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.newsStackContainer,
          {
            transform: [{ translateX: pan.x }],
            opacity: Animated.multiply(opacity, transitionOpacity),
          }
        ]}
        {...panResponder.panHandlers}
      >
        {/* Previous Content */}
        {memoizedPrevContent?.data && (
          <Animated.View
            style={[
              styles.newsStackItem,
              styles.prevNewsItem,
              { transform: [{ translateY: pan.y }] }
            ]}
          >
            {renderContent(memoizedPrevContent, false)}
          </Animated.View>
        )}

        {/* Current Content */}
        <Animated.View
          style={[
            styles.newsStackItem,
            styles.currentNewsItem,
            { transform: [{ translateY: pan.y }] }
          ]}
        >
          {renderContent(memoizedCurrentContent, true)}
        </Animated.View>

        {/* Next Content */}
        {memoizedNextContent?.data && (
          <Animated.View
            style={[
              styles.newsStackItem,
              styles.nextNewsItem,
              { transform: [{ translateY: pan.y }] }
            ]}
          >
            {renderContent(memoizedNextContent, false)}
          </Animated.View>
        )}
      </Animated.View>

      <Modal
        visible={showWebView}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowWebView(false)}
      >
        <SafeAreaView style={styles.webViewContainer}>
          <WebView
            source={{ uri: webViewUrl }}
            style={styles.webView}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.webViewLoading}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.webViewLoadingText}>Loading...</Text>
              </View>
            )}
          />
        </SafeAreaView>
      </Modal>

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

export default OptimizedNewsDetailScreen;