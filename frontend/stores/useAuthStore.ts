import { create } from 'zustand';
import { fetchApi } from '@/lib/api';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt?: string;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authModalOpen: boolean;
  authModalTab: 'login' | 'signup';
  setAuthModalOpen: (open: boolean, tab?: 'login' | 'signup') => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  updateProfile: (data: { name?: string; currentPassword?: string; newPassword?: string }) => Promise<void>;
  logout: () => void;
  deleteAccount: (password: string) => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,
  authModalOpen: false,
  authModalTab: 'login',

  setAuthModalOpen: (open, tab = 'login') =>
    set({ authModalOpen: open, authModalTab: tab }),

  login: async (email, password) => {
    const res = await fetchApi<{
      success: boolean;
      accessToken: string;
      refreshToken: string;
      user: AuthUser;
    }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (res.accessToken && res.user) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', res.accessToken);
        if (res.refreshToken) {
          localStorage.setItem('refreshToken', res.refreshToken);
        }
      }
      set({
        user: res.user,
        accessToken: res.accessToken,
        isAuthenticated: true,
        authModalOpen: false,
      });
    }
  },

  signup: async (email, password, name) => {
    await fetchApi('/api/v1/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    // Automatically log in after successful signup
    await get().login(email, password);
  },

  updateProfile: async (data) => {
    const token = get().accessToken || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
    const res = await fetchApi<{ success: boolean; user: AuthUser }>('/api/v1/auth/me', {
      method: 'PATCH',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: JSON.stringify(data),
    });
    if (res.user) {
      set({ user: res.user });
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
    });
    fetchApi('/api/v1/auth/logout', { method: 'POST' }).catch(() => {});
  },

  deleteAccount: async (password) => {
    const token = get().accessToken || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
    await fetchApi('/api/v1/auth/me', {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: JSON.stringify({ password }),
    });
    get().logout();
  },

  checkAuth: async () => {
    if (typeof window === 'undefined') return;
    set({ isLoading: true });
    try {
      let token = localStorage.getItem('accessToken');
      if (!token) {
        set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
        return;
      }

      // Check token expiry
      const parts = token.split('.');
      if (parts.length === 3) {
        try {
          const payload = JSON.parse(atob(parts[1]));
          if (payload.exp && payload.exp * 1000 < Date.now()) {
            // Token expired -> attempt refresh with refreshToken
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
              const refreshRes = await fetchApi<{ accessToken: string }>('/api/v1/auth/refresh', {
                method: 'POST',
                body: JSON.stringify({ refreshToken }),
              });
              if (refreshRes.accessToken) {
                token = refreshRes.accessToken;
                localStorage.setItem('accessToken', token);
              } else {
                get().logout();
                set({ isLoading: false });
                return;
              }
            } else {
              get().logout();
              set({ isLoading: false });
              return;
            }
          }
        } catch {
          // Token parse error
        }
      }

      const meRes = await fetchApi<{ success: boolean; user: AuthUser }>('/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (meRes.user) {
        set({
          user: meRes.user,
          accessToken: token,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        get().logout();
        set({ isLoading: false });
      }
    } catch {
      get().logout();
      set({ isLoading: false });
    }
  },
}));
