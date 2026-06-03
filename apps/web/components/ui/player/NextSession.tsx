export function NextSession() {
  return (
    <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <span className="inline-block px-2 py-0.5 bg-indigo-100 text-indigo-900 text-[10px] font-bold rounded uppercase tracking-wider mb-2">Next Session</span>
          <h2 className="text-lg font-bold text-slate-900">Evening Football U-15</h2>
        </div>
        <button className="bg-slate-900 text-white p-2.5 rounded-xl flex items-center justify-center active:scale-95 transition-transform">
          <span className="material-symbols-outlined text-[20px]">qr_code_2</span>
        </button>
      </div>
      <div className="grid grid-cols-2 gap-y-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-slate-400 text-[20px]">schedule</span>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Time</span>
            <span className="text-sm font-medium">Today, 5:00 PM</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-slate-400 text-[20px]">location_on</span>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Location</span>
            <span className="text-sm font-medium truncate">Main Stadium</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-slate-400 text-[20px]">apparel</span>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Uniform</span>
            <span className="text-sm font-medium">Blue Kit</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-slate-400 text-[20px]">person</span>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Coach</span>
            <span className="text-sm font-medium">Michael</span>
          </div>
        </div>
      </div>
      <div className="pt-2 flex gap-3">
        <button className="flex-1 py-2.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl text-sm font-medium active:scale-[0.98] transition-all flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          Going
        </button>
        <button className="flex-1 py-2.5 bg-white text-slate-400 border border-slate-200 rounded-xl text-sm font-medium active:scale-[0.98] transition-all flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-[18px]">cancel</span>
          Not Going
        </button>
      </div>
    </section>
  );
}