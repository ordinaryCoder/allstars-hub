'use server';

import { prisma } from '@packages/database';
import { revalidatePath, revalidateTag } from 'next/cache';
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
 * Fetches location filter options for admin user management filtering.
 */
export async function getFilterOptionsAdmin() {
  await requireRole('admin');

  const rawLocations = await prisma.location.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  const locations = rawLocations.map((l) => ({ id: l.id, name: l.name }));

  return { locations };
}

function mapUserWithLocationInfos<T extends Record<string, any>>(u: T) {
  const locationInfosSet = new Map<string, { locationId: string; locationName: string }>();

  u.players?.forEach((p: any) => {
    if (p.location) {
      locationInfosSet.set(p.location.id, {
        locationId: p.location.id,
        locationName: p.location.name,
      });
    }
  });

  u.parent_of?.forEach((po: any) => {
    if (po.player?.location) {
      locationInfosSet.set(po.player.location.id, {
        locationId: po.player.location.id,
        locationName: po.player.location.name,
      });
    }
  });

  return {
    id: u.id,
    first_name: u.first_name,
    last_name: u.last_name,
    email: u.email,
    mobile_number: u.mobile_number,
    status: u.status,
    created_at: u.created_at,
    academy_roles: u.academy_roles,
    locationInfos: Array.from(locationInfosSet.values()),
  };
}

const playerUserSelect = {
  id: true,
  first_name: true,
  last_name: true,
  email: true,
  mobile_number: true,
  status: true,
  created_at: true,
  academy_roles: { select: { permissions: true } },
  players: {
    select: {
      id: true,
      location_id: true,
      location: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
  parent_of: {
    select: {
      player: {
        select: {
          id: true,
          location_id: true,
          location: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  },
} as const;

/**
 * Single authoritative query function for fetching users by category ('players' | 'coaches' | 'pending' | 'inactive').
 */
export async function getUsersByCategory(category: 'players' | 'coaches' | 'pending' | 'inactive') {
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

  if (category === 'inactive') {
    const inactivePlayerRecords = await prisma.player.findMany({
      where: { is_active: false },
      select: {
        user_id: true,
        parents: { select: { parent_user_id: true } },
      },
    });

    const inactiveUserIdsSet = new Set<string>();
    inactivePlayerRecords.forEach((p) => {
      if (p.user_id) inactiveUserIdsSet.add(p.user_id);
      p.parents.forEach((pp) => {
        if (pp.parent_user_id) inactiveUserIdsSet.add(pp.parent_user_id);
      });
    });

    if (inactiveUserIdsSet.size === 0) {
      return [];
    }

    const users = await prisma.user.findMany({
      where: {
        id: { in: Array.from(inactiveUserIdsSet) },
        status: 'ACTIVE',
      },
      select: playerUserSelect,
      orderBy: { created_at: 'desc' },
    });

    return users.map(mapUserWithLocationInfos);
  }

  if (category === 'players') {
    const inactivePlayerRecords = await prisma.player.findMany({
      where: { is_active: false },
      select: {
        user_id: true,
        parents: { select: { parent_user_id: true } },
      },
    });

    const inactiveUserIdsSet = new Set<string>();
    inactivePlayerRecords.forEach((p) => {
      if (p.user_id) inactiveUserIdsSet.add(p.user_id);
      p.parents.forEach((pp) => {
        if (pp.parent_user_id) inactiveUserIdsSet.add(pp.parent_user_id);
      });
    });

    const users = await prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        ...(inactiveUserIdsSet.size > 0 ? { id: { notIn: Array.from(inactiveUserIdsSet) } } : {}),
        academy_roles: {
          some: {
            OR: [
              { permissions: { array_contains: 'player' } },
              { permissions: { array_contains: 'parent' } },
            ],
          },
        },
      },
      select: playerUserSelect,
      orderBy: { created_at: 'desc' },
    });

    return users.map(mapUserWithLocationInfos);
  }

  // Coaches / Admins
  return await prisma.user.findMany({
    where: {
      status: 'ACTIVE',
      academy_roles: {
        some: {
          OR: [
            { permissions: { array_contains: 'coach' }, },
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

/**
 * Deactivates a player (Admin only). Only sets linked player record is_active to false so user status remains ACTIVE and user can log in.
 */
export async function deactivatePlayer(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole('admin');

    if (!userId) {
      return { success: false, error: 'User ID is required' };
    }

    await prisma.player.updateMany({
      where: {
        OR: [
          { user_id: userId },
          { parents: { some: { parent_user_id: userId } } },
        ],
      },
      data: { is_active: false },
    });

    revalidatePath('/admin');
    revalidatePath('/coach/player-list');
    revalidatePath('/coach/new-session');
    revalidatePath('/coach/attendance-report');
    revalidateTag('player-counts', 'default');

    return { success: true };
  } catch (error: any) {
    console.error('Error deactivating player:', error);
    return { success: false, error: error?.message || 'Failed to deactivate player' };
  }
}

/**
 * Reactivates an inactive player (Admin only). Sets linked player record is_active to true.
 */
export async function reactivatePlayer(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole('admin');

    if (!userId) {
      return { success: false, error: 'User ID is required' };
    }

    await prisma.player.updateMany({
      where: {
        OR: [
          { user_id: userId },
          { parents: { some: { parent_user_id: userId } } },
        ],
      },
      data: { is_active: true },
    });

    revalidatePath('/admin');
    revalidatePath('/coach/player-list');
    revalidatePath('/coach/new-session');
    revalidatePath('/coach/attendance-report');
    revalidateTag('player-counts', 'default');

    return { success: true };
  } catch (error: any) {
    console.error('Error reactivating player:', error);
    return { success: false, error: error?.message || 'Failed to reactivate player' };
  }
}


export async function addPlayerAdmin(formData: FormData): Promise<{ success: false; error: string } | { success: true; email: string; passwordUsed: string }> {
  await requireRole('admin');

  const res = await signup(formData);
  if (!res.success) return { success: false, error: res.error };
  revalidatePath('/admin');
  revalidateTag('player-counts', 'default');
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

  // Assign coach role — check existing role by (user_id, academy_id) first
  const existingRole = await prisma.userAcademyRole.findFirst({
    where: { user_id: authUserId, academy_id: academy.id },
  });

  if (existingRole) {
    await prisma.userAcademyRole.update({
      where: { id: existingRole.id },
      data: { permissions: ['coach'] },
    });
  } else {
    await prisma.userAcademyRole.create({
      data: {
        user_id: authUserId,
        academy_id: academy.id,
        permissions: ['coach'],
      },
    });
  }

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
  revalidateTag('locations', 'default');
  revalidateTag('player-counts', 'default');
  return { success: true, email, passwordUsed: password };
}