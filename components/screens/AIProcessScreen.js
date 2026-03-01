import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ImageBackground,
  Animated,
  Dimensions,
} from 'react-native';
import { X } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { COLORS } from '../../config/colors';
import { FONTS } from '../../config/fonts';
import Svg, { Circle } from 'react-native-svg';
import { analyzeImageWithGemini } from '../../services/geminiService';

const { width } = Dimensions.get('window');

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function AIProcessScreen({ route, navigation }) {
  const imageUri = route?.params?.imageUri || null;
  const habit = route?.params?.habit || { title: '' };
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const containerAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Container entrance animation
    Animated.spring(containerAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Pulse animation for the card
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Rotation animation (left and right, 5 degrees)
    Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1, // 5 degrees to the right
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: -1, // 5 degrees to the left
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0, // Back to center
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Start analysis when component mounts
    const performAnalysis = async () => {
      if (!imageUri || !habit.title) return;
      
      try {
        // Animate progress from 0 to 0.5 (50%) during analysis
        Animated.timing(progressAnim, {
          toValue: 0.5,
          duration: 2000,
          useNativeDriver: false,
        }).start();

        // Perform actual analysis
        const result = await analyzeImageWithGemini(imageUri, habit.title);

        // Animate progress to 1.0 (100%) on completion
        Animated.timing(progressAnim, {
          toValue: 1.0,
          duration: 1000,
          useNativeDriver: false,
        }).start();

        setIsAnalyzing(false);
        setAnalysisResult(result);

        // Navigate to AIResultScreen after a delay
        setTimeout(() => {
          if (result.success) {
            // Navigate to AIResultScreen with analysis result
            navigation.navigate('AIResult', {
              imageUri: imageUri,
              habit: habit,
              analysisResult: result,
            });
          } else {
            // Navigate to AIResultScreen even for errors to show error message
            navigation.navigate('AIResult', {
              imageUri: imageUri,
              habit: habit,
              analysisResult: result,
            });
          }
        }, 2000);
      } catch (error) {
        console.error('Error in analysis:', error);
        setIsAnalyzing(false);
        setAnalysisResult({
          success: false,
          error: error.message || 'Failed to analyze image',
        });
      }
    };

    performAnalysis();
  }, [imageUri, habit.title]);

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  // Calculate strokeDashoffset for progress (0 to 1.0 = 100%)
  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0], // 100% progress = 0 remaining
  });

  const scale = containerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
  });

  const opacity = containerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // Rotation interpolation (-5 to +5 degrees)
  const rotate = rotateAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-5deg', '0deg', '5deg'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Close Button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <X size={24} color={COLORS.textGrey} />
        </TouchableOpacity>

        {/* Main Card */}
        <Animated.View
          style={[
            styles.cardContainer,
            {
              transform: [
                { scale: pulseAnim },
                { rotate: rotate },
              ],
              opacity: opacity,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.card,
              {
                transform: [{ scale: scale }],
              },
            ]}
          >
            {/* Blurred Image Background */}
            {imageUri ? (
              <ImageBackground
                source={{ uri: imageUri }}
                style={styles.imageBackground}
                imageStyle={styles.imageStyle}
              >
                <BlurView intensity={20} style={styles.blurOverlay} />
              </ImageBackground>
            ) : (
              <View style={styles.placeholderBackground}>
                <BlurView intensity={20} style={styles.blurOverlay} />
              </View>
            )}

            {/* Content Overlay */}
            <View style={styles.contentOverlay}>
              {/* Circular Progress Indicator */}
              <View style={styles.progressContainer}>
                <Svg width={140} height={140} style={styles.svg}>
                  {/* Background Circle */}
                  <Circle
                    cx={70}
                    cy={70}
                    r={radius}
                    stroke="#E0E0E0"
                    strokeWidth={3}
                    fill="none"
                  />
                  {/* Progress Circle */}
                  <AnimatedCircle
                    cx={70}
                    cy={70}
                    r={radius}
                    stroke={COLORS.primary}
                    strokeWidth={3}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    transform="rotate(-90 70 70)"
                  />
                </Svg>
              </View>

              {/* Text Content */}
              <Text style={styles.mainText}>
                {isAnalyzing 
                  ? 'AI Buddy is checking your progress...'
                  : analysisResult?.success
                  ? 'Progress verified! ✓'
                  : 'Analysis failed'}
              </Text>
              <Text style={styles.subText}>
                {isAnalyzing 
                  ? 'Identifying habit completion'
                  : analysisResult?.success
                  ? analysisResult?.data?.response || 'Your progress has been recorded'
                  : analysisResult?.error || 'Please try again'}
              </Text>
            </View>
          </Animated.View>
        </Animated.View>

        {/* Bottom Processing Indicator */}
        <View style={styles.bottomIndicator}>
          <View style={[styles.greenDot, !isAnalyzing && analysisResult?.success && styles.successDot]} />
          <Text style={styles.processingText}>
            {isAnalyzing ? 'Processing image' : analysisResult?.success ? 'Analysis complete' : 'Analysis failed'}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ECF7F0', // Light green background
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    left: 20,
    zIndex: 10,
    padding: 8,
  },
  cardContainer: {
    width: width - 40,
    maxWidth: 400,
    marginBottom: 40,
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.white,
    // Green shadow
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  imageBackground: {
    width: '100%',
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageStyle: {
    resizeMode: 'cover',
  },
  placeholderBackground: {
    width: '100%',
    height: 400,
    backgroundColor: '#E0E0E0',
  },
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  contentOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  progressContainer: {
    marginBottom: 32,
  },
  svg: {
    transform: [{ rotate: '0deg' }],
  },
  mainText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.white,
    fontFamily: FONTS.anton,
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subText: {
    fontSize: 16,
    fontWeight: '400',
    color: COLORS.white,
    fontFamily: FONTS.anton,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  bottomIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginRight: 8,
  },
  successDot: {
    backgroundColor: '#4CAF50',
  },
  processingText: {
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.textLight,
    fontFamily: FONTS.anton,
  },
});
