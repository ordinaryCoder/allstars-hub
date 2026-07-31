'use client';

import { useState } from 'react';
import { PerformanceTrack, PerformanceData } from '../../_components/PerformanceTrack';

export interface RecordedSessionItem {
  id: string;
  locationName: string;
  dateStr: string;
  timeStr: string;
  sessionPresent: number;
  sessionTotal: number;
  sessionRate: number;
  batchNames: string;
}

export interface LowAttendancePlayerItem {
  id: string;
  name: string;
  batch: string;
  attendancePercentage: number;
  absences: number;
}

interface AttendanceReportViewProps {
  performanceData: PerformanceData;
  recordedSessions: RecordedSessionItem[];
  lowAttendancePlayers: LowAttendancePlayerItem[];
}

function getInitials(name: string): string {
  if (!name) return 'P';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return 'P';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: PaginationProps) {
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  return (
    <div className="flex items-center justify-between gap-4 mt-1 pt-3 border-t border-slate-200">
      <span className="text-xs font-medium text-slate-500">
        {startIndex + 1}-{endIndex} of {totalItems}
      </span>

      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Previous Page"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 shadow-sm transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
        </button>

        <span className="text-xs font-semibold text-slate-700 px-2">
          {currentPage} / {totalPages}
        </span>

        <button
          type="button"
          aria-label="Next Page"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 shadow-sm transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
        </button>
      </div>
    </div>
  );
}

export function AttendanceReportView({
  performanceData,
  recordedSessions,
  lowAttendancePlayers,
}: AttendanceReportViewProps) {
  // Pagination state for Recorded Sessions (5 items per page)
  const [sessionsPage, setSessionsPage] = useState(1);
  const sessionsPageSize = 5;
  const sessionsTotal = recordedSessions.length;
  const sessionsTotalPages = Math.max(1, Math.ceil(sessionsTotal / sessionsPageSize));
  const sessionsStartIndex = (sessionsPage - 1) * sessionsPageSize;
  const paginatedSessions = recordedSessions.slice(
    sessionsStartIndex,
    sessionsStartIndex + sessionsPageSize
  );

  // Pagination state for Low Attendance Flags (5 items per page)
  const [flagsPage, setFlagsPage] = useState(1);
  const flagsPageSize = 5;
  const flagsTotal = lowAttendancePlayers.length;
  const flagsTotalPages = Math.max(1, Math.ceil(flagsTotal / flagsPageSize));
  const flagsStartIndex = (flagsPage - 1) * flagsPageSize;
  const paginatedFlags = lowAttendancePlayers.slice(
    flagsStartIndex,
    flagsStartIndex + flagsPageSize
  );

  return (
    <div className="space-y-6">
      {/* Performance Track */}
      <PerformanceTrack data={performanceData} />

      {/* Recorded Sessions Section with Pagination */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Recorded Sessions ({sessionsTotal})
          </h3>
        </div>

        {sessionsTotal === 0 ? (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center flex flex-col items-center justify-center gap-1.5 text-slate-500 text-xs shadow-sm">
            <span className="material-symbols-outlined text-slate-400 text-2xl">event_busy</span>
            <span>No attendance sessions recorded yet.</span>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {paginatedSessions.map((session) => (
              <div
                key={session.id}
                className="bg-white rounded-2xl p-4 border border-slate-200/80 hover:border-slate-300 shadow-sm flex flex-col gap-3 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col">
                    <h4 className="font-semibold text-slate-900 text-base leading-tight">
                      {session.locationName}
                    </h4>
                    <span className="text-xs text-slate-500 font-medium mt-0.5">
                      {session.dateStr} • {session.timeStr}
                    </span>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 font-bold text-xs px-2.5 py-1 rounded-full border border-emerald-100">
                    {session.sessionRate}% Rate
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-600 font-medium">
                    {session.batchNames}
                  </span>
                  <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                    {session.sessionPresent} / {session.sessionTotal} Present
                  </span>
                </div>
              </div>
            ))}

            {/* Pagination Controls for Recorded Sessions */}
            {sessionsTotal > sessionsPageSize && (
              <PaginationControls
                currentPage={sessionsPage}
                totalPages={sessionsTotalPages}
                totalItems={sessionsTotal}
                pageSize={sessionsPageSize}
                onPageChange={setSessionsPage}
              />
            )}
          </div>
        )}
      </section>

      {/* Low Attendance Flags Section with Pagination */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <span className="material-symbols-outlined text-red-500 text-[18px]">warning</span>
            Low Attendance Flags ({flagsTotal})
          </h3>
        </div>

        {flagsTotal === 0 ? (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center flex flex-col items-center justify-center gap-1.5 text-slate-500 text-xs shadow-sm">
            <span className="material-symbols-outlined text-emerald-500 text-2xl">verified</span>
            <span>No players flagged with low attendance.</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {paginatedFlags.map((player) => (
              <div
                key={player.id}
                className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80 hover:border-slate-300 flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-sm">
                    {getInitials(player.name)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm leading-tight">{player.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{player.batch}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-red-600">{player.attendancePercentage}%</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{player.absences} Absences</p>
                </div>
              </div>
            ))}

            {/* Pagination Controls for Low Attendance Flags */}
            {flagsTotal > flagsPageSize && (
              <PaginationControls
                currentPage={flagsPage}
                totalPages={flagsTotalPages}
                totalItems={flagsTotal}
                pageSize={flagsPageSize}
                onPageChange={setFlagsPage}
              />
            )}
          </div>
        )}
      </section>
    </div>
  );
}
