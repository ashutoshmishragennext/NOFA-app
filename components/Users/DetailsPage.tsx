// NEWS DETAIL PAGE COMPONENT WITH SWIPE NAVIGATION
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  PanResponder,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Navbar from '../Navbar';

const { width } = Dimensions.get('window');

const NewsDetailScreen = ({ article, onBack, onNext, hasNext = true }:any) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond to horizontal swipes
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value,
        });
      },
      onPanResponderMove: (evt, gestureState) => {
        // Update position and opacity based on swipe
        pan.setValue({ x: gestureState.dx, y: 0 });
        const progress = Math.abs(gestureState.dx) / width;
        opacity.setValue(1 - progress * 0.3);
      },
      onPanResponderRelease: (evt, gestureState) => {
        pan.flattenOffset();
        
        const shouldGoBack = gestureState.dx > width * 0.3 && gestureState.vx > 0;
        const shouldGoNext = gestureState.dx < -width * 0.3 && gestureState.vx < 0;

        if (shouldGoBack) {
          // Swipe right - go back
          Animated.parallel([
            Animated.timing(pan.x, {
              toValue: width,
              duration: 300,
              useNativeDriver: false,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 300,
              useNativeDriver: false,
            }),
          ]).start(() => {
            if (onBack) onBack();
          });
        } else if (shouldGoNext && hasNext) {
          // Swipe left - go to next
          Animated.parallel([
            Animated.timing(pan.x, {
              toValue: -width,
              duration: 300,
              useNativeDriver: false,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 300,
              useNativeDriver: false,
            }),
          ]).start(() => {
            if (onNext) onNext();
          });
        } else {
          // Spring back to original position
          Animated.parallel([
            Animated.spring(pan.x, {
              toValue: 0,
              useNativeDriver: false,
            }),
            Animated.spring(opacity, {
              toValue: 1,
              useNativeDriver: false,
            }),
          ]).start();
        }
      },
    })
  ).current;

  
   

// Then your SafeAreaView component stays exactly the same:
return (
  <SafeAreaView style={styles.container}>
    <StatusBar barStyle="light-content" backgroundColor="#000" />
    
    <Animated.View 
      style={[
        styles.container, 
        {
          transform: [{ translateX: pan.x }],
          opacity: opacity,
        }
      ]}
      {...panResponder.panHandlers}
    >
      {/* Header */}
      <Navbar/>

      <ScrollView style={styles.detailContent} showsVerticalScrollIndicator={false}>
        {/* Article Image */}
        <View style={styles.articleImageContainer}>
          <Image source={{ uri: article.featuredImage}} style={styles.articleImage} />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)']}
            style={styles.articleImageGradient}
          />
          {article.isExclusive && (
            <View style={styles.exclusiveTagDetail}>
              <Text style={styles.exclusiveText}>EXCLUSIVE</Text>
            </View>
          )}
          
          {/* Swipe Indicators */}
          <View style={styles.swipeIndicators}>
            <View style={styles.swipeIndicator}>
              <Text style={styles.swipeText}>← Swipe to go back</Text>
            </View>
            {/* {hasNext && (
              <View style={styles.swipeIndicator}>
                <Text style={styles.swipeText}>Swipe for next →</Text>
              </View>
            )} */}
          </View>
        </View>

        {/* Article Content */}
        <View style={styles.articleContentContainer}>
          {/* Source and Time */}
          <View style={styles.articleMeta}>
            <Text style={styles.articleSource}>📺 {article.source || "Unknown"}</Text>
            <Text style={styles.articleTime}>2 hours ago</Text>
          </View>

          {/* Title */}
          <Text style={styles.articleTitle}>{article.title}</Text>

          {/* Author and Location */}
          <View style={styles.authorSection}>
            <Text style={styles.authorText}>By {article.authorName}</Text>
            <Text style={styles.locationText}>📍 {article.location || "Unknown"}</Text>
          </View>

          {/* Tags */}
          <View style={styles.tagsContainer}>
            {article.tags && article.tags.split(',').map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag.trim()}</Text>
              </View>
            ))}
          </View>

          {/* Article Body */}
          <Text style={styles.articleLead}>{article.summary}</Text>
          <Text style={styles.articleBody}>{article.content}</Text>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>👍</Text>
          <Text style={styles.actionText}>{article.viewCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>👎</Text>
          <Text style={styles.actionText}>12</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionText}>{article.commentCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>📤</Text>
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton}>
          <Text style={styles.saveIcon}>🔖</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  </SafeAreaView>
);


};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  // DETAIL SCREEN STYLES
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  exclusiveText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 10,
    borderRadius: 25,
    backgroundColor: '#f8f9fa',
  },
  backIcon: {
    fontSize: 18,
    color: '#333',
    fontWeight: 'bold',
  },
  detailHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  shareButton: {
    padding: 10,
    borderRadius: 25,
    backgroundColor: '#f8f9fa',
  },
  shareIcon: {
    fontSize: 16,
  },
  detailContent: {
    flex: 1,
    backgroundColor: '#fff',
  },
  articleImageContainer: {
    position: 'relative',
    height: 300,
  },
  articleImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  articleImageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
  },
  exclusiveTagDetail: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#FF4444',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  
  // New Swipe Indicators
  swipeIndicators: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  swipeIndicator: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  swipeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },

  articleContentContainer: {
    padding: 20,
  },
  articleMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  articleSource: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  articleTime: {
    fontSize: 12,
    color: '#999',
  },
  articleTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    lineHeight: 34,
    marginBottom: 15,
  },
  authorSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  authorText: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
  locationText: {
    fontSize: 12,
    color: '#999',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 25,
  },
  tag: {
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  tagText: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '600',
  },
  articleLead: {
    fontSize: 18,
    lineHeight: 26,
    color: '#333',
    marginBottom: 25,
    fontWeight: '500',
    textAlign: 'justify',
  },
  articleBody: {
    fontSize: 16,
    lineHeight: 24,
    color: '#444',
    marginBottom: 20,
    textAlign: 'justify',
  },
  articleSubheading: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
    marginBottom: 15,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    paddingVertical: 20,
    marginVertical: 25,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  relatedSection: {
    marginTop: 30,
    paddingTop: 25,
    borderTopWidth: 2,
    borderTopColor: '#f0f0f0',
  },
  relatedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  relatedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginBottom: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  relatedImage: {
    width: 80,
    height: 60,
    borderRadius: 8,
    marginRight: 15,
  },
  relatedTextContainer: {
    flex: 1,
  },
  relatedItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    lineHeight: 18,
  },
  relatedItemSource: {
    fontSize: 12,
    color: '#999',
  },
  relatedArrow: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  actionIcon: {
    fontSize: 16,
    marginRight: 5,
  },
  actionText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  saveButton: {
    padding: 12,
    borderRadius: 25,
    backgroundColor: '#4CAF50',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  saveIcon: {
    fontSize: 18,
    color: '#fff',
  },
});

export default NewsDetailScreen;