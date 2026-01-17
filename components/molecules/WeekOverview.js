import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FONTS } from '../../config/fonts';
import { COLORS } from '../../config/colors';

// Habit completion states
const CompletedHabit = 'completed';
const NotCompleted = 'notCompleted';

/**
 * WeekOverview - A reusable component showing the current week's dates
 * Displays 7 days from Monday to Sunday with day numbers
 * 
 * @param {Object} props - Component props
 * @param {Object} props.style - Additional styles for the container
 * @returns {JSX.Element} WeekOverview component
 */
export const WeekOverview = ({ style }) => {
  // Mock data - get current week's dates (Monday to Sunday)
  const getCurrentWeekDates = () => {
    const today = new Date();
    const todayDate = today.getDate();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();
    
    const day = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    
    const monday = new Date(today);
    monday.setDate(diff);
    const weekDates = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const isToday = date.getDate() === todayDate && 
                      date.getMonth() === todayMonth && 
                      date.getFullYear() === todayYear;
      
      // Mock data - set completion state (for now, today is completed)
      const habitState = isToday ? CompletedHabit : NotCompleted;
      
      weekDates.push({
        dayLetter: ['m', 't', 'w', 't', 'f', 's', 's'][i],
        dayNumber: date.getDate(),
        isToday: isToday,
        habitState: habitState,
      });
    }
    
    return weekDates;
  };

  const weekDates = getCurrentWeekDates();

  return (
    <View style={[styles.container, style]}>
      {weekDates.map((day, index) => (
        <View 
          key={index} 
          style={styles.dayItem}
        >
          <Text style={[
            styles.dayLetter,
            day.isToday && styles.dayLetterToday
          ]}>
            {day.dayLetter}
          </Text>
          <View style={[
            styles.dayNumberContainer,
            day.isToday && styles.dayNumberContainerToday
          ]}>
            <Text style={[
              styles.dayNumber,
              day.isToday && styles.dayNumberToday
            ]}>
              {day.dayNumber}
            </Text>
          </View>
          <View style={[
            styles.indicatorDot,
            day.habitState === CompletedHabit && styles.indicatorDotCompleted
          ]} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    // paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  dayItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 4,
  },
  dayLetter: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    fontFamily: FONTS.anton,
    textTransform: 'lowercase',
    marginBottom: 6,
  },
  dayLetterToday: {
    color: COLORS.primary,
  },
  dayNumberContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumberContainerToday: {
    backgroundColor: COLORS.primary,
  },
  dayNumber: {
    fontSize: 16,
    // fontWeight: '400',
    color: '#333',
    fontFamily: FONTS.anton,
  },
  dayNumberToday: {
    color: COLORS.white,
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.habitNotCompleted,
    marginTop: 4,
  },
  indicatorDotCompleted: {
    backgroundColor: COLORS.habitCompleted,
  },
});
