import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, SafeAreaView, Text, TouchableOpacity, ScrollView, TextInput, Switch, Platform, Animated, ActivityIndicator, Alert } from 'react-native';
import { ChevronLeft, ChevronRight, Home, Briefcase, TreePine, Dumbbell, Coffee, MapPin, Check } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../config/colors';
import { FONTS } from '../../config/fonts';
import { createHabit, updateHabit, getHabitById } from '../../services/habitService';

export default function AddHabitScreen({ route, navigation }) {
  // Get habit data from route params if editing
  const editingHabit = route?.params?.habit;
  const isEditing = route?.params?.isEditing || false;

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // Step 1 states
  const [selectedHabit, setSelectedHabit] = useState(null);
  const PREFIX = 'I want to ';
  const [habitInput, setHabitInput] = useState(
    editingHabit?.title 
      ? (editingHabit.title.startsWith(PREFIX) ? editingHabit.title : `${PREFIX}${editingHabit.title}`)
      : PREFIX
  );

  // Step 2 states
  const [frequency, setFrequency] = useState(editingHabit?.frequency || 'daily');
  const [remindersEnabled, setRemindersEnabled] = useState(editingHabit?.remindersEnabled !== undefined ? editingHabit.remindersEnabled : true);
  const initialTime = editingHabit?.reminderTime ? new Date(editingHabit.reminderTime) : new Date();
  if (!editingHabit?.reminderTime) {
    initialTime.setHours(8, 30, 0, 0);
  }
  const [selectedTime, setSelectedTime] = useState(initialTime);
  const [selectedDays, setSelectedDays] = useState(editingHabit?.selectedDays || []);

  // Step 3 states
  const [selectedEnvironment, setSelectedEnvironment] = useState(editingHabit?.environment || 'home');

  // Loading and error states
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Animation values for step transitions
  const step1Anim = useRef(new Animated.Value(0)).current;
  const step2Anim = useRef(new Animated.Value(0)).current;
  const step3Anim = useRef(new Animated.Value(0)).current;

  const quickSuggestions = ['Drink water', 'Read', 'Meditation', 'Walk outside'];

  const daysOfWeek = [
    { label: 'Monday', value: 1 },
    { label: 'Tuesday', value: 2 },
    { label: 'Wednesday', value: 3 },
    { label: 'Thursday', value: 4 },
    { label: 'Friday', value: 5 },
    { label: 'Saturday', value: 6 },
    { label: 'Sunday', value: 0 },
  ];

  const environments = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'work', label: 'Work', icon: Briefcase },
    { id: 'outdoors', label: 'Outdoors', icon: TreePine },
    { id: 'gym', label: 'Gym', icon: Dumbbell },
    { id: 'cafe', label: 'Cafe', icon: Coffee },
    { id: 'anywhere', label: 'Anywhere', icon: MapPin },
  ];

  // Initialize steps 2 and 3 off-screen to the right
  useEffect(() => {
    step2Anim.setValue(400); // Start step 2 off-screen
    step3Anim.setValue(400); // Start step 3 off-screen
  }, []);

  // Initialize form with habit data when editing
  useEffect(() => {
    const loadHabitData = async () => {
      if (isEditing && editingHabit) {
        let habitToUse = editingHabit;
        
        // If only ID is provided, fetch the full habit data
        if (editingHabit.id && !editingHabit.title && !editingHabit.habitName) {
          const { data, error } = await getHabitById(editingHabit.id);
          if (error) {
            console.error('Error loading habit:', error);
            Alert.alert('Error', 'Failed to load habit data');
            return;
          }
          if (data) {
            habitToUse = data;
          }
        }
        
        // Map habit fields to form fields
        if (habitToUse.title) {
          const title = habitToUse.title.startsWith(PREFIX) 
            ? habitToUse.title 
            : `${PREFIX}${habitToUse.title}`;
          setHabitInput(title);
        } else if (habitToUse.habitName) {
          const habitName = habitToUse.habitName.startsWith(PREFIX)
            ? habitToUse.habitName
            : `${PREFIX}${habitToUse.habitName}`;
          setHabitInput(habitName);
        }
        
        if (habitToUse.frequency) {
          setFrequency(habitToUse.frequency);
        }
        
        if (habitToUse.environment) {
          setSelectedEnvironment(habitToUse.environment);
        }
        
        if (habitToUse.selectedDays) {
          setSelectedDays(habitToUse.selectedDays);
        }
        
        if (habitToUse.reminders !== undefined) {
          setRemindersEnabled(habitToUse.reminders);
        } else if (habitToUse.remindersEnabled !== undefined) {
          setRemindersEnabled(habitToUse.remindersEnabled);
        }
        
        if (habitToUse.reminderTime) {
          setSelectedTime(new Date(habitToUse.reminderTime));
        }
      }
    };
    
    loadHabitData();
  }, [editingHabit, isEditing]);

  // Animate step transitions
  useEffect(() => {
    const screenWidth = 400; // Approximate screen width for slide distance

    if (currentStep === 1) {
      // Step 1: Slide in from right (0), others exit to right
      Animated.parallel([
        Animated.timing(step1Anim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(step2Anim, {
          toValue: screenWidth,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(step3Anim, {
          toValue: screenWidth,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (currentStep === 2) {
      // Step 2: Slide in from right (0), Step 1 exits to left, Step 3 stays off-screen
      Animated.parallel([
        Animated.timing(step1Anim, {
          toValue: -screenWidth,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(step2Anim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(step3Anim, {
          toValue: screenWidth,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (currentStep === 3) {
      // Step 3: Slide in from right (0), Step 2 exits to left
      Animated.parallel([
        Animated.timing(step2Anim, {
          toValue: -screenWidth,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(step3Anim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [currentStep]);

  const handleHabitSelect = (habit) => {
    setSelectedHabit(habit);
    setHabitInput(`${PREFIX}${habit.toLowerCase()}`);
  };

  const handleInputChange = (text) => {
    // Ensure the prefix is always present
    if (!text.startsWith(PREFIX)) {
      // If user tries to delete the prefix, keep it
      if (text.length < PREFIX.length) {
        setHabitInput(PREFIX);
      } else {
        // If text doesn't start with prefix, add it
        setHabitInput(PREFIX + text.replace(PREFIX, ''));
      }
    } else {
      setHabitInput(text);
    }
  };

  const handleNextStep1 = () => {
    // Check if there's content after the prefix
    const habitText = habitInput.replace(PREFIX, '').trim();
    if (habitText) {
      setCurrentStep(2);
    }
  };

  const handleNextStep2 = () => {
    setCurrentStep(3);
  };

  const handleNextStep3 = async () => {
    if (isSaving) return; // Prevent multiple submissions
    
    setIsSaving(true);
    setSaveError(null);
    
    try {
      // Trigger haptics feedback for successful completion
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Prepare habit data
      const habitData = {
        habitName: habitInput.replace(PREFIX, '').trim(), // Remove prefix when saving
        frequency,
        remindersEnabled: remindersEnabled,
        reminderTime: selectedTime,
        selectedDays: frequency === 'weekly' ? selectedDays : [],
        environment: selectedEnvironment,
      };

      let savedHabit;
      
      if (isEditing && editingHabit?.id) {
        // Update existing habit
        const { data, error } = await updateHabit(editingHabit.id, habitData);
        
        if (error) {
          throw error;
        }
        
        savedHabit = data;
      } else {
        // Create new habit
        const { data, error } = await createHabit(habitData);
        
        if (error) {
          throw error;
        }
        
        savedHabit = data;
      }

      setIsSaving(false);
      
      // Navigate to HabitCreatedScreen with saved habit data
      navigation.navigate('HabitCreated', { 
        habitData: {
          ...habitData,
          id: savedHabit?.id,
        },
        savedHabit: savedHabit,
      });
    } catch (error) {
      console.error('Error saving habit:', error);
      setIsSaving(false);
      setSaveError(error.message || 'Failed to save habit. Please try again.');
      
      Alert.alert(
        'Error',
        error.message || 'Failed to save habit. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleBack = () => {
    if (currentStep === 1) {
      navigation.goBack();
    } else {
      setCurrentStep(currentStep - 1);
    }
  };

  const toggleDay = (dayValue) => {
    setSelectedDays(prev => {
      if (prev.includes(dayValue)) {
        return prev.filter(d => d !== dayValue);
      } else {
        return [...prev, dayValue].sort((a, b) => {
          const order = [1, 2, 3, 4, 5, 6, 0];
          return order.indexOf(a) - order.indexOf(b);
        });
      }
    });
  };

  const onTimeChange = (event, date) => {
    if (date) {
      setSelectedTime(date);
    }
  };

  const renderProgressDots = () => {
    return (
      <View style={styles.progressDots}>
        {[1, 2, 3].map((step) => (
          <View
            key={step}
            style={[
              styles.dot,
              step === currentStep ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <View style={styles.backButtonCircle}>
              <ChevronLeft size={20} color="#000" strokeWidth={2} />
            </View>
          </TouchableOpacity>
          {renderProgressDots()}
        </View>

        {/* Steps Container - Relative positioning for absolute children */}
        <View style={styles.stepsWrapper}>
          {/* Step 1: Add Habit */}
          <Animated.View
            style={[
              styles.stepContainer,
              {
                transform: [{ translateX: step1Anim }],
              },
            ]}
            pointerEvents={currentStep === 1 ? 'auto' : 'none'}
          >
          <ScrollView 
            contentContainerStyle={styles.stepScrollContent}
            showsVerticalScrollIndicator={false}
          >
          <View style={styles.mainContent}>
            <TextInput
              style={styles.habitInput}
              placeholder="I want to..."
              placeholderTextColor="#999"
              value={habitInput}
              onChangeText={handleInputChange}
              autoFocus={false}
            />
            <Text style={styles.suggestionsLabel}>QUICK SUGGESTIONS</Text>
            
            <View style={styles.suggestionsGrid}>
              {quickSuggestions.map((habit, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.suggestionButton,
                    selectedHabit === habit && styles.suggestionButtonSelected
                  ]}
                  onPress={() => handleHabitSelect(habit)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.suggestionButtonText,
                    selectedHabit === habit && styles.suggestionButtonTextSelected
                  ]}>
                    {habit}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          </ScrollView>
          </Animated.View>

          {/* Step 2: How Often */}
          <Animated.View
            style={[
              styles.stepContainer,
              styles.stepContainerAbsolute,
              {
                transform: [{ translateX: step2Anim }],
              },
            ]}
            pointerEvents={currentStep === 2 ? 'auto' : 'none'}
          >
          <ScrollView 
            contentContainerStyle={styles.stepScrollContent}
            showsVerticalScrollIndicator={false}
          >
          <View style={styles.mainContent}>
            <Text style={styles.title}>How often?</Text>
            
            <View style={styles.frequencyContainer}>
              <TouchableOpacity
                style={[
                  styles.frequencyButton,
                  frequency === 'daily' && styles.frequencyButtonActive
                ]}
                onPress={() => setFrequency('daily')}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.frequencyButtonText,
                  frequency === 'daily' && styles.frequencyButtonTextActive
                ]}>
                  Daily
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.frequencyButton,
                  frequency === 'weekly' && styles.frequencyButtonActive
                ]}
                onPress={() => setFrequency('weekly')}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.frequencyButtonText,
                  frequency === 'weekly' && styles.frequencyButtonTextActive
                ]}>
                  Weekly
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              <View style={styles.cardContent}>
                <View style={styles.cardTextContainer}>
                  <Text style={styles.cardTitle}>Reminders</Text>
                  <Text style={styles.cardDescription}>Get notified to complete your habit</Text>
                </View>
                <View style={styles.toggleContainer}>
                  <Switch
                    value={remindersEnabled}
                    onValueChange={setRemindersEnabled}
                    trackColor={{ false: '#D1D5DB', true: COLORS.primary }}
                    thumbColor={COLORS.white}
                    ios_backgroundColor="#D1D5DB"
                  />
                </View>
              </View>
            </View>

            {frequency === 'weekly' && (
              <View style={styles.card}>
                <View style={styles.daysContainer}>
                  {daysOfWeek.map((day) => {
                    const isSelected = selectedDays.includes(day.value);
                    return (
                      <TouchableOpacity
                        key={day.value}
                        style={[
                          styles.dayButton,
                          isSelected && styles.dayButtonSelected
                        ]}
                        onPress={() => toggleDay(day.value)}
                        activeOpacity={0.7}
                      >
                        <Text style={[
                          styles.dayButtonText,
                          isSelected && styles.dayButtonTextSelected
                        ]}>
                          {day.label.charAt(0).toLowerCase()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            <View style={styles.card}>
              <Text style={styles.cardSectionTitle}>SET TIME</Text>
              <View style={styles.timePickerWrapper}>
                {Platform.OS === 'ios' ? (
                  <DateTimePicker
                    value={selectedTime}
                    mode="time"
                    is24Hour={false}
                    display="spinner"
                    onChange={onTimeChange}
                    style={styles.timePicker}
                    textColor={COLORS.textDark}
                    themeVariant="light"
                  />
                ) : (
                  <DateTimePicker
                    value={selectedTime}
                    mode="time"
                    is24Hour={false}
                    display="default"
                    onChange={onTimeChange}
                  />
                )}
              </View>
            </View>
          </View>
          </ScrollView>
          </Animated.View>

          {/* Step 3: Where */}
          <Animated.View
            style={[
              styles.stepContainer,
              styles.stepContainerAbsolute,
              {
                transform: [{ translateX: step3Anim }],
              },
            ]}
            pointerEvents={currentStep === 3 ? 'auto' : 'none'}
          >
          <ScrollView 
            contentContainerStyle={styles.step3ScrollContent}
            showsVerticalScrollIndicator={false}
          >
          <View style={styles.step3Content}>
            <Text style={styles.title}>Where?</Text>
            <Text style={styles.subtitle}>Choose your habit environment</Text>
            
            <View style={styles.environmentsGrid}>
              {environments.map((env) => {
                const IconComponent = env.icon;
                const isSelected = selectedEnvironment === env.id;
                return (
                  <TouchableOpacity
                    key={env.id}
                    style={[
                      styles.environmentCard,
                      isSelected && styles.environmentCardSelected
                    ]}
                    onPress={() => setSelectedEnvironment(env.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.environmentIconContainer}>
                      <IconComponent 
                        size={24} 
                        color={isSelected ? COLORS.primary : COLORS.textGrey}
                        strokeWidth={2}
                      />
                    </View>
                    <Text style={[
                      styles.environmentLabel,
                      isSelected && styles.environmentLabelSelected
                    ]}>
                      {env.label}
                    </Text>
                    <View style={[
                      styles.selectionIndicator,
                      isSelected && styles.selectionIndicatorSelected
                    ]}>
                      {isSelected && (
                        <Check size={12} color={COLORS.white} strokeWidth={3} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          </ScrollView>
          </Animated.View>
        </View>

        {/* Next Button - Fixed at bottom, outside sliding content */}
        <TouchableOpacity
          style={[
            styles.nextButton,
            (currentStep === 1 ? (habitInput.replace(PREFIX, '').trim() && styles.nextButtonActive) : styles.nextButtonActive),
            isSaving && styles.nextButtonDisabled
          ]}
          onPress={
            currentStep === 1 ? handleNextStep1 : 
            currentStep === 2 ? handleNextStep2 : 
            handleNextStep3
          }
          activeOpacity={0.7}
          disabled={(currentStep === 1 && !habitInput.replace(PREFIX, '').trim()) || isSaving}
        >
          {isSaving && currentStep === 3 ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <Text style={[
                styles.nextButtonText,
                (currentStep !== 1 || habitInput.replace(PREFIX, '').trim()) && styles.nextButtonTextActive
              ]}>
                {currentStep === 3 ? (isEditing ? 'Save' : 'Next') : 'Next'}
              </Text>
              <ChevronRight 
                size={20} 
                color={(currentStep !== 1 || habitInput.replace(PREFIX, '').trim()) ? COLORS.primary : '#999'} 
                strokeWidth={2}
              />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.homeBackground,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  stepsWrapper: {
    flex: 1,
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 32,
  },
  backButton: {
    zIndex: 1,
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    position: 'absolute',
    left: 0,
    right: 0,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: COLORS.primary,
  },
  dotInactive: {
    backgroundColor: '#D1D5DB',
  },
  stepContainer: {
    width: '100%',
    flex: 1,
  },
  stepContainerAbsolute: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  stepScrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    minHeight: 400,
  },
  step3ScrollContent: {
    paddingBottom: 20,
  },
  step3Content: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 0,
  },
  // Step 1 Styles
  habitInput: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    fontFamily: FONTS.anton,
    textTransform: 'lowercase',
    marginBottom: 32,
    textAlign: 'center',
    width: '100%',
    paddingVertical: 8,
  },
  suggestionsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    fontFamily: FONTS.anton,
    letterSpacing: 1,
    marginBottom: 24,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    gap: 8,
  },
  suggestionButton: {
    backgroundColor: COLORS.white,
    borderRadius: 50,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignSelf: 'flex-start',
  },
  suggestionButtonSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.homeBackground,
  },
  suggestionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    fontFamily: FONTS.anton,
  },
  suggestionButtonTextSelected: {
    color: COLORS.primary,
  },
  // Step 2 Styles
  title: {
    fontSize: 32,
    fontWeight: '600',
    color: COLORS.textDark,
    fontFamily: FONTS.anton,
    textAlign: 'center',
    marginBottom: 32,
  },
  frequencyContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  frequencyButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 50,
    backgroundColor: '#E0E0E0',
  },
  frequencyButtonActive: {
    backgroundColor: COLORS.primary,
  },
  frequencyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textDark,
    fontFamily: FONTS.anton,
  },
  frequencyButtonTextActive: {
    color: COLORS.white,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textDark,
    fontFamily: FONTS.anton,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: COLORS.textGrey,
    fontFamily: FONTS.anton,
  },
  toggleContainer: {
    marginLeft: 16,
  },
  cardSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textGrey,
    fontFamily: FONTS.anton,
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 24,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 4,
  },
  dayButton: {
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 50,
    backgroundColor: '#F0F0F0',
    borderWidth: 1.5,
    borderColor: 'transparent',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  dayButtonSelected: {
    backgroundColor: COLORS.homeBackground,
    borderColor: COLORS.primary,
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textGrey,
    fontFamily: FONTS.anton,
  },
  dayButtonTextSelected: {
    color: COLORS.primary,
  },
  timePickerWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  timePicker: {
    width: '100%',
    height: 200,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: COLORS.textGrey,
    fontFamily: FONTS.anton,
    textAlign: 'center',
    marginBottom: 32,
    textTransform: 'lowercase',
  },
  environmentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  environmentCard: {
    width: '48%',
    aspectRatio: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    position: 'relative',
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  environmentCardSelected: {
    backgroundColor: COLORS.homeBackground,
    borderColor: COLORS.primary,
  },
  environmentIconContainer: {
    marginBottom: 8,
  },
  environmentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textGrey,
    fontFamily: FONTS.anton,
    textAlign: 'center',
  },
  environmentLabelSelected: {
    color: COLORS.primary,
  },
  selectionIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.textGrey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionIndicatorSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 50,
    backgroundColor: '#F0F0F0',
    marginTop: 20,
    gap: 8,
  },
  nextButtonActive: {
    backgroundColor: COLORS.primary,
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: FONTS.anton,
    color: '#999',
    textTransform: 'lowercase',
  },
  nextButtonTextActive: {
    color: COLORS.white,
  },
});
