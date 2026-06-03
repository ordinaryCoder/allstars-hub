export function AttendanceHealth() {
  return (
    <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <p className="text-slate-600 text-xs font-semibold mb-4 uppercase tracking-wider">Attendance Health</p>
      <div className="flex items-center gap-8">
        <div className="relative flex items-center justify-center">
          <svg className="w-24 h-24 transform -rotate-90">
            <circle className="text-slate-100" cx="48" cy="48" fill="transparent" r="42" stroke="currentColor" strokeWidth="8"></circle>
            <circle className="text-emerald-500 transition-all duration-1000 ease-out" cx="48" cy="48" fill="transparent" r="42" stroke="currentColor" strokeDasharray="263.89" strokeDashoffset="21.11" strokeLinecap="round" strokeWidth="8"></circle>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold">92%</span>
          </div>
        </div>
        <div className="flex-1 grid grid-cols-1 gap-3">
          <div className="flex items-center justify-between border-b border-slate-50 pb-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-slate-600 text-sm">Attended</span>
            </div>
            <span className="text-sm font-medium text-slate-900">23</span>
          </div>
          <div className="flex items-center justify-between border-b border-slate-50 pb-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span className="text-slate-600 text-sm">Missed</span>
            </div>
            <span className="text-sm font-medium text-slate-900">2</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-200"></span>
              <span className="text-slate-600 text-xs">Total Sessions</span>
            </div>
            <span className="text-xs font-semibold text-slate-400">25</span>
          </div>
        </div>
      </div>
    </section>
  );
}