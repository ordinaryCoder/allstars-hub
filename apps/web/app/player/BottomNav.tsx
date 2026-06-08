export function BottomNav({ currentTab = 'home' }: { currentTab?: 'home' | 'profile' }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-[448px] mx-auto w-full z-50 flex justify-around items-center h-20 px-2 pb-2 bg-white border-t border-slate-200 shadow-[0_-1px_3px_0_rgba(0,0,0,0.05)]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <a className={`flex flex-col items-center justify-center rounded-xl px-3 py-1 active:scale-95 transition-transform duration-150 ${currentTab === 'home' ? 'text-slate-900 bg-slate-100' : 'text-slate-500 hover:text-slate-700'}`} href="/player">
        <span className="material-symbols-outlined" style={{ fontVariationSettings: currentTab === 'home' ? "'FILL' 1" : "'FILL' 0" }}>home</span>
        <span className="text-[12px] font-medium">Home</span>
      </a>
      <a className={`flex flex-col items-center justify-center rounded-xl px-3 py-1 active:scale-95 transition-transform duration-150 ${currentTab === 'profile' ? 'text-slate-900 bg-slate-100' : 'text-slate-500 hover:text-slate-700'}`} href="/player/profile">
        <span className="material-symbols-outlined" style={{ fontVariationSettings: currentTab === 'profile' ? "'FILL' 1" : "'FILL' 0" }}>person</span>
        <span className="text-[12px] font-medium">Profile</span>
      </a>
    </nav>
  );
}