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

// TRENDING SCREEN COMPONENT
const TrendingScreen = () => {
  return (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.trendingScreenContainer}>
        <Text style={styles.trendingScreenTitle}>Trending Now</Text>
        <View style={styles.trendingList}>
          {[1, 2, 3, 4, 5].map((item) => (
            <TouchableOpacity key={item} style={styles.trendingListItem}>
              <Text style={styles.trendingNumber}>#{item}</Text>
              <View style={styles.trendingItemContent}>
                <Text style={styles.trendingItemTitle}>Breaking News Item {item}</Text>
                <Text style={styles.trendingItemSubtitle}>Trending in Politics</Text>
              </View>
              <Ionicons name="trending-up" size={24} color="#4CAF50" />
            </TouchableOpacity>
          ))}
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
  trendingScreenContainer: {
    padding: 20,
  },
  trendingScreenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  trendingList: {
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  trendingListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  trendingNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginRight: 15,
    width: 30,
  },
  trendingItemContent: {
    flex: 1,
  },
  trendingItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  trendingItemSubtitle: {
    fontSize: 12,
    color: '#666',
  },
});

export default TrendingScreen;