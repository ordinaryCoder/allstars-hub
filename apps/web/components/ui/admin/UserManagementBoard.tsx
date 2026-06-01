'use client';

import { useState, useMemo } from 'react';

// --- Types ---
type User = any;

// --- Helpers ---
const getPermissionsStr = (user: User) => {
  const perms = user.academy_roles?.[0]?.permissions;
  if (!perms) return '';
  return Array.isArray(perms) ? perms.join(', ').toLowerCase() : String(perms).toLowerCase();
};

const isParentOrPlayer = (user: User) => {
  const permStr = getPermissionsStr(user);
  return permStr.includes('parent') || permStr.includes('player');
};

const getPrimaryRole = (user: User) => {
  const permStr = getPermissionsStr(user);
  if (permStr.includes('admin')) return 'Admin';
  if (permStr.includes('coach')) return 'Coach';
  if (permStr.includes('player')) return 'Player';
  if (permStr.includes('parent')) return 'Parent';
  return 'User';
};

// --- Components ---
function FilterDropdown({ 
  value, 
  onChange 
}: { 
  value: 'pending' | 'players' | 'coaches';
  onChange: (val: 'pending' | 'players' | 'coaches') => void;
}) {
  return (
    <section className="relative group w-full max-w-full overflow-hidden mb-2">
      <label className="sr-only" htmlFor="user-filter">Filter Users</label>
      <div className="relative w-full max-w-full">
        <select 
          id="user-filter"
          value={value}
          onChange={(e) => onChange(e.target.value as any)}
          className="w-full h-[44px] pl-4 pr-10 appearance-none bg-white border border-slate-200 rounded-xl text-[14px] font-medium text-slate-900 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none cursor-pointer"
        >
          <option value="pending">Pending Users</option>
          <option value="players">Active Players</option>
          <option value="coaches">Active Coaches</option>
        </select>
        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">expand_more</span>
      </div>
    </section>
  );
}

function PendingUserCard({ user, approveUser }: { user: User; approveUser: (formData: FormData) => void }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-amber-200 flex flex-col gap-4 animate-in fade-in duration-300">
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center">
          <span className="text-[14px] font-medium text-slate-900">{user.first_name} {user.last_name}</span>
          <span className="text-[12px] font-semibold text-slate-500 px-2 py-0.5 bg-slate-100 rounded-full">{getPrimaryRole(user)}</span>
        </div>
        <div className="flex flex-col gap-0.5 mt-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-slate-500">mail</span>
            <span className="text-[14px] text-slate-500">{user.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-slate-500">call</span>
            <span className="text-[14px] text-slate-900">{user.mobile_number || 'N/A'}</span>
          </div>
        </div>
      </div>
      <form action={approveUser}>
        <input type="hidden" name="userId" value={user.id} />
        <button type="submit" className="w-full h-[44px] bg-slate-900 text-white rounded-xl text-[14px] font-medium hover:opacity-90 active:scale-[0.98] transition-all mt-2 shadow-sm">
          Approve
        </button>
      </form>
    </div>
  );
}

function ActiveUserCard({ user, isAdmin = false }: { user: User; isAdmin?: boolean }) {
  return (
    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex justify-between items-center animate-in fade-in duration-300">
      <div className="flex gap-3 w-full">
        <div className="w-12 h-12 rounded-full bg-white shadow-sm flex-shrink-0 flex items-center justify-center text-slate-400 font-bold border border-slate-200 uppercase">
          {user.first_name?.[0] || ''}{user.last_name?.[0] || ''}
        </div>
        <div className="flex-1 flex flex-col justify-center gap-1">
          <div className="flex justify-between items-center">
            <span className="text-[14px] font-medium text-slate-900">{user.first_name} {user.last_name}</span>
            {isAdmin ? (
              <div className="flex items-center gap-1 text-slate-900">
                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: '"FILL" 1' }}>verified_user</span>
                <span className="text-[12px] font-semibold uppercase tracking-wider">Admin</span>
              </div>
            ) : (
              <span className="text-[12px] font-semibold text-slate-500">{getPrimaryRole(user)}</span>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-[14px] text-slate-500">{user.email}</span>
            <span className="text-[14px] text-slate-900">{user.mobile_number || 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function UserManagementBoard({ pendingUsers, activeUsers, approveUser }: {
  pendingUsers: any[];
  activeUsers: any[];
  approveUser: (formData: FormData) => void;
}) {
  const [viewMode, setViewMode] = useState<'pending' | 'players' | 'coaches'>('pending');

  const activePlayers = useMemo(() => activeUsers.filter(isParentOrPlayer), [activeUsers]);
  const activeCoaches = useMemo(() => activeUsers.filter(u => !isParentOrPlayer(u)), [activeUsers]);

  return (
    <div className="flex flex-col gap-6 w-full relative">
      {/* Header Section */}
      <section className="flex flex-col gap-1">
        <h2 className="text-[20px] leading-[28px] font-bold text-slate-900">User Management</h2>
        <p className="text-[14px] leading-[20px] text-slate-500">Manage access and roles for all academy members.</p>
      </section>

      {/* Filter Dropdown */}
      <FilterDropdown value={viewMode} onChange={setViewMode} />

      {/* Dynamic User List */}
      <div className="flex flex-col gap-3 min-h-[50vh]">
        {viewMode === 'pending' && (
          <div className="space-y-3">
            <h3 className="text-[12px] font-semibold text-slate-500 px-1 uppercase tracking-wider">
              PENDING USERS ({pendingUsers.length})
            </h3>
            {pendingUsers.length === 0 ? (
              <div className="text-center text-sm text-slate-500 py-8 bg-white rounded-2xl border border-slate-200 shadow-sm">
                No pending users found.
              </div>
            ) : (
              pendingUsers.map(user => (
                <PendingUserCard key={user.id} user={user} approveUser={approveUser} />
              ))
            )}
          </div>
        )}

        {viewMode === 'players' && (
          <div className="space-y-3">
            <h3 className="text-[12px] font-semibold text-slate-500 px-1 uppercase tracking-wider">
              ACTIVE PLAYERS ({activePlayers.length})
            </h3>
            {activePlayers.length === 0 ? (
              <div className="text-center text-sm text-slate-500 py-8 bg-white rounded-2xl border border-slate-200 shadow-sm">
                No active players found.
              </div>
            ) : (
              activePlayers.map(user => (
                <ActiveUserCard key={user.id} user={user} />
              ))
            )}
          </div>
        )}

        {viewMode === 'coaches' && (
          <div className="space-y-3">
            <h3 className="text-[12px] font-semibold text-slate-500 px-1 uppercase tracking-wider">
              ACTIVE COACHES ({activeCoaches.length})
            </h3>
            {activeCoaches.length === 0 ? (
              <div className="text-center text-sm text-slate-500 py-8 bg-white rounded-2xl border border-slate-200 shadow-sm">
                No active coaches found.
              </div>
            ) : (
              activeCoaches.map(user => (
                <ActiveUserCard key={user.id} user={user} isAdmin={getPermissionsStr(user).includes('admin')} />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}