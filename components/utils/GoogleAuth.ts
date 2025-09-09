// utils/googleAuth.ts
import {
  GoogleSignin,
  statusCodes,
  isErrorWithCode,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';

// Configure Google Sign-In - ONLY webClientId is needed
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, // This is required for both Android and iOS
  scopes: ['profile', 'email'],
  offlineAccess: false,
});

export const useGoogleAuth = () => {
  const signInWithGoogle = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      
      if (isSuccessResponse(response)) {
        console.log('Google Sign-In Success:', response);
        return response;
      } else {
        console.log('Sign-in was cancelled');
        return null;
      }
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.SIGN_IN_CANCELLED:
            console.log('User cancelled sign-in');
            break;
          case statusCodes.IN_PROGRESS:
            console.log('Sign-in is in progress');
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            console.log('Play services not available');
            break;
          default:
            console.log('Unknown error occurred');
        }
      }
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await GoogleSignin.signOut();
      console.log('Successfully signed out');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return {
    signInWithGoogle,
    signOut,
  };
};
