import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { apiService } from '@/api';
import { useCategoryStore } from '@/stores/categoryStore';

const { width } = Dimensions.get('window');

const categoryConfig: Record<string, { icon: string; color: string; emoji: string }> = {
  arts: { icon: 'brush-outline', color: '#FF6B6B', emoji: '🎭' },
  food: { icon: 'restaurant-outline', color: '#FF8C42', emoji: '🍕' },
  gaming: { icon: 'game-controller-outline', color: '#6C5CE7', emoji: '🎮' },
  music: { icon: 'musical-note-outline', color: '#FF6B6B', emoji: '🎸' },
  science: { icon: 'flask-outline', color: '#00B894', emoji: '🧪' },
  football: { icon: 'football-outline', color: '#2D3436', emoji: '⚽' },
  travel: { icon: 'airplane-outline', color: '#0984E3', emoji: '✈️' },
  cricket: { icon: 'baseball-outline', color: '#FDCB6E', emoji: '🏏' },
  business: { icon: 'briefcase-outline', color: '#6C5CE7', emoji: '💼' },
  fashion: { icon: 'shirt-outline', color: '#A29BFE', emoji: '👗' },
  politics: { icon: 'flag-outline', color: '#E17055', emoji: '🏛️' },
  entertainment: { icon: 'film-outline', color: '#FD79A8', emoji: '🎬' },
  health: { icon: 'medical-outline', color: '#00B894', emoji: '🏥' },
  world: { icon: 'earth-outline', color: '#74B9FF', emoji: '🌍' },
  local: { icon: 'location-outline', color: '#FDCB6E', emoji: '📍' },
  nature: { icon: 'leaf-outline', color: '#00B894', emoji: '🌿' },
  gym: { icon: 'fitness-outline', color: '#FDCB6E', emoji: '💪' },
  technology: { icon: 'laptop-outline', color: '#2D3436', emoji: '💻' },
  tennis: { icon: 'tennisball-outline', color: '#00B894', emoji: '🎾' },
};

interface CategorySelectionScreenProps {
  onComplete?: (selectedCategories: any[]) => void;
  onBack?: () => void;
  mode?: 'onboarding' | 'settings';
  title?: string;
  description?: string;
  showBackButton?: boolean;
}

const CategorySelectionScreen: React.FC<CategorySelectionScreenProps> = ({
  onComplete,
  onBack,
  mode = 'onboarding',
  title,
  description,
  showBackButton = false,
}) => {
  const { user } = useAuth();

  // Read from zustand store
  const categories = useCategoryStore((s) => s.categories);
  const loading = useCategoryStore((s) => s.loading);
  const fetchCategories = useCategoryStore((s) => s.fetchCategories);

  // Local UI state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [savingCategories, setSavingCategories] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const isSettingsMode = mode === 'settings';
  const isOnboardingMode = mode === 'onboarding';

  // Fetch only if store empty; if onboarding preloaded, this stays instant
  useEffect(() => {
    if (!categories || categories.length === 0) {
      fetchCategories().catch(() => {});
    }
  }, [categories?.length, fetchCategories]); 

  // Load user preferences once categories are present
  useEffect(() => {
    const loadUserPreferences = async () => {
      if (!user?.id) return;
      try {
        const response = await apiService.getUserCategories(user.id);
        if (response?.success) {
          setSelectedCategories(response.data.categories || []);
        }
      } catch (e) {
        // non-blocking
      }
    };
    if (categories && categories.length) {
      loadUserPreferences();
    }
  }, [categories, user?.id]);

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  const handleImageError = (categoryId: string) => {
    setImageErrors((prev) => ({ ...prev, [categoryId]: true }));
  };

  const saveUserCategories = async () => {
    if (selectedCategories.length === 0) {
      Alert.alert('Select at least one', 'Please pick your interests.');
      return;
    }
    try {
      setSavingCategories(true);
      const response = await apiService.updateUserCategories(user?.id, selectedCategories);
      if (response?.success) {
        if (isOnboardingMode && onComplete) {
          onComplete(selectedCategories);
        } else if (isSettingsMode && onBack) {
          onBack();
        }
      } else {
        throw new Error('Save failed');
      }
    } catch {
      Alert.alert('Save Failed', 'Try again later');
    } finally {
      setSavingCategories(false);
    }
  };

  const renderCategoryIcon = (category: any) => {
    const config = categoryConfig[category.slug] || { icon: 'library-outline', color: '#74B9FF', emoji: '📚' };
    const hasValidImage = !!category.image && category.image.trim() !== '' && !imageErrors[category.id];
    if (hasValidImage) {
      return (
        <View style={styles.categoryIconContainer}>
          <Image source={{ uri: category.image }} style={styles.categoryImage} onError={() => handleImageError(category.id)} />
        </View>
      );
    }
    return (
      <View style={styles.categoryIconContainer}>
        <Text style={styles.categoryEmoji}>{config.emoji}</Text>
      </View>
    );
  };

  if (loading && (!categories || categories.length === 0)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.loadingText}>Loading categories...</Text>
      </View>
    );
  } 

  return (
    <SafeAreaView style={styles.container}>
      {(isSettingsMode || (isOnboardingMode && showBackButton)) && onBack && (
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>{title || 'Choose your interests'}</Text>
          <View style={styles.placeholder} />
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.titleSection}>
          <Text style={styles.description}>
            {description || "We'll recommend news according to your interests and familiarity."}
          </Text>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.categoriesGrid} showsVerticalScrollIndicator={false}>
          {categories?.map((category: any) => {
            const isSelected = selectedCategories.includes(category.id);
            return (
              <TouchableOpacity
                key={category.id}
                style={[styles.categoryCard, isSelected && styles.selectedCategoryCard]}
                onPress={() => toggleCategory(category.id)}
                disabled={savingCategories}
              >
                {renderCategoryIcon(category)}
                <Text style={[styles.categoryName, isSelected && styles.selectedCategoryName]} numberOfLines={1} ellipsizeMode="tail">
                  {category.name}
                </Text>
                {isSelected && (
                  <View style={styles.checkmark}>
                    <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.doneButton, (selectedCategories.length === 0 || savingCategories) && styles.disabledDoneButton]}
            onPress={saveUserCategories}
            disabled={selectedCategories.length === 0 || savingCategories}
          >
            {savingCategories ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.doneButtonText}>Done</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#F8F9FA"
  },
  
  // Header styles for settings mode
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#F8F9FA',
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
    paddingHorizontal: 24,
  },

  // Title section
  titleSection: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  title: { 
    fontSize: 24, 
    fontWeight: "600", 
    textAlign: "center",
    color: "#333",
  },
  description: { 
    fontSize: 16, 
    color: "#666", 
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },

  // Settings mode info
  settingsInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  selectedCount: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  quickActionButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  quickActionText: {
    color: '#333',
    fontWeight: '500',
    fontSize: 14,
  },

  // Scroll view and grid
  scrollView: {
    flex: 1,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap:4,
    columnGap:10,
    // justifyContent: "space-between",
    paddingBottom: 120,
  },
  
  // Category cards - fixed spacing and text wrapping
  categoryCard: {
    width: (width - 68) / 3, // Reduced margin for tighter spacing
    aspectRatio: 1,
    backgroundColor: '#F0F0F0',
    borderRadius: 16,
    padding: 12, // Reduced padding
    marginBottom: 8, // Much reduced bottom margin
    paddingVertical : 50,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedCategoryCard: { 
    borderColor: "#22C55E",
    backgroundColor: "#F8F9FA",
  },
  
  categoryIconContainer: {
    width: 40, // Slightly smaller
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8, // Reduced margin
  },
  categoryImage: {
    width: 40,
    height: 40,
    borderRadius: 12,
  },
  categoryEmoji: {
    fontSize: 24, // Slightly smaller
  },
  
  categoryName: { 
    fontSize: 11, // Slightly smaller
    fontWeight: "500", 
    textAlign: "center",
    color: "#666",
    lineHeight: 14,
    width: '100%', // Ensure full width for proper centering
  },
  selectedCategoryName: { 
    color: "#333",
    fontWeight: "600",
  },
  checkmark: { 
    position: "absolute", 
    top: 6, // Adjusted for smaller padding
    right: 6,
  },
  
  // Button container and styling
  buttonContainer: {
    paddingBottom: 20,
    paddingTop: 20,
  },
  doneButton: {
    backgroundColor: "#22C55E",
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: "center",
    marginHorizontal: 20,
  },
  disabledDoneButton: { 
    backgroundColor: "#CCCCCC",
  },
  doneButtonText: { 
    color: "#FFFFFF", 
    fontSize: 16, 
    fontWeight: "600" 
  },
  
  loadingContainer: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  loadingText: { 
    marginTop: 10, 
    fontSize: 16, 
    color: "#666" 
  },
});

export default CategorySelectionScreen;