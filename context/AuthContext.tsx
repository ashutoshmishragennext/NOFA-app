// context/AuthContext.tsx
import { apiService } from '@/api';
import { clearCookies, getCookies } from '@/utils/cookieUtils';
import { useRouter, useSegments } from 'expo-router';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'USER';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
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
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    loadUserFromStorage();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      handleRouteProtection();
    }
  }, [user, segments, isLoading]);

  const loadUserFromStorage = async () => {
    try {
      const cookies = await getCookies();
      if (cookies && cookies.token) {
        setUser({
          id: cookies.userId || '',
          name: cookies.name,
          email: cookies.email,
          role: cookies.role as 'SUPER_ADMIN' | 'ADMIN' | 'USER'
        });
        // router.replace(`(user)/dashboard` as any);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRouteProtection = () => {
    const inAuthGroup = segments[0] === '(auth)';
    
    if (!user) {
      // User not logged in - redirect to login
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
      throw error; // Re-throw to handle in component
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
      router.replace('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}