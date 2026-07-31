"use server";
import { createClient } from '@/lib/server';
import { prisma } from '@packages/database';

export async function saveAttendance(payload: {
  attendance: Record<string, string>,
  playersByLocation?: { locationId: string; players: { id: string }[] }[],
  sessionId?: string
}) {
  try {
    const { attendance, playersByLocation, sessionId } = payload;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    // Ensure user exists in public.users to satisfy foreign key constraints
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: {
        id: user.id,
        email: user.email || '',
        first_name: user.user_metadata?.first_name || 'Coach',
        last_name: user.user_metadata?.last_name || '',
        mobile_number: user.user_metadata?.mobile_number || null,
      },
    });

    if (sessionId) {
      // 1. Scheduled Session (pre-created by Admin or Scheduler with location and coach)
      const existingSession = await prisma.session.findUnique({
        where: { id: sessionId },
        select: { id: true, academy_id: true, location_id: true, coach_id: true, created_by: true }
      });
      if (!existingSession) throw new Error('Scheduled session not found');

      const targetSessionId = existingSession.id;
      const academyId = existingSession.academy_id;

      // Collect all player rows to insert
      const allPlayers: { id: string }[] = [];
      if (playersByLocation) {
        playersByLocation.forEach(loc => {
          (loc.players || []).forEach(p => allPlayers.push({ id: p.id }));
        });
      }

      const rows = allPlayers.map(p => {
        const val = attendance?.[p.id] || '';
        let status: 'PRESENT' | 'ABSENT' | 'LATE' = 'ABSENT';
        if (val === 'P') status = 'PRESENT';
        else if (val === 'A') status = 'ABSENT';
        else if (val === 'L') status = 'LATE';

        return {
          academy_id: academyId,
          session_id: targetSessionId,
          player_id: p.id,
          marked_by: user.id,
          status,
        };
      });

      if (rows.length > 0) {
        await prisma.attendance.createMany({ data: rows });
      }

      return { ok: true, sessionId: targetSessionId };
    } else {
      // 2. Spontaneous Session (Created on the fly by Coach inside a transaction)
      if (!playersByLocation || playersByLocation.length === 0) {
        throw new Error('No players provided');
      }

      // Enforce single-location constraint (no mixing of players from multiple locations)
      const distinctLocationIds = new Set(
        playersByLocation.map(loc => loc.locationId).filter(Boolean)
      );
      if (distinctLocationIds.size > 1) {
        throw new Error('Attendance cannot be marked for players across multiple locations in a single session.');
      }

      const rosterLocationId = playersByLocation[0]?.locationId;

      // Priority 1 (Primary): Location assigned to the coach in CoachLocation
      let locationId: string | undefined;
      const coachLoc = await prisma.coachLocation.findFirst({
        where: { user_id: user.id },
        select: { location_id: true }
      });
      if (coachLoc?.location_id) {
        locationId = coachLoc.location_id;
      }

      // Priority 2 (Secondary / Fallback): Selected roster location ID or player's primary location
      if (!locationId) {
        locationId = rosterLocationId;
      }

      if (!locationId) {
        const firstPlayerId = playersByLocation[0]?.players?.[0]?.id;
        if (firstPlayerId) {
          const firstPlayer = await prisma.player.findUnique({
            where: { id: firstPlayerId },
            select: { academy_id: true, location_id: true }
          });
          locationId = firstPlayer?.location_id;
        }
      }

      if (!locationId) {
        throw new Error('No location assigned to coach or selected roster.');
      }

      // Fetch academy ID from location
      const loc = await prisma.location.findUnique({
        where: { id: locationId },
        select: { academy_id: true }
      });
      if (!loc) throw new Error('Location not found');
      const academyId = loc.academy_id;

      // Wrap spontaneous session creation and attendance insertion inside atomic transaction
      return await prisma.$transaction(async (tx) => {
        const now = new Date();

        const newSession = await tx.session.create({
          data: {
            academy_id: academyId,
            location_id: locationId,
            created_by: user.id,
            coach_id: user.id,
            start_time: now,
            end_time: now,
          }
        });

        // Collect all player rows to insert
        const allPlayers: { id: string }[] = [];
        if (playersByLocation) {
          playersByLocation.forEach(l => {
            (l.players || []).forEach(p => allPlayers.push({ id: p.id }));
          });
        }

        const rows = allPlayers.map(p => {
          const val = attendance?.[p.id] || '';
          let status: 'PRESENT' | 'ABSENT' | 'LATE' = 'ABSENT';
          if (val === 'P') status = 'PRESENT';
          else if (val === 'A') status = 'ABSENT';
          else if (val === 'L') status = 'LATE';

          return {
            academy_id: academyId,
            session_id: newSession.id,
            player_id: p.id,
            marked_by: user.id,
            status,
          };
        });

        if (rows.length > 0) {
          await tx.attendance.createMany({ data: rows });
        }

        return { ok: true, sessionId: newSession.id };
      });
    }
  } catch (e) {
    console.error('saveAttendance action error', e);
    throw e;
  }
}

