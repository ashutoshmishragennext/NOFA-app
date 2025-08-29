// src/hooks/auth.ts
import { useState, useEffect } from 'react';

import { apiService } from '../api';
import { User } from '@/api/types';

export const useCurrentUser = (): User | null => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await apiService.getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error('Failed to load user:', error);
      }
    };

    loadUser();
  }, []);

  return user;
};