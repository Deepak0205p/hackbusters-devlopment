'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserProfile {
  id?: number;
  username: string;
  role: string;
  full_name?: string;
  department?: string;
  auth_method?: string;
  cert_serial?: string;
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  lastActive: number | null;
  initialize: () => void;
  login: (user: UserProfile, token: string) => void;
  logout: () => void;
  setUser: (user: UserProfile | null) => void;
  touchSession: () => void;
}

// Enterprise Session Timeout Invariant (ISA/IEC 62443: 8 hours absolute max or 45 mins idle)
const IDLE_TIMEOUT_MS = 45 * 60 * 1000;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      lastActive: null,
      initialize: () => {
        const state = get();
        if (state.lastActive && Date.now() - state.lastActive > IDLE_TIMEOUT_MS) {
          // Invalidate expired session
          set({ user: null, token: null, isAuthenticated: false, isLoading: false, lastActive: null });
        } else {
          set({ isLoading: false, lastActive: Date.now() });
        }
      },
      login: (user, token) => set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        lastActive: Date.now()
      }),
      logout: () => set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        lastActive: null
      }),
      setUser: (user) => set({ user, isAuthenticated: !!user, lastActive: Date.now() }),
      touchSession: () => {
        const state = get();
        if (state.isAuthenticated) {
          set({ lastActive: Date.now() });
        }
      }
    }),
    {
      name: 'mrpl-auth-storage'
    }
  )
);

