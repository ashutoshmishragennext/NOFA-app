// utils/googleAuth.ts
import { makeRedirectUri } from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export const useGoogleAuth = () => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    // iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    scopes: ['profile', 'email'],
    redirectUri: makeRedirectUri({
      scheme: 'apartmenttimes', // Replace with your app scheme
      path: 'oauth'
    }),
  });

  return {
    request,
    response,
    promptAsync,
  };
};

export const signInWithGoogle = async (promptAsync: any) => {
  try {
    const result = await promptAsync();
    return result;
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
};
