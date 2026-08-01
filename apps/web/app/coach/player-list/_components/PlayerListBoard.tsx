'use client';

import { useState, useMemo, useEffect } from 'react';
import { Tooltip } from '@/components/ui/Tooltip';
import { Pagination } from '@/components/ui/Pagination';

export interface SerializedPlayer {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  age: number | null;
  isActive: boolean;
  locationId: string;
  locationName: string;
  batches: Array<{
    id: string;
    name: string;
    sportName?: string | null;
  }>;
  parents: Array<{
    id: string;
    name: string;
    phone: string | null;
    email: string;
  }>;
}

export interface SerializedLocation {
  id: string;
  name: string;
  address?: string | null;
}

interface PlayerListBoardProps {
  players: SerializedPlayer[];
  locations: SerializedLocation[];
}

export function PlayerListBoard({ players, locations }: PlayerListBoardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const filteredPlayers = useMemo(() => {
    return players.filter((player) => {
      // Location filter
      if (selectedLocationId !== 'all' && player.locationId !== selectedLocationId) {
        return false;
      }

      // Search term filter
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase().trim();
        const fullName = `${player.firstName} ${player.lastName}`.toLowerCase();
        const locationName = player.locationName.toLowerCase();
        const batchNames = player.batches.map((b) => b.name.toLowerCase()).join(' ');
        const parentNames = player.parents.map((p) => p.name.toLowerCase()).join(' ');

        return (
          fullName.includes(query) ||
          locationName.includes(query) ||
          batchNames.includes(query) ||
          parentNames.includes(query)
        );
      }

      return true;
    });
  }, [players, selectedLocationId, searchTerm]);

  // Reset to first page when search query, location filter, or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedLocationId, pageSize]);

  const totalRecords = filteredPlayers.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedPlayers = filteredPlayers.slice(startIndex, startIndex + pageSize);

  return (
    <div className="flex flex-col gap-4">
      {/* Search & Location Filter Section */}
      <div className="flex flex-col gap-3">
        {/* Search Bar */}
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search player by name, location, or batch..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>

        {/* Location Tabs (if coach has multiple locations) */}
        {locations.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedLocationId('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedLocationId === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              All Locations ({players.length})
            </button>

            {locations.map((loc) => {
              const count = players.filter((p) => p.locationId === loc.id).length;
              return (
                <button
                  key={loc.id}
                  onClick={() => setSelectedLocationId(loc.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedLocationId === loc.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {loc.name} ({count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Players List Section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Players ({totalRecords})
          </span>
          {locations.length === 1 && (
            <span className="text-xs font-medium text-slate-600 bg-slate-200/60 px-2 py-0.5 rounded-md">
              📍 {locations[0]?.name}
            </span>
          )}
        </div>

        {totalRecords === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <span className="material-symbols-outlined text-[28px]">group_off</span>
            </div>
            <p className="text-sm font-semibold text-slate-800">No players found</p>
            <p className="text-xs text-slate-500 max-w-[240px]">
              {searchTerm
                ? 'Try adjusting your search criteria or clear the search filter.'
                : 'No players are currently registered under your assigned location(s).'}
            </p>
          </div>
        ) : (
          paginatedPlayers.map((player) => {
            const initials = `${player.firstName[0] || ''}${player.lastName[0] || ''}`.toUpperCase();
            const isParentRegistered = player.parents && player.parents.length > 0;

            return (
              <div
                key={player.id}
                className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-3 transition-shadow hover:shadow-md"
              >
                {/* Main Header info */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
                      {initials}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1">
                        <h3 className="font-semibold text-slate-900 text-base leading-tight">
                          {player.firstName} {player.lastName}
                        </h3>
                        {isParentRegistered && (
                          <Tooltip content="Registered by Parent">
                            <span className="material-symbols-outlined text-[8px] text-slate-500 flex-shrink-0 cursor-pointer hover:text-slate-800 transition-colors">
                              family_restroom
                            </span>
                          </Tooltip>
                        )}
                      </div>
                      {player.age !== null && (
                        <span className="text-xs font-medium text-slate-500 mt-0.5">
                          Age: {player.age} yrs
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                      player.isActive
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {player.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Batches & Sports */}
                {player.batches.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-100">
                    <span className="text-[11px] font-semibold text-slate-400 mr-1">Batches:</span>
                    {player.batches.map((b) => (
                      <span
                        key={b.id}
                        className="text-[11px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md"
                      >
                        {b.sportName ? `${b.sportName} - ` : ''}
                        {b.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Shared Pagination Controls */}
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
      </div>
    </div>
  );
}
