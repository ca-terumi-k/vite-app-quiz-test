import { create } from 'zustand';

const CATEGORY_KEY = 'gcpDevOpsQuizCategories';

interface CategoryStore {
  categories: string[];
  selectedCategories: string[];
  setCategories: (cats: string[]) => void;
  setSelectedCategories: (cats: string[]) => void;
  toggleCategory: (cat: string, checked: boolean) => void;
  loadFromStorage: (allCats: string[]) => void;
}

export const useCategoryStore = create<CategoryStore>((set, get) => ({
  categories: [],
  selectedCategories: [],
  setCategories: (cats) => set({ categories: cats }),
  setSelectedCategories: (cats) => {
    set({ selectedCategories: cats });
    localStorage.setItem(CATEGORY_KEY, JSON.stringify(cats));
  },
  toggleCategory: (cat, checked) => {
    const prev = get().selectedCategories;
    const next = checked
      ? Array.from(new Set([...prev, cat]))
      : prev.filter((c) => c !== cat);
    set({ selectedCategories: next });
    localStorage.setItem(CATEGORY_KEY, JSON.stringify(next));
  },
  loadFromStorage: (allCats) => {
    const saved = localStorage.getItem(CATEGORY_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.every((c) => typeof c === 'string')) {
          set({ selectedCategories: parsed, categories: allCats });
          return;
        }
      } catch {
        // Ignore JSON parse errors
        // and fall back to the default categories
        console.error('Failed to parse categories from localStorage');
      }
    }
    set({ selectedCategories: allCats, categories: allCats });
    localStorage.setItem(CATEGORY_KEY, JSON.stringify(allCats));
  },
}));
