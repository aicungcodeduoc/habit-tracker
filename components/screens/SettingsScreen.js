import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FONTS } from '../../config/fonts';
import { Button } from '../atoms';
import { supabase } from '../../config/supabase';

export default function SettingsScreen() {
  const navigation = useNavigation();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      // Navigation will automatically update due to auth state change
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleGoToLogin = () => {
    // Navigate to Login screen (for testing purposes)
    // Get the parent navigator (Stack) to navigate to Login screen
    const parent = navigation.getParent();
    if (parent) {
      parent.navigate('Login');
    } else {
      navigation.navigate('Login');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>settings</Text>
      <View style={styles.buttonContainer}>
        <Button
          title="go to login"
          onPress={handleGoToLogin}
          variant="outline"
          style={styles.button}
        />
        <Button
          title="logout"
          onPress={handleLogout}
          variant="outline"
          style={styles.button}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 28,
    color: '#333',
    marginBottom: 30,
    fontFamily: FONTS.anton,
    textTransform: 'lowercase',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    fontFamily: FONTS.anton,
    textTransform: 'lowercase',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
    gap: 16,
  },
  button: {
    marginBottom: 0,
  },
});
