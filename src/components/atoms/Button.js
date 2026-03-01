import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { FONTS } from '../../utils';

/**
 * Button - A reusable button component with multiple variants
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
}) => {
  const getButtonStyle = () => {
    const baseStyle = [styles.button];
    if (fullWidth) baseStyle.push(styles.fullWidth);
    if (variant === 'outline') {
      baseStyle.push(styles.outline);
      if (selected) baseStyle.push(styles.outlineSelected);
    } else if (variant === 'ghost') {
      baseStyle.push(styles.ghost);
      if (selected) baseStyle.push(styles.ghostSelected);
    } else {
      baseStyle.push(styles.default);
      if (selected) baseStyle.push(styles.defaultSelected);
    }
    if (disabled) baseStyle.push(styles.disabled);
    return baseStyle;
  };

  const getTextStyle = () => {
    const baseTextStyle = [styles.text];
    if (variant === 'outline') {
      baseTextStyle.push(selected ? styles.outlineSelectedText : styles.outlineText);
    } else if (variant === 'ghost') {
      baseTextStyle.push(selected ? styles.ghostSelectedText : styles.ghostText);
    } else {
      baseTextStyle.push(selected ? styles.defaultSelectedText : styles.defaultText);
    }
    if (disabled) baseTextStyle.push(styles.disabledText);
    return baseTextStyle;
  };

  return (
    <TouchableOpacity
      style={[...getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={[...getTextStyle(), textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  fullWidth: { width: '100%' },
  default: { backgroundColor: '#F0F3F7' },
  defaultSelected: { backgroundColor: '#01C459' },
  defaultText: { color: '#000000', fontWeight: 'bold', fontFamily: FONTS.anton },
  defaultSelectedText: { color: '#FFFFFF', fontWeight: 'bold', fontFamily: FONTS.anton },
  outline: { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#01C459' },
  outlineSelected: { backgroundColor: '#01C459', borderColor: '#01C459' },
  outlineText: { color: '#01C459', fontWeight: 'bold', fontFamily: FONTS.anton },
  outlineSelectedText: { color: '#FFFFFF', fontWeight: 'bold', fontFamily: FONTS.anton },
  ghost: { backgroundColor: 'transparent', borderWidth: 0 },
  ghostSelected: { backgroundColor: '#01C459' },
  ghostText: { color: '#01C459', fontWeight: 'bold', fontFamily: FONTS.anton },
  ghostSelectedText: { color: '#FFFFFF', fontWeight: 'bold', fontFamily: FONTS.anton },
  text: { fontSize: 16, fontWeight: 'bold', fontFamily: FONTS.anton },
  disabled: { opacity: 0.5 },
  disabledText: { opacity: 0.5 },
});
