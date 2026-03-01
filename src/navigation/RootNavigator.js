/**
 * Root stack navigation (React Navigation).
 * Uses screens and BottomTabNavigator from src.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BottomTabNavigator } from '../components';
import {
  LoginScreen,
  SettingsScreen,
  OnboardingScreen,
  AddHabitScreen,
  HowOftenScreen,
  HabitCreatedScreen,
  AIResultScreen,
  HabitSuccessScreen,
  HabitDetailScreen,
  AIProcessScreen,
} from '../screens';

const Stack = createNativeStackNavigator();

export default function RootNavigator({ initialRouteName = 'Login' }) {
  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Main" component={BottomTabNavigator} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="HabitDetail" component={HabitDetailScreen} />
      <Stack.Screen name="AIProcess" component={AIProcessScreen} />
      <Stack.Screen name="AIResult" component={AIResultScreen} />
      <Stack.Screen name="HabitSuccess" component={HabitSuccessScreen} />
      <Stack.Screen name="AddHabit" component={AddHabitScreen} />
      <Stack.Screen name="HowOften" component={HowOftenScreen} />
      <Stack.Screen name="HabitCreated" component={HabitCreatedScreen} />
    </Stack.Navigator>
  );
}
