import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator
} from 'react-native';
import { uploadImageFromPicker } from '../uploadHelper';
import { apiService } from '@/api';

const ProfileScreen = () => {
  const [isUploading, setIsUploading] = useState(false);
  const { user, logout, updateUser } = useAuth();

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

  const uploadProfileIcon = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User not found');
      return;
    }

    try {
      setIsUploading(true);
      
      // Upload image
      const uploadData = await uploadImageFromPicker();
      
      if (uploadData?.url) {
        // Update profile picture in database
        const response = await apiService.updateProfilePicture(user.id, uploadData.url);
        
        if (response.success && response.data.image) {
          // Update user context with new image
          await updateUser({ image: response.data.image });
          Alert.alert('Success', 'Profile picture updated successfully!');
        }
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      Alert.alert('Error', 'Failed to update profile picture. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.profileContainer}>
        <View style={styles.profileHeader}>
          <TouchableOpacity 
            onPress={uploadProfileIcon} 
            disabled={isUploading}
            style={styles.profileImageContainer}
          >
            {isUploading ? (
              <View style={styles.uploadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.uploadingText}>Uploading...</Text>
              </View>
            ) : user?.image ? (
              <Image
                source={{ uri: user.image }}
                style={styles.profileImage}
                onError={(error) => {
                  console.error('Image load error:', error);
                  // Optionally remove broken image URL
                  updateUser({ image: undefined });
                }}
              />
            ) : (
              <Ionicons name="person-circle-outline" size={80} color="#4CAF50" />
            )}
          </TouchableOpacity>
          
          <Text style={styles.profileName}>{user?.name}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
      
        </View>

        <View style={styles.profileOptions}>
          <TouchableOpacity
            style={styles.profileOption}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Text style={styles.profileOptionText}>Logout</Text>
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
  profileImageContainer: {
    marginBottom: 10,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
  },
  uploadingContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    fontSize: 10,
    color: '#666',
    marginTop: 5,
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
