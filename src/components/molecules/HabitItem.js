import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Check } from 'lucide-react-native';
import { COLORS, FONTS } from '../../utils';
import { toggleCompletion } from '../../api';

/**
 * HabitItem - A component displaying a single habit item with completion state
 * 
 * @param {Object} props - Component props
 * @param {string} props.habitId - The habit ID (required for toggle)
 * @param {string} props.title - The habit title/name
 * @param {string} props.subtitle - Optional subtitle (e.g., "target: 2l", "daily")
 * @param {boolean} props.completed - Whether the habit is completed (default: false)
 * @param {Function} props.onPress - Optional callback function when item is pressed
 * @param {Function} props.onToggle - Optional callback function when completion is toggled
 * @param {Object} props.style - Additional styles for the container
 * @returns {JSX.Element} HabitItem component
 */
export const HabitItem = ({
  habitId,
  title,
  subtitle,
  completed = false,
  completionDate = null,
  readOnly = false,
  onToggleBlocked,
  onPress,
  onToggle,
  style,
}) => {
  const [isToggling, setIsToggling] = useState(false);
  const [localCompleted, setLocalCompleted] = useState(completed);
  
  // Animation values
  const checkboxScale = useRef(new Animated.Value(completed ? 1 : 0)).current;
  const checkmarkOpacity = useRef(new Animated.Value(completed ? 1 : 0)).current;
  const checkmarkScale = useRef(new Animated.Value(completed ? 1 : 0)).current;
  const titleOpacity = useRef(new Animated.Value(completed ? 0.6 : 1)).current;

  // Initialize animation values on mount
  useEffect(() => {
    if (completed) {
      checkboxScale.setValue(1);
      checkmarkOpacity.setValue(1);
      checkmarkScale.setValue(1);
      titleOpacity.setValue(0.6);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- init anim values once on mount
  }, []);

  // Update local state when prop changes
  useEffect(() => {
    if (completed !== localCompleted) {
      // Add small delay before animating to completed state
      const timeout = setTimeout(() => {
        animateToCompleted(completed);
        setLocalCompleted(completed);
      }, 300); // 300ms delay
      
      return () => clearTimeout(timeout);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to completed; animateToCompleted stable
  }, [completed]);

  const animateToCompleted = (isCompleted) => {
    if (isCompleted) {
      // Animate to completed state
      Animated.parallel([
        // Checkbox fills in
        Animated.spring(checkboxScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: false, // Need false for backgroundColor
        }),
        // Checkmark appears with scale animation
        Animated.sequence([
          Animated.delay(150), // Small delay before checkmark appears
          Animated.parallel([
            Animated.spring(checkmarkScale, {
              toValue: 1,
              tension: 100,
              friction: 5,
              useNativeDriver: true,
            }),
            Animated.timing(checkmarkOpacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]),
        ]),
        // Title fades slightly
        Animated.timing(titleOpacity, {
          toValue: 0.6,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate to uncompleted state
      Animated.parallel([
        Animated.timing(checkboxScale, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(checkmarkOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(checkmarkScale, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const handleCheckboxPress = async (e) => {
    // Prevent triggering onPress when clicking checkbox
    e.stopPropagation();
    
    if (readOnly) {
      if (onToggleBlocked) onToggleBlocked();
      return;
    }

    if (!habitId || isToggling) return;

    setIsToggling(true);
    
    // Optimistically update UI with animation
    const newCompletedState = !localCompleted;
    animateToCompleted(newCompletedState);
    setLocalCompleted(newCompletedState);

    try {
      const { error, wasCompleted } = await toggleCompletion(habitId, completionDate);
      
      if (error) {
        // Revert on error
        animateToCompleted(!newCompletedState);
        setLocalCompleted(!newCompletedState);
        console.error('Error toggling completion:', error);
      } else {
        // Call onToggle callback if provided, passing the new completion state
        if (onToggle) {
          onToggle(wasCompleted);
        }
      }
    } catch (error) {
      // Revert on error
      animateToCompleted(!newCompletedState);
      setLocalCompleted(!newCompletedState);
      console.error('Error toggling completion:', error);
    } finally {
      setIsToggling(false);
    }
  };

  // Interpolate checkbox background color
  const checkboxBgColor = checkboxScale.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', COLORS.primary],
  });

  const checkboxBorderColor = checkboxScale.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.textLight, COLORS.primary],
  });

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={styles.content}>
        <Animated.Text 
          style={[
            styles.title,
            localCompleted && styles.titleCompleted,
            { opacity: titleOpacity }
          ]}
        >
          {title}
        </Animated.Text>
        {subtitle && (
          <Text style={styles.subtitle}>
            {subtitle}
          </Text>
        )}
      </View>
      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={handleCheckboxPress}
        disabled={!habitId || isToggling}
        activeOpacity={0.7}
      >
        <Animated.View
          style={[
            styles.checkbox,
            {
              backgroundColor: checkboxBgColor,
              borderColor: checkboxBorderColor,
            }
          ]}
        >
          <Animated.View
            style={{
              opacity: checkmarkOpacity,
              transform: [{ scale: checkmarkScale }],
            }}
          >
            {localCompleted && (
              <Check size={16} color={COLORS.white} strokeWidth={3} />
            )}
          </Animated.View>
        </Animated.View>
      </TouchableOpacity>
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
  checkboxContainer: {
    // Container for the animated checkbox
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCompleted: {
    // This style is now handled by animation
  },
});
