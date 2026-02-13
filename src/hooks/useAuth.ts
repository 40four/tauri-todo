// src/hooks/useAuth.ts

import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { User } from '../types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const currentUser = await invoke<User | null>('get_current_user');
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Failed to check auth:', error);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  const login = (authenticatedUser: User) => {
    setUser(authenticatedUser);
  };

  const logout = async () => {
    try {
      await invoke('logout_user');
      setUser(null);
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  return { user, loading, login, logout };
}
