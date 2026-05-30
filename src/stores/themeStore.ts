import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => Promise<void>;
  setTheme: (theme: Theme) => Promise<void>;
  initTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'light',
  isDark: false,

  toggleTheme: async () => {
    const next = get().theme === 'light' ? 'dark' : 'light';
    await window.api.settingsSetTheme(next);
    set({ theme: next, isDark: next === 'dark' });
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', next === 'dark');
    }
  },

  setTheme: async (theme: Theme) => {
    await window.api.settingsSetTheme(theme);
    set({ theme, isDark: theme === 'dark' });
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  },

  initTheme: async () => {
    if (typeof window === 'undefined') return;
    try {
      const result = await window.api.settingsGetTheme();
      const theme = (result as any)?.data || 'light';
      set({ theme, isDark: theme === 'dark' });
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', theme === 'dark');
      }
    } catch {
      // Fallback: system preference
      if (typeof window !== 'undefined') {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = systemPrefersDark ? 'dark' : 'light';
        set({ theme, isDark: systemPrefersDark });
        document.documentElement.classList.toggle('dark', systemPrefersDark);
      }
    }
  },
}));
