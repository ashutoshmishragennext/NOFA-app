// store/adStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '@/api';

export interface AdData {
  id: string;
  type: 'banner' | 'video' | 'product' | 'app' | 'service' | 'travel';
  title: string;
  description: string;
  imageUrl: string;
  ctaText: string;
  advertiser: string;
  backgroundColor: string;
  redirectLink: string;
}

export interface AdDisplayState {
  shouldShowAd: boolean;
  currentAdIndex: number;
  articlesViewedCount: number;
  nextAdAfter: number;
  adQueue: AdData[];
}

export type ApiAd = {
  id: string;
  title: string;
  description: string;
  advertiserName: string;
  advertiserEmail?: string;
  imageUrl: string;
  size: string;
  price: number;
  clickUrl: string;
  startDate?: string;
  endDate?: string;
  priority?: string;
  isActive?: boolean;
  createdBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

// Pure mapping with validation + defaults
const toAdData = (a: ApiAd): AdData => ({
  id: a.id,
  type: 'banner', // default; change if backend sends a type
  title: a.title,
  description: a.description,
  imageUrl: a.imageUrl,
  ctaText: 'Learn more',
  advertiser: a.advertiserName,
  backgroundColor: '#FFFFFF',
  redirectLink: a.clickUrl,
});

const TTL_MS = 1000 * 60 * 0.1; // 30m

type AdStore = AdDisplayState & {
  lastFetchedAt?: number;
  currentAd: () => AdData | null;
  setQueue: (ads: AdData[]) => void;
  fetchAds: () => Promise<void>;
  advanceAd: () => void;
  recordArticleView: () => void;
  setShouldShow: (v: boolean) => void;
};

export const useAdStore = create<AdStore>()(
  persist(
    (set, get) => ({
      shouldShowAd: false,
      currentAdIndex: 0,
      articlesViewedCount: 0,
      nextAdAfter: 3,
      adQueue: [],
      lastFetchedAt: undefined,

      currentAd: () => {
        const { adQueue, currentAdIndex } = get();
        return adQueue.length ? adQueue[currentAdIndex % adQueue.length] : null;
      },

      setQueue: (ads) =>
        set({
          adQueue: ads,
          currentAdIndex: 0,
          lastFetchedAt: Date.now(),
        }),

      fetchAds: async () => {
        const { lastFetchedAt, adQueue } = get();
        const now = Date.now();
        if (lastFetchedAt && now - lastFetchedAt < TTL_MS && adQueue.length) return;

        
        const raw: ApiAd[] = await apiService.getAds();
        
        // Transform + filter invalids
        const mapped = raw
          .map(toAdData)
          .filter((x) => !!x.id && !!x.title && !!x.imageUrl && !!x.redirectLink);

        if (mapped.length) {
          set({ adQueue: mapped, currentAdIndex: 0, lastFetchedAt: now });
        }
      },

      advanceAd: () => {
        const { adQueue, currentAdIndex } = get();
        if (!adQueue.length) return;
        set({ currentAdIndex: (currentAdIndex + 1) % adQueue.length });
      },

      recordArticleView: () => {
        const { articlesViewedCount, nextAdAfter } = get();
        const newCount = articlesViewedCount + 1;
        const shouldShowAd = newCount % nextAdAfter === 0;
        set({ articlesViewedCount: newCount, shouldShowAd });
      },

      setShouldShow: (v) => set({ shouldShowAd: v }),
    }),
    {
      name: 'ad-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        adQueue: s.adQueue,
        lastFetchedAt: s.lastFetchedAt,
        nextAdAfter: s.nextAdAfter,
      }),
      version: 1,
    }
  )
);
