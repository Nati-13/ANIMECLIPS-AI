'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient, SupabaseClient, User as SupabaseAuthUser } from '@supabase/supabase-js';

export interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  signup: (email: string, password?: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const isSupabaseClientConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project') &&
  !supabaseAnonKey.includes('your-')
);

let supabaseBrowserClient: SupabaseClient | null = null;
if (typeof window !== 'undefined' && isSupabaseClientConfigured && supabaseUrl && supabaseAnonKey) {
  try {
    supabaseBrowserClient = createClient(supabaseUrl, supabaseAnonKey);
  } catch {
    supabaseBrowserClient = null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      // 1. If Supabase Auth is available
      if (supabaseBrowserClient) {
        try {
          const { data: { session } } = await supabaseBrowserClient.auth.getSession();
          if (session?.user && mounted) {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
            });
            setLoading(false);
            return;
          }
        } catch (err) {
          console.warn('[auth] Supabase session retrieval error:', err);
        }

        // Listen for auth state changes
        const { data: { subscription } } = supabaseBrowserClient.auth.onAuthStateChange(
          (_event, session) => {
            if (session?.user && mounted) {
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
              });
            } else if (mounted) {
              setUser(null);
            }
          }
        );

        if (mounted) setLoading(false);
        return () => subscription.unsubscribe();
      }

      // 2. Local session fallback for offline/development testing
      try {
        const stored = localStorage.getItem('animeclips_user');
        if (stored && mounted) {
          setUser(JSON.parse(stored));
        } else if (mounted) {
          const defaultUser: User = {
            id: 'user_editor_1',
            email: 'creator@animeclips.ai',
            name: 'Anime Editor',
          };
          setUser(defaultUser);
          localStorage.setItem('animeclips_user', JSON.stringify(defaultUser));
        }
      } catch {
        // Ignore
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email: string, password?: string) => {
    if (supabaseBrowserClient && password) {
      const { data, error } = await supabaseBrowserClient.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        throw new Error(error.message);
      }
      if (data.user) {
        const loggedInUser: User = {
          id: data.user.id,
          email: data.user.email || email,
          name: data.user.user_metadata?.name || email.split('@')[0],
        };
        setUser(loggedInUser);
        localStorage.setItem('animeclips_user', JSON.stringify(loggedInUser));
        return;
      }
    }

    // Fallback login
    const newUser: User = {
      id: `user_${Date.now()}`,
      email,
      name: email.split('@')[0],
    };
    setUser(newUser);
    localStorage.setItem('animeclips_user', JSON.stringify(newUser));
  };

  const signup = async (email: string, password?: string, name?: string) => {
    if (supabaseBrowserClient && password) {
      const { data, error } = await supabaseBrowserClient.auth.signUp({
        email,
        password,
        options: {
          data: { name: name || email.split('@')[0] },
        },
      });
      if (error) {
        throw new Error(error.message);
      }
      if (data.user) {
        const newUser: User = {
          id: data.user.id,
          email: data.user.email || email,
          name: name || email.split('@')[0],
        };
        setUser(newUser);
        localStorage.setItem('animeclips_user', JSON.stringify(newUser));
        return;
      }
    }

    // Fallback signup
    const newUser: User = {
      id: `user_${Date.now()}`,
      email,
      name: name || email.split('@')[0],
    };
    setUser(newUser);
    localStorage.setItem('animeclips_user', JSON.stringify(newUser));
  };

  const logout = async () => {
    if (supabaseBrowserClient) {
      await supabaseBrowserClient.auth.signOut().catch(() => {});
    }
    setUser(null);
    localStorage.removeItem('animeclips_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
