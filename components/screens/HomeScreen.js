import React, { useMemo } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Text } from 'react-native';
import { Plus } from 'lucide-react-native';
import { DateHeader, WeekOverview, HabitItem } from '../molecules';
import { COLORS } from '../../config/colors';
import { FONTS } from '../../config/fonts';

// Simple emoji mapping based on title keywords
const getEmoji = (title) => {
  const lower = title.toLowerCase();
  if (lower.includes('water') || lower.includes('drink')) return '💧';
  if (lower.includes('read') || lower.includes('book')) return '📖';
  if (lower.includes('exercise') || lower.includes('workout') || lower.includes('gym')) return '💪';
  if (lower.includes('meditate') || lower.includes('meditation')) return '🧘';
  if (lower.includes('sleep') || lower.includes('bed')) return '😴';
  if (lower.includes('code') || lower.includes('programming')) return '💻';
  if (lower.includes('walk') || lower.includes('run')) return '🚶';
  if (lower.includes('fruit') || lower.includes('vegetable') || lower.includes('eat')) return '🍎';
  if (lower.includes('journal') || lower.includes('write')) return '📝';
  if (lower.includes('stretch') || lower.includes('yoga')) return '🧘‍♀️';
  if (lower.includes('music') || lower.includes('piano') || lower.includes('guitar')) return '🎵';
  if (lower.includes('draw') || lower.includes('art')) return '🎨';
  if (lower.includes('call') || lower.includes('phone')) return '📞';
  if (lower.includes('gratitude') || lower.includes('thank')) return '🙏';
  return '✅';
};

// Mock habits data
const mockHabits = [
  { title: 'drink water', subtitle: 'target: 2l', completed: false },
  { title: 'read 1 page', subtitle: 'daily', completed: true },
  { title: 'exercise 30 min', subtitle: 'morning', completed: false },
  { title: 'meditate 10 min', subtitle: 'before bed', completed: true },
  { title: 'sleep 8 hours', subtitle: 'nightly', completed: false },
  { title: 'code 1 hour', subtitle: 'learning', completed: true },
  { title: 'walk 5000 steps', subtitle: 'daily', completed: false },
  { title: 'eat fruit', subtitle: 'once a day', completed: true },
  { title: 'write journal', subtitle: 'evening', completed: false },
  { title: 'stretch 15 min', subtitle: 'daily', completed: true },
];

export default function HomeScreen({ navigation }) {
  const habits = useMemo(() => mockHabits, []);

  const handleHabitPress = (habit) => {
    const parent = navigation.getParent();
    const nav = parent || navigation;
    nav.navigate('HabitDetail', {
      habit: {
        title: habit.title,
        target: habit.subtitle,
        streak: Math.floor(Math.random() * 10) + 1,
        icon: habit.title.split(' ')[0],
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <DateHeader />
        <WeekOverview />
        <View style={styles.habitsContainer}>
          {habits.map((habit, index) => (
            <HabitItem
              key={index}
              title={`${getEmoji(habit.title)} ${habit.title}`}
              subtitle={habit.subtitle}
              completed={habit.completed}
              onPress={() => handleHabitPress(habit)}
            />
          ))}
        </View>
        <TouchableOpacity 
          style={styles.addHabitButton}
          activeOpacity={0.7}
          onPress={() => {
            const parent = navigation.getParent();
            if (parent) {
              parent.navigate('AddHabit');
            } else {
              navigation.navigate('AddHabit');
            }
          }}
        >
          <Plus size={20} color="#666" strokeWidth={2} />
          <Text style={styles.addHabitText}>add new habit</Text>
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
    paddingBottom: 120,
  },
  habitsContainer: {
    marginTop: 20,
  },
  addHabitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 50,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    backgroundColor: 'transparent',
    marginTop: 20,
    gap: 8,
  },
  addHabitText: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: FONTS.anton,
    color: '#666',
    textTransform: 'lowercase',
  },
});
