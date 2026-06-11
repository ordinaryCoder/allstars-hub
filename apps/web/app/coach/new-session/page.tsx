import Link from 'next/link';
import { createClient } from '../../../lib/server';
import { prisma } from '../../../../../packages/database';
import { redirect } from 'next/navigation';
import { NewSessionForm } from './NewSessionForm';

export default async function NewSessionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const coachBatches = await prisma.batch.findMany({
    where: {
      location: {
        coachLocations: { some: { user_id: user.id } }
      }
    },
    include: { location: true, players: true }
  });

  const batches = coachBatches.map(batch => ({
    id: batch.id,
    name: batch.name,
    locationId: batch.location_id,
    locationName: batch.location.name,
    playerCount: batch.players.length,
  }));

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{ __html: `
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
      `}} />
      <div className="bg-slate-50 text-slate-900 antialiased min-h-screen font-sans">
        <div className="max-w-[448px] mx-auto min-h-screen bg-slate-50 flex flex-col relative pb-32">
      {/* TopAppBar */}
      <header className="flex items-center justify-between px-4 h-16 w-full sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
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

      <NewSessionForm batches={batches} />
    </div>
    </div>
    </>
  );
}