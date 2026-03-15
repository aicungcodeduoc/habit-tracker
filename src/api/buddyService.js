import { supabase } from './supabase';

/**
 * Buddy Service — CRUD operations for buddy_messages
 */

const getCurrentUserId = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) {
    throw new Error('User not authenticated');
  }
  return session.user.id;
};

/**
 * Get chat messages with pagination (newest first)
 */
export const getMessages = async (limit = 50, beforeTimestamp = null) => {
  try {
    const userId = await getCurrentUserId();

    let query = supabase
      .from('buddy_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (beforeTimestamp) {
      query = query.lt('created_at', beforeTimestamp);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error getting buddy messages:', error);
    return { data: [], error };
  }
};

/**
 * Save a single message
 */
export const saveMessage = async (role, content, metadata = {}) => {
  try {
    const userId = await getCurrentUserId();

    const { data, error } = await supabase
      .from('buddy_messages')
      .insert([{
        user_id: userId,
        role,
        content,
        metadata,
      }])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error saving buddy message:', error);
    return { data: null, error };
  }
};

/**
 * Delete all messages for the current user
 */
export const deleteAllMessages = async () => {
  try {
    const userId = await getCurrentUserId();

    const { error } = await supabase
      .from('buddy_messages')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting buddy messages:', error);
    return { error };
  }
};
