'use server';

import { prisma } from '@packages/database';
import { revalidatePath } from 'next/cache';
import { signup } from '@/app/(auth)/signup/_actions/action';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/server';
import { requireRole } from '@/lib/dal';

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

export async function addPlayerAdmin(formData: FormData): Promise<{ success: false; error: string } | { success: true }> {
  await requireRole('admin');

  const res = await signup(formData, true);
  if (!res.success) return { success: false, error: res.error };
  revalidatePath('/admin');
  return { success: true };
}

export async function addCoachAdmin(formData: FormData): Promise<{ success: false; error: string } | { success: true }> {
  await requireRole('admin');

  const email = formData.get('email')?.toString().trim() || '';
  const firstName = formData.get('firstName')?.toString().trim() || '';
  const lastName = formData.get('lastName')?.toString().trim() || '';
  const mobileNumber = formData.get('mobileNumber')?.toString().trim() || '';
  const locationId = formData.get('locationId')?.toString().trim() || '';

  if (!email || !firstName || !lastName || !mobileNumber || !locationId) {
    return { success: false as const, error: 'Please fill in all required fields' };
  }

  const academy = await prisma.academy.findFirst({
    where: { is_active: true },
    select: { id: true },
  });

  if (!academy) {
    return { success: false as const, error: 'No active academy available' };
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

  if (authError || !authData?.user) {
    return { success: false as const, error: authError?.message ?? 'Unable to create auth account for coach' };
  }

  await prisma.coachLocation.create({
    data: { user_id: authData.user.id, location_id: locationId },
  });

  revalidatePath('/admin');
  return { success: true };
}