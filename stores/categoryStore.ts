// stores/categoryStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '@/api';

type Category = { id: string; name: string; slug: string; image?: string };
type CategoryStore = {
  categories: Category[];
  lastFetchedAt?: number;
  loading: boolean;
  error?: string;
  setCategories: (cats: Category[]) => void;
  clear: () => void;
  fetchCategories: (force?: boolean) => Promise<void>;
};

const TTL_MS = 1000 * 60 * 60; // 1h cache

export const useCategoryStore = create<CategoryStore>()(
  persist(
    (set, get) => ({
      categories: [],
      lastFetchedAt: undefined,
      loading: false,
      error: undefined,
      setCategories: (cats) => set({ categories: cats, lastFetchedAt: Date.now() }),
      clear: () => set({ categories: [], lastFetchedAt: undefined, error: undefined }),
      fetchCategories: async (force = false) => {
        const { lastFetchedAt, categories } = get();
        const now = Date.now();
        if (!force && lastFetchedAt && now - lastFetchedAt < TTL_MS && categories.length) return;
        set({ loading: true, error: undefined });
        try {
          const resp = await apiService.getAllCategories();
          if (resp?.success) {
            set({ categories: resp.data || [], lastFetchedAt: now, loading: false });
          } else {
            set({ loading: false, error: 'Failed to load categories' });
          }
        } catch (e) {
          set({ loading: false, error: 'Failed to load categories' });
        }
      },
    }),
    {
      name: 'category-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ categories: s.categories, lastFetchedAt: s.lastFetchedAt }),
      version: 1,
    }
  )
);
