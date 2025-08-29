// app/_layout.tsx - Simplified Root Layout
import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Slot } from 'expo-router';
import { AuthProvider, useAuth } from '@/context/AuthContext';

function RootLayoutNav() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});