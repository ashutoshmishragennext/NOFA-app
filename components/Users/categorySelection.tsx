import { apiService } from "@/api";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
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
} from "react-native";

const { width } = Dimensions.get("window");

const categoryConfig = {
  arts: { icon: "brush-outline", color: "#3B82F6" },
  food: { icon: "restaurant-outline", color: "#F97316" },
  gaming: { icon: "game-controller-outline", color: "#1F2937" },
  music: { icon: "musical-note-outline", color: "#EF4444" },
  science: { icon: "flask-outline", color: "#10B981" },
  football: { icon: "football-outline", color: "#6B7280" },
//   education: { icon: "school-outline", color: "#F59E0B" },
//   technology: { icon: "laptop-outline", color: "#1F2937" },
  travel: { icon: "airplane-outline", color: "#06B6D4" },
  cricket: { icon: "baseball-outline", color: "#F59E0B" },
  business: { icon: "briefcase-outline", color: "#8B5CF6" },
  fashion: { icon: "shirt-outline", color: "#84CC16" },
  politics: { icon: "flag-outline", color: "#DC2626" },
//   sports: { icon: "trophy-outline", color: "#059669" },
  entertainment: { icon: "film-outline", color: "#7C3AED" },
  health: { icon: "medical-outline", color: "#EC4899" },
  world: { icon: "earth-outline", color: "#0EA5E9" },
  local: { icon: "location-outline", color: "#F97316" },
};

const CategorySelectionScreen = ({ onComplete } : any) => {
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [savingCategories, setSavingCategories] = useState(false);
  const [imageErrors, setImageErrors] = useState({});
  const { user } = useAuth();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await apiService.getAllCategories();

      if (response && response.success) {
        setCategories(response.data || []);
        if (user?.id) {
          await loadUserPreferences();
        }
      } else {
        throw new Error("Failed to load categories");
      }
    } catch (error) {
      console.error("Error loading categories:", error);
      Alert.alert("Error", "Failed to load categories. Please try again.");
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadUserPreferences = async () => {
    try {
      const response = await apiService.getUserCategories(user.id);
      if (response && response.success) {
        setSelectedCategories(response.data.categories || []);
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
    }
  };

  const toggleCategory = (id) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleImageError = (categoryId) => {
    setImageErrors(prev => ({
      ...prev,
      [categoryId]: true
    }));
  };

  const saveUserCategories = async () => {
    if (selectedCategories.length === 0) {
      Alert.alert("Select at least one", "Please pick your interests.");
      return;
    }

    try {
      setSavingCategories(true);
      const response = await apiService.updateUserCategories(
        user.id,
        selectedCategories
      );

      if (response && response.success) {
        Alert.alert("Saved!", "Preferences updated.", [
          { text: "Continue", onPress: () => onComplete(selectedCategories) },
        ]);
      } else {
        throw new Error("Save failed");
      }
    } catch (error) {
      Alert.alert("Save Failed", "Try again later");
    } finally {
      setSavingCategories(false);
    }
  };

  const renderCategoryIcon = (category) => {
    const config = categoryConfig[category.slug] || {
      icon: "library-outline",
      color: "#6B7280",
    };

    // Check if category has image and image hasn't failed to load
    const hasValidImage = category.image && 
                         category.image.trim() !== '' && 
                         !imageErrors[category.id];

    if (hasValidImage) {
      return (
        <View style={styles.interestIconContainer}>
          <Image
            source={{ uri: category.image }}
            style={styles.interestImage}
            onError={() => handleImageError(category.id)}
          />
        </View>
      );
    } else {
      return (
        <View
          style={[styles.interestIcon, { backgroundColor: config.color }]}
        >
          <Ionicons name={config.icon} size={20} color="white" />
        </View>
      );
    }
  };

  if (loadingCategories) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.loadingText}>Loading categories...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.categoriesGrid}>
        {categories.map((category) => {
          const isSelected = selectedCategories.includes(category.id);

          return (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.interestCard,
                isSelected && styles.selectedInterestCard,
              ]}
              onPress={() => toggleCategory(category.id)}
              disabled={savingCategories}
            >
              {renderCategoryIcon(category)}
              <Text
                style={[
                  styles.interestName,
                  isSelected && styles.selectedInterestName,
                ]}
              >
                {category.name}
              </Text>
              {isSelected && (
                <View style={styles.checkmark}>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color="#22C55E"
                  />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.doneButton,
          (selectedCategories.length === 0 || savingCategories) &&
            styles.disabledDoneButton,
        ]}
        onPress={saveUserCategories}
        disabled={selectedCategories.length === 0 || savingCategories}
      >
        {savingCategories ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.doneButtonText}>Done</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 28, fontWeight: "bold", textAlign: "center" },
  description: { fontSize: 16, color: "#6B7280", textAlign: "center" },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingBottom: 100,
    marginTop: 20,
  },
  interestCard: {
    width: (width - 100) / 3,
    aspectRatio: 0.7,
    columnGap:1,
    rowGap:1,
    backgroundColor: "#f2f0f0ff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,

    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedInterestCard: { borderColor: "#22C55E", backgroundColor: "#F0FDF4" },
  interestIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  interestIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  interestImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  interestName: { fontSize: 11, fontWeight: "600", textAlign: "center" },
  selectedInterestName: { color: "#22C55E" },
  checkmark: { position: "absolute", top: 6, right: 6 },
  doneButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#111827",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  disabledDoneButton: { backgroundColor: "#D1D5DB" },
  doneButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, fontSize: 16, color: "#6B7280" },
});

export default CategorySelectionScreen;