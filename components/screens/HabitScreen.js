import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { HabitScreenHeader } from '../organisms';

export default function HabitScreen() {
  const handleTodayPress = () => {
    // TODO: Implement date picker or navigation
    console.log('Today pressed');
  };

  const handleIconPress = () => {
    // TODO: Implement icon action (e.g., navigate to stats, view streak)
    console.log('Icon pressed');
  };

  const handleAvatarPress = () => {
    // TODO: Implement avatar action (e.g., navigate to profile, settings)
    console.log('Avatar pressed');
  };

  return (
    <SafeAreaView style={styles.container}>
      <HabitScreenHeader
        onTodayPress={handleTodayPress}
        onIconPress={handleIconPress}
        onAvatarPress={handleAvatarPress}
        iconNumber="1"
      />
      <View style={styles.content}>
        {/* Content will be added here */}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
  },
});
