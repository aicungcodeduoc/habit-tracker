import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { FONTS } from '../../config/fonts';

/**
 * DateHeader - A reusable header component for date navigation
 * 
 * @param {Object} props - Component props
 * @param {string} props.dateText - Text to display (default: "today")
 * @param {Object} props.style - Additional styles for the container
 * @returns {JSX.Element} DateHeader component
 */
export const DateHeader = ({ 
  dateText = 'today',
  style,
}) => {
  // Mock data - no functionality needed
  const displayText = dateText || 'today';

  return (
    <View style={[styles.container, style]}>
      <View style={styles.textContainer}>
        <Text style={styles.dateText}>{displayText}</Text>
        <TouchableOpacity 
          style={styles.iconContainer}
          activeOpacity={0.7}
        >
          <ChevronRight 
            size={20} 
            color="#333" 
            strokeWidth={2}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'transparent',
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    fontFamily: FONTS.anton,
    textTransform: 'lowercase',
  },
  iconContainer: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
});
