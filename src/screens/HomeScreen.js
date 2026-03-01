import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Text, ActivityIndicator, Modal, Pressable, Animated } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Plus } from 'lucide-react-native';
import { DateHeader, WeekOverview, HabitItem } from '../components';
import { COLORS, FONTS } from '../utils';
import { getHabits, getCompletionsForDateRange } from '../api';

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

// Format date as YYYY-MM-DD in local timezone
const formatLocalDate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isPastDay = (date) => {
  const selected = formatLocalDate(date);
  const today = formatLocalDate(new Date());
  return selected < today;
};

// Determine if a habit should show for a given date (daily vs weekly)
const isHabitScheduledForDate = (habit, date = new Date()) => {
  const frequency = habit?.frequency || 'daily';

  if (frequency === 'daily') return true;

  if (frequency === 'weekly') {
    const selectedDays = Array.isArray(habit?.selectedDays) ? habit.selectedDays : [];

    // Backward compatibility / safety: if no days selected, don't hide the habit
    if (selectedDays.length === 0) return true;

    // JS: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const dayOfWeek = date.getDay();
    return selectedDays.includes(dayOfWeek);
  }

  // Unknown frequency: show by default
  return true;
};

// Get current week's range (Monday -> Sunday) for an anchor date
const getWeekRange = (anchor = new Date()) => {
  const base = anchor || new Date();
  const day = base.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const diffToMonday = base.getDate() - day + (day === 0 ? -6 : 1);

  const monday = new Date(base);
  monday.setDate(diffToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return { start: monday, end: sunday };
};

export default function HomeScreen({ navigation }) {
  const SHEET_HIDDEN_TRANSLATE_Y = 150;
  const [habits, setHabits] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [pastDaySheetVisible, setPastDaySheetVisible] = useState(false);
  const sheetTranslateY = useRef(new Animated.Value(SHEET_HIDDEN_TRANSLATE_Y)).current;

  // Load habits and completions
  const loadHabits = useCallback(async (date = new Date()) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch habits and week completions in parallel
      const targetDate = date || new Date();
      const { start: weekStart, end: weekEnd } = getWeekRange(targetDate);
      const [habitsResult, completionsResult] = await Promise.all([
        getHabits(),
        getCompletionsForDateRange(weekStart, weekEnd)
      ]);

      if (habitsResult.error) {
        throw habitsResult.error;
      }

      if (completionsResult.error) {
        console.warn('Error loading completions:', completionsResult.error);
        // Don't throw, just use empty completions
      }

      setHabits(habitsResult.data || []);
      setCompletions(completionsResult.data || []);
    } catch (err) {
      console.error('Error loading habits:', err);
      setError(err.message || 'Failed to load habits');
      setHabits([]);
      setCompletions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle completion toggle - update only the specific habit's completion state
  const handleCompletionToggle = useCallback((habitId, wasCompleted) => {
    const selectedDateString = formatLocalDate(selectedDate);
    setCompletions(prevCompletions => {
      if (wasCompleted) {
        // Add completion if it doesn't exist
        const exists = prevCompletions.some(
          c => c.habit_id === habitId && c.completion_date === selectedDateString
        );
        if (!exists) {
          return [...prevCompletions, { habit_id: habitId, completion_date: selectedDateString }];
        }
        return prevCompletions;
      } else {
        // Remove completion
        return prevCompletions.filter(
          c => !(c.habit_id === habitId && c.completion_date === selectedDateString)
        );
      }
    });
  }, [selectedDate]);

  // Load habits on mount and when selected date changes
  useEffect(() => {
    loadHabits(selectedDate);
  }, [loadHabits, selectedDate]);

  // Reload habits when screen comes into focus (important: habits reset daily)
  useFocusEffect(
    useCallback(() => {
      loadHabits(selectedDate);
    }, [loadHabits, selectedDate])
  );

  const handleHabitPress = (habit) => {
    const parent = navigation.getParent();
    const nav = parent || navigation;
    nav.navigate('HabitDetail', {
      habit: {
        id: habit.id,
        title: habit.title || habit.habitName,
        target: habit.target || `target: ${habit.frequency || 'daily'}`,
        streak: habit.streak || 0,
        icon: habit.icon,
        frequency: habit.frequency,
        environment: habit.environment,
        remindersEnabled: habit.remindersEnabled,
        reminderTime: habit.reminderTime,
        selectedDays: habit.selectedDays,
      }
    });
  };

  const selectedDateString = formatLocalDate(selectedDate);
  const habitsForSelectedDate = habits.filter(h => isHabitScheduledForDate(h, selectedDate));
  const completedDates = new Set((completions || []).map(c => c.completion_date).filter(Boolean));

  // Build completion ratios for each day in the visible week (Mon -> Sun)
  const { start: weekStart } = getWeekRange(selectedDate);
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    return date;
  });

  const completedHabitIdsByDate = new Map();
  for (const c of completions || []) {
    const dateKey = c?.completion_date;
    const habitId = c?.habit_id;
    if (!dateKey || !habitId) continue;
    if (!completedHabitIdsByDate.has(dateKey)) {
      completedHabitIdsByDate.set(dateKey, new Set());
    }
    completedHabitIdsByDate.get(dateKey).add(habitId);
  }

  const completionRatioByDateString = {};
  for (const dayDate of weekDates) {
    const dateKey = formatLocalDate(dayDate);
    const scheduledHabitsForDay = habits.filter(h => isHabitScheduledForDate(h, dayDate));
    const total = scheduledHabitsForDay.length;
    const completedSet = completedHabitIdsByDate.get(dateKey) || new Set();
    const completedCount = scheduledHabitsForDay.reduce((acc, h) => {
      return completedSet.has(h.id) ? acc + 1 : acc;
    }, 0);

    completionRatioByDateString[dateKey] = total > 0 ? completedCount / total : 0;
  }

  const isSameDay = (a, b) => formatLocalDate(a) === formatLocalDate(b);
  const getDateLabel = (date) => {
    if (isSameDay(date, new Date())) return 'today';
    try {
      return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).toLowerCase();
    } catch {
      return formatLocalDate(date);
    }
  };

  const openPastDaySheet = useCallback(() => {
    setPastDaySheetVisible(true);
    sheetTranslateY.setValue(SHEET_HIDDEN_TRANSLATE_Y);
    Animated.timing(sheetTranslateY, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [sheetTranslateY, SHEET_HIDDEN_TRANSLATE_Y]);

  const closePastDaySheet = useCallback(() => {
    Animated.timing(sheetTranslateY, {
      toValue: SHEET_HIDDEN_TRANSLATE_Y,
      duration: 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setPastDaySheetVisible(false);
    });
  }, [sheetTranslateY, SHEET_HIDDEN_TRANSLATE_Y]);

  const selectedDateIsPast = isPastDay(selectedDate);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <DateHeader dateText={getDateLabel(selectedDate)} />
        <WeekOverview
          selectedDate={selectedDate}
          completedDates={completedDates}
          completionRatioByDate={completionRatioByDateString}
          onSelectDate={(date) => setSelectedDate(date)}
        />

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading habits...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => loadHabits(selectedDate)}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.habitsContainer}>
              {habits.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No habits yet. Create your first habit!</Text>
                </View>
              ) : habitsForSelectedDate.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No habits for this day.</Text>
                </View>
              ) : (
                habitsForSelectedDate.map((habit) => {
                  const habitTitle = habit.title || habit.habitName || '';
                  const habitSubtitle = habit.target || `${habit.frequency || 'daily'}`;

                  // Check if habit is completed for today
                  const isCompleted = completions.some(
                    completion =>
                      completion.habit_id === habit.id &&
                      completion.completion_date === selectedDateString
                  );

                  return (
                    <HabitItem
                      key={habit.id}
                      habitId={habit.id}
                      title={`${getEmoji(habitTitle)} ${habitTitle}`}
                      subtitle={habitSubtitle}
                      completed={isCompleted}
                      completionDate={selectedDate}
                      readOnly={selectedDateIsPast}
                      onToggleBlocked={openPastDaySheet}
                      onPress={() => {
                        if (selectedDateIsPast) {
                          openPastDaySheet();
                          return;
                        }
                        handleHabitPress(habit);
                      }}
                      onToggle={(wasCompleted) => {
                        // Update only this habit's completion state
                        handleCompletionToggle(habit.id, wasCompleted);
                      }}
                    />
                  );
                })
              )}
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
          </>
        )}
      </ScrollView>

      {/* Past-day warning sheet */}
      <Modal
        visible={pastDaySheetVisible}
        transparent
        animationType="none"
        onRequestClose={closePastDaySheet}
      >
        <Pressable style={styles.sheetOverlay} onPress={closePastDaySheet}>
          <Pressable onPress={() => {}}>
            <Animated.View
              style={[
                styles.sheetContainer,
                { transform: [{ translateY: sheetTranslateY }] },
              ]}
            >
              <Text style={styles.sheetTitle}>past day</Text>
              <Text style={styles.sheetMessage}>
                you&apos;ve passed this day. you can only view past habits.
              </Text>
              <TouchableOpacity style={styles.sheetButton} onPress={closePastDaySheet} activeOpacity={0.8}>
                <Text style={styles.sheetButtonText}>Okay</Text>
              </TouchableOpacity>
            </Animated.View>
          </Pressable>
        </Pressable>
      </Modal>
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
  loadingContainer: {
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
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 14,
    color: '#FF6B6B',
    fontFamily: FONTS.anton,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
    fontFamily: FONTS.anton,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textGrey,
    fontFamily: FONTS.anton,
    textAlign: 'center',
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    minHeight: 180,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textDark,
    fontFamily: FONTS.anton,
    textTransform: 'lowercase',
    marginBottom: 8,
  },
  sheetMessage: {
    fontSize: 14,
    color: COLORS.textGrey,
    fontFamily: FONTS.anton,
    textTransform: 'lowercase',
    marginBottom: 16,
  },
  sheetButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    fontFamily: FONTS.anton,
  },
});
