import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import { ArrowLeft, Pen, MoreVertical, Flame, Camera, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../../config/colors';
import { FONTS } from '../../config/fonts';
// import { analyzeImageWithGemini } from '../../services/geminiService'; // Commented out for testing

// Function to get emoji icon based on habit title
const getHabitEmoji = (title) => {
  const lowerTitle = title.toLowerCase();
  
  // Map keywords to emojis (7 different options)
  if (lowerTitle.includes('water') || lowerTitle.includes('drink')) {
    return '💧';
  } else if (lowerTitle.includes('read') || lowerTitle.includes('book')) {
    return '📚';
  } else if (lowerTitle.includes('exercise') || lowerTitle.includes('workout') || lowerTitle.includes('gym') || lowerTitle.includes('run')) {
    return '💪';
  } else if (lowerTitle.includes('meditate') || lowerTitle.includes('yoga') || lowerTitle.includes('mindfulness')) {
    return '🧘';
  } else if (lowerTitle.includes('sleep') || lowerTitle.includes('bed')) {
    return '😴';
  } else if (lowerTitle.includes('fruit') || lowerTitle.includes('vegetable') || lowerTitle.includes('eat') || lowerTitle.includes('food')) {
    return '🍎';
  } else if (lowerTitle.includes('write') || lowerTitle.includes('journal')) {
    return '✍️';
  }
  
  // Default emoji if no match
  return '⭐';
};

export default function HabitDetailScreen({ route, navigation }) {
  // Get habit data from route params or use defaults
  const habit = route?.params?.habit || {
    title: 'drink water',
    target: 'target: 2l today',
    streak: 3,
    icon: 'water',
  };

  const habitEmoji = getHabitEmoji(habit.title);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageAnalysisResult, setImageAnalysisResult] = useState(null); // null, 'success', or 'fail'
  const [analysisResponse, setAnalysisResponse] = useState(null); // Store the full response

  // Request permissions and open camera
  const handleOpenCamera = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Sorry, we need camera permissions to take photos!',
          [{ text: 'OK' }]
        );
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);
        setImageAnalysisResult(null);
        setAnalysisResponse(null);
        // Process image with Gemini API
        await processImageWithGemini(imageUri);
      }
    } catch (error) {
      console.error('Error opening camera:', error);
      Alert.alert('Error', 'Failed to open camera. Please try again.');
    }
  };

  // Request permissions and open image library
  const handleOpenLibrary = async () => {
    try {
      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Sorry, we need photo library permissions to select images!',
          [{ text: 'OK' }]
        );
        return;
      }

      // Launch image library
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);
        setImageAnalysisResult(null);
        setAnalysisResponse(null);
        // Process image with Gemini API
        await processImageWithGemini(imageUri);
      }
    } catch (error) {
      console.error('Error opening image library:', error);
      Alert.alert('Error', 'Failed to open image library. Please try again.');
    }
  };

  // Process image with Gemini API (TESTING: Not actually uploading to Gemini)
  const processImageWithGemini = async (imageUri) => {
    setIsProcessing(true);
    try {
      // TESTING: Skip actual API call and return mock response
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock response - testing if it returns message only
      const mockResponse = {
        success: true,
        data: {
          response: 'This is a test response message. The image shows progress related to your habit: ' + habit.title
        }
      };
      
      if (mockResponse.success) {
        setImageAnalysisResult('success');
        setAnalysisResponse(mockResponse.data);
      } else {
        setImageAnalysisResult('fail');
        setAnalysisResponse(mockResponse.error);
      }
    } catch (error) {
      console.error('Error processing image:', error);
      setImageAnalysisResult('fail');
      setAnalysisResponse('Failed to analyze image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={20} color={COLORS.textGrey} />
          </TouchableOpacity>
          
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => navigation.navigate('AddHabit', { habit: habit, isEditing: true })}
            >
              <Pen size={20} color={COLORS.textGrey} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <MoreVertical size={20} color={COLORS.textGrey} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Habit Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Text style={styles.emojiIcon}>{habitEmoji}</Text>
          </View>
        </View>

        {/* Habit Title */}
        <Text style={styles.habitTitle}>{habit.title}</Text>
        
        {/* Target */}
        <Text style={styles.target}>{habit.target}</Text>

        {/* Streak Card */}
        <View style={styles.streakCard}>
          <Flame size={36} color="#FF6B35" />
          <View style={styles.streakContent}>
            <Text style={styles.streakText}>{habit.streak} day streak</Text>
            <Text style={styles.streakSubtext}>Small wins add up.</Text>
          </View>
        </View>

        {/* Progress Section */}
        <Text style={styles.progressHeading}>show your progress</Text>
        
        <View style={styles.progressButtons}>
          <TouchableOpacity style={styles.progressButton} onPress={handleOpenCamera}>
            <View style={styles.progressIconContainer}>
              <Camera size={32} color={COLORS.textDark} />
            </View>
            <Text style={styles.progressButtonText}>open camera</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.progressButton} onPress={handleOpenLibrary}>
            <View style={styles.progressIconContainer}>
              <ImageIcon size={32} color={COLORS.textDark} />
            </View>
            <Text style={styles.progressButtonText}>from library</Text>
          </TouchableOpacity>
        </View>

        {/* Display selected image if available */}
        {selectedImage && (
          <View style={styles.selectedImageContainer}>
            <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
            
            {/* Processing State */}
            {isProcessing && (
              <View style={styles.analysisContainer}>
                <ActivityIndicator size="large" color={COLORS.textDark} />
                <Text style={styles.analysisText}>Analyzing image...</Text>
              </View>
            )}

            {/* Success State */}
            {!isProcessing && imageAnalysisResult === 'success' && (
              <View style={[styles.analysisContainer, styles.successContainer]}>
                <Text style={styles.successIcon}>✓</Text>
                <Text style={styles.successText}>Image verified successfully!</Text>
                {analysisResponse?.response && (
                  <Text style={styles.responseText}>{analysisResponse.response}</Text>
                )}
              </View>
            )}

            {/* Fail State */}
            {!isProcessing && imageAnalysisResult === 'fail' && (
              <View style={[styles.analysisContainer, styles.failContainer]}>
                <Text style={styles.failIcon}>✗</Text>
                <Text style={styles.failText}>Image verification failed</Text>
                {analysisResponse && (
                  <Text style={styles.errorText}>{analysisResponse}</Text>
                )}
              </View>
            )}
          </View>
        )}

        {/* Skip Button */}
        <TouchableOpacity style={styles.skipButton}>
          <Text style={styles.skipText}>skip for today</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerButton: {
    padding: 8,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiIcon: {
    fontSize: 48,
  },
  habitTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: COLORS.textDark,
    fontFamily: FONTS.anton,
    textAlign: 'center',
    marginBottom: 8,
  },
  target: {
    fontSize: 16,
    fontWeight: '400',
    color: COLORS.textLight,
    fontFamily: FONTS.anton,
    textAlign: 'center',
    marginBottom: 32,
  },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECF7F0',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginBottom: 40,
    // Shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  streakContent: {
    marginLeft: 12,
    alignItems: 'center',
  },
  streakText: {
    fontSize: 33,
    fontWeight: '600',
    color: COLORS.textDark,
    fontFamily: FONTS.anton,
    marginBottom: 4,
  },
  streakSubtext: {
    fontSize: 24,
    fontWeight: '400',
    color: COLORS.textLight,
    fontFamily: FONTS.anton,
  },
  progressHeading: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textDark,
    fontFamily: FONTS.anton,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  progressButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  progressButton: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: '#F6F8F6',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    // Shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textDark,
    fontFamily: FONTS.anton,
    marginTop: 12,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.textLight,
    fontFamily: FONTS.anton,
  },
  selectedImageContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  selectedImage: {
    width: '100%',
    height: 300,
    borderRadius: 16,
    resizeMode: 'cover',
  },
  analysisContainer: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  successContainer: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  failContainer: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#F44336',
  },
  successIcon: {
    fontSize: 32,
    color: '#4CAF50',
    marginBottom: 8,
  },
  failIcon: {
    fontSize: 32,
    color: '#F44336',
    marginBottom: 8,
  },
  successText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    fontFamily: FONTS.anton,
    marginBottom: 4,
  },
  failText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#C62828',
    fontFamily: FONTS.anton,
    marginBottom: 4,
  },
  analysisText: {
    fontSize: 14,
    color: COLORS.textDark,
    fontFamily: FONTS.anton,
    marginTop: 8,
  },
  responseText: {
    fontSize: 12,
    color: '#2E7D32',
    fontFamily: FONTS.anton,
    marginTop: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 12,
    color: '#C62828',
    fontFamily: FONTS.anton,
    marginTop: 8,
    textAlign: 'center',
  },
});
