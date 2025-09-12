import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CategorySelectionScreen from './categorySelection';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

const OnboardingScreen = ({ onComplete }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

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
    }
  ];

  const handleNext = () => {
    if (currentPage < onboardingData.length - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      // Move to categories page
      setCurrentPage(3);
    }
  };

  const handleSkip = () => {
    // Skip to categories page
    setCurrentPage(3);
  };

  const handlePrevious = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleCategoriesComplete = (selectedCategories) => {
    // Complete onboarding with selected categories
    onComplete(selectedCategories);
  };

  const handleBackFromCategories = () => {
    // Go back to last onboarding page
    setCurrentPage(onboardingData.length - 1);
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

  const currentData = onboardingData[currentPage];
  const isCategoriesPage = currentPage === 3;

  // If we're on categories page, render the CategorySelectionScreen
  if (isCategoriesPage) {
    return (
      <View style={[styles.container, {
            paddingTop: insets.top,
            paddingBottom: insets.bottom
          }]}>
        <StatusBar style="dark" />
      <CategorySelectionScreen 
        onComplete={handleCategoriesComplete}
        onBack={handleBackFromCategories}
        mode="onboarding"
        title="Select Categories?"
        description="We'll recommend news according to your interests and familiarity."
        showBackButton={true} // Show back button in onboarding mode
      />
      </View>
    );
  }

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
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
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
            <Text style={styles.navButtonText}>Back</Text>
          </TouchableOpacity>

          <View style={styles.dotsContainer}>
            {onboardingData.map((_, index) => (
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
            <Text style={styles.nextButtonText}>
              {currentPage === onboardingData.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
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
});

export default OnboardingScreen;
