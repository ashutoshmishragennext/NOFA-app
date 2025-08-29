// src/utils/cookieUtils.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserCookies {
  name: string;
  email: string;
  role: string;
  token: string;
  userId?: string; // Add userId field
}

const STORAGE_KEY = 'user_auth_data';

export const setCookies = async (userData: UserCookies): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
  } catch (error) {
    console.error('Error setting cookies:', error);
    throw new Error('Failed to save user data');
  }
};

export const getCookies = async (): Promise<UserCookies | null> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.error('Error getting cookies:', error);
    return null;
  }
};

export const clearCookies = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing cookies:', error);
    throw new Error('Failed to clear user data');
  }
};

export const getAuthToken = async (): Promise<string | null> => {
  try {
    const cookies = await getCookies();
    return cookies?.token || null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const token = await getAuthToken();
    return !!token;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};