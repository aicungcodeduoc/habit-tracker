import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { FONTS } from '../../config/fonts';

/**
 * HabitScreenHeader - Header component for the Habit Screen
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onTodayPress - Function to call when "Today" is pressed
 * @param {Function} props.onIconPress - Function to call when icon is pressed
 * @param {Function} props.onAvatarPress - Function to call when avatar is pressed
 * @param {string} props.iconNumber - Number to display in the icon (default: "1")
 * @param {string} props.avatarUri - URI for the avatar image (optional)
 * @returns {JSX.Element} HabitScreenHeader component
 */
export const HabitScreenHeader = ({
  onTodayPress,
  onIconPress,
  onAvatarPress,
  iconNumber = '1',
  avatarUri,
}) => {
  return (
    <View style={styles.header}>
      {/* Left Icon - Teardrop/Flame shape with number */}
      <TouchableOpacity
        style={styles.iconContainer}
        onPress={onIconPress}
        activeOpacity={0.7}
      >
        <View style={styles.iconShape}>
          <Text style={styles.iconNumber}>{iconNumber}</Text>
        </View>
      </TouchableOpacity>

      {/* Center - "Today" text with dropdown */}
      <TouchableOpacity
        style={styles.centerContainer}
        onPress={onTodayPress}
        activeOpacity={0.7}
      >
        <Text style={styles.todayText}>Today</Text>
        <Text style={styles.chevron}>▼</Text>
      </TouchableOpacity>

      {/* Right - User Avatar */}
      <TouchableOpacity
        style={styles.avatarContainer}
        onPress={onAvatarPress}
        activeOpacity={0.7}
      >
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarPlaceholderText}>U</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#007AFF', // Blue background
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 56, // Standard header height
  },
  iconContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconShape: {
    width: 32,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF', // Blue color to match header
    fontFamily: FONTS.anton,
  },
  centerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  todayText: {
    fontSize: 20,
    fontFamily: FONTS.anton,
    color: '#FFFFFF',
    marginRight: 4,
  },
  chevron: {
    fontSize: 12,
    color: '#FFFFFF',
    marginLeft: 4,
    fontWeight: 'normal',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666666',
    fontFamily: FONTS.anton,
  },
});
