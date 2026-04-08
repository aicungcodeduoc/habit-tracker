import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView, 
  Text, 
  ScrollView, 
  TouchableOpacity,
  Image
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
// import { Upload } from 'lucide-react-native';
import { COLORS } from '../../config/colors';
import { FONTS } from '../../config/fonts';
import { getCategories, getHabitsByCategory, getHabits, getCategoryCompletionsWithImages, getAllCategoryCompletions } from '../../src/api/habitService';

export default function StreaksScreen() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [habits, setHabits] = useState([]);
  const [categoryHabits, setCategoryHabits] = useState([]);
  const [weeklyCompletions, setWeeklyCompletions] = useState({});
  const [allCompletions, setAllCompletions] = useState([]);
  const [, setLoadingCompletions] = useState(false);

  // Get current week dates (Sunday to Saturday) using local timezone
  const getCurrentWeekDates = () => {
    const today = new Date();
    // Get local date components (handles timezone automatically)
    const year = today.getFullYear();
    const month = today.getMonth();
    const date = today.getDate();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Create Sunday of current week in local timezone
    const sunday = new Date(year, month, date - dayOfWeek, 0, 0, 0, 0);
    
    // Create Saturday of current week in local timezone
    const saturday = new Date(year, month, date - dayOfWeek + 6, 23, 59, 59, 999);
    
    return { start: sunday, end: saturday };
  };

  const getTodayDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Get day labels for current week
  const getWeekDayLabels = () => {
    const { start } = getCurrentWeekDates();
    const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    const labels = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      
      // Format date as YYYY-MM-DD in local timezone
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      
      labels.push({
        label: days[i],
        date: date,
        dateString: dateString,
        dayOfWeek: i, // 0 = Sunday, 6 = Saturday
      });
    }
    
    return labels;
  };

  // Load categories from habits (only once)
  const loadCategories = useCallback(async () => {
    try {
      const { data, error } = await getCategories();
      
      if (error) {
        console.error('Error loading categories:', error);
        setCategories([]);
        return;
      }
      
      const categoryList = data || [];
      setCategories(categoryList);
      
      // Auto-select first category if available and none selected
      if (categoryList.length > 0 && !selectedCategory) {
        setSelectedCategory(categoryList[0]);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
    }
  }, [selectedCategory]);

  // Load habits for selected category
  const loadCategoryHabits = useCallback(async (category) => {
    if (!category) {
      setCategoryHabits([]);
      return;
    }

    try {
      const { data, error } = await getHabitsByCategory(category);
      
      if (error) {
        console.error('Error loading category habits:', error);
        setCategoryHabits([]);
        return;
      }
      
      setCategoryHabits(data || []);
    } catch (error) {
      console.error('Error loading category habits:', error);
      setCategoryHabits([]);
    }
  }, []);

  // Load all habits for overall streak calculation
  const loadAllHabits = useCallback(async () => {
    try {
      const { data, error } = await getHabits();
      
      if (error) {
        console.error('Error loading habits:', error);
        setHabits([]);
        return;
      }
      
      setHabits(data || []);
    } catch (error) {
      console.error('Error loading habits:', error);
      setHabits([]);
    }
  }, []);

  // Initial load - only once
  useEffect(() => {
    loadCategories();
    loadAllHabits();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  // Load all completions for category (for stats calculation)
  const loadAllCompletions = useCallback(async (category) => {
    if (!category) {
      setAllCompletions([]);
      return;
    }

    try {
      const { data, error } = await getAllCategoryCompletions(category);
      
      if (error) {
        console.error('Error loading all completions:', error);
        setAllCompletions([]);
        return;
      }
      
      setAllCompletions(data || []);
    } catch (error) {
      console.error('Error loading all completions:', error);
      setAllCompletions([]);
    }
  }, []);

  // Load weekly completions with images for selected category
  const loadWeeklyCompletions = useCallback(async (category) => {
    if (!category) {
      setWeeklyCompletions({});
      return;
    }

    try {
      setLoadingCompletions(true);
      const { start, end } = getCurrentWeekDates();
      const { data, error } = await getCategoryCompletionsWithImages(category, start, end);
      
      if (error) {
        console.error('Error loading weekly completions:', error);
        setWeeklyCompletions({});
        return;
      }

      if (__DEV__) {
        const todayString = getTodayDateString();
        const todayEntries = (data || {})[todayString] || [];
        console.log('[Streaks] weeklyCompletions loaded', {
          category,
          daysWithCompletions: Object.keys(data || {}).length,
          todayString,
          todayCompletions: todayEntries.length,
          todayFirstImageUrl: todayEntries?.[0]?.image?.url || null,
        });
      }
      
      setWeeklyCompletions(data || {});
    } catch (error) {
      console.error('Error loading weekly completions:', error);
      setWeeklyCompletions({});
    } finally {
      setLoadingCompletions(false);
    }
  }, []);

  // Load category habits and weekly completions when category changes
  useEffect(() => {
    if (selectedCategory) {
      loadCategoryHabits(selectedCategory);
      loadWeeklyCompletions(selectedCategory);
      loadAllCompletions(selectedCategory);
    } else {
      setCategoryHabits([]);
      setWeeklyCompletions({});
      setAllCompletions([]);
    }
  }, [selectedCategory, loadCategoryHabits, loadWeeklyCompletions, loadAllCompletions]);

  // Refresh weekly completions when the screen is focused (tabs usually keep screens mounted)
  useFocusEffect(
    useCallback(() => {
      if (selectedCategory) {
        loadWeeklyCompletions(selectedCategory);
      }
    }, [selectedCategory, loadWeeklyCompletions])
  );

  // Calculate streak for selected category
  const calculateCategoryStreak = () => {
    if (!selectedCategory || categoryHabits.length === 0) {
      // Calculate overall streak from all habits
      const totalStreak = habits.reduce((sum, habit) => sum + (habit.streak || 0), 0);
      return totalStreak;
    }
    
    // Calculate streak for selected category
    const categoryStreak = categoryHabits.reduce((sum, habit) => sum + (habit.streak || 0), 0);
    return categoryStreak;
  };

  // Calculate started date and skip count for selected category
  const calculateCategoryStats = useCallback(() => {
    if (!selectedCategory || categoryHabits.length === 0) {
      return { startedDate: null, skipCount: 0 };
    }

    // Use all completions to find the earliest date
    if (allCompletions.length === 0) {
      return { startedDate: null, skipCount: 0 };
    }

    const sortedDates = [...allCompletions].sort();
    const startedDate = sortedDates[0];

    // Calculate skip count: days from started date to today that don't have completions
    if (!startedDate) {
      return { startedDate: null, skipCount: 0 };
    }

    const startDate = new Date(startedDate + 'T00:00:00'); // Add time to avoid timezone issues
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    // Create a set of completion dates for quick lookup
    const completionDatesSet = new Set(allCompletions);
    
    let skipCount = 0;
    const currentDate = new Date(startDate);
    
    while (currentDate <= today) {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      
      // Check if this date has a completion
      if (!completionDatesSet.has(dateString)) {
        skipCount++;
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return { startedDate, skipCount };
  }, [selectedCategory, categoryHabits, allCompletions]);

  const { startedDate, skipCount } = calculateCategoryStats();

  // Calculate streak number for display
  const streakNumber = calculateCategoryStreak();

  // Format started date for display
  const formatStartedDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* White Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          {/* Category Filter Bar */}
          {categories.length === 0 ? (
            <View style={styles.emptyCategoriesContainer}>
              <Text style={styles.emptyCategoriesText}>No habits yet</Text>
            </View>
          ) : (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryContainer}
              style={styles.categoryScrollView}
            >
              {categories.map((category) => {
                const isSelected = selectedCategory === category;
                return (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryButton,
                      isSelected && styles.categoryButtonSelected
                    ]}
                    onPress={() => setSelectedCategory(category)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.categoryButtonText,
                      isSelected && styles.categoryButtonTextSelected
                    ]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>

      {/* Main Content Area */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Streak Display */}
        <View style={styles.streakSection}>
          <View style={styles.streakNumberContainer}>
            <Text style={styles.streakNumber}>{streakNumber}</Text>
            <Text style={styles.streakLabel}>DAY STREAK</Text>
          </View>
          <Text style={styles.streakMessage}>
            {selectedCategory 
              ? `You're doing great with ${selectedCategory}! Keep it up.`
              : "You're growing stronger every day! Keep it up."}
          </Text>
        </View>

        {/* Growth Visualization */}
        <View style={styles.growthSection}>
          <View style={styles.growthImageContainer}>
            {/* Placeholder for growth image - replace with actual image */}
            <View style={styles.growthImagePlaceholder}>
              <Text style={styles.growthImageText}>🌱</Text>
            </View>
          </View>
          <View style={styles.growthStageCard}>
            <Text style={styles.growthStageText}>
              Growth Stage: Sapling (Level 3)
            </Text>
          </View>
        </View>

        {/* Streak Details */}
        <View style={styles.detailsSection}>
          <View style={styles.detailsRow}>
            <Text style={styles.detailLabel}>
              Started: {formatStartedDate(startedDate)}
            </Text>
            <Text style={styles.detailLabel}>
              Skips: <Text style={styles.skipCount}>{skipCount}</Text>
            </Text>
          </View>
        </View>

        {/* Daily Progress Tracker */}
        <View style={styles.progressSection}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.progressContainer}
          >
            {getWeekDayLabels().map((dayInfo, index) => {
              const completionsForDay = weeklyCompletions[dayInfo.dateString] || [];
              const isCompleted = completionsForDay.length > 0;
              const firstImage = completionsForDay.length > 0 && completionsForDay[0].image
                ? completionsForDay[0].image.url
                : null;
              const hasImage = !!firstImage;

              if (__DEV__ && dayInfo.dateString === getTodayDateString()) {
                console.log('[Streaks] render today', {
                  dateString: dayInfo.dateString,
                  isCompleted,
                  hasImage,
                  firstImage,
                  completionsForDayLen: completionsForDay.length,
                  firstCompletionId: completionsForDay?.[0]?.id || null,
                });
              }
              
              return (
                <View key={`${dayInfo.dateString}-${index}`} style={styles.dayIndicator}>
                  <View style={[
                    styles.dayCircle,
                    isCompleted && !hasImage && styles.dayCircleCompleted,
                    isCompleted && hasImage && styles.dayCircleWithImage,
                  ]}>
                    {isCompleted && firstImage ? (
                      <Image 
                        source={{ uri: firstImage }} 
                        style={styles.dayImage}
                        resizeMode="cover"
                      />
                    ) : isCompleted ? (
                      <Text style={styles.checkmark}>✓</Text>
                    ) : null}
                  </View>
                  <Text style={styles.dayLabel}>{dayInfo.label}</Text>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* Share Button */}
        {/* <TouchableOpacity style={styles.shareButton} activeOpacity={0.7}>
          <Text style={styles.shareButtonText}>SHARE</Text>
          <Upload size={18} color={COLORS.primary} strokeWidth={2} />
        </TouchableOpacity> */}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    backgroundColor: COLORS.white,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  categoryScrollView: {
    marginTop: 8,
  },
  categoryContainer: {
    paddingRight: 20,
    gap: 8,
  },
  categoryButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  categoryButtonSelected: {
    backgroundColor: COLORS.homeBackground,
    borderColor: COLORS.primary,
  },
  categoryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textGrey,
    fontFamily: FONTS.anton,
  },
  categoryButtonTextSelected: {
    color: COLORS.primary,
  },
  loadingContainer: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  emptyCategoriesContainer: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  emptyCategoriesText: {
    fontSize: 14,
    color: COLORS.textGrey,
    fontFamily: FONTS.anton,
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 40,
  },
  streakSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  streakNumberContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  streakNumber: {
    fontSize: 72,
    fontWeight: 'bold',
    color: COLORS.primary,
    fontFamily: FONTS.anton,
  },
  streakLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    fontFamily: FONTS.anton,
    letterSpacing: 2,
    marginTop: 4,
  },
  streakMessage: {
    fontSize: 16,
    color: COLORS.textGrey,
    textAlign: 'center',
    fontFamily: FONTS.anton,
    marginTop: 8,
  },
  growthSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  growthImageContainer: {
    marginBottom: 16,
  },
  growthImagePlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 16,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  growthImageText: {
    fontSize: 80,
  },
  growthStageCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  growthStageText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
    fontFamily: FONTS.anton,
  },
  detailsSection: {
    marginBottom: 24,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.textDark,
    fontFamily: FONTS.anton,
  },
  skipCount: {
    color: '#FF3B30',
    fontWeight: '600',
  },
  viewAllLink: {
    fontSize: 14,
    color: COLORS.primary,
    fontFamily: FONTS.anton,
    fontWeight: '600',
  },
  progressSection: {
    marginBottom: 32,
  },
  progressContainer: {
    gap: 8,
    paddingRight: 20,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  dayIndicator: {
    alignItems: 'center',
    gap: 6,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F0F0',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleCompleted: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    borderStyle: 'solid',
    overflow: 'hidden',
  },
  dayCircleWithImage: {
    backgroundColor: 'transparent',
    borderColor: COLORS.primary,
    borderStyle: 'solid',
    overflow: 'hidden',
  },
  dayImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  checkmark: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  dayLabel: {
    fontSize: 10,
    color: COLORS.textGrey,
    fontFamily: FONTS.anton,
    fontWeight: '600',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.homeBackground,
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
    marginBottom: 40,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    fontFamily: FONTS.anton,
    letterSpacing: 1,
  },
});
