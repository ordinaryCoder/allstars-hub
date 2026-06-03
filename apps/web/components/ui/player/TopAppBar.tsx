export function TopAppBar({ userName, initials, signOut }: { userName?: string; initials?: string; signOut?: () => void }) {
  return (
    <header className="flex justify-between items-center w-full px-4 h-16 sticky top-0 z-50 bg-white shadow-sm border-b border-slate-200">
      <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-[10px]">
          {initials || 'U'}
        </div>
        <span className="text-sm font-medium text-slate-900">{userName || 'User'}</span>
        <span className="material-symbols-outlined text-slate-500 text-[18px]">expand_more</span>
      </div>
      <div className="flex items-center">
        {signOut ? (
          <form action={signOut}>
            <button type="submit" className="p-2 hover:bg-slate-100 rounded-full transition-colors active:opacity-70 cursor-pointer flex items-center justify-center mr-2">
              <span className="material-symbols-outlined text-slate-900">logout</span>
            </button>
          </form>
        ): null}
      </div>
    </header>
  );
}