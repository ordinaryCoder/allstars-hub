'use server'

import { createClient } from '../../../lib/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { prisma } from '../../../../../packages/database'

export async function signup(formData: FormData, isFromAdmin = false) {
  const email = formData.get('email')?.toString().trim() ?? ''
  let password = formData.get('password')?.toString() ?? ''
  const firstName = formData.get('firstName')?.toString().trim() ?? ''
  const lastName = formData.get('lastName')?.toString().trim() ?? ''
  const mobileNumber = formData.get('mobileNumber')?.toString().trim() ?? ''
  const role = formData.get('role')?.toString() ?? 'parent'
  const guardianName = formData.get('guardianName')?.toString().trim() ?? ''
  const dob = formData.get('dob')?.toString() ?? ''
  const locationId = formData.get('locationId')?.toString() ?? ''

  if (isFromAdmin && !password) {
    password = Math.random().toString(36).slice(-8) + 'X1!'
  }

  if (!email || !password || !firstName || !lastName || !mobileNumber || (role === 'parent' && !guardianName) || !dob || !locationId) {
    return { error: 'Please fill in all required fields' }
  }

  const academy = await prisma.academy.findFirst({
    where: { is_active: true },
    select: { id: true },
  })

  if (!academy) {
    return { error: 'No active academy available' }
  }

  let authData;
  let authError;

  if (isFromAdmin) {
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { data, error } = await supabaseAdmin.auth.signUp({
      email,
      password,
      options: {
        data: {
          isFromAdmin: true,
          role,
          first_name: role === 'parent' ? guardianName : firstName,
          last_name: lastName,
          mobile_number: mobileNumber,
          location_id: locationId,
          dob: dob,
          player_first_name: role === 'parent' ? firstName : undefined,
          player_last_name: role === 'parent' ? lastName : undefined,
        },
      },
    });
    authData = data;
    authError = error;
  } else {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role, first_name: firstName, last_name: lastName, mobile_number: mobileNumber, location_id: locationId, dob: dob } },
    });
    authData = data;
    authError = error;
  }

  if (authError || !authData?.user) {
    return { error: authError?.message ?? 'Unable to create account' }
  }

  if (!isFromAdmin) {
    return { success: true, email }
  }
}

export async function getLocations() {
  const academy = await prisma.academy.findFirst({
    where: { is_active: true },
    select: { id: true },
  });
  if (!academy) return [];
  return prisma.location.findMany({
    where: { academy_id: academy.id },
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  });
}
