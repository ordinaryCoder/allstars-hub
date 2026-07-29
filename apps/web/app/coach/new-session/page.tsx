import Link from 'next/link';
import { createClient } from '../../../lib/server';
import { prisma } from '@packages/database';
import { redirect } from 'next/navigation';
import AttendanceRoster from './_components/AttendanceRoster';
import { saveAttendance } from './_actions/action';

export default async function NewSessionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch all players for locations the coach has access to and group by location
  const locationPlayers = await prisma.player.findMany({
    where: {
      location: {
        coachLocations: { some: { user_id: user.id } }
      }
    },
    include: { location: true },
    orderBy: { first_name: 'asc' },
  });

  const playersByLocationMap = new Map();
  locationPlayers.forEach(p => {
    const locId = p.location_id;
    const locName = p.location?.name || 'Unknown';
    if (!playersByLocationMap.has(locId)) {
      playersByLocationMap.set(locId, { locationId: locId, locationName: locName, players: [] });
    }
    playersByLocationMap.get(locId).players.push({ id: p.id, firstName: p.first_name, lastName: p.last_name });
  });

  const playersByLocation = Array.from(playersByLocationMap.values());

  return (
    <>
      <div className="bg-slate-50 text-slate-900 antialiased min-h-screen font-sans">
        <div className="max-w-[448px] mx-auto min-h-screen bg-slate-50 flex flex-col relative pb-32">
      {/* TopAppBar */}
      <header className="flex items-center justify-between px-4 h-16 w-full sticky top-0 z-50 bg-white border-b border-black/10 shadow-sm">
        <div className="flex items-center gap-4 w-full">
          <Link 
            href="/coach" 
            aria-label="Go back" 
            className="flex items-center justify-center w-11 h-11 -ml-2 rounded-full text-slate-900 active:opacity-70 transition-opacity duration-150"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="font-semibold text-lg tracking-tight text-slate-900">Session Setup</h1>
        </div>
      </header>

      <AttendanceRoster playersByLocation={playersByLocation} onSave={saveAttendance} />
    </div>
    </div>
    </>
  );
}