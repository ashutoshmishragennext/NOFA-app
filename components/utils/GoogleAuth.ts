// components/utils/GoogleAuth.ts
import { 
  GoogleSignin, 
  statusCodes,
  User,
  SignInResponse,
  GetTokensResponse 
} from '@react-native-google-signin/google-signin';
import { useEffect, useState } from 'react';

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  scopes: ['profile', 'email'],
  offlineAccess: false,
});


console.log('Web Client ID:', process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID);

export const useGoogleAuth = () => {
  // Fix 1: Proper typing for user state
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkCurrentUser();
  }, []);

  const checkCurrentUser = async () => {
    try {
      // Fix 2: Use correct method name
      const currentUser = await GoogleSignin.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Check user error:', error);
    }
  };

  const getCurrentUser = async () => {
    try {
      const currentUser = await GoogleSignin.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Get current user error:', error);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Checking Play Services...');
      await GoogleSignin.hasPlayServices();
      
      console.log('Starting Google Sign-In...');
      const userInfo: SignInResponse = await GoogleSignin.signIn();
      
      
      // Fix 3: Handle the response properly
      if (userInfo.type === 'success') {
        setUser(userInfo.data);
        
        // Get user's ID token and access token
        const tokens: GetTokensResponse = await GoogleSignin.getTokens();
        console.log('Google tokens:', tokens);
        
        // Return the user info and tokens
        return {
          userInfo: userInfo.data,
          tokens
        };
      } else {
        throw new Error('Sign in was cancelled');
      }
      
    } catch (error: any) {
      setError(error.message);
       console.error('Detailed error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('Sign in cancelled');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Sign in in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.log('Play services not available');
      } else {
        console.error('Sign-in error:', error);
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await GoogleSignin.revokeAccess();
      await GoogleSignin.signOut();
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return {
    user,
    loading,
    error,
    signInWithGoogle,
    signOut,
    isSignedIn: !!user,
  };
};
