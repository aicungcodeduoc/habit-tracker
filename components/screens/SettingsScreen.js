import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { User, LogOut } from 'lucide-react-native';
import { FONTS } from '../../config/fonts';
import { Button } from '../atoms';
import { supabase } from '../../config/supabase';
import { COLORS } from '../../src/utils/colors';

export default function SettingsScreen() {
  const navigation = useNavigation();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      
      // Navigate to Login screen by resetting the stack
      // We go up to the root navigator if needed
      let rootNavigator = navigation;
      let parent = navigation.getParent();
      while (parent) {
        rootNavigator = parent;
        parent = parent.getParent();
      }

      rootNavigator.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        })
      );
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleGoToProfile = () => {
    navigation.navigate('Profile');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image 
          source={require('../../assets/logo/logo.png')}
          style={styles.headerLogo}
          resizeMode="contain"
        />
        <Text style={styles.title}>settings</Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="profile"
          onPress={handleGoToProfile}
          variant="outline"
          style={styles.button}
          icon={<User size={20} color={COLORS.textDark} />}
        />
        <Button
          title="logout"
          onPress={handleLogout}
          variant="outline"
          style={styles.button}
          icon={<LogOut size={20} color="#FF4D4F" />}
          textStyle={{ color: '#FF4D4F' }}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.versionText}>version 1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white || '#ffffff',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 60,
    marginBottom: 40,
  },
  headerLogo: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  title: {
    fontSize: 32,
    color: COLORS.black || '#000',
    fontFamily: FONTS.anton,
    textTransform: 'lowercase',
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  button: {
    marginBottom: 0,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 14,
    color: COLORS.textLight || '#999',
    fontFamily: FONTS.anton,
    opacity: 0.6,
  },
});

