import Link from 'next/link';

export interface SessionLocation {
  name: string;
}

export interface Session {
  id: string;
  location_id?: string | null;
  start_time: Date;
  end_time: Date;
  location?: SessionLocation | null;
  attendance?: { id: string }[] | null;
}

export function TodaySessions({ sessions }: { sessions: Session[] }) {
  const now = new Date();

  return (
    <section className="flex flex-col gap-4">
      <div className="flex justify-between items-center px-1">
        <h2 className="text-lg font-bold text-slate-900">Today's Sessions</h2>
      </div>
      <div className="flex flex-col gap-3">
        {sessions.length === 0 ? (
          <div className="text-sm text-slate-500 py-4 text-center bg-white rounded-2xl shadow-sm border border-slate-100">
            No sessions scheduled for today.
          </div>
        ) : (
          sessions.map((session) => {
            const hasAttendance = Array.isArray(session.attendance) && session.attendance.length > 0;
            const isCompleted = now > session.end_time || hasAttendance;
            const isActive = !isCompleted && now >= session.start_time && now <= session.end_time;
            const statusLabel = hasAttendance ? 'COMPLETED' : isActive ? 'ACTIVE' : isCompleted ? 'COMPLETED' : 'UPCOMING';
            const locationTitle = session.location?.name || 'Unassigned Location';

            const timeString = new Intl.DateTimeFormat('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            }).format(new Date(session.start_time));

            return (
              <div key={session.id} className={`bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3 ${isCompleted ? 'opacity-80' : ''}`}>
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <h3 className={`text-lg font-bold ${isCompleted ? 'text-slate-500' : 'text-slate-900'}`}>{locationTitle}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <div className={`flex items-center gap-1 ${isCompleted ? 'text-slate-400' : 'text-slate-500'}`}>
                        <span className="material-symbols-outlined text-[16px]">schedule</span>
                        <span className="text-sm font-normal">{timeString}</span>
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
                      <Link
                        href={`/coach/new-session?sessionId=${session.id}${session.location_id ? `&locationId=${session.location_id}` : ''}`}
                        className="bg-slate-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-800 active:scale-95 transition-all w-full text-center block"
                      >
                        Mark Attendance
                      </Link>
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