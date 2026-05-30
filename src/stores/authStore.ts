import { create } from "zustand";
import type { API, User } from "@/lib/api";

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  verifyPin: (pin: string) => boolean;
  isAdminOrManager: () => boolean;
  login: (credentials: {
    pin?: string;
    email?: string;
    password?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  verifyPin: (pin: string): boolean => {
    // TODO: Replace with real API call to verify PIN against hashed PIN in DB
    // For now, compare against stored user pin (in development only)
    const user = get().user;
    if (!user?.pin) return false;
    // WARNING: This is NOT secure. Replace with bcrypt compare in backend
    return user.pin === pin || pin === '123456'; // fallback dev PIN
  },

  isAdminOrManager: (): boolean => {
    const user = get().user;
    return user?.role === 'admin' || user?.role === 'manager';
  },

  login: async (credentials) => {
    const res = await (window as unknown as { api: API }).api.authLogin(
      credentials,
    );
    if (!res.ok) {
      throw new Error(res.error.message);
    }
    localStorage.setItem("token", res.data.token);
    set({ user: res.data.user, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    await (window as unknown as { api: API }).api.authLogout();
    localStorage.removeItem("token");
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await (window as unknown as { api: API }).api.authMe(
        token ?? undefined,
      );
      if (res.ok && res.data) {
        set({ user: res.data, isAuthenticated: true, isLoading: false });
      } else {
        localStorage.removeItem("token");
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
