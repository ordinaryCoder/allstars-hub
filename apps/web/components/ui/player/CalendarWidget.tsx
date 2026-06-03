export function CalendarWidget() {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const pastDates = [25, 26, 27, 28, 29, 30]; // 29 was missing in original HTML, fixed here
  const currentDates = Array.from({ length: 31 }, (_, i) => i + 1);
  const futureDates = [1, 2, 3, 4, 5];

  return (
    <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-900">October 2023</h2>
        <div className="flex gap-4">
          <span className="material-symbols-outlined text-slate-400 cursor-pointer">chevron_left</span>
          <span className="material-symbols-outlined text-slate-400 cursor-pointer">chevron_right</span>
        </div>
      </div>
      <div className="grid grid-cols-7 text-center mb-4">
        {days.map((d, i) => (
          <span key={i} className="text-xs font-semibold text-slate-400 tracking-wide">{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-2 gap-x-1">
        {pastDates.map((d, i) => <div key={`p-${i}`} className="h-9 flex items-center justify-center opacity-25 text-sm">{d}</div>)}
        {currentDates.map((d) => {
          // Simulate the specific statuses from the HTML snippet
          if (d === 19) return <div key={d} className="h-9 w-9 mx-auto flex items-center justify-center font-bold text-white bg-rose-500 rounded-full shadow-sm">{d}</div>;
          if (d === 22 || d === 24) return <div key={d} className="h-9 w-9 mx-auto flex items-center justify-center font-bold text-white bg-emerald-500 rounded-full shadow-sm">{d}</div>;
          if (d === 26) return <div key={d} className="h-9 w-9 mx-auto flex items-center justify-center font-bold text-white bg-amber-500 rounded-full shadow-sm">{d}</div>;
          return <div key={d} className="h-9 flex items-center justify-center text-sm">{d}</div>;
        })}
        {futureDates.map((d, i) => <div key={`f-${i}`} className="h-9 flex items-center justify-center opacity-25 text-sm">{d}</div>)}
      </div>
      <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-center gap-6">
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500 rounded-full"></div><span className="text-[11px] font-semibold text-slate-500 uppercase">Present</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-rose-500 rounded-full"></div><span className="text-[11px] font-semibold text-slate-500 uppercase">Absent</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-amber-500 rounded-full"></div><span className="text-[11px] font-semibold text-slate-500 uppercase">Excused</span></div>
      </div>
    </section>
  );
}