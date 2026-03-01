import React from 'react';
import { StyleSheet, Image } from 'react-native';

/**
 * OnboardingImage - A reusable component for onboarding step images
 * Matches the styling and positioning used in step 2
 * 
 * @param {Object} props - Component props
 * @param {any} props.source - Image source (require statement)
 * @param {Object} props.style - Additional styles for the image
 * @returns {JSX.Element} OnboardingImage component
 */
export const OnboardingImage = ({ source, style }) => {
  return (
    <Image
      source={source}
      style={[styles.image, style]}
      resizeMode="cover"
    />
  );
};

const styles = StyleSheet.create({
  image: {
    width: '120%',
    marginLeft: '-10%',
    height: '100%',
    resizeMode: 'cover',
  },
});
