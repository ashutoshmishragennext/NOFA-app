import { Ionicons } from '@expo/vector-icons';
import React from 'react'
import {
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const SavedScreen = () => {
  return (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.savedContainer}>
        <Text style={styles.savedTitle}>Saved Articles</Text>
        <Text style={styles.savedSubtitle}>Your bookmarked articles will appear here</Text>
        <Ionicons name="bookmark-outline" size={64} color="#ccc" style={styles.savedIcon} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({

    content: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  // SAVED SCREEN STYLES
  savedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  savedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  savedSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  savedIcon: {
    marginBottom: 20,
  },
});

export default SavedScreen;