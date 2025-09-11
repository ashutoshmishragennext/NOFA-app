import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiService } from '@/api';
import { useAuth } from '@/context/AuthContext';

interface Category {
  id: string;
  name: string;
  icon?: string;
  description?: string;
}

interface CategorySelectionScreenProps {
  onBack: () => void;
}

const CategorySelectionScreen: React.FC<CategorySelectionScreenProps> = ({ onBack }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  // Sample categories - replace with your actual categories
  const sampleCategories: Category[] = [
    { id: '1', name: 'Technology', icon: 'laptop-outline', description: 'Tech news and updates' },
    { id: '2', name: 'Sports', icon: 'football-outline', description: 'Sports news and scores' },
    { id: '3', name: 'Politics', icon: 'flag-outline', description: 'Political news and analysis' },
    { id: '4', name: 'Business', icon: 'briefcase-outline', description: 'Business and finance' },
    { id: '5', name: 'Entertainment', icon: 'film-outline', description: 'Movies, TV, and celebrity news' },
    { id: '6', name: 'Health', icon: 'fitness-outline', description: 'Health and wellness' },
    { id: '7', name: 'Science', icon: 'flask-outline', description: 'Science discoveries' },
    { id: '8', name: 'Travel', icon: 'airplane-outline', description: 'Travel tips and destinations' },
    { id: '9', name: 'Food', icon: 'restaurant-outline', description: 'Food and recipes' },
    { id: '10', name: 'Fashion', icon: 'shirt-outline', description: 'Fashion and lifestyle' },
  ];

  useEffect(() => {
    loadCategories();
    loadUserPreferences();
  }, []);

  const loadCategories = async () => {
    try {
      // Replace with your actual API call
      // const response = await apiService.getCategories();
      // setCategories(response.categories);
      
      // Using sample data for now
      setCategories(sampleCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories(sampleCategories); // Fallback to sample data
    } finally {
      setLoading(false);
    }
  };

  const loadUserPreferences = async () => {
    try {
      if (user?.id) {
        // Replace with your actual API call
        // const preferences = await apiService.getUserPreferences(user.id);
        // setSelectedCategories(preferences.selectedCategories || []);
        
        // Sample user preferences
        setSelectedCategories(['1', '2', '4']); // Technology, Sports, Business
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const savePreferences = async () => {
    if (selectedCategories.length === 0) {
      Alert.alert('Error', 'Please select at least one category');
      return;
    }

    try {
      setSaving(true);
      const userId = user ? user.id : ""
      // Replace with your actual API call
      await apiService.updateUserCategories(
        userId,
        selectedCategories
      );

      Alert.alert(
        'Success',
        'Your category preferences have been updated successfully!',
        [{ text: 'OK', onPress: () => onBack() }]
      );
      
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const selectAll = () => {
    setSelectedCategories(categories.map(cat => cat.id));
  };

  const clearAll = () => {
    setSelectedCategories([]);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading categories...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Categories</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          <Text style={styles.description}>
            Choose the news categories you're interested in. You can select multiple categories.
          </Text>

          <Text style={styles.selectedCount}>
            {selectedCategories.length} of {categories.length} categories selected
          </Text>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity onPress={selectAll} style={styles.quickActionButton}>
              <Text style={styles.quickActionText}>Select All</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={clearAll} style={styles.quickActionButton}>
              <Text style={styles.quickActionText}>Clear All</Text>
            </TouchableOpacity>
          </View>

          {/* Categories Grid */}
          <View style={styles.categoriesGrid}>
            {categories.map((category) => {
              const isSelected = selectedCategories.includes(category.id);
              return (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryCard,
                    isSelected && styles.selectedCategoryCard
                  ]}
                  onPress={() => toggleCategory(category.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.categoryHeader}>
                    <View style={[
                      styles.categoryIcon,
                      isSelected && styles.selectedCategoryIcon
                    ]}>
                      <Ionicons
                        name={category.icon as any || 'list-outline'}
                        size={24}
                        color={isSelected ? '#fff' : '#4CAF50'}
                      />
                    </View>
                    {isSelected && (
                      <View style={styles.selectedIndicator}>
                        <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                      </View>
                    )}
                  </View>
                  <Text style={[
                    styles.categoryName,
                    isSelected && styles.selectedCategoryName
                  ]}>
                    {category.name}
                  </Text>
                  {category.description && (
                    <Text style={[
                      styles.categoryDescription,
                      isSelected && styles.selectedCategoryDescription
                    ]}>
                      {category.description}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              (saving || selectedCategories.length === 0) && styles.disabledButton
            ]}
            onPress={savePreferences}
            disabled={saving || selectedCategories.length === 0}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>
                Save Preferences ({selectedCategories.length})
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 24,
  },
  selectedCount: {
    fontSize: 14,
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  quickActionText: {
    color: '#4CAF50',
    fontWeight: '500',
    fontSize: 14,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#e9ecef',
    minHeight: 120,
  },
  selectedCategoryCard: {
    borderColor: '#4CAF50',
    backgroundColor: '#f8fff8',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  categoryIcon: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#e8f5e8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCategoryIcon: {
    backgroundColor: '#4CAF50',
  },
  selectedIndicator: {
    marginTop: -5,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  selectedCategoryName: {
    color: '#4CAF50',
  },
  categoryDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  selectedCategoryDescription: {
    color: '#4CAF50',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});

export default CategorySelectionScreen;
