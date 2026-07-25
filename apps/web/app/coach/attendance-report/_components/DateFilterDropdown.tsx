'use client';

import { useRouter } from 'next/navigation';

export default function DateFilterDropdown({ currentDays }: { currentDays: number }) {
  const router = useRouter();

  return (
    <div className="relative inline-block">
      <select
        value={currentDays}
        onChange={(e) => router.push(`/coach/attendance-report?days=${e.target.value}`)}
        className="appearance-none flex items-center gap-1.5 px-4 py-2 pr-8 bg-slate-900 text-white rounded-full text-sm font-medium outline-none cursor-pointer"
      >
        <option value={30}>Last 30 Days</option>
        <option value={90}>Last 3 Months</option>
        <option value={180}>Last 6 Months</option>
      </select>
      <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-white pointer-events-none text-[16px]">
        expand_more
      </span>
    </div>
  );
}