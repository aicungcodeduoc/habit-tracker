import { supabase } from '../config/supabase';

/**
 * Habit Service - CRUD operations for habits
 */

// Get all habits
export const getHabits = async () => {
  try {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching habits:', error);
    return { data: null, error };
  }
};

// Get a single habit by ID
export const getHabitById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching habit:', error);
    return { data: null, error };
  }
};

// Create a new habit
export const createHabit = async (habit) => {
  try {
    const { name, description, color = '#4A90E2' } = habit;

    if (!name || name.trim() === '') {
      throw new Error('Habit name is required');
    }

    const { data, error } = await supabase
      .from('habits')
      .insert([
        {
          name: name.trim(),
          description: description?.trim() || null,
          color,
          streak: 0,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating habit:', error);
    return { data: null, error };
  }
};

// Update an existing habit
export const updateHabit = async (id, updates) => {
  try {
    const { name, description, color, streak } = updates;

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (color !== undefined) updateData.color = color;
    if (streak !== undefined) updateData.streak = streak;

    const { data, error } = await supabase
      .from('habits')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating habit:', error);
    return { data: null, error };
  }
};

// Delete a habit
export const deleteHabit = async (id) => {
  try {
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', id);

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

// Reset streak for a habit
export const resetStreak = async (id) => {
  return await updateHabit(id, { streak: 0 });
};
