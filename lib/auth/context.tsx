'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check localStorage session
    try {
      const stored = localStorage.getItem('animeclips_user');
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        // Default guest editor session for smooth local testing
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
      setLoading(false);
    }
  }, []);

  const login = async (email: string) => {
    const newUser: User = {
      id: `user_${Date.now()}`,
      email,
      name: email.split('@')[0],
    };
    setUser(newUser);
    localStorage.setItem('animeclips_user', JSON.stringify(newUser));
  };

  const signup = async (email: string, _pass?: string, name?: string) => {
    const newUser: User = {
      id: `user_${Date.now()}`,
      email,
      name: name || email.split('@')[0],
    };
    setUser(newUser);
    localStorage.setItem('animeclips_user', JSON.stringify(newUser));
  };

  const logout = async () => {
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
