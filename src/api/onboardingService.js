import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const ONBOARDING_DATA_KEY = '@onboarding_data';

export const saveOnboardingData = async (data) => {
  try {
    const existingDataString = await AsyncStorage.getItem(ONBOARDING_DATA_KEY);
    const existingData = existingDataString ? JSON.parse(existingDataString) : {};

    const updatedData = {
      ...existingData,
      habitName: data.habitName !== undefined ? data.habitName : existingData.habitName,
      distractionIndex: data.distractionIndex !== undefined ? data.distractionIndex : existingData.distractionIndex,
      distractionText: data.distractionText !== undefined ? data.distractionText : existingData.distractionText,
      notificationsEnabled: data.notificationsEnabled !== undefined ? data.notificationsEnabled : existingData.notificationsEnabled,
      onboardingCompleted: data.onboardingCompleted !== undefined ? data.onboardingCompleted : existingData.onboardingCompleted,
      updatedAt: new Date().toISOString(),
    };

    await AsyncStorage.setItem(ONBOARDING_DATA_KEY, JSON.stringify(updatedData));
    await syncOnboardingDataToDatabase(updatedData);

    return { data: updatedData, error: null };
  } catch (error) {
    console.error('Error saving onboarding data:', error);
    return { data: null, error: error.message || 'Failed to save onboarding data' };
  }
};

const syncOnboardingDataToDatabase = async (localData) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return;

    const { data: existingData } = await supabase
      .from('onboarding_data')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existingData) {
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
    console.log('Could not sync onboarding data to database (user may not be authenticated):', error.message);
  }
};

export const getOnboardingData = async () => {
  try {
    const localDataString = await AsyncStorage.getItem(ONBOARDING_DATA_KEY);
    let localData = localDataString ? JSON.parse(localDataString) : null;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: dbData } = await supabase
          .from('onboarding_data')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (dbData) {
          localData = {
            habitName: dbData.habit_name,
            distractionIndex: dbData.distraction_index,
            distractionText: dbData.distraction_text,
            notificationsEnabled: dbData.notifications_enabled,
            onboardingCompleted: dbData.onboarding_completed,
            ...localData,
          };
        }
      }
    } catch (dbError) {
      console.log('Could not fetch from database, using local data:', dbError.message);
    }

    return { data: localData, error: null };
  } catch (error) {
    console.error('Error fetching onboarding data:', error);
    return { data: null, error: error.message || 'Failed to fetch onboarding data' };
  }
};

export const isOnboardingCompleted = async () => {
  try {
    const { data, error } = await getOnboardingData();
    if (error || !data) return false;
    return data.onboardingCompleted === true;
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }
};

export const syncOnboardingToDatabase = async () => {
  try {
    const localDataString = await AsyncStorage.getItem(ONBOARDING_DATA_KEY);
    if (!localDataString) return;
    const localData = JSON.parse(localDataString);
    await syncOnboardingDataToDatabase(localData);
  } catch (error) {
    console.error('Error syncing onboarding data to database:', error);
  }
};
