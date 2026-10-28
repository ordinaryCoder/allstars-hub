'use server';

import { prisma } from '@packages/database';
import { revalidatePath, revalidateTag } from 'next/cache';
import { signup } from '@/app/(auth)/signup/_actions/action';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/server';
import { requireRole } from '@/lib/dal';

import { validateCoachData, validateAdminPlayerData, normalizeIndianMobile } from '@/lib/validations/signup';
import { DEFAULT_PRESET_PASSWORD } from '@/lib/constants/auth';


function generateTempPassword() {
  return Math.random().toString(36).slice(-8) + 'X1!';
}

/**
 * Approves a pending user (Admin only).
 */
async function getPendingUserSignupDetails(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { academy_roles: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  let meta: Record<string, any> = {};
  if (serviceRoleKey) {
    try {
      const supabaseAdmin = createSupabaseClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { data: authData } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (authData?.user?.user_metadata) {
        meta = authData.user.user_metadata;
      }
    } catch (err) {
      console.warn('Failed to fetch user metadata from Supabase Admin API:', err);
    }
  }

  if (!meta || Object.keys(meta).length === 0) {
    try {
      const rawUserRows: any = await prisma.$queryRawUnsafe(
        'SELECT raw_user_meta_data FROM auth.users WHERE id = $1::uuid',
        userId
      );
      if (rawUserRows?.[0]?.raw_user_meta_data) {
        meta = rawUserRows[0].raw_user_meta_data;
      }
    } catch (e) {
      // fallback
    }
  }

  const rolePerm = user.academy_roles?.[0]?.permissions;
  const roleFromPerm = Array.isArray(rolePerm) ? rolePerm[0] : String(rolePerm || '');
  const role = (meta.role || roleFromPerm || 'player').toLowerCase();

  const mobileNumber = normalizeIndianMobile(meta.mobile_number || user.mobile_number || '');
  const locationId = meta.location_id || '';
  const dob = meta.dob || null;
  const guardianName = meta.guardian_name || (role === 'parent' ? user.first_name : '');

  const firstName = (meta.first_name || user.first_name || '').trim();
  const lastName = (meta.last_name || user.last_name || '').trim();

  let locationName = '';
  if (locationId) {
    const loc = await prisma.location.findUnique({
      where: { id: locationId },
      select: { name: true },
    });
    locationName = loc?.name || '';
  }

  return {
    user,
    role,
    firstName,
    lastName,
    guardianName,
    mobileNumber,
    locationId,
    locationName,
    dob,
  };
}

export async function checkPendingUserConflict(userId: string) {
  await requireRole('admin');

  const details = await getPendingUserSignupDetails(userId);
  const academy = await prisma.academy.findFirst({
    where: { is_active: true },
    select: { id: true },
  });

  if (!academy) {
    throw new Error('No active academy found');
  }

  const orConditions: any[] = [];
  // 1. Mobile number match across academy
  if (details.mobileNumber) {
    orConditions.push({ mobile_number: details.mobileNumber });
  }

  // 2. Location-scoped name match: (location_id AND matching first_name + last_name)
  const trimmedFirst = details.firstName?.trim();
  const trimmedLast = details.lastName?.trim();

  if (details.locationId && trimmedFirst && trimmedLast) {
    orConditions.push({
      location_id: details.locationId,
      first_name: { equals: trimmedFirst, mode: 'insensitive' },
      last_name: { equals: trimmedLast, mode: 'insensitive' },
    });
  } else if (details.locationId && trimmedFirst) {
    orConditions.push({
      location_id: details.locationId,
      first_name: { equals: trimmedFirst, mode: 'insensitive' },
    });
  }

  if (orConditions.length === 0) {
    return {
      hasConflict: false,
      user: {
        id: details.user.id,
        email: details.user.email,
        firstName: details.firstName,
        lastName: details.lastName,
        mobileNumber: '',
        role: details.role,
        guardianName: details.guardianName,
        dob: details.dob,
        locationId: details.locationId,
        locationName: details.locationName,
      },
      matchingPlayers: [],
    };
  }

  const matchingPlayers = await prisma.player.findMany({
    where: {
      academy_id: academy.id,
      OR: orConditions,
    },
    include: {
      location: { select: { id: true, name: true } },
      user: { select: { id: true, first_name: true, last_name: true, email: true } },
      parents: {
        include: {
          parent: { select: { id: true, first_name: true, last_name: true, email: true } },
        },
      },
    },
  });

  return {
    hasConflict: matchingPlayers.length > 0,
    user: {
      id: details.user.id,
      email: details.user.email,
      firstName: details.firstName,
      lastName: details.lastName,
      mobileNumber: details.mobileNumber,
      role: details.role,
      guardianName: details.guardianName,
      dob: details.dob,
      locationId: details.locationId,
      locationName: details.locationName,
    },
    matchingPlayers: matchingPlayers.map((p) => ({
      id: p.id,
      first_name: p.first_name,
      last_name: p.last_name,
      mobile_number: p.mobile_number,
      email: p.email,
      dob: p.dob,
      is_active: p.is_active,
      location: p.location,
      linked_user: p.user,
      parents: p.parents,
    })),
  };
}

export async function resolveUserApproval(params: {
  userId: string;
  action: 'APPROVE_NEW_AND_LINK_EXISTING' | 'UPDATE_AND_APPROVE_DETAILS' | 'REJECT_REQUEST';
  mergePlayerId?: string;
  mergedData?: {
    firstName?: string;
    lastName?: string;
    dob?: string | null;
    locationId?: string;
    mobileNumber?: string;
  };
}): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole('admin');
    const { userId, action, mergePlayerId, mergedData } = params;
    if (!userId) {
      return { success: false, error: 'User ID is required' };
    }

    if (action === 'REJECT_REQUEST') {
      await prisma.user.update({
        where: { id: userId },
        data: { status: 'INACTIVE' },
      });
      revalidatePath('/admin');
      revalidateTag('user-profiles', 'default');
      return { success: true };
    }

    const details = await getPendingUserSignupDetails(userId);
    const academy = await prisma.academy.findFirst({
      where: { is_active: true },
      select: { id: true },
    });

    if (!academy) {
      return { success: false, error: 'No active academy found' };
    }

    let effectiveLocationId = details.locationId;
    if (!effectiveLocationId) {
      const firstLoc = await prisma.location.findFirst({
        where: { academy_id: academy.id },
        select: { id: true },
      });
      effectiveLocationId = firstLoc?.id || '';
    }

    if (action === 'APPROVE_NEW_AND_LINK_EXISTING') {
      await prisma.$transaction(async (tx) => {
        // 1. Activate user
        await tx.user.update({
          where: { id: userId },
          data: { status: 'ACTIVE' },
        });

        // 2. Create new player
        const newPlayer = await tx.player.create({
          data: {
            academy_id: academy.id,
            location_id: effectiveLocationId,
            user_id: details.role === 'player' ? userId : null,
            first_name: details.firstName,
            last_name: details.lastName,
            mobile_number: details.mobileNumber,
            email: details.role === 'player' ? details.user.email : null,
            dob: details.dob ? new Date(details.dob) : new Date(),
            is_active: true,
          },
        });

        // 3. If parent, link new child and all matching existing players with this phone number
        if (details.role === 'parent') {
          await tx.parentPlayer.create({
            data: {
              parent_user_id: userId,
              player_id: newPlayer.id,
            },
          });

          if (details.mobileNumber) {
            const matchingPlayers = await tx.player.findMany({
              where: {
                academy_id: academy.id,
                mobile_number: details.mobileNumber,
                id: { not: newPlayer.id },
              },
              select: { id: true },
            });

            for (const p of matchingPlayers) {
              await tx.parentPlayer.upsert({
                where: {
                  parent_user_id_player_id: {
                    parent_user_id: userId,
                    player_id: p.id,
                  },
                },
                create: {
                  parent_user_id: userId,
                  player_id: p.id,
                },
                update: {},
              });
            }
          }
        }
      });
    } else if (action === 'UPDATE_AND_APPROVE_DETAILS') {
      if (!mergePlayerId) {
        return { success: false, error: 'Target player record to merge is required' };
      }

      await prisma.$transaction(async (tx) => {
        // 1. Activate user
        await tx.user.update({
          where: { id: userId },
          data: { status: 'ACTIVE' },
        });

        const updatedFirstName = mergedData?.firstName?.trim() || details.firstName;
        const updatedLastName = mergedData?.lastName?.trim() || details.lastName;
        const updatedLocationId = mergedData?.locationId || effectiveLocationId;
        const updatedDob = mergedData?.dob ? new Date(mergedData.dob) : (details.dob ? new Date(details.dob) : undefined);
        const updatedMobile = mergedData?.mobileNumber ? normalizeIndianMobile(mergedData.mobileNumber) : details.mobileNumber;

        // 2. Overwrite existing player details and link user if player
        await tx.player.update({
          where: { id: mergePlayerId },
          data: {
            first_name: updatedFirstName,
            last_name: updatedLastName,
            location_id: updatedLocationId,
            dob: updatedDob,
            mobile_number: updatedMobile || undefined,
            user_id: details.role === 'player' ? userId : undefined,
          },
        });

        // 3. If parent, link existing player to parent
        if (details.role === 'parent') {
          await tx.parentPlayer.upsert({
            where: {
              parent_user_id_player_id: {
                parent_user_id: userId,
                player_id: mergePlayerId,
              },
            },
            create: {
              parent_user_id: userId,
              player_id: mergePlayerId,
            },
            update: {},
          });
        }
      });
    }

    revalidatePath('/admin');
    revalidatePath('/coach/player-list');
    revalidatePath('/coach/new-session');
    revalidatePath('/coach/attendance-report');
    revalidateTag('player-counts', 'default');
    revalidateTag('coach-player-list', 'default');
    revalidateTag('user-profiles', 'default');

    return { success: true };
  } catch (error: any) {
    console.error('Error resolving user approval:', error);
    return { success: false, error: error?.message || 'Failed to resolve user approval' };
  }
}

export async function approvePendingUser(userId: string): Promise<{ success: boolean; error?: string }> {
  return await resolveUserApproval({
    userId,
    action: 'APPROVE_NEW_AND_LINK_EXISTING',
  });
}

export async function approveUser(formData: FormData): Promise<void> {
  await requireRole('admin');
  const userId = formData.get('userId')?.toString().trim();
  if (!userId) return;
  await approvePendingUser(userId);
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
      location: { select: { id: true, name: true } },
    },
  },
  parent_of: {
    select: {
      player: {
        select: {
          id: true,
          location_id: true,
          location: { select: { id: true, name: true } },
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
    revalidateTag('coach-player-list', 'default');
    revalidateTag('user-profiles', 'default');

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
    revalidateTag('coach-player-list', 'default');
    revalidateTag('user-profiles', 'default');

    return { success: true };
  } catch (error: any) {
    console.error('Error reactivating player:', error);
    return { success: false, error: error?.message || 'Failed to reactivate player' };
  }
}


export async function addPlayerAdmin(formData: FormData): Promise<{ success: true; playerName: string } | { success: false; error: string }> {
  await requireRole('admin');

  const firstName = formData.get('firstName')?.toString().trim() || '';
  const lastName = formData.get('lastName')?.toString().trim() || '';
  const mobileNumber = normalizeIndianMobile(formData.get('mobileNumber')?.toString() || '');
  const locationId = formData.get('locationId')?.toString().trim() || '';
  const emailRaw = formData.get('email')?.toString().trim() || '';
  const email = emailRaw ? emailRaw.toLowerCase() : null;
  const dobRaw = formData.get('dob')?.toString().trim() || '';

  const validation = validateAdminPlayerData({
    firstName,
    lastName,
    mobileNumber,
    locationId,
    email: email || undefined,
    dob: dobRaw,
  });

  if (!validation.isValid && validation.error) {
    return { success: false, error: validation.error };
  }

  const dob = new Date(dobRaw);

  const academy = await prisma.academy.findFirst({
    where: { is_active: true },
    select: { id: true },
  });

  if (!academy) {
    return { success: false, error: 'No active academy available' };
  }

  try {
    await prisma.player.create({
      data: {
        academy_id: academy.id,
        location_id: locationId,
        first_name: firstName,
        last_name: lastName,
        mobile_number: mobileNumber,
        email,
        dob,
        user_id: null,
        is_active: true,
      },
    });

    revalidatePath('/admin');
    revalidatePath('/coach/player-list');
    revalidatePath('/coach/new-session');
    revalidatePath('/coach/attendance-report');
    revalidateTag('player-counts', 'default');
    revalidateTag('coach-player-list', 'default');
    revalidateTag('user-profiles', 'default');

    return { success: true, playerName: `${firstName} ${lastName}`.trim() };
  } catch (error: any) {
    console.error('Error adding player admin:', error);
    return { success: false, error: error?.message || 'Failed to add player' };
  }
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
  revalidateTag('coach-player-list', 'default');
  revalidateTag('user-profiles', 'default');
  return { success: true, email, passwordUsed: password };
}

/**
 * Fetches individual player records (from the players table) for the admin board.
 * Each row is one player — parents with multiple children appear as separate rows.
 */
export async function getPlayerRecords(status: 'active' | 'inactive') {
  await requireRole('admin');

  const players = await prisma.player.findMany({
    where: { is_active: status === 'active' },
    select: {
      id: true,
      first_name: true,
      last_name: true,
      dob: true,
      mobile_number: true,
      email: true,
      is_active: true,
      location: { select: { id: true, name: true } },
      // Self-login user linked directly
      user: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
        },
      },
      // Parent accounts linked via parent_player join table
      parents: {
        select: {
          parent: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: [{ location: { name: 'asc' } }, { first_name: 'asc' }],
  });

  return players.map((p) => ({
    id: p.id,
    first_name: p.first_name,
    last_name: p.last_name,
    dob: p.dob,
    mobile_number: p.mobile_number,
    email: p.email,
    is_active: p.is_active,
    location: p.location ?? null,
    linked_user: p.user ?? null,
    parent_accounts: p.parents.map((pp) => pp.parent),
  }));
}

/**
 * Deactivates a single player record by its players.id (not a user account id).
 */
export async function deactivatePlayerById(
  playerId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole('admin');
    if (!playerId) return { success: false, error: 'Player ID is required' };

    await prisma.player.update({
      where: { id: playerId },
      data: { is_active: false },
    });

    revalidatePath('/admin');
    revalidatePath('/coach/player-list');
    revalidatePath('/coach/new-session');
    revalidatePath('/coach/attendance-report');
    revalidateTag('player-counts', 'default');
    revalidateTag('coach-player-list', 'default');

    return { success: true };
  } catch (error: any) {
    console.error('Error deactivating player:', error);
    return { success: false, error: error?.message || 'Failed to deactivate player' };
  }
}

/**
 * Reactivates a single player record by its players.id.
 */
export async function reactivatePlayerById(
  playerId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole('admin');
    if (!playerId) return { success: false, error: 'Player ID is required' };

    await prisma.player.update({
      where: { id: playerId },
      data: { is_active: true },
    });

    revalidatePath('/admin');
    revalidatePath('/coach/player-list');
    revalidatePath('/coach/new-session');
    revalidatePath('/coach/attendance-report');
    revalidateTag('player-counts', 'default');
    revalidateTag('coach-player-list', 'default');

    return { success: true };
  } catch (error: any) {
    console.error('Error reactivating player:', error);
    return { success: false, error: error?.message || 'Failed to reactivate player' };
  }
}