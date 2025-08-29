// app/(super-admin)/_layout.tsx - Super Admin Layout
import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';

export default function SuperAdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0066cc',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <View style={{ width: size, height: size, backgroundColor: color }} />
          ),
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: 'Users',
          tabBarIcon: ({ color, size }) => (
            <View style={{ width: size, height: size, backgroundColor: color }} />
          ),
        }}
      />
      <Tabs.Screen
        name="organizations"
        options={{
          title: 'Organizations',
          tabBarIcon: ({ color, size }) => (
            <View style={{ width: size, height: size, backgroundColor: color }} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <View style={{ width: size, height: size, backgroundColor: color }} />
          ),
        }}
      />
    </Tabs>
  );
}