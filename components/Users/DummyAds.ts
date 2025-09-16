export interface AdDisplayState {
  shouldShowAd: boolean;
  currentAdIndex: number;
  articlesViewedCount: number;
  nextAdAfter: number;
  adQueue: AdData[];
}
export interface AdData {
  id: string;
  type: 'banner' | 'video' | 'product' | 'app' | 'service' | 'travel';
  title: string;
  description: string;
  imageUrl: string;
  ctaText: string;
  advertiser: string;
  backgroundColor: string;
  redirectLink : string;
}

export interface AdClickData {
  adId: string;
  adType: string;
  advertiser: string;
  timestamp: number;
}

// export interface NewsDetailScreenProps {
//   article: any;
//   onBack: () => void;
//   onNext?: () => void;
//   hasNext: boolean;
//   onPrev?: () => void;
//   hasPrev?: boolean;
//   currentIndex: number;
//   totalArticles: number;
//   sourceTab?: string;
//   prerenderedArticles: any, // New prop
//   allArticles?: any[];
//   transitionState : any;
// }
interface NewsDetailScreenProps {
  article: any;
  onBack: () => void;
  onNext: () => void;
  onPrev: () => void;
  hasNext: boolean;
  hasPrev: boolean;
  currentIndex: number;
  totalArticles: number;
  sourceTab: string;
  allArticles: any[];
  prerenderedArticles: Map<string, any>;
  transitionState: {
    isTransitioning: boolean;
    direction: 'next' | 'prev' | null;
    nextArticle: any;
  };
  // NEW ENHANCED PROPS
  contentQueue: {
    previous2: any;
    previous1: any;
    current: any;
    next1: any;
    next2: any;
    next3: any;
  };
  adConfig: {
    interstitialFrequency: number;
    rewardedAdAvailable: boolean;
    bannerAdVisible: boolean;
    articleCount: number;
    lastInterstitialShown: number;
  };
  adQueue: {
    interstitialLoaded: boolean;
    rewardedLoaded: boolean;
    bannerLoaded: false;
  };
  onAdEvent: (eventType: string, data: any) => void;
  cacheStats: {
    totalCached: number;
    cacheHitRate: string;
  };
}



export const dummyAds: AdData[] = [
  {
    id: 'ad_1',
    type: 'banner',
    title: 'Best Online Shopping',
    description: 'Get 50% off on all electronics. Limited time offer!',
    imageUrl: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400',
    ctaText: 'Shop Now',
    advertiser: 'ShopMart',
    backgroundColor: '#FF6B6B',
    redirectLink : 'https://www.adjust.com/glossary/advertisement/'
  },
  {
    id: 'ad_2',
    type: 'video',
    title: 'Learn Coding Online',
    description: 'Master programming skills with expert instructors',
    imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400',
    ctaText: 'Start Learning',
    advertiser: 'CodeAcademy',
    backgroundColor: '#4ECDC4',
    redirectLink : 'https://www.adjust.com/glossary/advertisement/'
  },
  {
    id: 'ad_3',
    type: 'product',
    title: 'Premium Coffee Beans',
    description: 'Freshly roasted coffee beans delivered to your door',
    imageUrl: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400',
    ctaText: 'Order Now',
    advertiser: 'Coffee Co.',
    backgroundColor: '#8B4513',
        redirectLink : 'https://www.adjust.com/glossary/advertisement/'

  },
  {
    id: 'ad_4',
    type: 'app',
    title: 'Fitness Tracker App',
    description: 'Track your daily activities and achieve fitness goals',
    imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
    ctaText: 'Download',
    advertiser: 'FitTrack',
    backgroundColor: '#45B7D1',
        redirectLink : 'https://www.adjust.com/glossary/advertisement/'

  },
  {
    id: 'ad_5',
    type: 'service',
    title: 'Food Delivery',
    description: 'Order your favorite food from top restaurants',
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400',
    ctaText: 'Order Food',
    advertiser: 'FoodExpress',
    backgroundColor: '#FF8C42',
        redirectLink : 'https://www.adjust.com/glossary/advertisement/'

  },
  {
    id: 'ad_6',
    type: 'travel',
    title: 'Book Your Dream Vacation',
    description: 'Explore amazing destinations with exclusive deals',
    imageUrl: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400',
    ctaText: 'Book Now',
    advertiser: 'TravelDeals',
    backgroundColor: '#6C5CE7',
        redirectLink : 'https://www.adjust.com/glossary/advertisement/'

  }
];
