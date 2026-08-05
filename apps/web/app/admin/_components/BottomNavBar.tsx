import Link from 'next/link'

export function BottomNavBar({ currentTab }: { currentTab: string }) {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[448px] z-50 flex justify-around items-center h-20 px-2 pb-2 bg-white/80 backdrop-blur-md border-t border-slate-200 shadow-lg" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <Link href="/admin?tab=home" className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${currentTab === 'home' ? 'text-slate-900 bg-slate-100' : 'text-slate-500 hover:bg-slate-50'}`}>
        <span className="material-symbols-outlined" style={{ fontVariationSettings: currentTab === 'home' ? "'FILL' 1" : "'FILL' 0" }}>home</span>
        <span className="text-[11px] font-medium mt-1">Home</span>
      </Link>
      <Link href="/admin?tab=users" className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${currentTab === 'users' ? 'text-slate-900 bg-slate-100' : 'text-slate-500 hover:bg-slate-50'}`}>
        <span className="material-symbols-outlined" style={{ fontVariationSettings: currentTab === 'users' ? "'FILL' 1" : "'FILL' 0" }}>group</span>
        <span className="text-[11px] font-medium mt-1">Users</span>
      </Link>
    </nav>
  )
}