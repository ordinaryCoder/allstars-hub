import { ACADEMY_NAME } from '@/lib/constant';

interface TopAppBarProps {
  userName?: string;
  initials?: string;
  avatarUrl?: string;
  signOut?: () => void;
  onSignOut?: () => void;
}

export function TopAppBar({
  userName,
  initials,
  avatarUrl,
  signOut,
  onSignOut,
}: TopAppBarProps) {
  const handleSignOut = signOut || onSignOut;
  const displayName = userName || 'User';
  const displayInitials = initials || (displayName[0] ? displayName[0].toUpperCase() : 'U');

  return (
    <header className="flex justify-between items-center w-full px-4 h-16 sticky top-0 z-50 bg-white shadow-sm border-b border-slate-200">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-800 text-sm shrink-0">
          {avatarUrl ? (
            <img
              className="w-full h-full object-cover"
              alt={`${displayName} portrait`}
              src={avatarUrl}
            />
          ) : (
            <span>{displayInitials}</span>
          )}
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-base text-slate-900 capitalize">{displayName}</span>
          <span className="text-[10px] text-slate-500 font-bold tracking-wider uppercase">
            {ACADEMY_NAME}
          </span>
        </div>
      </div>
      {handleSignOut ? (
        <form action={handleSignOut}>
          <button
            type="submit"
            className="bg-slate-100 p-2 rounded-full text-slate-900 active:scale-95 transition-transform duration-150 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
            title="Sign Out"
          >
            <span className="material-symbols-outlined">logout</span>
          </button>
        </form>
      ) : null}
    </header>
  );
}