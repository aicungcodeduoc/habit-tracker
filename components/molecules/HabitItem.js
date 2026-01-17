import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Check } from 'lucide-react-native';
import { COLORS } from '../../config/colors';
import { FONTS } from '../../config/fonts';

/**
 * HabitItem - A component displaying a single habit item with completion state
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - The habit title/name
 * @param {string} props.subtitle - Optional subtitle (e.g., "target: 2l", "daily")
 * @param {boolean} props.completed - Whether the habit is completed (default: false)
 * @param {Function} props.onPress - Optional callback function when item is pressed
 * @param {Object} props.style - Additional styles for the container
 * @returns {JSX.Element} HabitItem component
 */
export const HabitItem = ({
  title,
  subtitle,
  completed = false,
  onPress,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={styles.content}>
        <Text style={[
          styles.title,
          completed && styles.titleCompleted
        ]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.subtitle}>
            {subtitle}
          </Text>
        )}
      </View>
      <View style={[
        styles.checkbox,
        completed && styles.checkboxCompleted
      ]}>
        {completed && (
          <Check size={16} color={COLORS.white} strokeWidth={3} />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginVertical: 4,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Shadow for Android
    elevation: 3,
  },
  content: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textDark,
    fontFamily: FONTS.anton,
    marginBottom: 2,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: COLORS.textGrey,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.textLight,
    fontFamily: FONTS.anton,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.textLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCompleted: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
});
