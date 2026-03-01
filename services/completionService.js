import { supabase } from '../config/supabase';

/**
 * Completion Service - CRUD operations for habit_completions
 */

// Helper function to get current user ID
const getCurrentUserId = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) {
    throw new Error('User not authenticated');
  }
  return session.user.id;
};

// Helper function to format date as YYYY-MM-DD
const formatDate = (date) => {
  if (!date) {
    date = new Date();
  }
  if (typeof date === 'string') {
    date = new Date(date);
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Create a completion record for a habit on a specific date
 * @param {string} habitId - The habit ID
 * @param {Date|string} completionDate - The date of completion (defaults to today)
 * @param {string} notes - Optional notes about the completion
 * @param {boolean} verified - Whether completion was verified (e.g., via image)
 * @returns {Promise<{data: any, error: any}>}
 */
export const createCompletion = async (habitId, completionDate = null, notes = null, verified = false) => {
  try {
    const userId = await getCurrentUserId();
    const dateString = formatDate(completionDate);

    const { data, error } = await supabase
      .from('habit_completions')
      .insert([
        {
          habit_id: habitId,
          user_id: userId,
          completion_date: dateString,
          notes: notes?.trim() || null,
          verified: verified || false,
          verification_method: verified ? 'manual' : null,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating completion:', error);
    return { data: null, error };
  }
};

/**
 * Delete a completion record (unmark completion)
 * @param {string} habitId - The habit ID
 * @param {Date|string} completionDate - The date of completion to delete
 * @returns {Promise<{error: any}>}
 */
export const deleteCompletion = async (habitId, completionDate = null) => {
  try {
    const userId = await getCurrentUserId();
    const dateString = formatDate(completionDate);

    const { error } = await supabase
      .from('habit_completions')
      .delete()
      .eq('habit_id', habitId)
      .eq('user_id', userId)
      .eq('completion_date', dateString);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting completion:', error);
    return { error };
  }
};

/**
 * Get completion for a specific habit on a specific date
 * @param {string} habitId - The habit ID
 * @param {Date|string} date - The date to check
 * @returns {Promise<{data: any, error: any}>}
 */
export const getCompletion = async (habitId, date = null) => {
  try {
    const userId = await getCurrentUserId();
    const dateString = formatDate(date);

    const { data, error } = await supabase
      .from('habit_completions')
      .select('*')
      .eq('habit_id', habitId)
      .eq('user_id', userId)
      .eq('completion_date', dateString)
      .maybeSingle();

    if (error) throw error;
    return { data: data || null, error: null };
  } catch (error) {
    console.error('Error getting completion:', error);
    return { data: null, error };
  }
};

/**
 * Get all completions for a specific date (for all habits)
 * @param {Date|string} date - The date to check (defaults to today)
 * @returns {Promise<{data: any[], error: any}>}
 */
export const getCompletionsForDate = async (date = null) => {
  try {
    const userId = await getCurrentUserId();
    const dateString = formatDate(date);

    const { data, error } = await supabase
      .from('habit_completions')
      .select('*')
      .eq('user_id', userId)
      .eq('completion_date', dateString);

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error getting completions for date:', error);
    return { data: [], error };
  }
};

/**
 * Get all completions within a date range (inclusive)
 * @param {Date|string} startDate - Start date of range
 * @param {Date|string} endDate - End date of range
 * @returns {Promise<{data: any[], error: any}>}
 */
export const getCompletionsForDateRange = async (startDate, endDate) => {
  try {
    const userId = await getCurrentUserId();
    const startDateString = formatDate(startDate);
    const endDateString = formatDate(endDate);

    const { data, error } = await supabase
      .from('habit_completions')
      .select('*')
      .eq('user_id', userId)
      .gte('completion_date', startDateString)
      .lte('completion_date', endDateString);

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error getting completions for date range:', error);
    return { data: [], error };
  }
};

/**
 * Get completions for a specific habit within a date range
 * @param {string} habitId - The habit ID
 * @param {Date|string} startDate - Start date of range
 * @param {Date|string} endDate - End date of range
 * @returns {Promise<{data: any[], error: any}>}
 */
export const getCompletionsForHabit = async (habitId, startDate, endDate) => {
  try {
    const userId = await getCurrentUserId();
    const startDateString = formatDate(startDate);
    const endDateString = formatDate(endDate);

    const { data, error } = await supabase
      .from('habit_completions')
      .select('*')
      .eq('habit_id', habitId)
      .eq('user_id', userId)
      .gte('completion_date', startDateString)
      .lte('completion_date', endDateString)
      .order('completion_date', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error getting completions for habit:', error);
    return { data: [], error };
  }
};

/**
 * Toggle completion for a habit on a specific date
 * If completion exists, delete it. If not, create it.
 * @param {string} habitId - The habit ID
 * @param {Date|string} date - The date to toggle (defaults to today)
 * @returns {Promise<{data: any, error: any, wasCompleted: boolean}>}
 */
export const toggleCompletion = async (habitId, date = null) => {
  try {
    // Check if completion exists
    const { data: existingCompletion, error: checkError } = await getCompletion(habitId, date);
    
    if (checkError) throw checkError;

    if (existingCompletion) {
      // Delete completion (unmark)
      const { error } = await deleteCompletion(habitId, date);
      if (error) throw error;
      return { data: null, error: null, wasCompleted: false };
    } else {
      // Create completion (mark as complete)
      const { data, error } = await createCompletion(habitId, date);
      if (error) throw error;
      return { data, error: null, wasCompleted: true };
    }
  } catch (error) {
    console.error('Error toggling completion:', error);
    return { data: null, error, wasCompleted: false };
  }
};
