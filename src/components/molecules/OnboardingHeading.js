import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { FONTS } from '../../utils';

/**
 * OnboardingHeading - A reusable component for onboarding step headings
 * 
 * @param {Object} props - Component props
 * @param {string} props.subtitle - Subtitle text (smaller, gray)
 * @param {string} props.title - Main title text (larger, bold)
 * @param {Object} props.style - Additional styles for the container
 * @param {Animated.Value} props.animation - Animation value for slide-in effect
 * @param {Animated.Value} props.subtitleAnimation - Animation value for subtitle
 * @param {Animated.Value} props.titleAnimation - Animation value for title
 * @param {Animated.Value} props.subtitleExitAnimation - Exit animation value for subtitle
 * @param {Animated.Value} props.titleExitAnimation - Exit animation value for title
 * @param {number} props.slideInDistance - Distance to slide in from (default: 300)
 * @param {number} props.slideOutDistance - Distance to slide out to (default: 400)
 * @returns {JSX.Element} OnboardingHeading component
 */
export const OnboardingHeading = ({ 
  subtitle, 
  title, 
  style, 
  subtitleStyle, 
  titleStyle, 
  animation, 
  subtitleAnimation, 
  titleAnimation,
  subtitleExitAnimation,
  titleExitAnimation,
  slideInDistance = 300,
  slideOutDistance = 400,
}) => {
  // Use separate animations if provided, otherwise fall back to single animation
  const getSubtitleTranslateX = () => {
    if (subtitleAnimation) {
      const entry = subtitleAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [slideInDistance, 0],
      });
      if (subtitleExitAnimation) {
        const exit = subtitleExitAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -slideOutDistance],
        });
        return Animated.add(entry, exit);
      }
      return entry;
    }
    if (animation) {
      return animation.interpolate({
        inputRange: [0, 1],
        outputRange: [slideInDistance, 0],
      });
    }
    return 0;
  };
  
  const getTitleTranslateX = () => {
    if (titleAnimation) {
      const entry = titleAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [slideInDistance, 0],
      });
      if (titleExitAnimation) {
        const exit = titleExitAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -slideOutDistance],
        });
        return Animated.add(entry, exit);
      }
      return entry;
    }
    if (animation) {
      return animation.interpolate({
        inputRange: [0, 1],
        outputRange: [slideInDistance, 0],
      });
    }
    return 0;
  };
  
  const subtitleTranslateX = getSubtitleTranslateX();
  const titleTranslateX = getTitleTranslateX();
  const subtitleOpacity = subtitleAnimation || animation || 1;
  const titleOpacity = titleAnimation || animation || 1;

  return (
    <View style={[styles.container, style]}>
      {subtitle && (
        <Animated.View
          style={{
            opacity: subtitleOpacity,
            transform: [{ translateX: subtitleTranslateX }],
          }}
        >
          <Text style={[styles.subtitle, subtitleStyle]}>{subtitle}</Text>
        </Animated.View>
      )}
      <Animated.View
        style={{
          opacity: titleOpacity,
          transform: [{ translateX: titleTranslateX }],
        }}
      >
        <Text style={[styles.title, titleStyle]}>{title}</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 20,
    zIndex: 5,
    backgroundColor: 'transparent',
  },
  subtitle: {
    fontSize: 20,
    color: '#999',
    fontFamily: FONTS.anton,
    textTransform: 'lowercase',
    marginBottom: 8,
  },
  title: {
    fontSize: 42,
    color: '#333',
    fontFamily: FONTS.anton,
    textTransform: 'lowercase',
    fontWeight: 'bold',
    lineHeight: 50,
  },
});
