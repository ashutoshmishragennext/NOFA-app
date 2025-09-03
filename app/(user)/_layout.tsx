import React from 'react';
import { Stack } from 'expo-router';

export default function UserLayout() {
  return (
    <Stack 
      screenOptions={{ 
        headerShown: false // Hide default header since NewsApp has custom header
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ title: 'Dashboard' }} 
      />
      {/* Add more screens if needed in future */}
    </Stack>
  );
}