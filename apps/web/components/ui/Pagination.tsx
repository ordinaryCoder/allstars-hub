'use client';

import React from 'react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  showPageSizeSelector?: boolean;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  pageSizeOptions = [5, 10, 20],
  onPageChange,
  onPageSizeChange,
  showPageSizeSelector = true,
  className = '',
}: PaginationProps) {
  if (totalItems <= 0) return null;

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 mt-1 pt-3 border-t border-slate-200 text-xs font-medium text-slate-500 ${className}`}>
      {/* Left side: Rows per page selector & Item range */}
      <div className="flex items-center gap-3">
        {showPageSizeSelector && onPageSizeChange && (
          <div className="flex items-center gap-1.5">
            <label htmlFor="pageSizeSelect" className="text-slate-500 font-medium">
              Rows:
            </label>
            <div className="relative">
              <select
                id="pageSizeSelect"
                value={pageSize}
                onChange={(e) => {
                  onPageSizeChange(Number(e.target.value));
                  onPageChange(1); // Reset to page 1 on page size change
                }}
                className="h-7 pl-2 pr-6 appearance-none bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none cursor-pointer"
              >
                {pageSizeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 !text-[14px]">
                expand_more
              </span>
            </div>
          </div>
        )}

        <span>
          {totalItems > 0 ? `${startIndex + 1}-${endIndex} of ${totalItems}` : '0 of 0'}
        </span>
      </div>

      {/* Right side: Page indicator & Navigation controls */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-700 px-1">
          {currentPage} / {totalPages}
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous Page"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 shadow-sm transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>

          <button
            type="button"
            aria-label="Next Page"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 shadow-sm transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
}
