import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, Text, TouchableOpacity, ScrollView, Switch, Platform } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS } from '../../config/colors';
import { FONTS } from '../../config/fonts';

export default function HowOftenScreen({ navigation, route }) {
  const [frequency, setFrequency] = useState('daily');
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const initialTime = new Date();
  initialTime.setHours(8, 30, 0, 0);
  const [selectedTime, setSelectedTime] = useState(initialTime);
  
  // Days of week: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const [selectedDays, setSelectedDays] = useState([]);
  
  const daysOfWeek = [
    { label: 'Monday', value: 1 },
    { label: 'Tuesday', value: 2 },
    { label: 'Wednesday', value: 3 },
    { label: 'Thursday', value: 4 },
    { label: 'Friday', value: 5 },
    { label: 'Saturday', value: 6 },
    { label: 'Sunday', value: 0 },
  ];

  const toggleDay = (dayValue) => {
    setSelectedDays(prev => {
      if (prev.includes(dayValue)) {
        return prev.filter(d => d !== dayValue);
      } else {
        return [...prev, dayValue].sort((a, b) => {
          // Sort with Monday first
          const order = [1, 2, 3, 4, 5, 6, 0];
          return order.indexOf(a) - order.indexOf(b);
        });
      }
    });
  };

  const handleNext = () => {
    // TODO: Navigate to next step or save habit (habitData for next screen when wired)
    // const habitData = { ...route?.params, frequency, reminders: remindersEnabled, reminderTime: selectedTime, selectedDays: frequency === 'weekly' ? selectedDays : null };
    // navigation.navigate('NextStep', { habit: habitData });
  };

  const onTimeChange = (event, date) => {
    if (Platform.OS === 'android') {
      // Handle Android differently if needed
    }
    if (date) {
      setSelectedTime(date);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <View style={styles.backButtonCircle}>
              <ChevronLeft size={20} color="#000" strokeWidth={2} />
            </View>
          </TouchableOpacity>
          
          {/* Progress dots */}
          <View style={styles.progressDots}>
            <View style={[styles.dot, styles.dotInactive]} />
            <View style={[styles.dot, styles.dotActive]} />
            <View style={[styles.dot, styles.dotInactive]} />
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          <Text style={styles.title}>How often?</Text>
          
          {/* Frequency Selection */}
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

          {/* Reminders Card */}
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

          {/* Day Selection Card (only for Weekly) */}
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
                        {day.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Set Time Card */}
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

        {/* Next Button */}
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          activeOpacity={0.7}
        >
          <Text style={styles.nextButtonText}>Next</Text>
          <ChevronRight 
            size={20} 
            color={COLORS.white} 
            strokeWidth={2}
          />
        </TouchableOpacity>
      </ScrollView>
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
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexGrow: 1,
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
    backgroundColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
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
  mainContent: {
    flex: 1,
    paddingVertical: 20,
  },
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
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  dayButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 50,
    backgroundColor: '#F0F0F0',
    borderWidth: 1.5,
    borderColor: 'transparent',
    minWidth: 90,
    alignItems: 'center',
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
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    marginTop: 40,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: FONTS.anton,
    color: COLORS.white,
    textTransform: 'lowercase',
  },
});
