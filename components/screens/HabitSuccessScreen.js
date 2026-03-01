import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Check } from 'lucide-react-native';
import { COLORS } from '../../config/colors';
import { FONTS } from '../../config/fonts';
import { createCompletion, getCompletion, getCompletionsForHabit } from '../../src/api/completionService';
import { saveCompletionImage } from '../../src/api/habitService';

// Format date as YYYY-MM-DD in local timezone
const formatLocalDate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Monday -> Sunday range (local timezone)
const getWeekRangeMondayStart = (refDate = new Date()) => {
  const date = new Date(refDate);
  const day = date.getDay(); // 0=Sun..6=Sat
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday

  const monday = new Date(date);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(diff);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { start: monday, end: sunday };
};

export default function HabitSuccessScreen({ route, navigation }) {
  const { habit, imageUri } = route?.params || {};
  const [scaleAnim] = useState(() => new Animated.Value(0));
  const [rippleAnim1] = useState(() => new Animated.Value(0));
  const [rippleAnim2] = useState(() => new Animated.Value(0));
  const [rippleAnim3] = useState(() => new Animated.Value(0));

  const [weekLoading, setWeekLoading] = useState(false);
  const [weekCompletedDates, setWeekCompletedDates] = useState(new Set());
  const [completedSessions, setCompletedSessions] = useState(0);

  const todayString = useMemo(() => formatLocalDate(new Date()), []);
  const dayLabels = useMemo(() => ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'], []);
  const weekDays = useMemo(() => {
    const { start } = getWeekRangeMondayStart(new Date());
    return dayLabels.map((label, index) => {
      const d = new Date(start);
      d.setDate(start.getDate() + index);
      return { label, date: d, dateString: formatLocalDate(d) };
    });
  }, [dayLabels]);

  useEffect(() => {
    // Mark habit as completed when screen loads (AI verified it)
    const markAndLoadWeek = async () => {
      if (!habit?.id) return;

      const today = new Date();
      let completionId = null;

      try {
        // Create completion record with verified=true since AI confirmed it
        const { data, error } = await createCompletion(
          habit.id,
          today, // Today's date
          null, // No notes
          true // Verified by AI
        );

        if (data?.id) {
          completionId = data.id;
        }

        if (error) {
          // Likely already completed today (unique constraint). Log only.
          console.error('Error marking habit as completed:', error);
        }
      } catch (error) {
        console.error('Error creating completion:', error);
      }

      // If we couldn't get the completionId from createCompletion (duplicate etc), fetch it
      if (!completionId) {
        try {
          const { data: existing } = await getCompletion(habit.id, today);
          if (existing?.id) completionId = existing.id;
        } catch (error) {
          console.error('Error fetching existing completion:', error);
        }
      }

      // Persist the proof image (if provided)
      if (completionId && imageUri) {
        try {
          const { error } = await saveCompletionImage({
            habitId: habit.id,
            completionId,
            imageUri,
          });
          if (error) {
            console.error('Error saving completion image:', error);
            if (__DEV__) {
              console.log('[HabitSuccess] saveCompletionImage failed', {
                habitId: habit.id,
                completionId,
                hasImageUri: !!imageUri,
              });
            }
          }
        } catch (error) {
          console.error('Error saving completion image:', error);
        }
      } else if (__DEV__) {
        console.log('[HabitSuccess] skip saveCompletionImage', {
          habitId: habit?.id,
          completionId,
          hasImageUri: !!imageUri,
        });
      }

      try {
        setWeekLoading(true);
        const { start, end } = getWeekRangeMondayStart(today);
        const { data, error } = await getCompletionsForHabit(habit.id, start, end);
        if (error) {
          console.error('Error loading weekly completions:', error);
          setWeekCompletedDates(new Set());
          setCompletedSessions(0);
          return;
        }

        const dateSet = new Set((data || []).map(c => c.completion_date).filter(Boolean));
        setWeekCompletedDates(dateSet);
        setCompletedSessions(dateSet.size);
      } catch (error) {
        console.error('Error loading weekly completions:', error);
        setWeekCompletedDates(new Set());
        setCompletedSessions(0);
      } finally {
        setWeekLoading(false);
      }
    };

    markAndLoadWeek();

    // Checkmark animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Ripple animations
    const createRipple = (animValue, delay) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    };

    createRipple(rippleAnim1, 0).start();
    createRipple(rippleAnim2, 400).start();
    createRipple(rippleAnim3, 800).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount; anim refs stable
  }, []);

  const handleContinue = () => {
    // Navigate to Home screen (Main tab navigator with Home tab)
    // Reset navigation stack to go back to Main (which shows Home tab by default)
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  };

  const checkmarkScale = scaleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const ripple1Scale = rippleAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.5],
  });

  const ripple1Opacity = rippleAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0],
  });

  const ripple2Scale = rippleAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.5],
  });

  const ripple2Opacity = rippleAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0],
  });

  const ripple3Scale = rippleAnim3.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.5],
  });

  const ripple3Opacity = rippleAnim3.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0],
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Success Checkmark with Ripple Effect */}
        <View style={styles.checkmarkContainer}>
          {/* Ripple circles */}
          <Animated.View
            style={[
              styles.ripple,
              {
                transform: [{ scale: ripple1Scale }],
                opacity: ripple1Opacity,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.ripple,
              {
                transform: [{ scale: ripple2Scale }],
                opacity: ripple2Opacity,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.ripple,
              {
                transform: [{ scale: ripple3Scale }],
                opacity: ripple3Opacity,
              },
            ]}
          />
          
          {/* Main checkmark circle */}
          <Animated.View
            style={[
              styles.checkmarkCircle,
              {
                transform: [{ scale: checkmarkScale }],
              },
            ]}
          >
            <Check size={48} color={COLORS.black} strokeWidth={4} />
          </Animated.View>
        </View>

        {/* Success Text */}
        <Text style={styles.mainText}>That counts.</Text>
        <Text style={styles.subText}>nicely done</Text>

        {/* Weekly Progress Tracker */}
        <View style={styles.progressContainer}>
          {/* Day Labels */}
          <View style={styles.dayLabels}>
            {dayLabels.map((day, index) => (
              <Text
                key={day}
                style={[
                  styles.dayLabel,
                  weekDays[index]?.dateString === todayString && styles.currentDayLabel,
                ]}
              >
                {day}
              </Text>
            ))}
          </View>

          {/* Week checkmarks */}
          <View style={styles.weekChecks}>
            {weekDays.map((d) => {
              const isToday = d.dateString === todayString;
              const isCompleted = weekCompletedDates.has(d.dateString);
              return (
                <View key={d.dateString} style={styles.dayCheckItem}>
                  <View
                    style={[
                      styles.dayCircle,
                      isCompleted && styles.dayCircleCompleted,
                      isToday && !isCompleted && styles.dayCircleTodayOutline,
                    ]}
                  >
                    {isCompleted ? (
                      <Check size={18} color={COLORS.black} strokeWidth={4} />
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>

          {/* Progress Text */}
          <Text style={styles.progressText}>
            You completed {completedSessions} sessions this week.
          </Text>
          <Text style={styles.progressSubtext}>Keep it going.</Text>

          {weekLoading ? (
            <View style={styles.weekLoadingRow}>
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
          ) : null}
        </View>

        {/* Continue Button */}
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>continue</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  checkmarkContainer: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  ripple: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary,
  },
  checkmarkCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  mainText: {
    fontSize: 32,
    fontWeight: '600',
    color: COLORS.textDark,
    fontFamily: FONTS.anton,
    marginBottom: 8,
  },
  subText: {
    fontSize: 18,
    fontWeight: '400',
    color: COLORS.textLight,
    fontFamily: FONTS.anton,
    marginBottom: 48,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 48,
  },
  dayLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.textLight,
    fontFamily: FONTS.anton,
    flex: 1,
    textAlign: 'center',
  },
  currentDayLabel: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  weekChecks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  dayCheckItem: {
    flex: 1,
    alignItems: 'center',
  },
  dayCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleCompleted: {
    backgroundColor: COLORS.primary,
  },
  dayCircleTodayOutline: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  progressText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textDark,
    fontFamily: FONTS.anton,
    textAlign: 'center',
    marginBottom: 4,
  },
  progressSubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.textLight,
    fontFamily: FONTS.anton,
    textAlign: 'center',
  },
  weekLoadingRow: {
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButton: {
    width: '100%',
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textDark,
    fontFamily: FONTS.anton,
  },
});
