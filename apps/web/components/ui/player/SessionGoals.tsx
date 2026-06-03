export function SessionGoals() {
  return (
    <section className="space-y-3">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 space-y-4">
          <div>
            <h4 className="text-xs font-semibold text-slate-900 mb-2 uppercase tracking-wide">GOALS FOR SESSIONS</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="material-symbols-outlined text-slate-400">circle</span>
                <span className="text-sm text-slate-700">Practice 50 left-foot passes</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="material-symbols-outlined text-emerald-500" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <span className="text-sm text-slate-500 line-through">Improve sprint recovery time</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}