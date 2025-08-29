// NEWS DETAIL PAGE COMPONENT
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
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

const { width } = Dimensions.get('window');
const NewsDetailScreen = ({ article, onBack }:any) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Header */}
      <View style={styles.detailHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.detailHeaderTitle}>Article</Text>
        <TouchableOpacity style={styles.shareButton}>
          <Text style={styles.shareIcon}>📤</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.detailContent} showsVerticalScrollIndicator={false}>
        {/* Article Image */}
        <View style={styles.articleImageContainer}>
          <Image source={{ uri: article.image }} style={styles.articleImage} />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)']}
            style={styles.articleImageGradient}
          />
          {article.isExclusive && (
            <View style={styles.exclusiveTagDetail}>
              <Text style={styles.exclusiveText}>EXCLUSIVE</Text>
            </View>
          )}
        </View>

        {/* Article Content */}
        <View style={styles.articleContentContainer}>
          {/* Source and Time */}
          <View style={styles.articleMeta}>
            <Text style={styles.articleSource}>📺 {article.source}</Text>
            <Text style={styles.articleTime}>2 hours ago</Text>
          </View>

          {/* Title */}
          <Text style={styles.articleTitle}>{article.title}</Text>

          {/* Author and Location */}
          <View style={styles.authorSection}>
            <Text style={styles.authorText}>By Political Correspondent</Text>
            <Text style={styles.locationText}>📍 New Delhi</Text>
          </View>

          {/* Tags */}
          <View style={styles.tagsContainer}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>Politics</Text>
            </View>
            <View style={styles.tag}>
              <Text style={styles.tagText}>International</Text>
            </View>
            <View style={styles.tag}>
              <Text style={styles.tagText}>Breaking</Text>
            </View>
          </View>

          {/* Article Body */}
          <Text style={styles.articleLead}>
            In a significant diplomatic development, former President Donald Trump reportedly engaged in a telephone conversation with Indian Prime Minister Narendra Modi, discussing key insights from the recent Alaska summit.
          </Text>

          <Text style={styles.articleBody}>
            The conversation, which lasted approximately 45 minutes, covered various aspects of bilateral relations and international cooperation. Sources close to the matter suggest that the discussion focused on strengthening ties between the two nations.
          </Text>

          <Text style={styles.articleSubheading}>
            Key Discussion Points
          </Text>

          <Text style={styles.articleBody}>
            During the call, Trump shared valuable insights from discussions held during the Alaska summit, where world leaders gathered to address pressing global challenges including climate change and economic cooperation.
          </Text>

          <Text style={styles.articleBody}>
            Political analysts view this communication as a positive step towards maintaining strong international relationships. The timing of the call underscores the importance both leaders place on continued dialogue.
          </Text>

          {/* Stats Section */}
          <View style={styles.statsSection}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>2.4K</Text>
              <Text style={styles.statLabel}>Reads</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>187</Text>
              <Text style={styles.statLabel}>Shares</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>42</Text>
              <Text style={styles.statLabel}>Comments</Text>
            </View>
          </View>

          {/* Related Articles */}
          <View style={styles.relatedSection}>
            <Text style={styles.relatedTitle}>Related Articles</Text>
            
            <TouchableOpacity style={styles.relatedItem}>
              <Image 
                source={{ uri: "https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?w=80&h=60&fit=crop" }} 
                style={styles.relatedImage} 
              />
              <View style={styles.relatedTextContainer}>
                <Text style={styles.relatedItemTitle}>International Summit Outcomes</Text>
                <Text style={styles.relatedItemSource}>Global News • 3h ago</Text>
              </View>
              <Text style={styles.relatedArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.relatedItem}>
              <Image 
                source={{ uri: "https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=80&h=60&fit=crop" }} 
                style={styles.relatedImage} 
              />
              <View style={styles.relatedTextContainer}>
                <Text style={styles.relatedItemTitle}>Diplomatic Relations Update</Text>
                <Text style={styles.relatedItemSource}>World Today • 5h ago</Text>
              </View>
              <Text style={styles.relatedArrow}>→</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>👍</Text>
          <Text style={styles.actionText}>242</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>👎</Text>
          <Text style={styles.actionText}>12</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionText}>18</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>📤</Text>
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton}>
          <Text style={styles.saveIcon}>🔖</Text>
        </TouchableOpacity>
      </View>
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
    // paddingTop:40,
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

export default NewsDetailScreen