import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface AdData {
  id: string;
  type: 'banner' | 'video' | 'product' | 'app' | 'service' | 'travel';
  title: string;
  description: string;
  imageUrl: string;
  ctaText: string;
  advertiser: string;
  backgroundColor: string;
}

interface AdComponentProps {
  adData: AdData;
  onAdClick?: (adData: AdData) => void;
  onAdClose?: () => void;
}

const EnhancedAdComponent = ({ adData, onAdClick, onAdClose, visible }) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.adContainer, { opacity }]}>
      {/* Your ad component content */}
      <TouchableOpacity onPress={() => onAdClick(adData)} style={styles.adContent}>
        <Image 
          source={{ uri: adData.imageUrl }} 
          style={styles.adImage}
          resizeMode="cover"
        />
        <View style={styles.adTextContainer}>
          <Text style={styles.adTitle}>{adData.title}</Text>
          <Text style={styles.adDescription}>{adData.description}</Text>
          <Text style={styles.adAdvertiser}>Sponsored by {adData.advertiser}</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={onAdClose} style={styles.adCloseButton}>
        <Ionicons name="close" size={24} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
};

// Add these styles for the ad component:
const styles = StyleSheet.create({
  adContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    zIndex: 100,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  adContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    width: '90%',
    maxWidth: 400,
  },
  adImage: {
    width: '100%',
    height: 200,
  },
  adTextContainer: {
    padding: 16,
  },
  adTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
  },
  adDescription: {
    fontSize: 14,
    marginBottom: 8,
    color: '#666',
  },
  adAdvertiser: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  adCloseButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
});


export default EnhancedAdComponent;