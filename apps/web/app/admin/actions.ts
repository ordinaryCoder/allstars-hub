'use server';

import { prisma } from '../../../../packages/database';
import { revalidatePath } from 'next/cache';
import { signup } from '../(auth)/signup/action';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Generates a secure temporary password.
 * In a real-world scenario, you would email this to the user.
 */
function generateTempPassword() {
  return Math.random().toString(36).slice(-8) + 'X1!';
}

export async function addPlayerAdmin(formData: FormData) {
  const res = await signup(formData, true);
  if (res?.error) return { error: res.error };
  revalidatePath('/admin');
  return { success: true };
}

export async function addCoachAdmin(formData: FormData) {
  const email = formData.get('email')?.toString().trim() || '';
  const firstName = formData.get('firstName')?.toString().trim() || '';
  const lastName = formData.get('lastName')?.toString().trim() || '';
  const mobileNumber = formData.get('mobileNumber')?.toString().trim() || '';
  const locationId = formData.get('locationId')?.toString().trim() || '';
  const batchIdsString = formData.get('batchIds')?.toString().trim() || '';

  const batchIds = batchIdsString ? batchIdsString.split(',') : [];

  if (!email || !firstName || !lastName || !mobileNumber || !locationId) {
    return { error: 'Please fill in all required fields' };
  }

  const academy = await prisma.academy.findFirst({
    where: { is_active: true },
    select: { id: true },
  });

  if (!academy) {
    return { error: 'No active academy available' };
  }

  const tempPassword = generateTempPassword();
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
    email,
    password: tempPassword,
  });

  if (authError || !authData?.user) {
    return { error: authError?.message ?? 'Unable to create auth account for coach' };
  }

  await prisma.user.create({
    data: {
      id: authData.user.id,
      email,
      first_name: firstName,
      last_name: lastName,
      mobile_number: mobileNumber,
      status: 'ACTIVE',
      academy_roles: {
        create: { 
          academy_id: academy.id,
          permissions: ['coach'] 
        }
      },
      coachLocations: {
        create: { location_id: locationId }
      },
      assigned_batches: {
        create: batchIds.map((batchId) => ({ batch_id: batchId }))
      }
    }
  });

  revalidatePath('/admin');
  return { success: true };
}