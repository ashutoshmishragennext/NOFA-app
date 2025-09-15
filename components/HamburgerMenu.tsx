import React from 'react';
import { View, StyleSheet } from 'react-native';

const HamburgerIcon = ({ color = '#000000', size = 24 }) => {
  const lineHeight = size * 0.12; // Responsive line thickness
  const lineSpacing = size * 0.1; // Space between lines
  const topBottomWidth = size * 0.8; // Width of top and bottom lines
  const middleOffset = size * 0.4; // How much the middle line is offset

  return (
    <View style={[styles.container, { width: size * 1.4, height: 18 }]}>
      {/* Top line - left aligned */}
      <View 
        style={[
          styles.line, 
          {
            width: topBottomWidth,
            height: lineHeight,
            backgroundColor: color,
            marginBottom: lineSpacing,
          }
        ]} 
      />
      
      {/* Middle line - same length, offset to the right */}
      <View 
        style={[
          styles.line, 
          {
            width: topBottomWidth,
            height: lineHeight,
            backgroundColor: color,
            marginLeft: middleOffset,
            marginBottom: lineSpacing,
          }
        ]} 
      />
      
      {/* Bottom line - left aligned */}
      <View 
        style={[
          styles.line, 
          {
            width: topBottomWidth,
            height: lineHeight,
            backgroundColor: color,
          }
        ]} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
  },
  line: {
    borderRadius: 2,
  },
});

export default HamburgerIcon;