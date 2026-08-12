'use client';

import type { ViewMode } from './types';

interface FilterDropdownProps {
  value: ViewMode;
  onChange: (val: ViewMode) => void;
  disabled?: boolean;
}

export function FilterDropdown({
  value,
  onChange,
  disabled = false,
}: FilterDropdownProps) {
  return (
    <section className="relative group w-full max-w-full overflow-hidden mb-2">
      <label className="sr-only" htmlFor="user-filter">
        Filter Users
      </label>
      <div className="relative w-full max-w-full">
        <select
          id="user-filter"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value as ViewMode)}
          className="w-full h-[44px] pl-4 pr-10 appearance-none bg-white border border-slate-200 rounded-xl text-[14px] font-medium text-slate-900 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none cursor-pointer disabled:opacity-60"
        >
          <option value="players">Active Players</option>
          <option value="coaches">Active Coaches</option>
          <option value="pending">Pending Users</option>
          <option value="inactive">Inactive Players</option>
        </select>
        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
          expand_more
        </span>
      </div>
    </section>
  );
}
