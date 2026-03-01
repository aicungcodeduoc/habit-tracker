import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system/legacy';

/**
 * Habit Service - CRUD operations for habits
 */

// Helper function to extract category from title
const extractCategory = (title) => {
  if (!title) return null;
  
  const PREFIX = 'I want to ';
  const trimmedTitle = title.trim();
  
  // Remove prefix if present
  if (trimmedTitle.toLowerCase().startsWith(PREFIX.toLowerCase())) {
    return trimmedTitle.substring(PREFIX.length).trim();
  }
  
  // Return title as-is if no prefix
  return trimmedTitle;
};

// Helper function to get current user ID
const getCurrentUserId = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) {
    throw new Error('User not authenticated');
  }
  return session.user.id;
};

const getFileExtension = (uri) => {
  if (typeof uri !== 'string') return 'jpg';
  const clean = uri.split('?')[0];
  const lastDot = clean.lastIndexOf('.');
  if (lastDot === -1) return 'jpg';
  const ext = clean.slice(lastDot + 1).toLowerCase();
  if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) return ext === 'jpeg' ? 'jpg' : ext;
  return 'jpg';
};

const contentTypeForExt = (ext) => {
  switch (ext) {
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'jpg':
    default:
      return 'image/jpeg';
  }
};

const base64ToUint8Array = (base64) => {
  if (typeof base64 !== 'string') return new Uint8Array();
  const clean = base64.replace(/[\r\n\s]/g, '');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) lookup[chars.charCodeAt(i)] = i;

  const padding = clean.endsWith('==') ? 2 : clean.endsWith('=') ? 1 : 0;
  const byteLength = (clean.length * 3) / 4 - padding;
  const bytes = new Uint8Array(byteLength);

  let p = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const encoded1 = lookup[clean.charCodeAt(i)];
    const encoded2 = lookup[clean.charCodeAt(i + 1)];
    const encoded3 = lookup[clean.charCodeAt(i + 2)];
    const encoded4 = lookup[clean.charCodeAt(i + 3)];

    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
    if (p < byteLength) bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    if (p < byteLength) bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
  }

  return bytes;
};

// Helper function to convert Date to TIME format (HH:MM:SS)
const dateToTimeString = (date) => {
  if (!date) return null;
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

// Helper function to convert TIME string to Date object
const timeStringToDate = (timeString) => {
  if (!timeString) return null;
  const [hours, minutes] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes || 0, 0, 0);
  return date;
};

// Get all habits for current user
export const getHabits = async () => {
  try {
    const userId = await getCurrentUserId();
    
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Transform data for UI consumption
    const transformedData = (data || []).map(habit => ({
      ...habit,
      habitName: habit.title,
      reminderTime: timeStringToDate(habit.reminder_time),
      remindersEnabled: habit.reminders_enabled,
      selectedDays: habit.selected_days || [],
      // Ensure category is included, extract from title if missing (backward compatibility)
      category: habit.category || extractCategory(habit.title),
    }));
    
    return { data: transformedData, error: null };
  } catch (error) {
    console.error('Error fetching habits:', error);
    return { data: null, error };
  }
};

// Get a single habit by ID
export const getHabitById = async (id) => {
  try {
    const userId = await getCurrentUserId();
    
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    
    // Transform data for UI consumption
    const transformedData = data ? {
      ...data,
      habitName: data.title,
      reminderTime: timeStringToDate(data.reminder_time),
      remindersEnabled: data.reminders_enabled,
      selectedDays: data.selected_days || [],
      // Ensure category is included, extract from title if missing (backward compatibility)
      category: data.category || extractCategory(data.title),
    } : null;
    
    return { data: transformedData, error: null };
  } catch (error) {
    console.error('Error fetching habit:', error);
    return { data: null, error };
  }
};

// Create a new habit
export const createHabit = async (habit) => {
  try {
    const userId = await getCurrentUserId();
    
    // Map UI fields to database fields
    const {
      habitName, // UI field name
      title, // Alternative field name
      description,
      target,
      frequency = 'daily',
      selectedDays = [],
      remindersEnabled = true,
      reminderTime,
      environment = 'anywhere',
      color = '#4A90E2',
      icon,
    } = habit;

    // Use habitName or title, whichever is provided
    const habitTitle = habitName || title;
    
    if (!habitTitle || habitTitle.trim() === '') {
      throw new Error('Habit name is required');
    }

    // Extract category from title
    const category = extractCategory(habitTitle);

    // Convert reminderTime Date to TIME format
    const reminderTimeString = reminderTime ? dateToTimeString(reminderTime) : null;
    
    // Ensure selectedDays is an array
    const selectedDaysArray = Array.isArray(selectedDays) ? selectedDays : [];

    const habitData = {
      user_id: userId,
      title: habitTitle.trim(),
      description: description?.trim() || null,
      target: target?.trim() || null,
      category: category || null,
      frequency: frequency || 'daily',
      selected_days: frequency === 'weekly' ? selectedDaysArray : [],
      reminders_enabled: remindersEnabled !== undefined ? remindersEnabled : true,
      reminder_time: reminderTimeString,
      environment: environment || 'anywhere',
      color: color || '#4A90E2',
      icon: icon || null,
      streak: 0,
      is_active: true,
    };

    const { data, error } = await supabase
      .from('habits')
      .insert([habitData])
      .select()
      .single();

    if (error) throw error;
    
    // Transform response for UI
    const transformedData = {
      ...data,
      habitName: data.title,
      reminderTime: timeStringToDate(data.reminder_time),
      remindersEnabled: data.reminders_enabled,
      selectedDays: data.selected_days || [],
      category: data.category || extractCategory(data.title),
    };
    
    return { data: transformedData, error: null };
  } catch (error) {
    console.error('Error creating habit:', error);
    return { data: null, error };
  }
};

// Update an existing habit
export const updateHabit = async (id, updates) => {
  try {
    const userId = await getCurrentUserId();
    
    const {
      habitName,
      title,
      description,
      target,
      frequency,
      selectedDays,
      remindersEnabled,
      reminderTime,
      environment,
      color,
      icon,
      streak,
      is_active,
    } = updates;

    const updateData = {};
    
    // Handle title (from habitName or title field)
    let updatedTitle = null;
    if (habitName !== undefined) updatedTitle = habitName.trim();
    if (title !== undefined) updatedTitle = title.trim();
    
    if (updatedTitle !== null) {
      updateData.title = updatedTitle;
      // Extract category when title changes
      updateData.category = extractCategory(updatedTitle);
    }
    
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (target !== undefined) updateData.target = target?.trim() || null;
    if (frequency !== undefined) updateData.frequency = frequency;
    if (selectedDays !== undefined) {
      updateData.selected_days = Array.isArray(selectedDays) ? selectedDays : [];
    }
    if (remindersEnabled !== undefined) updateData.reminders_enabled = remindersEnabled;
    if (reminderTime !== undefined) {
      updateData.reminder_time = reminderTime ? dateToTimeString(reminderTime) : null;
    }
    if (environment !== undefined) updateData.environment = environment;
    if (color !== undefined) updateData.color = color;
    if (icon !== undefined) updateData.icon = icon;
    if (streak !== undefined) updateData.streak = streak;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await supabase
      .from('habits')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId) // Ensure user owns the habit
      .select()
      .single();

    if (error) throw error;
    
    // Transform response for UI
    const transformedData = data ? {
      ...data,
      habitName: data.title,
      reminderTime: timeStringToDate(data.reminder_time),
      remindersEnabled: data.reminders_enabled,
      selectedDays: data.selected_days || [],
      category: data.category || extractCategory(data.title),
    } : null;
    
    return { data: transformedData, error: null };
  } catch (error) {
    console.error('Error updating habit:', error);
    return { data: null, error };
  }
};

// Delete a habit
export const deleteHabit = async (id) => {
  try {
    const userId = await getCurrentUserId();
    
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', id)
      .eq('user_id', userId); // Ensure user owns the habit

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting habit:', error);
    return { error };
  }
};

// Increment streak for a habit
export const incrementStreak = async (id) => {
  try {
    const { data: habit, error: fetchError } = await getHabitById(id);
    if (fetchError) throw fetchError;

    const newStreak = (habit.streak || 0) + 1;
    return await updateHabit(id, { streak: newStreak });
  } catch (error) {
    console.error('Error incrementing streak:', error);
    return { data: null, error };
  }
};

// Get unique categories from user's habits
export const getCategories = async () => {
  try {
    const userId = await getCurrentUserId();
    
    const { data, error } = await supabase
      .from('habits')
      .select('category')
      .eq('user_id', userId)
      .eq('is_active', true)
      .not('category', 'is', null);

    if (error) throw error;
    
    // Extract unique categories
    const categories = [...new Set((data || [])
      .map(h => h.category)
      .filter(Boolean)
      .sort())];
    
    return { data: categories, error: null };
  } catch (error) {
    console.error('Error fetching categories:', error);
    return { data: null, error };
  }
};

// Get habits by category
export const getHabitsByCategory = async (category) => {
  try {
    const userId = await getCurrentUserId();
    
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .eq('category', category)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Transform data for UI consumption
    const transformedData = (data || []).map(habit => ({
      ...habit,
      habitName: habit.title,
      reminderTime: timeStringToDate(habit.reminder_time),
      remindersEnabled: habit.reminders_enabled,
      selectedDays: habit.selected_days || [],
      category: habit.category || extractCategory(habit.title),
    }));
    
    return { data: transformedData, error: null };
  } catch (error) {
    console.error('Error fetching habits by category:', error);
    return { data: null, error };
  }
};

// Get completions with images for habits in a category within a date range
export const getCategoryCompletionsWithImages = async (category, startDate, endDate) => {
  try {
    const userId = await getCurrentUserId();
    
    // Format dates in local timezone (YYYY-MM-DD)
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const startDateString = formatDate(startDate);
    const endDateString = formatDate(endDate);
    
    // Get habits in the category
    const { data: habitsData, error: habitsError } = await supabase
      .from('habits')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .eq('category', category);
    
    if (habitsError) throw habitsError;
    
    if (!habitsData || habitsData.length === 0) {
      return { data: {}, error: null };
    }
    
    const habitIds = habitsData.map(h => h.id);
    
    // Get completions for these habits within date range
    // Note: completion_date is stored as DATE in database, so we compare as strings
    const { data: completionsData, error: completionsError } = await supabase
      .from('habit_completions')
      .select('*')
      .in('habit_id', habitIds)
      .eq('user_id', userId)
      .gte('completion_date', startDateString)
      .lte('completion_date', endDateString)
      .order('completion_date', { ascending: true });
    
    if (completionsError) throw completionsError;
    
    // Get images for these completions
    const completionIds = (completionsData || []).map(c => c.id);
    let imagesData = [];
    
    if (completionIds.length > 0) {
      // Prefer fetching storage_path, but gracefully fallback if column doesn't exist yet.
      const { data: images, error: imagesError } = await supabase
        .from('habit_images')
        .select('id, completion_id, image_url, storage_path, taken_at')
        .in('completion_id', completionIds)
        .eq('user_id', userId);

      if (imagesError) {
        if (__DEV__) {
          console.log('[getCategoryCompletionsWithImages] imagesError (with storage_path):', imagesError);
        }

        const { data: imagesFallback, error: fallbackError } = await supabase
          .from('habit_images')
          .select('id, completion_id, image_url, taken_at')
          .in('completion_id', completionIds)
          .eq('user_id', userId);

        if (__DEV__) {
          console.log('[getCategoryCompletionsWithImages] imagesFallbackError:', fallbackError);
        }

        if (!fallbackError && imagesFallback) {
          imagesData = imagesFallback;
        }
      } else if (images) {
        imagesData = images;
      }
    }

    if (__DEV__) {
      console.log('[getCategoryCompletionsWithImages] fetched', {
        category,
        completionsCount: (completionsData || []).length,
        imagesCount: (imagesData || []).length,
      });
    }
    
    // Resolve images to displayable URLs (private bucket => signed URLs)
    const resolveImageUrl = async (img) => {
      const path = img?.storage_path || img?.image_url;
      if (!path) return null;
      if (typeof path === 'string' && (path.startsWith('http://') || path.startsWith('https://'))) {
        return path;
      }

      // Treat as storage path in the private 'habit-images' bucket
      const { data, error } = await supabase
        .storage
        .from('habit-images')
        .createSignedUrl(path, 3600);

      if (error) {
        console.warn('Error creating signed URL:', error);
        return null;
      }

      return data?.signedUrl || null;
    };

    const imagesResolved = await Promise.all(
      (imagesData || []).map(async (img) => ({
        completion_id: img.completion_id,
        taken_at: img.taken_at,
        url: await resolveImageUrl(img),
      }))
    );

    // Create a map of completion_id to images (sorted newest first)
    const imagesMap = {};
    imagesResolved.forEach((img) => {
      if (!img?.completion_id || !img?.url) return;
      if (!imagesMap[img.completion_id]) imagesMap[img.completion_id] = [];
      imagesMap[img.completion_id].push({
        url: img.url,
        takenAt: img.taken_at,
      });
    });

    Object.keys(imagesMap).forEach((completionId) => {
      imagesMap[completionId].sort((a, b) => {
        const at = a?.takenAt ? new Date(a.takenAt).getTime() : 0;
        const bt = b?.takenAt ? new Date(b.takenAt).getTime() : 0;
        return bt - at;
      });
    });
    
    // Transform data to group by date
    const completionsByDate = {};
    (completionsData || []).forEach(completion => {
      const date = completion.completion_date; // Already in YYYY-MM-DD format from DB
      if (!completionsByDate[date]) {
        completionsByDate[date] = [];
      }
      
      // Get the first image for this completion if available
      const images = imagesMap[completion.id] || [];
      const firstImage = images.length > 0 ? images[0] : null;
      
      completionsByDate[date].push({
        ...completion,
        image: firstImage,
        _imageTakenAt: firstImage?.takenAt || null,
      });
    });

    // Make per-day image selection deterministic: newest image first (falls back to completed_at)
    Object.keys(completionsByDate).forEach((dateKey) => {
      completionsByDate[dateKey].sort((a, b) => {
        const at = a?._imageTakenAt ? new Date(a._imageTakenAt).getTime() : 0;
        const bt = b?._imageTakenAt ? new Date(b._imageTakenAt).getTime() : 0;
        if (bt !== at) return bt - at;
        const ac = a?.completed_at ? new Date(a.completed_at).getTime() : 0;
        const bc = b?.completed_at ? new Date(b.completed_at).getTime() : 0;
        return bc - ac;
      });
    });
    
    return { data: completionsByDate, error: null };
  } catch (error) {
    console.error('Error fetching category completions with images:', error);
    return { data: null, error };
  }
};

/**
 * Save a completion proof image:
 * - Upload to private storage bucket 'habit-images'
 * - Insert row into 'habit_images' linked to the completion
 */
export const saveCompletionImage = async ({ habitId, completionId, imageUri }) => {
  try {
    if (!habitId || !completionId || !imageUri) {
      throw new Error('Missing habitId, completionId, or imageUri');
    }

    const userId = await getCurrentUserId();
    const ext = getFileExtension(imageUri);
    const contentType = contentTypeForExt(ext);
    const dateFolder = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC ok for foldering)
    const storagePath = `${userId}/${habitId}/${dateFolder}/${completionId}.${ext}`;

    // Avoid duplicates: if an image already exists for this completion, do nothing
    const { data: existing, error: existingError } = await supabase
      .from('habit_images')
      .select('id')
      .eq('user_id', userId)
      .eq('completion_id', completionId)
      .limit(1)
      .maybeSingle();

    if (!existingError && existing?.id) {
      if (__DEV__) {
        console.log('[saveCompletionImage] already exists for completion', { completionId });
      }
      return { data: existing, error: null };
    }

    // In Expo/RN, fetch(file://...) often fails. Prefer reading from FileSystem and uploading bytes.
    let uploadBody = null;
    try {
      const res = await fetch(imageUri);
      uploadBody = await res.blob();
    } catch {
      uploadBody = null;
    }

    if (!uploadBody) {
      const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: 'base64' });
      uploadBody = base64ToUint8Array(base64);
    }

    const { error: uploadError } = await supabase
      .storage
      .from('habit-images')
      .upload(storagePath, uploadBody, {
        contentType,
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Insert record (fallback if storage_path column doesn't exist yet)
    const insertPayload = {
      habit_id: habitId,
      completion_id: completionId,
      user_id: userId,
      image_url: storagePath,
      storage_path: storagePath,
    };

    let inserted = null;
    let insertError = null;

    {
      const { data, error } = await supabase
        .from('habit_images')
        .insert([insertPayload])
        .select()
        .single();
      inserted = data;
      insertError = error;
    }

    if (insertError) {
      if (__DEV__) {
        console.log('[saveCompletionImage] insertError (with storage_path):', insertError);
      }

      const { data: dataFallback, error: errorFallback } = await supabase
        .from('habit_images')
        .insert([
          {
            habit_id: habitId,
            completion_id: completionId,
            user_id: userId,
            image_url: storagePath,
          },
        ])
        .select()
        .single();

      if (errorFallback) throw errorFallback;
      inserted = dataFallback;
    }

    if (__DEV__) {
      console.log('[saveCompletionImage] saved', {
        completionId,
        storagePath,
        insertedId: inserted?.id,
      });
    }

    return { data: inserted, error: null };
  } catch (error) {
    console.error('Error saving completion image:', error);
    return { data: null, error };
  }
};

// Get all completions for habits in a category (for calculating started date and skip count)
export const getAllCategoryCompletions = async (category) => {
  try {
    const userId = await getCurrentUserId();
    
    // Get habits in the category
    const { data: habitsData, error: habitsError } = await supabase
      .from('habits')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .eq('category', category);
    
    if (habitsError) throw habitsError;
    
    if (!habitsData || habitsData.length === 0) {
      return { data: [], error: null };
    }
    
    const habitIds = habitsData.map(h => h.id);
    
    // Get all completions for these habits
    const { data: completionsData, error: completionsError } = await supabase
      .from('habit_completions')
      .select('completion_date')
      .in('habit_id', habitIds)
      .eq('user_id', userId)
      .order('completion_date', { ascending: true });
    
    if (completionsError) throw completionsError;
    
    // Extract unique dates
    const uniqueDates = [...new Set((completionsData || []).map(c => c.completion_date))];
    
    return { data: uniqueDates, error: null };
  } catch (error) {
    console.error('Error fetching all category completions:', error);
    return { data: null, error };
  }
};

// Reset streak for a habit
export const resetStreak = async (id) => {
  return await updateHabit(id, { streak: 0 });
};
