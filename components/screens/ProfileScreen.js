import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
  Linking,
} from 'react-native';
import { useNavigation, CommonActions, useFocusEffect } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import {
  Star,
  LogOut,
  ChevronRight,
  Trash2,
  Bell,
} from 'lucide-react-native';
import { FONTS } from '../../config/fonts';
import { supabase } from '../../config/supabase';
import { deleteCurrentUserAccount } from '../../src/api/accountService';
import { getOnboardingData, saveOnboardingData } from '../../src/api/onboardingService';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationSwitchBusy, setNotificationSwitchBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const { data } = await getOnboardingData();
        if (!cancelled) {
          setNotificationsEnabled(data?.notificationsEnabled === true);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const handleNotificationToggle = async (enabled) => {
    if (notificationSwitchBusy || deletingAccount) return;
    setNotificationSwitchBusy(true);
    try {
      if (enabled) {
        const { status: existing } = await Notifications.getPermissionsAsync();
        let finalStatus = existing;
        if (existing !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus === 'granted') {
          await saveOnboardingData({ notificationsEnabled: true });
          setNotificationsEnabled(true);
        } else {
          await saveOnboardingData({ notificationsEnabled: false });
          setNotificationsEnabled(false);
          Alert.alert(
            'Notifications',
            'To receive reminders, enable notifications for this app in Settings.',
            [
              { text: 'Not now', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
        }
      } else {
        await saveOnboardingData({ notificationsEnabled: false });
        await Notifications.cancelAllScheduledNotificationsAsync();
        setNotificationsEnabled(false);
      }
    } catch (e) {
      console.warn('Notification preference update failed', e);
      Alert.alert('Error', 'Could not update notification settings.');
    } finally {
      setNotificationSwitchBusy(false);
    }
  };

  const menuItems = [
    { id: 'rate', title: 'Rate us', icon: Star },
    { id: 'signout', title: 'Sign out', icon: LogOut, isDestructive: true },
    { id: 'delete_account', title: 'Delete account', icon: Trash2, isDestructive: true },
  ];

  const resetNavigationToLogin = () => {
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
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      resetNavigationToLogin();
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  const handleDeleteAccount = async () => {
    if (deletingAccount) return;
    setDeletingAccount(true);
    try {
      const { error } = await deleteCurrentUserAccount();
      if (error) {
        throw error;
      }
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        console.warn('Sign out after delete failed', signOutError.message);
      }
      resetNavigationToLogin();
    } catch (error) {
      console.error('Error deleting account:', error);
      const message =
        error?.message && typeof error.message === 'string'
          ? error.message
          : 'Could not delete your account. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleMenuItemPress = (id) => {
    // Handle menu item press
    console.log(`Pressed: ${id}`);
    
    if (id === 'rate') {
      // Handle native rating modal
      const handleRate = async () => {
        try {
          // Lazy load the module to prevent startup crash if native module is missing
          const StoreReview = require('expo-store-review');
          
          if (!StoreReview) {
            console.error('StoreReview module is not loaded');
            Alert.alert('Error', 'Rating feature is not available in this build.');
            return;
          }

          const isAvailable = await StoreReview.isAvailableAsync();
          if (isAvailable) {
            await StoreReview.requestReview();
          } else {
            // Fallback for environments where StoreReview is not available (like some simulators)
            Alert.alert('Rate Us', 'Native rating is only available on real devices.');
          }
        } catch (error) {
          console.error('Error with rating:', error);
          // If the error is about missing native module, we catch it here
          if (error.message && error.message.includes('native module')) {
            Alert.alert('Error', 'This build is missing the rating module. Please rebuild the app.');
          }
        }
      };
      handleRate();
    } else if (id === 'signout') {
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Sign Out',
            style: 'destructive',
            onPress: handleSignOut,
          },
        ]
      );
    } else if (id === 'delete_account') {
      Alert.alert(
        'Delete account',
        'This permanently deletes your account and data. This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: handleDeleteAccount,
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>profile</Text>
          {deletingAccount ? (
            <ActivityIndicator style={styles.headerSpinner} color="#FF4D4F" />
          ) : null}
        </View>
        
        <View style={styles.menuContainer}>
          <View style={[styles.menuItem, styles.menuItemFirst, styles.toggleRow]}>
            <View style={styles.menuItemLeft}>
              <Bell size={24} color="#333" />
              <Text style={styles.menuItemText}>notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationToggle}
              disabled={notificationSwitchBusy || deletingAccount}
              trackColor={{ false: '#E0E0E0', true: 'rgba(1, 196, 89, 0.45)' }}
              thumbColor={notificationsEnabled ? '#01C459' : '#f4f3f4'}
            />
          </View>
          {menuItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.menuItem,
                  index === menuItems.length - 1 && styles.menuItemLast,
                ]}
                onPress={() => handleMenuItemPress(item.id)}
                activeOpacity={0.7}
                disabled={deletingAccount}
              >
                <View style={styles.menuItemLeft}>
                  <IconComponent 
                    size={24} 
                    color={item.isDestructive ? '#FF4D4F' : '#333'} 
                  />
                  <Text style={[
                    styles.menuItemText,
                    item.isDestructive && styles.menuItemTextDestructive
                  ]}>
                    {item.title}
                  </Text>
                </View>
                <ChevronRight size={20} color="#999" />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerSpinner: {
    marginLeft: 'auto',
  },
  headerLogo: {
    width: 32,
    height: 32,
    borderRadius: 4,
  },
  title: {
    fontSize: 36,
    color: '#333',
    fontFamily: FONTS.anton,
    textTransform: 'lowercase',
  },
  menuContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuItemFirst: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  toggleRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuItemLast: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    fontSize: 20,
    color: '#333',
    marginLeft: 16,
    fontFamily: FONTS.anton,
    textTransform: 'lowercase',
  },
  menuItemTextDestructive: {
    color: '#FF4D4F',
  },
});
