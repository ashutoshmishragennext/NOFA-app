import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Dashboard from '@/components/Dashboard';

const SuperAdminContent = () => (
  <View style={styles.adminContent}>
    <Text style={styles.sectionTitle}>Super Admin Panel</Text>
    <TouchableOpacity style={[styles.menuItem, styles.superAdminItem]}>
      <Text style={styles.menuText}>Manage All Users</Text>
    </TouchableOpacity>
    <TouchableOpacity style={[styles.menuItem, styles.superAdminItem]}>
      <Text style={styles.menuText}>System Settings</Text>
    </TouchableOpacity>
    <TouchableOpacity style={[styles.menuItem, styles.superAdminItem]}>
      <Text style={styles.menuText}>Analytics & Reports</Text>
    </TouchableOpacity>
  </View>
);

export default function SuperAdminDashboard() {
  return (
    <Dashboard 
      title="Super Admin Dashboard" 
      roleSpecificContent={<SuperAdminContent />} 
    />
  );
}

const styles = StyleSheet.create({
  adminContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  menuItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  superAdminItem: {
    borderLeftWidth: 4,
    borderLeftColor: '#ff6b6b',
  },
  adminItem: {
    borderLeftWidth: 4,
    borderLeftColor: '#4ecdc4',
  },
  userItem: {
    borderLeftWidth: 4,
    borderLeftColor: '#45b7d1',
  },
  menuText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
});