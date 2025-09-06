// context/AuthContext.tsx
import { apiService } from '@/api';
import { clearCookies, getCookies } from '@/utils/cookieUtils';
import { useRouter, useSegments } from 'expo-router';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  image?: string;
  provider?:string;
  loginTime ?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>; // Add this
  googleSignIn: (accessToken: string) => Promise<void>; // Add this
}
const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initialNavigation, setInitialNavigation] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  const AUTH_TOKEN_KEY = 'auth_token';
  const USER_DATA_KEY = 'user_data';

  useEffect(() => {
    loadUserFromStorage();
  }, []);

  useEffect(() => {
    if (!isLoading && !initialNavigation) {
      handleInitialNavigation();
      setInitialNavigation(true);
    }
  }, [isLoading, initialNavigation]);

  useEffect(() => {
    if (!isLoading && initialNavigation) {
      handleRouteProtection();
    }
  }, [user, segments, isLoading, initialNavigation]);

  const loadUserFromStorage = async () => {
  try {
    // Check both token and user data
    const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    const userData = await SecureStore.getItemAsync(USER_DATA_KEY);
    
    if (token && userData) {
      const user = JSON.parse(userData);
      setUser(user);
      console.log('User restored from SecureStore:', user);
    } else {
      console.log('No valid session found');
    }
  } catch (error) {
    console.error('Error loading user:', error);
  } finally {
    setIsLoading(false);
  }
};

  const handleInitialNavigation = () => {
    if (user) {
      // User is logged in - redirect to dashboard
      redirectToDashboard(user.role);
    } else {
      // User is not logged in - ensure they're on login page
      router.replace('/login');
    }
  };

  const handleRouteProtection = () => {
    const inAuthGroup = segments[0] === '(auth)';
    
    if (!user) {
      // User not logged in - redirect to login if not already there
      if (!inAuthGroup) {
        router.replace('/login');
      }
    } else {
      // User is logged in
      if (inAuthGroup) {
        // User is logged in but on auth page - redirect to dashboard
        redirectToDashboard(user.role);
      } else {
        // Check if user is accessing correct role-based route
        const currentRoleGroup = segments[0];
        const expectedRoleGroup = getRoleGroup(user.role);
        
        if (currentRoleGroup && currentRoleGroup.startsWith('(') && currentRoleGroup !== expectedRoleGroup) {
          redirectToDashboard(user.role);
        }
      }
    }
  };

  const getRoleGroup = (role: string): string => {
    switch (role) {
      case 'SUPER_ADMIN':
        return '(super-admin)';
      case 'ADMIN':
        return '(admin)';
      case 'USER':
        return '(user)';
      default:
        return '(user)';
    }
  };

  const redirectToDashboard = (role: string) => {
    const roleGroup = getRoleGroup(role);
    router.replace(`${roleGroup}/dashboard` as any);
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await apiService.login({ email, password });
      setUser(response.user);
      // Navigation will be handled by useEffect
    } catch (error) {
      throw error;
    }
  };

  // Add this function in AuthProvider
    const updateUser = async (updates: Partial<User>) => {
      if (!user) return;
      
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      
      // Update stored user data
      await SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(updatedUser));
      console.log('User data updated:', updatedUser);
    };

const googleSignIn = async (accessToken: string) => {
  try {
    const response = await apiService.googleSignIn(accessToken);
    setUser(response.user);
    // Navigation will be handled by existing useEffect
  } catch (error) {
    console.error('Google sign in error:', error);
    throw error;
  }
};
  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      await clearCookies();
      setInitialNavigation(false); // Reset for next login
      router.replace('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout ,updateUser, googleSignIn  }}>
      {children}
    </AuthContext.Provider>
  );
}
