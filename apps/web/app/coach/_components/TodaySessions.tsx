export function TodaySessions({ sessions }: { sessions: any[] }) {

  const now = new Date();

  return (
    <section className="flex flex-col gap-4">
      <div className="flex justify-between items-center px-1">
        <h2 className="text-lg font-bold text-slate-900">Today's Sessions</h2>
        <button className="text-slate-500 text-xs font-semibold tracking-wider hover:text-slate-700 transition-colors uppercase">
          View Schedule
        </button>
      </div>
      <div className="flex flex-col gap-3">
        {sessions.length === 0 ? (
          <div className="text-sm text-slate-500 py-4 text-center bg-white rounded-2xl shadow-sm border border-slate-100">
            No sessions scheduled for today.
          </div>
        ) : (
          sessions.map((session) => {
            const isCompleted = now > session.end_time;
            const isActive = now >= session.start_time && now <= session.end_time;
            const statusLabel = isActive ? 'ACTIVE' : isCompleted ? 'COMPLETED' : 'UPCOMING';
            const title = session.batches.map((b: { batch: { name: string } }) => b.batch.name).join(', ') || 'Untitled Session';

            const timeString = new Intl.DateTimeFormat('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            }).format(new Date(session.start_time));

            return (
              <div key={session.id} className={`bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3 ${isCompleted ? 'opacity-80' : ''}`}>
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <h3 className={`text-lg font-bold ${isCompleted ? 'text-slate-500' : 'text-slate-900'}`}>{title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <div className={`flex items-center gap-1 ${isCompleted ? 'text-slate-400' : 'text-slate-500'}`}>
                        <span className="material-symbols-outlined text-[16px]">schedule</span>
                        <span className="text-sm font-normal">{timeString}</span>
                      </div>
                      <div className={`flex items-center gap-1 ${isCompleted ? 'text-slate-400' : 'text-slate-500'}`}>
                        <span className="material-symbols-outlined text-[16px]">location_on</span>
                        <span className="text-sm font-normal">{session.location?.name || 'Unassigned'}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-[11px] font-bold rounded-full border ${isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : isCompleted ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                    {statusLabel}
                  </span>
                </div>

                {!isCompleted && (
                  <>
                    <div className="h-[1px] bg-slate-50 w-full"></div>
                    <div className="flex justify-between items-center">
                      <button className="bg-slate-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-800 active:scale-95 transition-all w-full">
                        {isActive ? 'Resume Session' : 'Start Session'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}