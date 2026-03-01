import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FONTS, COLORS } from '../../utils';

// Format date as YYYY-MM-DD in local timezone
const formatLocalDate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const clamp01 = (n) => {
  const value = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
};

const hexToRgb = (hex) => {
  if (typeof hex !== 'string') return null;
  const normalized = hex.trim().replace('#', '');
  if (normalized.length !== 6) return null;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  if ([r, g, b].some((v) => Number.isNaN(v))) return null;
  return { r, g, b };
};

const blendRgb = (from, to, t) => {
  const ratio = clamp01(t);
  return {
    r: Math.round(from.r + (to.r - from.r) * ratio),
    g: Math.round(from.g + (to.g - from.g) * ratio),
    b: Math.round(from.b + (to.b - from.b) * ratio),
  };
};

const rgbString = (rgb) => `rgb(${rgb.r},${rgb.g},${rgb.b})`;

// WCAG contrast helpers (choose readable text color)
const srgbToLinear = (channel) => {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};

const relativeLuminance = (rgb) => {
  const r = srgbToLinear(rgb.r);
  const g = srgbToLinear(rgb.g);
  const b = srgbToLinear(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrastRatio = (rgbA, rgbB) => {
  const l1 = relativeLuminance(rgbA);
  const l2 = relativeLuminance(rgbB);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
};

const pickReadableTextColor = (backgroundRgb) => {
  const white = hexToRgb(COLORS.white) || { r: 255, g: 255, b: 255 };
  const dark = hexToRgb(COLORS.textDark) || { r: 51, g: 51, b: 51 };
  return contrastRatio(backgroundRgb, white) >= contrastRatio(backgroundRgb, dark) ? COLORS.white : COLORS.textDark;
};

/**
 * WeekOverview - A reusable component showing the current week's dates
 * Displays 7 days from Monday to Sunday with day numbers
 * 
 * @param {Object} props - Component props
 * @param {Date} props.selectedDate - Currently selected date (default: today)
 * @param {Function} props.onSelectDate - Callback when a date is selected
 * @param {Set<string>} props.completedDates - Set of YYYY-MM-DD strings to mark as completed
 * @param {Object} props.completionRatioByDate - Map of YYYY-MM-DD -> completion ratio (0..1)
 * @param {Object} props.style - Additional styles for the container
 * @returns {JSX.Element} WeekOverview component
 */
export const WeekOverview = ({
  selectedDate = new Date(),
  onSelectDate,
  completedDates = new Set(),
  completionRatioByDate = {},
  style
}) => {
  const anchor = selectedDate || new Date();
  const today = new Date();

  // Get current week's dates (Monday to Sunday) for the selectedDate
  const getWeekDates = () => {
    const day = anchor.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const diff = anchor.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday

    const monday = new Date(anchor);
    monday.setDate(diff);

    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);

      const dateString = formatLocalDate(date);
      const isToday = formatLocalDate(date) === formatLocalDate(today);
      const isSelected = formatLocalDate(date) === formatLocalDate(anchor);
      const isCompleted = completedDates?.has?.(dateString) || false;

      weekDates.push({
        date,
        dateString,
        dayLetter: ['m', 't', 'w', 't', 'f', 's', 's'][i],
        dayNumber: date.getDate(),
        isToday,
        isSelected,
        isCompleted,
      });
    }

    return weekDates;
  };

  const weekDates = getWeekDates();

  return (
    <View style={[styles.container, style]}>
      {weekDates.map((day, index) => {
        const ratio = clamp01(completionRatioByDate?.[day.dateString] ?? 0);
        const from = hexToRgb(COLORS.white) || { r: 255, g: 255, b: 255 };
        const to = hexToRgb(COLORS.primary) || from;
        const backgroundRgb = blendRgb(from, to, ratio);
        const circleBackground = rgbString(backgroundRgb);
        const dayNumberColor = pickReadableTextColor(backgroundRgb);
        const selectedBorderColor = dayNumberColor === COLORS.white ? COLORS.white : COLORS.primary;

        return (
          <TouchableOpacity
            key={index}
            style={styles.dayItem}
            activeOpacity={0.7}
            disabled={!onSelectDate}
            onPress={() => onSelectDate?.(day.date)}
          >
            <Text style={[
              styles.dayLetter,
              day.isToday && styles.dayLetterToday,
              day.isSelected && styles.dayLetterSelected
            ]}>
              {day.dayLetter}
            </Text>
            <View style={[
              styles.dayNumberContainer,
              { backgroundColor: circleBackground },
              day.isSelected && styles.dayNumberContainerSelected,
              day.isSelected && { borderColor: selectedBorderColor },
              day.isToday && !day.isSelected && styles.dayNumberContainerTodayOutline
            ]}>
              <Text style={[
                styles.dayNumber,
                day.isSelected && styles.dayNumberSelected,
                { color: dayNumberColor }
              ]}>
                {day.dayNumber}
              </Text>
            </View>
            <View style={[
              styles.indicatorDot,
              day.isCompleted && styles.indicatorDotCompleted
            ]} />
          </TouchableOpacity>
        );
      })}
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
  dayLetterSelected: {
    color: COLORS.primary,
  },
  dayNumberContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumberContainerSelected: {
    borderWidth: 2,
  },
  dayNumberContainerTodayOutline: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  dayNumber: {
    fontSize: 16,
    // fontWeight: '400',
    color: '#333',
    fontFamily: FONTS.anton,
  },
  dayNumberSelected: {
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
