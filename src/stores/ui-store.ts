import { create } from 'zustand';

interface UIState {
  // Profile drawer
  isProfileOpen: boolean;
  openProfile: () => void;
  closeProfile: () => void;
  toggleProfile: () => void;

  // Search dialog
  isSearchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;

  // Mobile sidebar
  isSidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;

  // Theme
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Profile drawer
  isProfileOpen: false,
  openProfile: () => set({ isProfileOpen: true }),
  closeProfile: () => set({ isProfileOpen: false }),
  toggleProfile: () => set((s) => ({ isProfileOpen: !s.isProfileOpen })),

  // Search dialog
  isSearchOpen: false,
  openSearch: () => set({ isSearchOpen: true }),
  closeSearch: () => set({ isSearchOpen: false }),
  toggleSearch: () => set((s) => ({ isSearchOpen: !s.isSearchOpen })),

  // Mobile sidebar
  isSidebarOpen: false,
  openSidebar: () => set({ isSidebarOpen: true }),
  closeSidebar: () => set({ isSidebarOpen: false }),
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),

  // Theme
  isDarkMode: true,
  toggleDarkMode: () => set((s) => ({ isDarkMode: !s.isDarkMode })),
}));
