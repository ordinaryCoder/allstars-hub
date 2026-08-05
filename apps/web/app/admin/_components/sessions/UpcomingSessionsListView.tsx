'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  UpcomingSessionCard,
  type UpcomingSessionCardProps,
} from '../UpcomingSessionCard';
import { Pagination } from '@/components/ui/Pagination';

export interface UpcomingSessionItem extends UpcomingSessionCardProps {
  id: string;
}

interface UpcomingSessionsListViewProps {
  sessions: UpcomingSessionItem[];
}

export function UpcomingSessionsListView({
  sessions,
}: UpcomingSessionsListViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    const query = searchQuery.toLowerCase().trim();
    return sessions.filter(
      (s) =>
        s.locationName.toLowerCase().includes(query) ||
        s.coachName.toLowerCase().includes(query) ||
        s.sessionDateText.toLowerCase().includes(query)
    );
  }, [sessions, searchQuery]);

  const totalItems = filteredSessions.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  const paginatedSessions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSessions.slice(start, start + pageSize);
  }, [filteredSessions, currentPage, pageSize]);

  return (
    <div className="space-y-4">
      {/* Header with Navigation */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin"
          className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </Link>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">All Upcoming Sessions</h1>
          <p className="text-xs text-slate-500 font-medium">
            {totalItems} scheduled {totalItems === 1 ? 'session' : 'sessions'} planned
          </p>
        </div>
      </div>

      {/* Search Filter */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
          search
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Filter by location, coach, or date..."
          className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-slate-900 outline-none shadow-sm"
        />
      </div>

      {/* Sessions List */}
      {paginatedSessions.length > 0 ? (
        <div className="space-y-3">
          {paginatedSessions.map((session) => (
            <UpcomingSessionCard key={session.id} {...session} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-8 border border-slate-100 text-center space-y-2">
          <span className="material-symbols-outlined text-[40px] text-slate-300">
            event_available
          </span>
          <p className="text-xs font-bold text-slate-500">No upcoming sessions found</p>
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        pageSizeOptions={[5, 10, 20]}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        showPageSizeSelector={true}
      />
    </div>
  );
}
