import { create } from 'zustand';
import { getTransactionCategories, createTransactionCategory } from '@/lib/apiActions';
import { useMemo } from 'react';

interface Category {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
}

interface CategoryState {
  categories: Category[];
  isLoading: boolean;
  
  fetchCategories: () => Promise<void>;
  addCategory: (category: Category) => void;
  createQuickly: (name: string, type: 'INCOME' | 'EXPENSE') => Promise<Category | null>;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  isLoading: false,

  fetchCategories: async () => {
    set({ isLoading: true });
    try {
      const res = await getTransactionCategories();
      if (res.success && res.data) {
        set({
          categories: res.data,
        });
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  addCategory: (category) => {
    const { categories } = get();
    // Ngăn chặn duplicate
    if (categories.find(c => c.name === category.name)) return;
    
    set({
      categories: [...categories, category],
    });
  },

  createQuickly: async (name, type) => {
    try {
      const res = await createTransactionCategory({ name, type });
      if (res.success && res.data) {
        get().addCategory(res.data);
        return res.data;
      }
    } catch (error) {
      console.error('Error in createQuickly store:', error);
    }
    return null;
  }
}));

// Selectors để tránh re-render
export const useIncomeCategories = () => {
  const categories = useCategoryStore(state => state.categories);
  return useMemo(() => categories.filter(c => c.type === 'INCOME'), [categories]);
};

export const useExpenseCategories = () => {
  const categories = useCategoryStore(state => state.categories);
  return useMemo(() => categories.filter(c => c.type === 'EXPENSE'), [categories]);
};
