'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { User as AppUser } from '@/types';

interface AuthContextType {
  user: AppUser | null;
  session: Session | null;
  loading: boolean;
  isLoginModalOpen: boolean;
  signOut: () => Promise<void>;
  openLoginModal: () => void;
  closeLoginModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  // Helper to fetch user profile from public.users
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();

      if (error) {
        console.error('Error fetching public user profile:', error.message);
        return null;
      }
      return data as AppUser;
    } catch (err) {
      console.error('Unexpected error fetching user profile:', err);
      return null;
    }
  };

  useEffect(() => {
    // 1. Initial Session Check
    const getInitialSession = async () => {
      // Check if a mock user is stored in local storage first (local offline / preview bypass)
      if (typeof window !== 'undefined') {
        const mockUserStr = localStorage.getItem('knive_mock_user');
        if (mockUserStr) {
          try {
            const mockUser = JSON.parse(mockUserStr);
            setUser(mockUser);
            setSession({
              access_token: 'mock-token',
              token_type: 'bearer',
              expires_in: 3600,
              refresh_token: 'mock-refresh',
              user: {
                id: mockUser.id,
                email: mockUser.email,
                app_metadata: {},
                user_metadata: {},
                aud: 'authenticated',
                created_at: new Date().toISOString(),
              } as any,
            });
            setLoading(false);
            return;
          } catch (e) {
            console.error('Failed to load mock user:', e);
          }
        }
      }

      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();
        setSession(initialSession);

        if (initialSession?.user) {
          const profile = await fetchUserProfile(initialSession.user.id);
          setUser(profile);
        }
      } catch (err) {
        console.error('Error getting initial session:', err);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // 2. Listen to Session Changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      // Only trigger if no local storage mock exists
      if (typeof window !== 'undefined' && localStorage.getItem('knive_mock_user')) {
        return;
      }

      setSession(currentSession);

      if (currentSession?.user) {
        setLoading(true);
        const profile = await fetchUserProfile(currentSession.user.id);
        setUser(profile);
        setLoading(false);
        setIsLoginModalOpen(false);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      setLoading(true);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('knive_mock_user');
      }
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      setLoading(false);
    }
  };

  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isLoginModalOpen,
        signOut,
        openLoginModal,
        closeLoginModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
