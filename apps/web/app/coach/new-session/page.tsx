import Link from 'next/link';
import { createClient } from '../../../lib/server';
import { prisma } from '@packages/database';
import { redirect } from 'next/navigation';
import AttendanceRoster from './_components/AttendanceRoster';
import { saveAttendance } from './_actions/action';

export default async function NewSessionPage({ searchParams }: { searchParams: Promise<{ locationId?: string; sessionId?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const resolvedParams = await searchParams;
  const sessionId = resolvedParams.sessionId || undefined;

  // 1. Fetch locations assigned to the coach
  const coachLocations = await prisma.coachLocation.findMany({
    where: { user_id: user.id },
    include: { location: true },
  });

  const locations = coachLocations.map(cl => ({
    id: cl.location.id,
    name: cl.location.name,
  }));

  // Default to first assigned location if not specified in searchParams
  const selectedLocationId = resolvedParams.locationId || locations[0]?.id || '';
  const selectedLocation = locations.find(l => l.id === selectedLocationId) || locations[0];

  // 2. Fetch ONLY players for the selected location
  let players: { id: string; firstName: string; lastName: string }[] = [];
  if (selectedLocationId) {
    const dbPlayers = await prisma.player.findMany({
      where: {
        location_id: selectedLocationId,
        is_active: true,
      },
      orderBy: { first_name: 'asc' },
      select: {
        id: true,
        first_name: true,
        last_name: true,
      },
    });

    players = dbPlayers.map(p => ({
      id: p.id,
      firstName: p.first_name,
      lastName: p.last_name,
    }));
  }

  const playersByLocation = selectedLocation ? [{
    locationId: selectedLocation.id,
    locationName: selectedLocation.name,
    players,
  }] : [];

  return (
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

        <AttendanceRoster 
          locations={locations}
          selectedLocationId={selectedLocationId}
          playersByLocation={playersByLocation} 
          sessionId={sessionId}
          onSave={saveAttendance} 
        />
      </div>
    </div>
  );
}