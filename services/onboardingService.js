import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';

const ONBOARDING_DATA_KEY = '@onboarding_data';

/**
 * Save or update onboarding data locally (AsyncStorage)
 * This stores data locally during onboarding before user is authenticated
 * @param {Object} data - Onboarding data
 * @param {string} data.habitName - The habit name from step 1
 * @param {number} data.distractionIndex - The selected distraction index from step 3
 * @param {string} data.distractionText - The selected distraction text from step 3
 * @param {boolean} data.notificationsEnabled - Whether notifications are enabled
 * @param {boolean} data.onboardingCompleted - Whether onboarding is completed
 * @returns {Promise<Object>} The saved onboarding data
 */
export const saveOnboardingData = async (data) => {
  try {
    // Get existing local data
    const existingDataString = await AsyncStorage.getItem(ONBOARDING_DATA_KEY);
    const existingData = existingDataString ? JSON.parse(existingDataString) : {};

    // Merge new data with existing data
    const updatedData = {
      ...existingData,
      habitName: data.habitName !== undefined ? data.habitName : existingData.habitName,
      distractionIndex: data.distractionIndex !== undefined ? data.distractionIndex : existingData.distractionIndex,
      distractionText: data.distractionText !== undefined ? data.distractionText : existingData.distractionText,
      notificationsEnabled: data.notificationsEnabled !== undefined ? data.notificationsEnabled : existingData.notificationsEnabled,
      onboardingCompleted: data.onboardingCompleted !== undefined ? data.onboardingCompleted : existingData.onboardingCompleted,
      updatedAt: new Date().toISOString(),
    };

    // Save to local storage
    await AsyncStorage.setItem(ONBOARDING_DATA_KEY, JSON.stringify(updatedData));

    // Try to sync to database if user is authenticated
    await syncOnboardingDataToDatabase(updatedData);

    return { data: updatedData, error: null };
  } catch (error) {
    console.error('Error saving onboarding data:', error);
    return { data: null, error: error.message || 'Failed to save onboarding data' };
  }
};

/**
 * Sync local onboarding data to database if user is authenticated
 * @param {Object} localData - Local onboarding data
 * @returns {Promise<void>}
 */
const syncOnboardingDataToDatabase = async (localData) => {
  try {
    // Check if user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      // User not authenticated yet, skip database sync
      return;
    }

    // Check if onboarding data already exists for this user
    const { data: existingData } = await supabase
      .from('onboarding_data')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existingData) {
      // Update existing record
      await supabase
        .from('onboarding_data')
        .update({
          habit_name: localData.habitName || null,
          distraction_index: localData.distractionIndex !== undefined ? localData.distractionIndex : null,
          distraction_text: localData.distractionText || null,
          notifications_enabled: localData.notificationsEnabled || false,
          onboarding_completed: localData.onboardingCompleted || false,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
    } else {
      // Insert new record
      await supabase
        .from('onboarding_data')
        .insert({
          user_id: user.id,
          habit_name: localData.habitName || null,
          distraction_index: localData.distractionIndex !== undefined ? localData.distractionIndex : null,
          distraction_text: localData.distractionText || null,
          notifications_enabled: localData.notificationsEnabled || false,
          onboarding_completed: localData.onboardingCompleted || false,
        });
    }
  } catch (error) {
    // Silently fail - local storage is the source of truth
    console.log('Could not sync onboarding data to database (user may not be authenticated):', error.message);
  }
};

/**
 * Get onboarding data from local storage
 * Also tries to fetch from database if user is authenticated and merge the data
 * @returns {Promise<Object>} The user's onboarding data
 */
export const getOnboardingData = async () => {
  try {
    // Get from local storage first
    const localDataString = await AsyncStorage.getItem(ONBOARDING_DATA_KEY);
    let localData = localDataString ? JSON.parse(localDataString) : null;

    // Try to get from database if user is authenticated
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: dbData } = await supabase
          .from('onboarding_data')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (dbData) {
          // Merge database data with local data (database takes precedence)
          localData = {
            habitName: dbData.habit_name,
            distractionIndex: dbData.distraction_index,
            distractionText: dbData.distraction_text,
            notificationsEnabled: dbData.notifications_enabled,
            onboardingCompleted: dbData.onboarding_completed,
            ...localData, // Local data can override if needed
          };
        }
      }
    } catch (dbError) {
      // If database fetch fails, just use local data
      console.log('Could not fetch from database, using local data:', dbError.message);
    }

    return { data: localData, error: null };
  } catch (error) {
    console.error('Error fetching onboarding data:', error);
    return { data: null, error: error.message || 'Failed to fetch onboarding data' };
  }
};

/**
 * Check if user has completed onboarding
 * @returns {Promise<boolean>} True if onboarding is completed
 */
export const isOnboardingCompleted = async () => {
  try {
    const { data, error } = await getOnboardingData();
    
    if (error || !data) {
      return false;
    }

    return data.onboardingCompleted === true;
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }
};

/**
 * Sync local onboarding data to database after user authentication
 * Call this after user signs in to sync any locally stored onboarding data
 * @returns {Promise<void>}
 */
export const syncOnboardingToDatabase = async () => {
  try {
    const localDataString = await AsyncStorage.getItem(ONBOARDING_DATA_KEY);
    if (!localDataString) {
      return; // No local data to sync
    }

    const localData = JSON.parse(localDataString);
    await syncOnboardingDataToDatabase(localData);
  } catch (error) {
    console.error('Error syncing onboarding data to database:', error);
  }
};
