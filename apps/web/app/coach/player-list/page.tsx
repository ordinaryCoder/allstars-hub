import { createClient } from '@/lib/server';
import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/dal';
import { prisma } from '@packages/database';
import { CoachBottomNav } from '@/components/layout/CoachBottomNav';
import { PlayerListBoard, SerializedPlayer, SerializedLocation } from './_components/PlayerListBoard';

export default async function CoachPlayersListPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  await requireRole(user.id, 'coach');

  // Fetch coach's assigned locations
  const coachLocations = await prisma.coachLocation.findMany({
    where: { user_id: user.id },
    include: { location: true },
  });

  const locations: SerializedLocation[] = coachLocations.map(cl => ({
    id: cl.location.id,
    name: cl.location.name,
    address: cl.location.address,
  }));

  // Fetch all players for the locations the coach has access to (no batch query for Phase 1)
  const rawPlayers = await prisma.player.findMany({
    where: {
      location: {
        coachLocations: { some: { user_id: user.id } },
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
  });

  const players: SerializedPlayer[] = rawPlayers.map((p) => {
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

  return (
    <div className="bg-slate-50 text-slate-900 antialiased min-h-screen font-sans">
      <div className="max-w-[448px] mx-auto min-h-screen bg-slate-50 flex flex-col relative pb-24">
        {/* Header */}
        <header className="flex justify-between items-center w-full px-4 h-16 sticky top-0 z-50 bg-white shadow-sm border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
              <span className="material-symbols-outlined text-[20px]">groups</span>
            </div>
            <div className="flex flex-col">
              <h1 className="font-bold text-base text-slate-900">Location Players</h1>
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                {locations.length} {locations.length === 1 ? 'Location' : 'Locations'} Assigned
              </span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-4 py-6">
          <PlayerListBoard players={players} locations={locations} />
        </main>

        <CoachBottomNav currentTab="player-list" />
      </div>
    </div>
  );
}
