// src/api/index.ts
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, API_TIMEOUT } from '../constants/config';
import { LoginRequest, LoginResponse, User } from './types';

const AUTH_TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = 'user_data';

// Get the Bearer token from environment variable
const BEARER_TOKEN = process.env.EXPO_PUBLIC_BEARER_TOKEN || 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiI5MzI4ZmRjNC03ZThmLTQ1NTgtOTA4MS0xNjE3MDc4YTMyMDYiLCJleHAiOjE3NTYyNzYwNTl9.8T7NYohV7U3QROwubIyptIjDBbB49zVVMwE-0foZ6j0';

class ApiService {
  private baseURL: string;
  private timeout: number;
  private isLoggedIn: boolean = false;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.timeout = API_TIMEOUT;
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      const userData = await SecureStore.getItemAsync(USER_DATA_KEY);
      if (userData) {
        this.isLoggedIn = true;
        console.log('User session restored');
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    }
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Only add Authorization header if user is logged in
    if (this.isLoggedIn) {
      headers['Authorization'] = `Bearer ${BEARER_TOKEN}`;
    }

    return headers;
  }

  private async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const authHeaders = await this.getAuthHeaders();
      const fullUrl = `${this.baseURL}${url}`;

      const response = await fetch(fullUrl, {
        ...options,
        signal: controller.signal,
        headers: {
          ...authHeaders,
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      throw error;
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      if (response.status === 401) {
        await this.clearAuth();
        throw new Error('Authentication failed. Please login again.');
      }
      
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  }

  private async clearAuth() {
    this.isLoggedIn = false;
    try {
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_DATA_KEY);
    } catch (error) {
      console.error('Error clearing auth:', error);
    }
  }

async login(credentials: LoginRequest): Promise<LoginResponse> {
  const url = `${this.baseURL}/api/auth/login`;
  console.log("🚀 Making request to:", url);
  console.log("📋 Credentials:", credentials);
  console.log("🌐 Base URL:", this.baseURL);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    console.log("📡 Response received:", {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    });

    const data = await response.json();
    console.log("📦 Response data:", data);

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    if (!data.user) {
      throw new Error('Invalid login response: missing user data');
    }

    this.isLoggedIn = true;
    await SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(data.user));

    return {
      user: data.user,
      token: BEARER_TOKEN,
      message: data.message
    };
  } catch (error: any) {
    console.error("❌ Login error details:", {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    
    // Provide more specific error messages
    if (error.message.includes('Network request failed')) {
      throw new Error('Cannot connect to server. Check if server is running and both devices are on same WiFi network.');
    }
    
    throw error;
  }
}

  async logout(): Promise<void> {
    try {
      if (this.isLoggedIn) {
        await this.fetchWithTimeout('/api/auth/logout', {
          method: 'POST',
        });
      }
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      await this.clearAuth();
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const userData = await SecureStore.getItemAsync(USER_DATA_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async getUserById(id: string): Promise<User> {
    const response = await this.fetchWithTimeout(`/api/users/${id}`, {
      method: 'GET',
    });
    return this.handleResponse<User>(response);
  }

  async getUsers(): Promise<User[]> {
    console.log("Fetching users");
    
    const response = await this.fetchWithTimeout('/api/users', {
      method: 'GET',
    });
    
    const users = await this.handleResponse<User[]>(response);
    console.log("Users fetched:", users);
    
    return users;
  }

  // Getter to check if user is logged in
  get isAuthenticated(): boolean {
    return this.isLoggedIn;
  }
}

export const apiService = new ApiService();