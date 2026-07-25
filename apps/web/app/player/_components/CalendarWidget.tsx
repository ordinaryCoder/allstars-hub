export function CalendarWidget({ monthName, attendanceMap }: { monthName: string; attendanceMap: Record<number, string> }) {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay(); // 0 is Sun, 1 is Mon
  const startOffset = firstDay === 0 ? 6 : firstDay - 1; // Mon=0..Sun=6
  
  const prevMonthDays = new Date(year, month, 0).getDate();
  const pastDates = Array.from({ length: startOffset }, (_, i) => prevMonthDays - startOffset + i + 1);
  const currentDates = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const futureDates = Array.from({ length: 42 - (pastDates.length + currentDates.length) }, (_, i) => i + 1);

  return (
    <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-900">{monthName}</h2>
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
          const status = attendanceMap[d];
          if (status === 'Absent') return <div key={d} className="h-9 w-9 mx-auto flex items-center justify-center font-bold text-white bg-rose-500 rounded-full shadow-sm">{d}</div>;
          if (status === 'Present') return <div key={d} className="h-9 w-9 mx-auto flex items-center justify-center font-bold text-white bg-emerald-500 rounded-full shadow-sm">{d}</div>;
          if (status === 'Late') return <div key={d} className="h-9 w-9 mx-auto flex items-center justify-center font-bold text-white bg-amber-500 rounded-full shadow-sm">{d}</div>;
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