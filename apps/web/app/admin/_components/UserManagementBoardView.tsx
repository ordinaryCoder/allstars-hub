'use client';

import { useState, useMemo, useEffect } from 'react';
import { Pagination } from '@/components/ui/Pagination';
import { ListSkeleton } from '@/components/ui/Loading';
import {
  getUsersByCategory,
  deactivatePlayer,
  reactivatePlayer,
  getFilterOptionsAdmin,
} from '../_actions/action';

import type { User, ViewMode } from './user-management/types';
import { getPermissionsStr } from './user-management/types';
import { FilterDropdown } from './user-management/FilterDropdown';
import { SearchInput } from './user-management/SearchInput';
import { ActiveUserCard } from './user-management/ActiveUserCard';
import { PendingUserCard } from './user-management/PendingUserCard';
import { DeactivateConfirmModal } from './user-management/DeactivateConfirmModal';
import { ReactivateConfirmModal } from './user-management/ReactivateConfirmModal';

export type { User };

export function UserManagementBoardView({ initialPlayers = [] }: { initialPlayers?: User[] }) {
  const [viewMode, setViewMode] = useState<ViewMode>('players');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('all');

  const [filterLocations, setFilterLocations] = useState<Array<{ id: string; name: string }>>([]);

  const [userMap, setUserMap] = useState<Record<string, User[]>>({
    players: initialPlayers,
  });
  const [isLoading, setIsLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Deactivation and Reactivation Modal States
  const [userToDeactivate, setUserToDeactivate] = useState<User | null>(null);
  const [userToReactivate, setUserToReactivate] = useState<User | null>(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Load location filter options on mount
  useEffect(() => {
    getFilterOptionsAdmin()
      .then((opts) => {
        setFilterLocations(opts.locations);
      })
      .catch((err) => {
        console.error('Failed to load filter options for admin:', err);
      });
  }, []);

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
    setSelectedLocationId('all');
    setCurrentPage(1);
  }, [viewMode]);

  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize, searchQuery, selectedLocationId]);

  const currentUsers = userMap[viewMode] || [];

  const filteredList = useMemo(() => {
    return currentUsers.filter((user) => {
      // 1. Search Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
        const email = (user.email || '').toLowerCase();
        const mobile = (user.mobile_number || '').toLowerCase();
        const matchesSearch = fullName.includes(q) || email.includes(q) || mobile.includes(q);
        if (!matchesSearch) return false;
      }

      // Location filter applies to 'players' and 'inactive' categories
      if (viewMode === 'players' || viewMode === 'inactive') {
        const infos = user.locationInfos || [];

        // 2. Location Filter
        if (selectedLocationId !== 'all') {
          const matchesLocation = infos.some((info) => info.locationId === selectedLocationId);
          if (!matchesLocation) return false;
        }
      }

      return true;
    });
  }, [currentUsers, searchQuery, viewMode, selectedLocationId]);

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

  const handleConfirmDeactivate = async () => {
    if (!userToDeactivate) return;
    setIsSubmittingAction(true);
    try {
      const res = await deactivatePlayer(userToDeactivate.id);
      if (res.success) {
        setUserMap((prev) => ({
          ...prev,
          players: (prev.players || []).filter((u) => u.id !== userToDeactivate.id),
          ...(prev.inactive ? { inactive: [userToDeactivate, ...prev.inactive] } : {}),
        }));
        setUserToDeactivate(null);
      } else {
        alert(res.error || 'Failed to deactivate player');
      }
    } catch (err: any) {
      alert(err?.message || 'Error deactivating player');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleConfirmReactivate = async () => {
    if (!userToReactivate) return;
    setIsSubmittingAction(true);
    try {
      const res = await reactivatePlayer(userToReactivate.id);
      if (res.success) {
        setUserMap((prev) => ({
          ...prev,
          inactive: (prev.inactive || []).filter((u) => u.id !== userToReactivate.id),
          ...(prev.players ? { players: [userToReactivate, ...prev.players] } : {}),
        }));
        setUserToReactivate(null);
      } else {
        alert(res.error || 'Failed to reactivate player');
      }
    } catch (err: any) {
      alert(err?.message || 'Error reactivating player');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const getHeaderTitle = () => {
    if (viewMode === 'players') return `ACTIVE PLAYERS (${filteredList.length})`;
    if (viewMode === 'coaches') return `ACTIVE COACHES (${filteredList.length})`;
    if (viewMode === 'inactive') return `INACTIVE PLAYERS (${filteredList.length})`;
    return `PENDING USERS (${filteredList.length})`;
  };

  const getEmptyMessage = () => {
    if (selectedLocationId !== 'all') {
      const locName = filterLocations.find((l) => l.id === selectedLocationId)?.name || 'this location';
      return `No ${viewMode === 'players' ? 'active players' : 'inactive players'} found at ${locName}.`;
    }
    return `No ${viewMode === 'players' ? 'active players' : viewMode === 'coaches' ? 'active coaches' : viewMode === 'inactive' ? 'inactive players' : 'pending users'} found.`;
  };

  return (
    <div className="flex flex-col gap-6 w-full relative">
      {/* Header Section */}
      <section className="flex flex-col gap-1">
        <h2 className="text-[20px] leading-[28px] font-bold text-slate-900">User Management</h2>
        <p className="text-[14px] leading-[20px] text-slate-500">Manage access and roles for all academy members.</p>
      </section>

      {/* Controls Section: Search, Category Filter, and Location Filter */}
      <div className="flex flex-col gap-3">
        <SearchInput value={searchQuery} onChange={setSearchQuery} />
        <FilterDropdown value={viewMode} onChange={setViewMode} disabled={isLoading} />

        {/* Location Filter for Active/Inactive Players */}
        {(viewMode === 'players' || viewMode === 'inactive') && filterLocations.length > 0 && (
          <div className="relative w-full">
            <label className="sr-only" htmlFor="admin-location-filter">Filter by Location</label>
            <select
              id="admin-location-filter"
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              className="w-full h-[42px] pl-3 pr-8 appearance-none bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-slate-900 outline-none cursor-pointer truncate shadow-sm"
            >
              <option value="all">All Locations ({filterLocations.length})</option>
              {filterLocations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  📍 {loc.name}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[18px]">
              expand_more
            </span>
          </div>
        )}
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
            {getEmptyMessage()}
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
                onDeactivate={setUserToDeactivate}
                onReactivate={setUserToReactivate}
                isInactive={viewMode === 'inactive'}
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

      {/* Confirmation Dialog Modals */}
      <DeactivateConfirmModal
        user={userToDeactivate}
        isOpen={Boolean(userToDeactivate)}
        onClose={() => setUserToDeactivate(null)}
        onConfirm={handleConfirmDeactivate}
        isSubmitting={isSubmittingAction}
      />

      <ReactivateConfirmModal
        user={userToReactivate}
        isOpen={Boolean(userToReactivate)}
        onClose={() => setUserToReactivate(null)}
        onConfirm={handleConfirmReactivate}
        isSubmitting={isSubmittingAction}
      />
    </div>
  );
}
