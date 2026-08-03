export function TopAppBar({ userName, initials, signOut }: { userName?: string; initials?: string; signOut?: () => void }) {
  return (
    <header className="flex justify-between items-center w-full px-4 h-16 sticky top-0 z-50 bg-white shadow-sm border-b border-slate-200">
      <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200 max-w-[260px]">
        <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
          {initials || 'U'}
        </div>
        <span className="text-xs font-bold text-slate-900 truncate">{userName || 'User'}</span>
      </div>
      <div className="flex items-center">
        {signOut ? (
          <form action={signOut}>
            <button
              type="submit"
              className="flex flex-col items-center justify-center px-2 py-1 hover:bg-slate-100 rounded-xl transition-colors active:opacity-70 cursor-pointer text-slate-700 hover:text-slate-900 group"
            >
              <span className="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform">logout</span>
              <span className="text-[10px] font-bold text-slate-500 group-hover:text-slate-900 leading-none mt-0.5">Signout</span>
            </button>
          </form>
        ) : null}
      </div>
    </header>
  );
}