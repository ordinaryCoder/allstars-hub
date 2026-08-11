import { unstable_cache } from 'next/cache';
import { prisma } from '@packages/database';

/**
 * Cached fetch for active locations (revalidates every 60s or on demand via 'locations' tag).
 */
export const getActiveLocationsCached = unstable_cache(
  async () => {
    return prisma.location.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  },
  ['active-locations-list'],
  { revalidate: 60, tags: ['locations'] }
);

/**
 * Cached fetch for active player counts grouped by location_id (revalidates every 60s or on demand via 'player-counts' tag).
 */
export const getActivePlayerCountsCached = unstable_cache(
  async () => {
    const activePlayersPerLocation = await prisma.player.groupBy({
      by: ['location_id'],
      where: { is_active: true },
      _count: { _all: true },
    });

    const locationPlayerCounts: Record<string, number> = {};
    activePlayersPerLocation.forEach((group) => {
      if (group.location_id) {
        locationPlayerCounts[group.location_id] = group._count._all;
      }
    });
    return locationPlayerCounts;
  },
  ['active-player-counts-by-location'],
  { revalidate: 60, tags: ['player-counts'] }
);

/**
 * Cached fetch for coach's player list (active and inactive players across assigned locations).
 */
export async function getCoachPlayersListCached(coachUserId: string) {
  return unstable_cache(
    async () => {
      const [coachLocations, rawPlayers] = await Promise.all([
        prisma.coachLocation.findMany({
          where: { user_id: coachUserId },
          include: { location: true },
        }),
        prisma.player.findMany({
          where: {
            location: {
              coachLocations: { some: { user_id: coachUserId } },
            },
          },
          include: {
            location: true,
            parents: {
              include: { parent: true },
            },
          },
          orderBy: [
            { location: { name: 'asc' } },
            { first_name: 'asc' },
          ],
        }),
      ]);

      const locations = coachLocations.map((cl) => ({
        id: cl.location.id,
        name: cl.location.name,
        address: cl.location.address,
      }));

      const players = rawPlayers.map((p) => {
        let age: number | null = null;
        if (p.dob) {
          const birthDate = new Date(p.dob);
          const today = new Date();
          age = today.getFullYear() - birthDate.getFullYear();
          const m = today.getMonth() - birthDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
        }

        return {
          id: p.id,
          firstName: p.first_name,
          lastName: p.last_name,
          dob: p.dob.toISOString(),
          age,
          isActive: p.is_active,
          locationId: p.location_id,
          locationName: p.location?.name || 'Unknown Location',
          parents: p.parents.map((pp) => ({
            id: pp.parent.id,
            name: `${pp.parent.first_name} ${pp.parent.last_name}`.trim(),
            phone: pp.parent.mobile_number ?? null,
            email: pp.parent.email,
          })),
        };
      });

      return { locations, players };
    },
    [`coach-players-${coachUserId}`],
    { revalidate: 60, tags: ['coach-player-list', `coach-player-list-${coachUserId}`] }
  )();
}

/**
 * Cached fetch for full profile data across admin, coaches, players, and parents.
 */
export async function getUserProfileDataCached(userId: string) {
  return unstable_cache(
    async () => {
      const [dbUser, player, totalSessions, activePlayersCount] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          include: {
            coachLocations: {
              include: {
                location: true,
              },
            },
            academy_roles: {
              include: {
                academy: true,
              },
            },
          },
        }),
        prisma.player.findFirst({
          where: {
            OR: [
              { user_id: userId },
              { parents: { some: { parent_user_id: userId } } },
            ],
          },
          include: {
            parents: {
              include: { parent: true },
            },
          },
        }),
        prisma.session.count({
          where: {
            OR: [
              { created_by: userId },
              { coach_id: userId },
            ],
          },
        }),
        prisma.player.count({
          where: {
            is_active: true,
            location: {
              coachLocations: {
                some: { user_id: userId },
              },
            },
          },
        }),
      ]);

      return {
        dbUser,
        player,
        totalSessions,
        activePlayersCount,
      };
    },
    [`user-profile-${userId}`],
    { revalidate: 60, tags: ['user-profiles', `user-profile-${userId}`] }
  )();
}
