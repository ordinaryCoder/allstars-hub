'use server';

import { prisma } from '@packages/database';
import { revalidatePath } from 'next/cache';
import { signup } from '@/app/(auth)/signup/_actions/action';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/server';
import { requireRole } from '@/lib/dal';

import { validateCoachData, normalizeIndianMobile } from '@/lib/validations/signup';
import { DEFAULT_PRESET_PASSWORD } from '@/lib/constants/auth';

/**
 * Generates a secure temporary password.
 * In a real-world scenario, you would email this to the user.
 */
function generateTempPassword() {
  return Math.random().toString(36).slice(-8) + 'X1!';
}

/**
 * Approves a pending user (Admin only).
 */
export async function approveUser(formData: FormData): Promise<void> {
  await requireRole('admin');

  const userId = formData.get('userId')?.toString().trim();
  if (!userId) {
    return;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { status: 'ACTIVE' },
  });

  revalidatePath('/admin');
}

/**
 * Single authoritative query function for fetching users by category ('players' | 'coaches' | 'pending').
 */
export async function getUsersByCategory(category: 'players' | 'coaches' | 'pending') {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Unauthorized');
  }

  await requireRole('admin');

  if (category === 'pending') {
    return await prisma.user.findMany({
      where: { status: 'PENDING' },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        mobile_number: true,
        status: true,
        created_at: true,
        academy_roles: { select: { permissions: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  const activeUsers = await prisma.user.findMany({
    where: { status: 'ACTIVE' },
    select: {
      id: true,
      first_name: true,
      last_name: true,
      email: true,
      mobile_number: true,
      status: true,
      created_at: true,
      academy_roles: { select: { permissions: true } },
    },
    orderBy: { created_at: 'desc' },
  });

  if (category === 'players') {
    return activeUsers.filter((u) => {
      const perms = u.academy_roles?.[0]?.permissions;
      if (!perms) return false;
      const permStr = Array.isArray(perms) ? perms.join(',').toLowerCase() : String(perms).toLowerCase();
      return permStr.includes('parent') || permStr.includes('player');
    });
  }

  // Coaches / Admins
  return activeUsers.filter((u) => {
    const perms = u.academy_roles?.[0]?.permissions;
    if (!perms) return false;
    const permStr = Array.isArray(perms) ? perms.join(',').toLowerCase() : String(perms).toLowerCase();
    return !permStr.includes('parent') && !permStr.includes('player');
  });
}


export async function addPlayerAdmin(formData: FormData): Promise<{ success: false; error: string } | { success: true; email: string; passwordUsed: string }> {
  await requireRole('admin');

  const res = await signup(formData);
  if (!res.success) return { success: false, error: res.error };
  revalidatePath('/admin');
  return { success: true, email: res.email, passwordUsed: res.passwordUsed || DEFAULT_PRESET_PASSWORD };
}

export async function addCoachAdmin(formData: FormData): Promise<{ success: false; error: string } | { success: true; email: string; passwordUsed: string }> {
  await requireRole('admin');

  const email = formData.get('email')?.toString().trim() || '';
  const firstName = formData.get('firstName')?.toString().trim() || '';
  const lastName = formData.get('lastName')?.toString().trim() || '';
  const mobileNumber = normalizeIndianMobile(formData.get('mobileNumber')?.toString() || '');
  const locationId = formData.get('locationId')?.toString().trim() || '';
  let password = formData.get('password')?.toString() || '';
  if (!password) {
    password = DEFAULT_PRESET_PASSWORD;
  }

  const validation = validateCoachData({
    firstName,
    lastName,
    email,
    mobileNumber,
    locationId,
  });

  if (!validation.isValid && validation.error) {
    return { success: false, error: validation.error };
  }

  const academy = await prisma.academy.findFirst({
    where: { is_active: true },
    select: { id: true },
  });

  if (!academy) {
    return { success: false, error: 'No active academy available' };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  let authUserId: string | null = null;

  if (serviceRoleKey) {
    const supabaseAdmin = createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: adminData } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: password,
      email_confirm: true,
      user_metadata: {
        isFromAdmin: true,
        role: 'coach',
        first_name: firstName,
        last_name: lastName,
        mobile_number: mobileNumber,
        location_id: locationId,
      },
    });

    if (adminData?.user) {
      authUserId = adminData.user.id;
    }
  }

  if (!authUserId) {
    const supabaseClient = createSupabaseClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: signUpData, error: signUpError } = await supabaseClient.auth.signUp({
      email,
      password: password,
      options: {
        data: {
          isFromAdmin: true,
          role: 'coach',
          first_name: firstName,
          last_name: lastName,
          mobile_number: mobileNumber,
          location_id: locationId,
        },
      },
    });

    if (signUpError || !signUpData?.user) {
      return { success: false, error: signUpError?.message ?? 'Unable to create auth account for coach' };
    }
    authUserId = signUpData.user.id;
  }

  // Create public.users entry with status ACTIVE
  await prisma.user.upsert({
    where: { id: authUserId },
    update: {
      first_name: firstName,
      last_name: lastName,
      mobile_number: mobileNumber,
      status: 'ACTIVE',
    },
    create: {
      id: authUserId,
      email,
      first_name: firstName,
      last_name: lastName,
      mobile_number: mobileNumber,
      status: 'ACTIVE',
    },
  });

  // Assign coach role
  await prisma.userAcademyRole.upsert({
    where: { id: authUserId },
    update: { permissions: ['coach'] },
    create: {
      user_id: authUserId,
      academy_id: academy.id,
      permissions: ['coach'],
    },
  });

  // Assign coach location
  await prisma.coachLocation.upsert({
    where: {
      user_id_location_id: {
        user_id: authUserId,
        location_id: locationId,
      },
    },
    update: {},
    create: {
      user_id: authUserId,
      location_id: locationId,
    },
  });

  revalidatePath('/admin');
  return { success: true, email, passwordUsed: password };
}