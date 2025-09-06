import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions, 
  ScrollView, 
  ActivityIndicator,
  Image,
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiService } from '@/api';
import { useAuth } from '@/context/AuthContext'; // Add this import

const { width, height } = Dimensions.get('window');

const OnboardingScreen = ({ onComplete }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [savingCategories, setSavingCategories] = useState(false); // Add saving state
  const insets = useSafeAreaInsets();
  const { user } = useAuth(); // Get current user

  const onboardingData = [
    {
      id: 1,
      title: "News On The Go",
      description: "I provide essential news for your general knowledge everyday!",
      backgroundColor: "#ffffff",
      imageUrl: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=400&fit=crop&crop=center"
    },
    {
      id: 2,
      title: "Wherever you want",
      description: "I provide essential news for your general knowledge everyday!",
      backgroundColor: "#ffffff", 
      imageUrl: "https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?w=400&h=400&fit=crop&crop=center"
    },
    {
      id: 3,
      title: "Whenever you want",
      description: "I provide essential news for your general knowledge everyday!",
      backgroundColor: "#ffffff",
      imageUrl: "https://images.unsplash.com/photo-1559526324-593bc073d938?w=400&h=400&fit=crop&crop=center"
    },
    {
      id: 4,
      title: "Choose your interests",
      description: "What are you interested in?",
      backgroundColor: "#ffffff"
    }
  ];

  // Enhanced category mapping with colors from your image
  const categoryConfig = {
    'arts': { icon: 'brush-outline', color: '#3B82F6' },
    'food': { icon: 'restaurant-outline', color: '#F97316' },
    'gaming': { icon: 'game-controller-outline', color: '#1F2937' },
    'music': { icon: 'musical-note-outline', color: '#EF4444' },
    'science': { icon: 'flask-outline', color: '#10B981' },
    'football': { icon: 'football-outline', color: '#6B7280' },
    'education': { icon: 'school-outline', color: '#F59E0B' },
    'technology': { icon: 'laptop-outline', color: '#1F2937' },
    'travel': { icon: 'airplane-outline', color: '#06B6D4' },
    'cricket': { icon: 'baseball-outline', color: '#F59E0B' },
    'business': { icon: 'briefcase-outline', color: '#8B5CF6' },
    'fashion': { icon: 'shirt-outline', color: '#84CC16' },
    'politics': { icon: 'flag-outline', color: '#DC2626' },
    'sports': { icon: 'trophy-outline', color: '#059669' },
    'entertainment': { icon: 'film-outline', color: '#7C3AED' },
    'health': { icon: 'medical-outline', color: '#EC4899' },
    'world': { icon: 'earth-outline', color: '#0EA5E9' },
    'local': { icon: 'location-outline', color: '#F97316' }
  };

  useEffect(() => {
    if (currentPage === 3) {
      loadCategories();
    }
  }, [currentPage]);

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await apiService.getAllCategories();
      
      if (response && response.success) {
        setCategories(response.data || []);
        
        // If user is logged in, load their existing preferences
        if (user?.id) {
          await loadUserPreferences();
        }
      } else {
        throw new Error('Failed to load categories');
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      Alert.alert('Error', 'Failed to load categories. Please try again.');
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Load user's existing category preferences
  const loadUserPreferences = async () => {
    try {
      if (!user?.id) return;
      
      const response = await apiService.getUserCategories(user.id);
      if (response && response.success) {
        setSelectedCategories(response.data.categories || []);
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
      // Don't show error for this as it might be first time user
    }
  };

  const toggleCategory = (categoryId) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  // Updated handleNext with category saving
  const handleNext = async () => {
    if (currentPage < onboardingData.length - 1) {
      setCurrentPage(currentPage + 1);
    } else if (currentPage === 3) {
      // Save categories when completing onboarding
      await saveUserCategories();
    }
  };

  // New function to save user categories
  const saveUserCategories = async () => {
    if (selectedCategories.length === 0) {
      Alert.alert('Please select at least one category', 'Choose your interests to get personalized news.');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'User not found. Please log in again.');
      return;
    }

    try {
      setSavingCategories(true);
      
      const response = await apiService.updateUserCategories(user.id, selectedCategories);
      
      if (response && response.success) {
        console.log('Categories saved successfully:', response);
        Alert.alert(
          'Preferences Saved!', 
          `You've selected ${selectedCategories.length} categories. You can change these anytime in settings.`,
          [
            {
              text: 'Continue',
              onPress: () => onComplete(selectedCategories)
            }
          ]
        );
      } else {
        throw new Error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving categories:', error);
      Alert.alert(
        'Save Failed', 
        'Could not save your preferences. Please try again.',
        [
          { text: 'Try Again', onPress: saveUserCategories },
          { text: 'Skip for Now', onPress: () => onComplete(selectedCategories) }
        ]
      );
    } finally {
      setSavingCategories(false);
    }
  };

  const handleSkip = () => {
    if (currentPage === 3) {
      // Don't allow skip on interests page, but offer minimal selection
      Alert.alert(
        'Select Your Interests',
        'Please choose at least one category to personalize your news experience.',
        [{ text: 'OK' }]
      );
      return;
    }
    onComplete([]);
  };

  const handlePrevious = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const renderProgressIndicator = () => {
    return (
      <View style={styles.progressContainer}>
        
        {currentPage === 3 && (
          <Text style={[styles.progressText, { color: '#22C55E' }]}>
               Sign up interests
          </Text>
        )}
      </View>
    );
  };

  const renderCategoriesScreen = () => {
    if (loadingCategories) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22C55E" />
          <Text style={styles.loadingText}>Loading categories...</Text>
        </View>
      );
    }

    return (
      <View style={styles.interestsContainer}>
        <ScrollView 
          contentContainerStyle={styles.categoriesGrid}
          showsVerticalScrollIndicator={false}
        >
          {categories.map((category) => {
            const categorySlug = category.slug?.toLowerCase();
            const config = categoryConfig[categorySlug] || { 
              icon: 'library-outline', 
              color: '#6B7280' 
            };
            const isSelected = selectedCategories.includes(category.id);
            
            return (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.interestCard,
                  isSelected && styles.selectedInterestCard
                ]}
                onPress={() => toggleCategory(category.id)}
                activeOpacity={0.7}
                disabled={savingCategories} // Disable during saving
              >
                <View style={[styles.interestIcon, { backgroundColor: config.color }]}>
                  <Ionicons name={config.icon} size={20} color="white" />
                </View>
                <Text style={[
                  styles.interestName,
                  isSelected && styles.selectedInterestName
                ]}>
                  {category.name}
                </Text>
                {isSelected && (
                  <View style={styles.checkmark}>
                    <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Updated Done button with saving state */}
        <TouchableOpacity 
          style={[
            styles.doneButton,
            (selectedCategories.length === 0 || savingCategories) && styles.disabledDoneButton
          ]}
          onPress={handleNext}
          disabled={selectedCategories.length === 0 || savingCategories}
        >
          <View style={styles.doneButtonContent}>
            {savingCategories && (
              <ActivityIndicator size="small" color="#fff" style={styles.saveSpinner} />
            )}
            <Text style={[
              styles.doneButtonText,
              (selectedCategories.length === 0 || savingCategories) && styles.disabledDoneButtonText
            ]}>
              {savingCategories ? 'Saving...' : 'Done'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Show selected count */}
        {selectedCategories.length > 0 && (
          <View style={styles.selectedCountContainer}>
            <Text style={styles.selectedCountText}>
              {selectedCategories.length} categor{selectedCategories.length === 1 ? 'y' : 'ies'} selected
            </Text>
          </View>
        )}
      </View>
    );
  };

  const currentData = onboardingData[currentPage];
  const isCategoriesPage = currentPage === 3;

  return (
    <View style={[
      styles.container,
      { 
        paddingTop: insets.top,
        paddingBottom: insets.bottom
      }
    ]}>
      {/* Header */}
      <View style={styles.header}>
        {renderProgressIndicator()}
        {!isCategoriesPage && (
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {!isCategoriesPage ? (
          <>
            {/* Image Container */}
            <View style={styles.imageContainer}>
              <View style={styles.illustrationCircle}>
                <Image
                  source={{ uri: currentData.imageUrl }}
                  style={styles.onboardingImage}
                  resizeMode="cover"
                />
              </View>
            </View>

            {/* Text Content */}
            <View style={styles.textContainer}>
              <Text style={styles.title}>{currentData.title}</Text>
              <Text style={styles.description}>{currentData.description}</Text>
            </View>

            {/* Navigation Buttons */}
            <View style={styles.navigationContainer}>
              <TouchableOpacity 
                onPress={handlePrevious}
                style={[styles.navButton, currentPage === 0 && styles.hiddenButton]}
                disabled={currentPage === 0}
              >
                <Text style={styles.navButtonText}>Skip</Text>
              </TouchableOpacity>

              <View style={styles.dotsContainer}>
                {onboardingData.slice(0, 3).map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      { backgroundColor: index === currentPage ? '#22C55E' : '#D1D5DB' }
                    ]}
                  />
                ))}
              </View>

              <TouchableOpacity onPress={handleNext} style={styles.navButton}>
                <Text style={styles.nextButtonText}>Next</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <View style={styles.interestHeader}>
              <Text style={styles.title}>{currentData.title}</Text>
              <Text style={styles.description}>{currentData.description}</Text>
            </View>
            {renderCategoriesScreen()}
          </>
        )}
      </View>
    </View>
  );
};

// Add these new styles to your existing styles
const additionalStyles = {
  doneButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveSpinner: {
    marginRight: 8,
  },
  selectedCountContainer: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  selectedCountText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    minHeight: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '500',
  },
  progressSeparator: {
    color: '#E5E7EB',
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 40,
  },
  illustrationCircle: {
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: (width * 0.7) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  onboardingImage: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 20,
  },
  navButton: {
    minWidth: 60,
    alignItems: 'center',
  },
  hiddenButton: {
    opacity: 0,
  },
  navButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  nextButtonText: {
    fontSize: 16,
    color: '#22C55E',
    fontWeight: '600',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  // Categories/Interests screen styles
  interestHeader: {
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  interestsContainer: {
    flex: 1,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 120,
  },
  interestCard: {
    width: (width - 80) / 3,
    aspectRatio: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedInterestCard: {
    borderColor: '#22C55E',
    backgroundColor: '#F0FDF4',
  },
  interestIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  interestName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 14,
  },
  selectedInterestName: {
    color: '#22C55E',
  },
  checkmark: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  doneButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#111827',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledDoneButton: {
    backgroundColor: '#D1D5DB',
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledDoneButtonText: {
    color: '#9CA3AF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280',
  },
});

export default OnboardingScreen;
