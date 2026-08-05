'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/server';

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect('/login');
}

export async function changePassword(
  _prevState: { success: boolean; error?: string } | null,
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const currentPassword = formData.get('currentPassword')?.toString().trim() ?? '';
  const newPassword = formData.get('newPassword')?.toString().trim() ?? '';
  const confirmPassword = formData.get('confirmPassword')?.toString().trim() ?? '';

  // --- Basic validations on the server ---
  if (!currentPassword || !newPassword || !confirmPassword) {
    return { success: false, error: 'All fields are required.' };
  }
  if (newPassword.length < 8) {
    return { success: false, error: 'New password must be at least 8 characters.' };
  }
  if (newPassword !== confirmPassword) {
    return { success: false, error: 'New password and confirmation do not match.' };
  }
  if (currentPassword === newPassword) {
    return { success: false, error: 'New password must differ from the current password.' };
  }

  const supabase = await createClient();

  // Verify current user is logged in
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user?.email) {
    return { success: false, error: 'Session expired. Please log in again.' };
  }

  // Re-authenticate with current password to verify it
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (signInError) {
    return { success: false, error: 'Current password is incorrect.' };
  }

  // Update the password
  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
  if (updateError) {
    return { success: false, error: updateError.message ?? 'Failed to update password.' };
  }

  return { success: true };
}
