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
