export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-[448px] mx-auto w-full z-50 flex justify-around items-center h-20 px-2 pb-2 bg-white border-t border-slate-200 shadow-[0_-1px_3px_0_rgba(0,0,0,0.05)]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <a className="flex flex-col items-center justify-center text-slate-900 bg-slate-100 rounded-xl px-3 py-1 active:scale-95 transition-transform duration-150" href="#">
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
        <span className="text-[12px] font-medium">Home</span>
      </a>
      <a className="flex flex-col items-center justify-center text-slate-500 px-3 py-1 hover:text-slate-700 active:scale-95 transition-transform duration-150" href="#">
        <span className="material-symbols-outlined">calendar_month</span>
        <span className="text-[12px] font-medium">Calendar</span>
      </a>
      <a className="flex flex-col items-center justify-center text-slate-500 px-3 py-1 hover:text-slate-700 active:scale-95 transition-transform duration-150" href="#">
        <span className="material-symbols-outlined">person</span>
        <span className="text-[12px] font-medium">Profile</span>
      </a>
    </nav>
  );
}