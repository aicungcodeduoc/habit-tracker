import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { FONTS } from '../../utils';

/**
 * ViewAllButton - A reusable button component for "View All" actions
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onPress - Function to call when button is pressed
 * @param {string} props.label - Button text (default: "View All")
 * @param {Object} props.style - Additional styles for the button container
 * @param {Object} props.textStyle - Additional styles for the text
 * @param {string} props.variant - Button variant: 'primary' | 'secondary' (default: 'primary')
 * @returns {JSX.Element} ViewAllButton component
 */
export const ViewAllButton = ({
  onPress,
  label = 'View All',
  style,
  textStyle,
  variant = 'primary',
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === 'primary' ? styles.primary : styles.secondary,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.text,
          variant === 'primary' ? styles.primaryText : styles.secondaryText,
          textStyle,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: '#4A90E2',
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONTS.anton,
  },
  primaryText: {
    color: '#fff',
  },
  secondaryText: {
    color: '#4A90E2',
  },
});
