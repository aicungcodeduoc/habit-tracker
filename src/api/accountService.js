import { supabase } from './supabase';

/**
 * Xóa tài khoản auth của user hiện tại (RPC delete_current_user trên DB).
 * Dữ liệu liên quan cascade theo ON DELETE CASCADE.
 */
export async function deleteCurrentUserAccount() {
  const { error } = await supabase.rpc('delete_current_user');
  return { error };
}
