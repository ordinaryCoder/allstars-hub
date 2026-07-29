'use server';

import { createClient } from '@/lib/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { prisma } from '@packages/database';
import {
  validateSignupData,
  normalizeIndianMobile,
  type SignupInputData,
} from '@/lib/validations/signup';
import type { SignupState, LocationOption } from '@/types/auth';

export async function signup(
  formData: FormData,
  isFromAdmin = false
): Promise<SignupState> {
  const email = formData.get('email')?.toString().trim() ?? '';
  let password = formData.get('password')?.toString() ?? '';
  const firstName = formData.get('firstName')?.toString().trim() ?? '';
  const lastName = formData.get('lastName')?.toString().trim() ?? '';
  const mobileNumber = normalizeIndianMobile(
    formData.get('mobileNumber')?.toString() ?? ''
  );
  const role = formData.get('role')?.toString() ?? 'parent';
  const guardianName = formData.get('guardianName')?.toString().trim() ?? '';
  const dob = formData.get('dob')?.toString() ?? '';
  const locationId = formData.get('locationId')?.toString() ?? '';

  const inputData: SignupInputData = {
    email,
    password,
    firstName,
    lastName,
    mobileNumber,
    role,
    guardianName,
    dob,
    locationId,
  };

  const validationResult = validateSignupData(inputData, isFromAdmin);
  if (!validationResult.isValid && validationResult.error) {
    return { success: false, error: validationResult.error };
  }

  if (isFromAdmin && !password) {
    password = Math.random().toString(36).slice(-8) + 'X1!';
  }

  const academy = await prisma.academy.findFirst({
    where: { is_active: true },
    select: { id: true },
  });

  if (!academy) {
    return { success: false, error: 'No active academy available' };
  }

  let authData;
  let authError;

  if (isFromAdmin) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return { success: false, error: 'Supabase configuration is missing' };
    }

    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await supabaseAdmin.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`,
        data: {
          isFromAdmin: true,
          role,
          guardian_name: role === 'parent' ? guardianName : undefined,
          first_name: firstName,
          last_name: lastName,
          mobile_number: mobileNumber,
          location_id: locationId,
          dob: dob,
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
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`,
        data: {
          role,
          guardian_name: role === 'parent' ? guardianName : undefined,
          first_name: firstName,
          last_name: lastName,
          mobile_number: mobileNumber,
          location_id: locationId,
          dob: dob,
        },
      },
    });
    authData = data;
    authError = error;
  }

  if (authError || !authData?.user) {
    return {
      success: false,
      error: authError?.message ?? 'Unable to create account',
    };
  }

  return { success: true, email };
}

export async function getLocations(): Promise<LocationOption[]> {
  try {
    const academy = await prisma.academy.findFirst({
      where: { is_active: true },
      select: { id: true },
    });
    if (!academy) return [];

    return await prisma.location.findMany({
      where: { academy_id: academy.id },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    return [];
  }
}
