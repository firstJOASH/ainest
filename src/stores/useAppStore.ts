import { create } from "zustand";
import { Dataset, UserStats, DatasetCategory } from "@/lib/starknet";

interface AppState {
  // Theme
  isDarkMode: boolean;
  setDarkMode: (isDark: boolean) => void;
  toggleTheme: () => void;

  // Datasets
  datasets: Dataset[];
  setDatasets: (datasets: Dataset[]) => void;
  addDataset: (dataset: Dataset) => void;
  contractDatasets: Dataset[];
  setContractDatasets: (datasets: Dataset[]) => void;

  // Filters
  selectedCategory: DatasetCategory | "All";
  setSelectedCategory: (category: DatasetCategory | "All") => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // User
  userStats: UserStats | null;
  setUserStats: (stats: UserStats | null) => void;

  // UI State
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;

  // Modals
  isUploadModalOpen: boolean;
  setUploadModalOpen: (open: boolean) => void;
  isProfileModalOpen: boolean;
  setProfileModalOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Theme
  isDarkMode: localStorage.getItem("theme") === "dark" || false,
  setDarkMode: (isDark) => {
    set({ isDarkMode: isDark });
    localStorage.setItem("theme", isDark ? "dark" : "light");
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  },
  toggleTheme: () => {
    const { isDarkMode, setDarkMode } = get();
    setDarkMode(!isDarkMode);
  },

  // Datasets
  datasets: [],
  setDatasets: (datasets) => set({ datasets }),
  addDataset: (dataset) =>
    set((state) => ({
      datasets: [dataset, ...state.datasets],
    })),
  contractDatasets: [],
  setContractDatasets: (datasets) => set({ contractDatasets: datasets }),
  addContractDataset: (dataset: Dataset) =>
    set((state) => ({
      contractDatasets: [dataset, ...state.contractDatasets],
    })),

  // Filters
  selectedCategory: "All",
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  searchQuery: "",
  setSearchQuery: (query) => set({ searchQuery: query }),

  // User
  userStats: null,
  setUserStats: (stats) => set({ userStats: stats }),

  // UI State
  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),
  error: null,
  setError: (error) => set({ error }),

  // Modals
  isUploadModalOpen: false,
  setUploadModalOpen: (open) => set({ isUploadModalOpen: open }),
  isProfileModalOpen: false,
  setProfileModalOpen: (open) => set({ isProfileModalOpen: open }),
}));
