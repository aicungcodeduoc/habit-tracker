import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { FONTS } from '../../config/fonts';

/**
 * Button - A reusable button component with multiple variants
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onPress - Function to call when button is pressed
 * @param {string} props.title - Button text
 * @param {string} props.variant - Button variant: 'default' | 'outline' | 'ghost' (default: 'default')
 * @param {boolean} props.selected - Whether the button is in selected state (default: false)
 * @param {boolean} props.disabled - Whether the button is disabled (default: false)
 * @param {Object} props.style - Additional styles for the button container
 * @param {Object} props.textStyle - Additional styles for the text
 * @param {boolean} props.fullWidth - Whether the button should take full width (default: true)
 * @param {React.ReactNode} props.icon - Icon to display
 * @param {string} props.iconPosition - Position of the icon: 'left' | 'right' (default: 'left')
 * @returns {JSX.Element} Button component
 */
export const Button = ({
  onPress,
  title,
  variant = 'default',
  selected = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = true,
  icon,
  iconPosition = 'left',
}) => {
  // Determine which styles to apply based on variant and state
  const getButtonStyle = () => {
    const baseStyle = [styles.button];
    
    // Apply full width if specified
    if (fullWidth) {
      baseStyle.push(styles.fullWidth);
    }
    
    // Apply variant styles
    if (variant === 'outline') {
      baseStyle.push(styles.outline);
      if (selected) {
        baseStyle.push(styles.outlineSelected);
      }
    } else if (variant === 'ghost') {
      baseStyle.push(styles.ghost);
      if (selected) {
        baseStyle.push(styles.ghostSelected);
      }
    } else {
      // default variant
      baseStyle.push(styles.default);
      if (selected) {
        baseStyle.push(styles.defaultSelected);
      }
    }
    
    // Apply disabled state
    if (disabled) {
      baseStyle.push(styles.disabled);
    }
    
    return baseStyle;
  };
  
  const getTextStyle = () => {
    const baseTextStyle = [styles.text];
    
    // Apply variant text styles
    if (variant === 'outline') {
      if (selected) {
        baseTextStyle.push(styles.outlineSelectedText);
      } else {
        baseTextStyle.push(styles.outlineText);
      }
    } else if (variant === 'ghost') {
      if (selected) {
        baseTextStyle.push(styles.ghostSelectedText);
      } else {
        baseTextStyle.push(styles.ghostText);
      }
    } else {
      // default variant
      if (selected) {
        baseTextStyle.push(styles.defaultSelectedText);
      } else {
        baseTextStyle.push(styles.defaultText);
      }
    }
    
    // Apply disabled text style
    if (disabled) {
      baseTextStyle.push(styles.disabledText);
    }
    
    return baseTextStyle;
  };
  
  return (
    <TouchableOpacity
      style={[...getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={[styles.contentContainer, iconPosition === 'right' && styles.contentContainerReverse]}>
        {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
        <Text style={[...getTextStyle(), textStyle]}>
          {title}
        </Text>
        {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 50, // Pill-like shape with very rounded corners
    minHeight: 48,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainerReverse: {
    flexDirection: 'row-reverse',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  fullWidth: {
    width: '100%',
  },
  // Default variant styles
  default: {
    backgroundColor: '#F0F3F7', // Light grey background for unselected
  },
  defaultSelected: {
    backgroundColor: '#01C459', // Primary color for selected state
  },
  defaultText: {
    color: '#000000', // Black text for unselected default
    fontWeight: 'bold',
    fontFamily: FONTS.anton,
  },
  defaultSelectedText: {
    color: '#FFFFFF', // White text for selected default
    fontWeight: 'bold',
    fontFamily: FONTS.anton,
  },
  // Outline variant styles
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#01C459', // Primary color border
  },
  outlineSelected: {
    backgroundColor: '#01C459', // Primary color background when selected
    borderColor: '#01C459',
  },
  outlineText: {
    color: '#01C459', // Primary color text
    fontWeight: 'bold',
    fontFamily: FONTS.anton,
  },
  outlineSelectedText: {
    color: '#FFFFFF', // White text when selected
    fontWeight: 'bold',
    fontFamily: FONTS.anton,
  },
  // Ghost variant styles
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  ghostSelected: {
    backgroundColor: '#01C459', // Primary color background when selected
  },
  ghostText: {
    color: '#01C459', // Primary color text
    fontWeight: 'bold',
    fontFamily: FONTS.anton,
  },
  ghostSelectedText: {
    color: '#FFFFFF', // White text when selected
    fontWeight: 'bold',
    fontFamily: FONTS.anton,
  },
  // Text styles
  text: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: FONTS.anton,
  },
  // Disabled styles
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.5,
  },
});
