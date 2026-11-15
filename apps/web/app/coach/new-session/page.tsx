import Link from 'next/link';
import { requireRole } from '@/lib/dal';
import { prisma } from '@packages/database';
import { TopAppBar } from '@/components/layout/TopAppBar';
import { signOut } from '@/app/(auth)/_actions/auth';
import AttendanceRoster from './_components/AttendanceRoster';
import { saveAttendance } from './_actions/action';

export default async function NewSessionPage({ searchParams }: { searchParams: Promise<{ locationId?: string; sessionId?: string }> }) {
  const user = await requireRole('coach');

  const resolvedParams = await searchParams;
  const sessionId = resolvedParams.sessionId || undefined;
  const targetLocationId = resolvedParams.locationId;

  // 1. Fetch coach user details, locations assigned to the coach (and players in parallel if locationId is known)
  const [dbUser, coachLocations, initialPlayers] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { first_name: true, last_name: true },
    }),
    prisma.coachLocation.findMany({
      where: { user_id: user.id },
      include: { location: true },
    }),
    targetLocationId
      ? prisma.player.findMany({
          where: { location_id: targetLocationId, is_active: true },
          orderBy: { first_name: 'asc' },
          select: { id: true, first_name: true, last_name: true },
        })
      : Promise.resolve(null),
  ]);

  const coachName = dbUser?.first_name && dbUser?.last_name
    ? `${dbUser.first_name} ${dbUser.last_name}`.trim()
    : user.email?.split('@')[0] || 'Coach';

  const initials = coachName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const locations = coachLocations.map(cl => ({
    id: cl.location.id,
    name: cl.location.name,
  }));

  const selectedLocationId = targetLocationId || locations[0]?.id || '';
  const selectedLocation = locations.find(l => l.id === selectedLocationId) || locations[0];

  let players: { id: string; firstName: string; lastName: string }[] = [];
  if (initialPlayers) {
    players = initialPlayers.map(p => ({
      id: p.id,
      firstName: p.first_name,
      lastName: p.last_name,
    }));
  } else if (selectedLocationId) {
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
        {/* TopAppBar with back arrow to /coach */}
        <TopAppBar
          title="Session Setup"
          backHref="/coach"
          userName={coachName}
          initials={initials}
          signOut={signOut}
        />

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