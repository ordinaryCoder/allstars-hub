'use client';

import { useState, useMemo, useEffect } from 'react';
import { Pagination } from '@/components/ui/Pagination';
import { Skeleton, ListSkeleton } from '@/components/ui/Loading';
import { getUsersByCategory, approveUser as approveUserAction } from '../_actions/action';

// --- Types ---
export interface UserRole {
  permissions?: unknown;
}

export interface User {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  mobile_number?: string | null;
  status?: string | null;
  created_at?: Date | string | null;
  academy_roles?: UserRole[];
}

// --- Helpers ---
const getPermissionsStr = (user: User) => {
  const perms = user.academy_roles?.[0]?.permissions;
  if (!perms) return '';
  return Array.isArray(perms) ? perms.join(', ').toLowerCase() : String(perms).toLowerCase();
};

const getPrimaryRole = (user: User) => {
  const permStr = getPermissionsStr(user);
  if (permStr.includes('admin')) return 'Admin';
  if (permStr.includes('coach')) return 'Coach';
  if (permStr.includes('player')) return 'Player';
  if (permStr.includes('parent')) return 'Parent';
  return 'User';
};

// --- Filter Dropdown ---
function FilterDropdown({
  value,
  onChange,
  disabled = false,
}: {
  value: 'players' | 'coaches' | 'pending';
  onChange: (val: 'players' | 'coaches' | 'pending') => void;
  disabled?: boolean;
}) {
  return (
    <section className="relative group w-full max-w-full overflow-hidden mb-2">
      <label className="sr-only" htmlFor="user-filter">Filter Users</label>
      <div className="relative w-full max-w-full">
        <select
          id="user-filter"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value as 'players' | 'coaches' | 'pending')}
          className="w-full h-[44px] pl-4 pr-10 appearance-none bg-white border border-slate-200 rounded-xl text-[14px] font-medium text-slate-900 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none cursor-pointer disabled:opacity-60"
        >
          <option value="players">Active Players</option>
          <option value="coaches">Active Coaches</option>
          <option value="pending">Pending Users</option>
        </select>
        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">expand_more</span>
      </div>
    </section>
  );
}

function PendingUserCard({ user, onApprove }: { user: User; onApprove: (id: string) => void }) {
  const [isPending, setIsPending] = useState(false);

  const handleApprove = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    const formData = new FormData(e.currentTarget);
    try {
      await approveUserAction(formData);
      onApprove(user.id);
    } finally {
      setIsPending(false);
    }
  };

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
      <form onSubmit={handleApprove}>
        <input type="hidden" name="userId" value={user.id} />
        <button type="submit" disabled={isPending} className="w-full h-[44px] bg-slate-900 text-white rounded-xl text-[14px] font-medium hover:opacity-90 active:scale-[0.98] transition-all mt-2 shadow-sm flex items-center justify-center gap-2 disabled:opacity-50">
          {isPending ? 'Approving...' : 'Approve'}
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

function SearchInput({
  value,
  onChange
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div className="relative w-full">
      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
        search
      </span>
      <input
        type="text"
        placeholder="Search by name, email, or mobile..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-[44px] pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-[14px] font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none shadow-sm transition-all"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      )}
    </div>
  );
}

export function UserManagementBoardView({ initialPlayers = [] }: { initialPlayers?: User[] }) {
  // Default view: active players
  const [viewMode, setViewMode] = useState<'players' | 'coaches' | 'pending'>('players');
  const [searchQuery, setSearchQuery] = useState('');
  const [userMap, setUserMap] = useState<Record<string, User[]>>({
    players: initialPlayers,
  });
  const [isLoading, setIsLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Fetch data on demand upon dropdown selection if not already cached
  useEffect(() => {
    if (userMap[viewMode]) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    getUsersByCategory(viewMode)
      .then((data) => {
        if (isMounted) {
          setUserMap((prev) => ({ ...prev, [viewMode]: data }));
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch users category:', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [viewMode, userMap]);

  useEffect(() => {
    setCurrentPage(1);
  }, [viewMode, pageSize, searchQuery]);

  const currentUsers = userMap[viewMode] || [];

  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return currentUsers;
    const q = searchQuery.toLowerCase().trim();
    return currentUsers.filter((user) => {
      const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
      const email = (user.email || '').toLowerCase();
      const mobile = (user.mobile_number || '').toLowerCase();
      return fullName.includes(q) || email.includes(q) || mobile.includes(q);
    });
  }, [currentUsers, searchQuery]);

  const totalRecords = filteredList.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedList = filteredList.slice(startIndex, startIndex + pageSize);

  const handleRemovePending = (id: string) => {
    setUserMap((prev) => ({
      ...prev,
      pending: (prev.pending || []).filter((u) => u.id !== id),
    }));
  };

  const getHeaderTitle = () => {
    if (viewMode === 'players') return `ACTIVE PLAYERS (${currentUsers.length})`;
    if (viewMode === 'coaches') return `ACTIVE COACHES (${currentUsers.length})`;
    return `PENDING USERS (${currentUsers.length})`;
  };

  return (
    <div className="flex flex-col gap-6 w-full relative">
      {/* Header Section */}
      <section className="flex flex-col gap-1">
        <h2 className="text-[20px] leading-[28px] font-bold text-slate-900">User Management</h2>
        <p className="text-[14px] leading-[20px] text-slate-500">Manage access and roles for all academy members.</p>
      </section>

      {/* Controls Section: Search & Filter */}
      <div className="flex flex-col gap-3">
        <SearchInput value={searchQuery} onChange={setSearchQuery} />
        <FilterDropdown value={viewMode} onChange={setViewMode} disabled={isLoading} />
      </div>

      {/* Dynamic User List / Global Skeleton */}
      <div className="flex flex-col gap-3 min-h-[40vh]">
        <h3 className="text-[12px] font-semibold text-slate-500 px-1 uppercase tracking-wider">
          {getHeaderTitle()}
        </h3>

        {isLoading ? (
          <ListSkeleton count={4} />
        ) : filteredList.length === 0 ? (
          <div className="text-center text-sm text-slate-500 py-8 bg-white rounded-2xl border border-slate-200 shadow-sm">
            No {viewMode === 'players' ? 'active players' : viewMode === 'coaches' ? 'active coaches' : 'pending users'} found.
          </div>
        ) : (
          paginatedList.map((user) => {
            if (viewMode === 'pending') {
              return <PendingUserCard key={user.id} user={user} onApprove={handleRemovePending} />;
            }
            return (
              <ActiveUserCard
                key={user.id}
                user={user}
                isAdmin={getPermissionsStr(user).includes('admin')}
              />
            );
          })
        )}

        {/* Shared Pagination Controls */}
        {!isLoading && totalRecords > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalRecords}
            pageSize={pageSize}
            pageSizeOptions={[5, 10, 20]}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            showPageSizeSelector={true}
          />
        )}
      </div>
    </div>
  );
}
