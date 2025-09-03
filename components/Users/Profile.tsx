import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            logout();
          },
        },
      ]
    );
  };
  return (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.profileContainer}>
        <View style={styles.profileHeader}>
          <Ionicons name="person-circle-outline" size={80} color="#4CAF50" />
          <Text style={styles.profileName}>Bryan</Text>
          <Text style={styles.profileEmail}>bryan@example.com</Text>
        </View>
        <View style={styles.profileOptions}>
          {/* {['Settings', 'Notifications', 'Privacy', 'Help & Support'].map((option, index) => (
            <TouchableOpacity key={index} style={styles.profileOption}>
              <Text style={styles.profileOptionText}>{option}</Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
          ))} */}

          <TouchableOpacity
            style={styles.profileOption}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Text style={styles.profileOptionText}>
              Logout
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />

          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({

  content: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  // PROFILE SCREEN STYLES
  profileContainer: {
    padding: 20,
  },
  profileHeader: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 30,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  profileOptions: {
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
  },
  profileOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  profileOptionText: {
    fontSize: 16,
    color: '#333',
  },

});

export default ProfileScreen;