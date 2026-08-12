'use client';

import { useState, useMemo, useEffect } from 'react';
import { Pagination } from '@/components/ui/Pagination';
import { ListSkeleton } from '@/components/ui/Loading';
import {
  getUsersByCategory,
  getPlayerRecords,
  deactivatePlayerById,
  reactivatePlayerById,
  getFilterOptionsAdmin,
} from '../_actions/action';

import type { User, PlayerRecord, ViewMode } from './user-management/types';
import { getPermissionsStr } from './user-management/types';
import { FilterDropdown } from './user-management/FilterDropdown';
import { SearchInput } from './user-management/SearchInput';
import { ActiveUserCard } from './user-management/ActiveUserCard';
import { PlayerRecordCard } from './user-management/PlayerRecordCard';
import { PendingUserCard } from './user-management/PendingUserCard';
import { DeactivateConfirmModal } from './user-management/DeactivateConfirmModal';
import { ReactivateConfirmModal } from './user-management/ReactivateConfirmModal';

export type { User };

// ── helpers ──────────────────────────────────────────────────────────────────

/** True for view modes that show individual player records */
const isPlayerView = (mode: ViewMode) => mode === 'players' || mode === 'inactive';

export function UserManagementBoardView({ initialPlayers = [] }: { initialPlayers?: PlayerRecord[] }) {
  const [viewMode, setViewMode] = useState<ViewMode>('players');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('all');
  const [filterLocations, setFilterLocations] = useState<Array<{ id: string; name: string }>>([]);

  // Player records (players / inactive views)
  const [playerRecordMap, setPlayerRecordMap] = useState<Partial<Record<'players' | 'inactive', PlayerRecord[]>>>({
    players: initialPlayers,
  });

  // User records (coaches / pending views)
  const [userMap, setUserMap] = useState<Record<string, User[]>>({});

  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Confirmation state — uses minimal NamedEntity shape via the modal
  const [playerToDeactivate, setPlayerToDeactivate] = useState<PlayerRecord | null>(null);
  const [playerToReactivate, setPlayerToReactivate] = useState<PlayerRecord | null>(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Load location filter options on mount
  useEffect(() => {
    getFilterOptionsAdmin()
      .then((opts) => setFilterLocations(opts.locations))
      .catch((err) => console.error('Failed to load filter options:', err));
  }, []);

  // Fetch data when view mode changes (cached after first load)
  useEffect(() => {
    if (isPlayerView(viewMode)) {
      const key = viewMode as 'players' | 'inactive';
      if (playerRecordMap[key]) { setIsLoading(false); return; }

      let mounted = true;
      setIsLoading(true);
      getPlayerRecords(viewMode === 'players' ? 'active' : 'inactive')
        .then((data) => {
          if (mounted) {
            setPlayerRecordMap((prev) => ({ ...prev, [key]: data }));
            setIsLoading(false);
          }
        })
        .catch((err) => {
          console.error('Failed to fetch player records:', err);
          if (mounted) setIsLoading(false);
        });
      return () => { mounted = false; };
    } else {
      if (userMap[viewMode]) { setIsLoading(false); return; }

      let mounted = true;
      setIsLoading(true);
      getUsersByCategory(viewMode as 'coaches' | 'pending')
        .then((data) => {
          if (mounted) {
            setUserMap((prev) => ({ ...prev, [viewMode]: data }));
            setIsLoading(false);
          }
        })
        .catch((err) => {
          console.error('Failed to fetch users:', err);
          if (mounted) setIsLoading(false);
        });
      return () => { mounted = false; };
    }
  }, [viewMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset filters when switching modes
  useEffect(() => {
    setSelectedLocationId('all');
    setCurrentPage(1);
  }, [viewMode]);

  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize, searchQuery, selectedLocationId]);

  // ── Filtered list ─────────────────────────────────────────────────────────

  const filteredPlayerRecords = useMemo<PlayerRecord[]>(() => {
    if (!isPlayerView(viewMode)) return [];
    const key = viewMode as 'players' | 'inactive';
    const records = playerRecordMap[key] ?? [];

    return records.filter((p) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
        const parentNames = (p.parent_accounts ?? [])
          .map((a) => `${a.first_name} ${a.last_name}`)
          .join(' ')
          .toLowerCase();
        const linkedName = p.linked_user
          ? `${p.linked_user.first_name} ${p.linked_user.last_name}`.toLowerCase()
          : '';
        if (
          !fullName.includes(q) &&
          !parentNames.includes(q) &&
          !linkedName.includes(q)
        ) return false;
      }
      if (selectedLocationId !== 'all' && p.location?.id !== selectedLocationId) return false;
      return true;
    });
  }, [viewMode, playerRecordMap, searchQuery, selectedLocationId]);

  const filteredUserList = useMemo<User[]>(() => {
    if (isPlayerView(viewMode)) return [];
    const users = userMap[viewMode] ?? [];

    return users.filter((user) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
        const email = (user.email || '').toLowerCase();
        const mobile = (user.mobile_number || '').toLowerCase();
        if (!fullName.includes(q) && !email.includes(q) && !mobile.includes(q)) return false;
      }
      return true;
    });
  }, [viewMode, userMap, searchQuery]);

  // Select whichever filtered list is active
  const filteredList = isPlayerView(viewMode) ? filteredPlayerRecords : filteredUserList;
  const totalRecords = filteredList.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedList = filteredList.slice(startIndex, startIndex + pageSize);

  // ── Pending user helpers (user-based) ─────────────────────────────────────

  const handleRemovePending = (id: string) => {
    setUserMap((prev) => ({
      ...prev,
      pending: (prev.pending || []).filter((u) => u.id !== id),
    }));
  };

  // ── Player record deactivation / reactivation ─────────────────────────────

  const handleConfirmDeactivate = async () => {
    if (!playerToDeactivate) return;
    setIsSubmittingAction(true);
    try {
      const res = await deactivatePlayerById(playerToDeactivate.id);
      if (res.success) {
        // Remove from active list; optionally prepend to inactive cache if loaded
        setPlayerRecordMap((prev) => ({
          ...prev,
          players: (prev.players ?? []).filter((p) => p.id !== playerToDeactivate.id),
          ...(prev.inactive
            ? { inactive: [{ ...playerToDeactivate, is_active: false }, ...prev.inactive] }
            : {}),
        }));
        setPlayerToDeactivate(null);
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
    if (!playerToReactivate) return;
    setIsSubmittingAction(true);
    try {
      const res = await reactivatePlayerById(playerToReactivate.id);
      if (res.success) {
        setPlayerRecordMap((prev) => ({
          ...prev,
          inactive: (prev.inactive ?? []).filter((p) => p.id !== playerToReactivate.id),
          ...(prev.players
            ? { players: [{ ...playerToReactivate, is_active: true }, ...prev.players] }
            : {}),
        }));
        setPlayerToReactivate(null);
      } else {
        alert(res.error || 'Failed to reactivate player');
      }
    } catch (err: any) {
      alert(err?.message || 'Error reactivating player');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // ── Header text ───────────────────────────────────────────────────────────

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
    if (viewMode === 'players') return 'No active players found.';
    if (viewMode === 'inactive') return 'No inactive players found.';
    if (viewMode === 'coaches') return 'No active coaches found.';
    return 'No pending users found.';
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 w-full relative">
      {/* Header */}
      <section className="flex flex-col gap-1">
        <h2 className="text-[20px] leading-[28px] font-bold text-slate-900">User Management</h2>
        <p className="text-[14px] leading-[20px] text-slate-500">
          Manage access and roles for all academy members.
        </p>
      </section>

      {/* Controls */}
      <div className="flex flex-col gap-3">
        <SearchInput value={searchQuery} onChange={setSearchQuery} />
        <FilterDropdown value={viewMode} onChange={setViewMode} disabled={isLoading} />

        {/* Location filter for player views */}
        {isPlayerView(viewMode) && filterLocations.length > 0 && (
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

      {/* List */}
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
        ) : isPlayerView(viewMode) ? (
          // ── Player record cards ──
          (paginatedList as PlayerRecord[]).map((player) => (
            <PlayerRecordCard
              key={player.id}
              player={player}
              isInactive={viewMode === 'inactive'}
              onDeactivate={viewMode === 'players' ? setPlayerToDeactivate : undefined}
              onReactivate={viewMode === 'inactive' ? setPlayerToReactivate : undefined}
            />
          ))
        ) : (
          // ── User cards (coaches / pending) ──
          (paginatedList as User[]).map((user) => {
            if (viewMode === 'pending') {
              return <PendingUserCard key={user.id} user={user} onApprove={handleRemovePending} />;
            }
            return (
              <ActiveUserCard
                key={user.id}
                user={user}
                isAdmin={getPermissionsStr(user).includes('admin')}
                onDeactivate={undefined}
                onReactivate={undefined}
                isInactive={false}
              />
            );
          })
        )}

        {/* Pagination */}
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

      {/* Confirmation modals — work for PlayerRecord via NamedEntity */}
      <DeactivateConfirmModal
        user={playerToDeactivate}
        isOpen={Boolean(playerToDeactivate)}
        onClose={() => setPlayerToDeactivate(null)}
        onConfirm={handleConfirmDeactivate}
        isSubmitting={isSubmittingAction}
      />

      <ReactivateConfirmModal
        user={playerToReactivate}
        isOpen={Boolean(playerToReactivate)}
        onClose={() => setPlayerToReactivate(null)}
        onConfirm={handleConfirmReactivate}
        isSubmitting={isSubmittingAction}
      />
    </div>
  );
}
