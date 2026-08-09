'use server';

import { prisma } from '@packages/database';
import { revalidatePath } from 'next/cache';
import { signup } from '@/app/(auth)/signup/_actions/action';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/server';
import { requireRole } from '@/lib/dal';

import { validateCoachData, normalizeIndianMobile } from '@/lib/validations/signup';
import { DEFAULT_PRESET_PASSWORD } from '@/lib/constants/auth';


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

  if (category === 'players') {
    return await prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        academy_roles: {
          some: {
            OR: [
              { permissions: { array_contains: 'player' } },
              { permissions: { array_contains: 'parent' } },
            ],
          },
        },
      },
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

  // Coaches / Admins
  return await prisma.user.findMany({
    where: {
      status: 'ACTIVE',
      academy_roles: {
        some: {
          OR: [
            { permissions: { array_contains: 'coach' } },
            { permissions: { array_contains: 'admin' } },
          ],
        },
      },
    },
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

  if (!serviceRoleKey) {
    return { success: false, error: 'Supabase Service Role Key is missing' };
  }

  const supabaseAdmin = createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: adminData, error: createError } = await supabaseAdmin.auth.admin.createUser({
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

  if (createError || !adminData?.user) {
    return { success: false, error: createError?.message ?? 'Unable to create auth account for coach' };
  }

  const authUserId = adminData.user.id;

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

  // Assign coach role — use composite unique key (user_id, academy_id)
  // so re-adding an existing coach updates permissions rather than inserting a duplicate row.
  await prisma.userAcademyRole.upsert({
    where: { user_id_academy_id: { user_id: authUserId, academy_id: academy.id } },
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