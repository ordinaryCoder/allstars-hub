"use server";
import { createClient } from '@/lib/server';
import { prisma } from '../../../../../../packages/database';

export async function saveAttendance(payload: { attendance: Record<string, string>, playersByLocation?: { locationId: string; players: { id: string }[] }[] }) {
  try {
    const { attendance, playersByLocation } = payload;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    if (!playersByLocation || playersByLocation.length === 0) {
      throw new Error('No players provided');
    }

    const firstPlayerId = playersByLocation[0]?.players?.[0]?.id;
    if (!firstPlayerId) throw new Error('No player ids');

    const firstPlayer = await prisma.player.findUnique({ where: { id: firstPlayerId }, select: { academy_id: true, location_id: true } });
    if (!firstPlayer) throw new Error('Player not found');

    const academyId = firstPlayer.academy_id;
    const locationId = firstPlayer.location_id ?? playersByLocation[0]?.locationId ?? null;

    const now = new Date();

    const session = await prisma.session.create({
      data: {
        academy_id: academyId,
        location_id: locationId ?? academyId,
        created_by: user.id,
        start_time: now,
        end_time: now,
      }
    });

    const allPlayers: { id: string }[] = [];
    playersByLocation.forEach(loc => {
      (loc.players || []).forEach(p => allPlayers.push({ id: p.id }));
    });

    const rows = allPlayers.map(p => {
      const val = attendance?.[p.id] || '';
      let status: 'PRESENT' | 'ABSENT' | 'LEAVE' = 'ABSENT';
      if (val === 'P') status = 'PRESENT';
      else if (val === 'A') status = 'ABSENT';
      else if (val === 'L') status = 'PRESENT';

      return {
        academy_id: academyId,
        session_id: session.id,
        player_id: p.id,
        marked_by: user.id,
        status,
      };
    });

    await prisma.attendance.createMany({ data: rows });

    return { ok: true };
  } catch (e) {
    console.error('saveAttendance action error', e);
    throw e;
  }
}
