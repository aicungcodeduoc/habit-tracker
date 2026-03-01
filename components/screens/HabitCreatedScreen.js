import React, { useEffect, useState } from 'react';
import { View, StyleSheet, SafeAreaView, Text, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { ChevronRight, Home, Briefcase, TreePine, Dumbbell, Coffee, MapPin, Check, BookOpen, Calendar, Sparkles } from 'lucide-react-native';
import { COLORS } from '../../config/colors';
import { FONTS } from '../../config/fonts';
// import { generateHabitCompliment } from '../../src/api/geminiService';

export default function HabitCreatedScreen({ navigation, route }) {
  const [scaleAnim] = useState(() => new Animated.Value(1));
  const [pulseAnim] = useState(() => new Animated.Value(0));
  const [rotateAnim] = useState(() => new Animated.Value(0));

  const { habitData, savedHabit } = route.params || {};
  
  // Use savedHabit if available, otherwise use habitData
  const displayData = savedHabit || habitData;

  // State for AI-generated compliment (commented out)
  // const [aiCompliment, setAiCompliment] = useState(null);
  // const [isLoadingCompliment, setIsLoadingCompliment] = useState(true);
  // const [complimentError, setComplimentError] = useState(null);

  // Generate AI compliment on mount (commented out)
  // useEffect(() => {
  //   const generateCompliment = async () => {
  //     if (!displayData) {
  //       setIsLoadingCompliment(false);
  //       return;
  //     }

  //     try {
  //       setIsLoadingCompliment(true);
  //       setComplimentError(null);
        
  //       const result = await generateHabitCompliment({
  //         habitName: displayData.habitName || displayData.title || 'this habit',
  //         frequency: displayData.frequency || 'daily',
  //         environment: displayData.environment || 'anywhere',
  //         reminderTime: displayData.reminderTime || displayData.selectedTime || new Date(),
  //         selectedDays: displayData.selectedDays || [],
  //       });

  //       if (result.success && result.data) {
  //         setAiCompliment(result.data);
  //       } else {
  //         setComplimentError(result.error || 'Failed to generate compliment');
  //       }
  //     } catch (error) {
  //       console.error('Error generating compliment:', error);
  //       setComplimentError(error.message || 'Failed to generate compliment');
  //     } finally {
  //       setIsLoadingCompliment(false);
  //     }
  //   };

  //   generateCompliment();
  // }, [displayData]);

  // Animation for checkmark circle
  useEffect(() => {
    // Scale animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulsing animation for the circle
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Rotating animation around the circle
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount; anim refs stable
  }, []);

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Helper functions for formatting
  const formatTime = (date) => {
    if (!date) return '8:30 pm';
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'pm' : 'am';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${period}`;
  };

  const formatSchedule = () => {
    if (!displayData) return 'daily, at 8:30 pm';
    
    const { frequency, selectedTime, reminderTime, selectedDays } = displayData;
    const timeToUse = selectedTime || reminderTime;
    const daysOfWeek = [
      { label: 'Monday', value: 1 },
      { label: 'Tuesday', value: 2 },
      { label: 'Wednesday', value: 3 },
      { label: 'Thursday', value: 4 },
      { label: 'Friday', value: 5 },
      { label: 'Saturday', value: 6 },
      { label: 'Sunday', value: 0 },
    ];

    if (frequency === 'daily') {
      return `daily, at ${formatTime(timeToUse)}`;
    } else {
      if (selectedDays && selectedDays.length > 0) {
        const dayLabels = selectedDays.map(dayValue => {
          const day = daysOfWeek.find(d => d.value === dayValue);
          return day ? day.label : '';
        }).filter(Boolean);
        
        if (dayLabels.length === 1) {
          return `${dayLabels[0]}, at ${formatTime(timeToUse)}`;
        } else if (dayLabels.length <= 3) {
          return `${dayLabels.join(', ')}, at ${formatTime(timeToUse)}`;
        } else {
          return `weekly (${dayLabels.length} days), at ${formatTime(timeToUse)}`;
        }
      }
      return `weekly, at ${formatTime(timeToUse)}`;
    }
  };

  const formatLocation = () => {
    if (!displayData) return 'My Home';
    
    const environments = [
      { id: 'home', label: 'Home' },
      { id: 'work', label: 'Work' },
      { id: 'outdoors', label: 'Outdoors' },
      { id: 'gym', label: 'Gym' },
      { id: 'cafe', label: 'Cafe' },
      { id: 'anywhere', label: 'Anywhere' },
    ];

    const env = environments.find(e => e.id === (displayData.environment || 'home'));
    if (!env) return 'My Home';
    
    if (env.id === 'home') {
      return 'My Home';
    }
    return env.label;
  };

  const getEnvironmentIcon = () => {
    if (!displayData) return Home;
    
    const environments = [
      { id: 'home', icon: Home },
      { id: 'work', icon: Briefcase },
      { id: 'outdoors', icon: TreePine },
      { id: 'gym', icon: Dumbbell },
      { id: 'cafe', icon: Coffee },
      { id: 'anywhere', icon: MapPin },
    ];

    const env = environments.find(e => e.id === (displayData.environment || 'home'));
    return env ? env.icon : Home;
  };

  const handleStartSmall = () => {
    // Navigate to home screen (Main stack with Home tab)
    // This will trigger a refresh of the habits list
    navigation.navigate('Main', { screen: 'Home' });
  };

  const habitName = displayData?.habitName || displayData?.title || 'New habit';
  const frequency = displayData?.frequency || 'daily';
  const selectedTime = displayData?.reminderTime || displayData?.selectedTime || new Date();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.mainContent}>
            {/* Checkmark Circle with Animation */}
            <View style={styles.checkmarkContainer}>
              {/* Animated pulsing circle around checkmark */}
              <Animated.View
                style={[
                  styles.pulseCircle,
                  {
                    opacity: pulseOpacity,
                    transform: [{ scale: pulseScale }],
                  },
                ]}
              />
              
              {/* Animated rotating circles around checkmark */}
              <Animated.View
                style={[
                  styles.rotatingCircle,
                  {
                    transform: [{ rotate }],
                  },
                ]}
              >
                <View style={styles.rotatingDot} />
              </Animated.View>

              {/* Main checkmark circle */}
              <Animated.View
                style={[
                  styles.checkmarkCircle,
                  {
                    transform: [{ scale: scaleAnim }],
                  },
                ]}
              >
                <Check size={48} color={COLORS.white} strokeWidth={4} />
              </Animated.View>
            </View>

            {/* Title */}
            <Text style={styles.title}>you're all set!</Text>
            <Text style={styles.subtitle}>Ready to start your journey?</Text>

            {/* Habit Summary Card */}
            <View style={styles.habitSummaryCard}>
              {/* New Habit Section */}
              <View style={styles.summarySection}>
                <BookOpen size={20} color={COLORS.primary} strokeWidth={2} />
                <View style={styles.summaryTextContainer}>
                  <Text style={styles.summaryLabel}>NEW HABIT</Text>
                  <Text style={styles.summaryValue}>{habitName}</Text>
                </View>
              </View>

              {/* Divider */}
              <View style={styles.summaryDivider} />

              {/* Schedule Section */}
              <View style={styles.summarySection}>
                <Calendar size={20} color={COLORS.primary} strokeWidth={2} />
                <View style={styles.summaryTextContainer}>
                  <Text style={styles.summaryLabel}>SCHEDULE</Text>
                  <Text style={styles.summaryValue}>{formatSchedule()}</Text>
                </View>
              </View>

              {/* Divider */}
              <View style={styles.summaryDivider} />

              {/* Location Section */}
              <View style={styles.summarySection}>
                {(() => {
                  const LocationIcon = getEnvironmentIcon();
                  return <LocationIcon size={20} color={COLORS.primary} strokeWidth={2} />;
                })()}
                <View style={styles.summaryTextContainer}>
                  <Text style={styles.summaryLabel}>AT</Text>
                  <Text style={styles.summaryValue}>{formatLocation()}</Text>
                </View>
              </View>
            </View>

            {/* Motivational Message Box */}
            <View style={styles.motivationalBox}>
              {/* Main Message with Sparkle Icon */}
              <View style={styles.messageRow}>
                <View style={styles.sparkleIcon}>
                  <Sparkles size={20} color={COLORS.primary} strokeWidth={2} fill={COLORS.primary} />
                </View>
                <View style={styles.messageTextContainer}>
                  {/* AI-generated compliment (commented out) */}
                  {/* {isLoadingCompliment ? (
                    <View style={styles.loadingComplimentContainer}>
                      <ActivityIndicator size="small" color={COLORS.primary} />
                      <Text style={styles.motivationalText}>Generating your personalized message...</Text>
                    </View>
                  ) : aiCompliment ? (
                    <Text style={styles.motivationalText}>
                      {aiCompliment}
                    </Text>
                  ) : ( */}
                    <Text style={styles.motivationalText}>
                      You will <Text style={styles.motivationalHighlight}>{habitName}</Text> at <Text style={styles.motivationalHighlight}>{formatTime(selectedTime)}</Text> {frequency === 'daily' ? 'daily' : 'weekly'} in <Text style={styles.motivationalHighlight}>{formatLocation().toLowerCase()}</Text>.
                    </Text>
                  {/* )} */}
                </View>
              </View>
              
              {/* Sub-message - Italicized */}
              <View style={styles.noteContainer}>
                <Text style={styles.motivationalNote}>
                  Remember, consistency beats intensity.{'\n'}You got this!
                </Text>
              </View>
            </View>

            {/* Start Small Button */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.startSmallButton}
                onPress={handleStartSmall}
                activeOpacity={0.7}
              >
                <Text style={styles.startSmallButtonText}>
                  start small
                </Text>
                <ChevronRight 
                  size={20} 
                  color={COLORS.white} 
                  strokeWidth={2}
                />
              </TouchableOpacity>
              <Text style={styles.footer}>
                You can change this any time. No pressure.
              </Text>
            </View>
          </View>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  mainContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  checkmarkContainer: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    marginTop: 20,
    position: 'relative',
  },
  checkmarkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 2,
  },
  pulseCircle: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    zIndex: 0,
  },
  rotatingCircle: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'flex-start',
    zIndex: 1,
  },
  rotatingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginTop: 2,
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    color: COLORS.textDark,
    fontFamily: FONTS.anton,
    textAlign: 'center',
    marginBottom: 8,
    textTransform: 'lowercase',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: COLORS.textGrey,
    fontFamily: FONTS.anton,
    textAlign: 'center',
    marginBottom: 32,
  },
  habitSummaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summarySection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  summaryTextContainer: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textGrey,
    fontFamily: FONTS.anton,
    letterSpacing: 1,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textDark,
    fontFamily: FONTS.anton,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: 16,
  },
  motivationalBox: {
    backgroundColor: COLORS.homeBackground,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sparkleIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  messageTextContainer: {
    flex: 1,
  },
  motivationalText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
    fontFamily: FONTS.anton,
    lineHeight: 20,
  },
  motivationalHighlight: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  loadingComplimentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  noteContainer: {
    marginTop: 8,
  },
  motivationalNote: {
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.textGrey,
    fontFamily: FONTS.anton,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  buttonContainer: {
    width: '100%',
    paddingTop: 20,
  },
  startSmallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    gap: 8,
  },
  startSmallButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: FONTS.anton,
    color: COLORS.white,
    textTransform: 'lowercase',
  },
  footer: {
    fontSize: 12,
    fontWeight: '400',
    color: COLORS.textGrey,
    fontFamily: FONTS.anton,
    textAlign: 'center',
    marginTop: 12,
  },
});
