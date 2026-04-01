import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '../services/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await authAPI.login({ email, password });
          const { user, accessToken, refreshToken } = data.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          set({ user, accessToken, refreshToken, isAuthenticated: true, isLoading: false });
          return { success: true };
        } catch (err) {
          const error = err.response?.data?.error || 'Error al iniciar sesión';
          set({ isLoading: false, error });
          return { success: false, error };
        }
      },

      register: async (nombre, email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await authAPI.register({ nombre, email, password });
          const { user, accessToken, refreshToken } = data.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          set({ user, accessToken, refreshToken, isAuthenticated: true, isLoading: false });
          return { success: true };
        } catch (err) {
          const error = err.response?.data?.error || 'Error al registrarse';
          set({ isLoading: false, error });
          return { success: false, error };
        }
      },

      logout: async () => {
        const { refreshToken } = get();
        try { await authAPI.logout(refreshToken); } catch {}
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
