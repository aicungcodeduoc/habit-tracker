import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FONTS } from '../../config/fonts';

export default function CalendarScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Calendar</Text>
      <Text style={styles.subtitle}>Your habit calendar will appear here</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    fontFamily: FONTS.anton,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    fontFamily: FONTS.anton,
  },
});
