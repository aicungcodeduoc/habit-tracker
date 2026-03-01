import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { ArrowLeft, Pen, MoreVertical, Flame, Camera, Image as ImageIcon, Trash2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../../config/colors';
import { FONTS } from '../../config/fonts';
import { deleteHabit, getHabitById } from '../../services/habitService';
import { getCompletion, createCompletion } from '../../services/completionService';

// Function to get emoji icon based on habit title
const getHabitEmoji = (title) => {
  const lowerTitle = title.toLowerCase();
  
  // Map keywords to emojis (7 different options)
  if (lowerTitle.includes('water') || lowerTitle.includes('drink')) {
    return '💧';
  } else if (lowerTitle.includes('read') || lowerTitle.includes('book')) {
    return '📚';
  } else if (lowerTitle.includes('exercise') || lowerTitle.includes('workout') || lowerTitle.includes('gym') || lowerTitle.includes('run')) {
    return '💪';
  } else if (lowerTitle.includes('meditate') || lowerTitle.includes('yoga') || lowerTitle.includes('mindfulness')) {
    return '🧘';
  } else if (lowerTitle.includes('sleep') || lowerTitle.includes('bed')) {
    return '😴';
  } else if (lowerTitle.includes('fruit') || lowerTitle.includes('vegetable') || lowerTitle.includes('eat') || lowerTitle.includes('food')) {
    return '🍎';
  } else if (lowerTitle.includes('write') || lowerTitle.includes('journal')) {
    return '✍️';
  }
  
  // Default emoji if no match
  return '⭐';
};

export default function HabitDetailScreen({ route, navigation }) {
  // Get habit data from route params
  const routeHabit = route?.params?.habit;
  
  const [habit, setHabit] = useState(routeHabit || {
    title: 'drink water',
    target: 'target: 2l today',
    streak: 0,
    icon: 'water',
  });
  const [loading, setLoading] = useState(!!routeHabit?.id);
  const [isCompletedToday, setIsCompletedToday] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Fetch habit data from Supabase if ID is provided
  useEffect(() => {
    const loadHabitData = async () => {
      if (routeHabit?.id) {
        setLoading(true);
        try {
          // Fetch habit details
          const { data: habitData, error: habitError } = await getHabitById(routeHabit.id);
          
          if (habitError) {
            throw habitError;
          }
          
          if (habitData) {
            setHabit({
              id: habitData.id,
              title: habitData.title || habitData.habitName || 'Untitled Habit',
              target: habitData.target || `target: ${habitData.frequency || 'daily'}`,
              streak: habitData.streak || 0,
              icon: habitData.icon,
              frequency: habitData.frequency,
              environment: habitData.environment,
              remindersEnabled: habitData.remindersEnabled,
              reminderTime: habitData.reminderTime,
              selectedDays: habitData.selectedDays,
            });
            
            // Check if habit is completed for today
            const { data: completion } = await getCompletion(habitData.id, new Date());
            setIsCompletedToday(!!completion);
          }
        } catch (error) {
          console.error('Error loading habit:', error);
          Alert.alert('Error', 'Failed to load habit data');
        } finally {
          setLoading(false);
        }
      } else {
        // If no ID, check completion status for route habit
        if (routeHabit?.id) {
          const { data: completion } = await getCompletion(routeHabit.id, new Date());
          setIsCompletedToday(!!completion);
        }
      }
    };
    
    loadHabitData();
  }, [routeHabit?.id]);

  const habitEmoji = getHabitEmoji(habit.title);

  const handleDelete = () => {
    if (!habit.id) {
      Alert.alert('Error', 'Cannot delete habit: missing habit ID');
      return;
    }

    Alert.alert(
      'Delete Habit',
      `Are you sure you want to delete "${habit.title || habit.habitName}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setShowMenu(false),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await deleteHabit(habit.id);
              
              if (error) {
                throw error;
              }
              
              // Navigate back and refresh
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting habit:', error);
              Alert.alert(
                'Error',
                error.message || 'Failed to delete habit. Please try again.'
              );
            } finally {
              setShowMenu(false);
            }
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    setShowMenu(false);
    navigation.navigate('AddHabit', { 
      habit: {
        id: habit.id,
        title: habit.title || habit.habitName,
        habitName: habit.title || habit.habitName,
        frequency: habit.frequency || 'daily',
        remindersEnabled: habit.remindersEnabled !== undefined ? habit.remindersEnabled : true,
        reminderTime: habit.reminderTime || new Date(),
        selectedDays: habit.selectedDays || [],
        environment: habit.environment || 'anywhere',
        target: habit.target,
        streak: habit.streak,
      },
      isEditing: true 
    });
  };

  const handleSkipToday = async () => {
    if (!habit.id) {
      Alert.alert('Error', 'Cannot skip: missing habit ID');
      return;
    }

    Alert.alert(
      'Skip for Today',
      `Skip "${habit.title}" for today? This will break your streak.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Skip',
          style: 'destructive',
          onPress: async () => {
            // Do NOT create a completion record
            // Just navigate back - the streak will break automatically
            // when the database trigger checks for consecutive days
            navigation.goBack();
          },
        },
      ]
    );
  };

  // Request permissions and open camera
  const handleOpenCamera = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Sorry, we need camera permissions to take photos!',
          [{ text: 'OK' }]
        );
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        // Navigate to AIProcessScreen to perform analysis
        navigation.navigate('AIProcess', {
          imageUri: imageUri,
          habit: habit,
        });
      }
    } catch (error) {
      console.error('Error opening camera:', error);
      Alert.alert('Error', 'Failed to open camera. Please try again.');
    }
  };

  // Request permissions and open image library
  const handleOpenLibrary = async () => {
    try {
      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Sorry, we need photo library permissions to select images!',
          [{ text: 'OK' }]
        );
        return;
      }

      // Launch image library
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        // Navigate to AIProcessScreen to perform analysis
        navigation.navigate('AIProcess', {
          imageUri: imageUri,
          habit: habit,
        });
      }
    } catch (error) {
      console.error('Error opening image library:', error);
      Alert.alert('Error', 'Failed to open image library. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading habit...</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => {
              // Navigate to Home screen (Main tab navigator with Home tab)
              navigation.reset({
                index: 0,
                routes: [{ name: 'Main' }],
              });
            }}
          >
            <ArrowLeft size={20} color={COLORS.textGrey} />
          </TouchableOpacity>
          
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={handleEdit}
            >
              <Pen size={20} color={COLORS.textGrey} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => setShowMenu(!showMenu)}
            >
              <MoreVertical size={20} color={COLORS.textGrey} />
            </TouchableOpacity>
          </View>
          
          {/* Menu dropdown */}
          {showMenu && (
            <View style={styles.menuContainer}>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={handleDelete}
              >
                <Trash2 size={18} color="#FF6B6B" />
                <Text style={styles.menuItemTextDelete}>Delete Habit</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Habit Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Text style={styles.emojiIcon}>{habitEmoji}</Text>
          </View>
        </View>

        {/* Habit Title */}
        <Text style={styles.habitTitle}>{habit.title || habit.habitName || 'Untitled Habit'}</Text>
        
        {/* Target */}
        <Text style={styles.target}>{habit.target || `target: ${habit.frequency || 'daily'}`}</Text>

        {/* Streak Card */}
        <View style={styles.streakCard}>
          <Flame size={36} color="#FF6B35" />
          <View style={styles.streakContent}>
            <Text style={styles.streakText}>{habit.streak} day streak</Text>
            <Text style={styles.streakSubtext}>Small wins add up.</Text>
          </View>
        </View>

        {/* Progress Section */}
        <Text style={styles.progressHeading}>show your progress</Text>
        
        <View style={styles.progressButtons}>
          <TouchableOpacity style={styles.progressButton} onPress={handleOpenCamera}>
            <View style={styles.progressIconContainer}>
              <Camera size={32} color={COLORS.textDark} />
            </View>
            <Text style={styles.progressButtonText}>open camera</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.progressButton} onPress={handleOpenLibrary}>
            <View style={styles.progressIconContainer}>
              <ImageIcon size={32} color={COLORS.textDark} />
            </View>
            <Text style={styles.progressButtonText}>from library</Text>
          </TouchableOpacity>
        </View>

        {/* Skip Button */}
        <TouchableOpacity style={styles.skipButton} onPress={handleSkipToday}>
          <Text style={styles.skipText}>skip for today</Text>
        </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerButton: {
    padding: 8,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiIcon: {
    fontSize: 48,
  },
  habitTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: COLORS.textDark,
    fontFamily: FONTS.anton,
    textAlign: 'center',
    marginBottom: 8,
  },
  target: {
    fontSize: 16,
    fontWeight: '400',
    color: COLORS.textLight,
    fontFamily: FONTS.anton,
    textAlign: 'center',
    marginBottom: 32,
  },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECF7F0',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginBottom: 40,
    // Shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  streakContent: {
    marginLeft: 12,
    alignItems: 'center',
  },
  streakText: {
    fontSize: 33,
    fontWeight: '600',
    color: COLORS.textDark,
    fontFamily: FONTS.anton,
    marginBottom: 4,
  },
  streakSubtext: {
    fontSize: 24,
    fontWeight: '400',
    color: COLORS.textLight,
    fontFamily: FONTS.anton,
  },
  progressHeading: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textDark,
    fontFamily: FONTS.anton,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  progressButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  progressButton: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: '#F6F8F6',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    // Shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textDark,
    fontFamily: FONTS.anton,
    marginTop: 12,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.textLight,
    fontFamily: FONTS.anton,
  },
  menuContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
    minWidth: 160,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuItemTextDelete: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B6B',
    fontFamily: FONTS.anton,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textGrey,
    fontFamily: FONTS.anton,
  },
});
