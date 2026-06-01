export function TopAppBar({ signOut }: { signOut: () => void }) {
  return (
    <header className="flex justify-between items-center w-full px-4 h-16 sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm antialiased">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-slate-900">sports_score</span>
        <h1 className="text-lg font-bold text-slate-900">Elite Sports Academy</h1>
      </div>
      <form action={signOut}>
        <button type="submit" className="w-9 h-9 rounded-full overflow-hidden border border-slate-200 flex items-center justify-center bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all" title="Sign out">
          <span className="material-symbols-outlined text-[20px] text-slate-600">logout</span>
        </button>
      </form>
    </header>
  )
}