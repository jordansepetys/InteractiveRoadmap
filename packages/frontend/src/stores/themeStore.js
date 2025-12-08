import { create } from 'zustand';

// Check for saved preference or system preference
const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'light';

  const saved = localStorage.getItem('theme');
  if (saved === 'dark' || saved === 'light') {
    return saved;
  }

  // Check system preference
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  return 'light';
};

// Apply theme to document
const applyTheme = (theme) => {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  localStorage.setItem('theme', theme);
};

// Initialize on load
const initialTheme = getInitialTheme();
applyTheme(initialTheme);

const useThemeStore = create((set, get) => ({
  theme: initialTheme,

  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
  },

  toggleTheme: () => {
    const newTheme = get().theme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    set({ theme: newTheme });
  },

  isDark: () => get().theme === 'dark'
}));

export default useThemeStore;
