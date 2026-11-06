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

import { DEFAULT_PRESET_PASSWORD } from '@/lib/constants/auth';

export async function signup(formData: FormData): Promise<SignupState> {
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

  if (!password) {
    password = DEFAULT_PRESET_PASSWORD;
  }

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

  const validationResult = validateSignupData(inputData, true);
  if (!validationResult.isValid && validationResult.error) {
    return { success: false, error: validationResult.error };
  }

  const normalizedEmail = email.toLowerCase();
  const normalizedMobile = mobileNumber;

  // Check if an account already exists with this email or mobile number in public.users
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: { equals: normalizedEmail, mode: 'insensitive' } },
        { mobile_number: normalizedMobile },
      ],
    },
    select: { email: true, mobile_number: true },
  });

  let emailExists = !!(existingUser && existingUser.email?.toLowerCase() === normalizedEmail);
  let mobileExists = !!(existingUser && existingUser.mobile_number === normalizedMobile);

  // If not found in public.users, also check auth.users (e.g. pending/unconfirmed registrations)
  if (!emailExists || !mobileExists) {
    try {
      const authMatches: any = await prisma.$queryRawUnsafe(
        `SELECT email, raw_user_meta_data->>'mobile_number' as mobile
         FROM auth.users
         WHERE LOWER(email) = LOWER($1)
            OR raw_user_meta_data->>'mobile_number' = $2
            OR phone = $2
            OR phone = $3
         LIMIT 1`,
        normalizedEmail,
        normalizedMobile,
        `+91${normalizedMobile}`
      );
      if (authMatches && authMatches.length > 0) {
        if (authMatches[0].email?.toLowerCase() === normalizedEmail) {
          emailExists = true;
        }
        const authMobileRaw = (authMatches[0].mobile || '').replace(/\D/g, '').slice(-10);
        if (authMobileRaw === normalizedMobile) {
          mobileExists = true;
        }
      }
    } catch {
      // Fallback gracefully if direct auth.users query is not permitted
    }
  }

  if (emailExists || mobileExists) {
    const conflictField: 'both' | 'email' | 'mobile' =
      emailExists && mobileExists ? 'both' : emailExists ? 'email' : 'mobile';

    const fieldLabel =
      conflictField === 'both'
        ? 'An account with this email address and mobile number'
        : conflictField === 'email'
        ? 'An account with this email address'
        : 'An account with this mobile number';

    return {
      success: false,
      error: `${fieldLabel} already exists in our system. Please log in or contact support for assistance.`,
      isDuplicate: true,
      conflictField,
    };
  }

  const academy = await prisma.academy.findFirst({
    where: { is_active: true },
    select: { id: true },
  });

  if (!academy) {
    return { success: false, error: 'No active academy available' };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return { success: false, error: 'Supabase configuration is missing' };
  }

  const supabaseClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const { data: authData, error: authError } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/api/auth/callback`,
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

  if (authError || !authData?.user) {
    const isUserAlreadyRegistered =
      authError?.message?.toLowerCase().includes('already registered') ||
      authError?.message?.toLowerCase().includes('already exists') ||
      authError?.status === 422;

    if (isUserAlreadyRegistered) {
      return {
        success: false,
        error: 'An account with this email address already exists in our system. Please log in or contact support for assistance.',
        isDuplicate: true,
        conflictField: 'email',
      };
    }

    return {
      success: false,
      error: authError?.message ?? 'Unable to create account',
    };
  }

  return { success: true, email, passwordUsed: password };
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
