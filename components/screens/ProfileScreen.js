import React from 'react';
import { View, StyleSheet, SafeAreaView, Text, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { 
  Star, 
  LogOut, 
  ChevronRight 
} from 'lucide-react-native';
import * as StoreReview from 'expo-store-review';
import { FONTS } from '../../config/fonts';
import { supabase } from '../../config/supabase';

export default function ProfileScreen() {
  const navigation = useNavigation();
  
  const menuItems = [
    { id: 'rate', title: 'Rate us', icon: Star },
    { id: 'signout', title: 'Sign out', icon: LogOut, isDestructive: true },
  ];

  const handleSignOut = async () => {
    try {
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      // Navigate to Login screen by getting the root navigator
      // Since ProfileScreen is nested (inside BottomTabNavigator inside Stack),
      // we need to get the root Stack navigator
      let rootNavigator = navigation;
      
      // Traverse up to find the root navigator (Stack navigator)
      // The navigation hierarchy is: ProfileScreen -> BottomTabNavigator -> Stack
      let parent = navigation.getParent();
      while (parent) {
        rootNavigator = parent;
        parent = parent.getParent();
      }
      
      // Reset navigation stack to Login screen using root navigator
      rootNavigator.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        })
      );
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  const handleMenuItemPress = (id) => {
    // Handle menu item press
    console.log(`Pressed: ${id}`);
    
    if (id === 'rate') {
      // Handle native rating modal
      const handleRate = async () => {
        try {
          const isAvailable = await StoreReview.isAvailableAsync();
          if (isAvailable) {
            await StoreReview.requestReview();
          } else {
            // Fallback for environments where StoreReview is not available (like some simulators)
            Alert.alert('Rate Us', 'Native rating is only available on real devices.');
          }
        } catch (error) {
          console.error('Error with rating:', error);
        }
      };
      handleRate();
    } else if (id === 'signout') {
      // Show confirmation alert before signing out
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
    }
    // TODO: Implement navigation/actions for other menu items
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>profile</Text>
        </View>
        
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.menuItem,
                  index === 0 && styles.menuItemFirst,
                  index === menuItems.length - 1 && styles.menuItemLast,
                ]}
                onPress={() => handleMenuItemPress(item.id)}
                activeOpacity={0.7}
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
