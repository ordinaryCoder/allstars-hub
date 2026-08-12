'use client';

import { useState } from 'react';
import type { User } from './types';
import { getPrimaryRole } from './types';
import { approveUser as approveUserAction } from '../../_actions/action';

interface PendingUserCardProps {
  user: User;
  onApprove: (id: string) => void;
}

export function PendingUserCard({ user, onApprove }: PendingUserCardProps) {
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
          <span className="text-[14px] font-medium text-slate-900">
            {user.first_name} {user.last_name}
          </span>
          <span className="text-[12px] font-semibold text-slate-500 px-2 py-0.5 bg-slate-100 rounded-full">
            {getPrimaryRole(user)}
          </span>
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
        <button
          type="submit"
          disabled={isPending}
          className="w-full h-[44px] bg-slate-900 text-white rounded-xl text-[14px] font-medium hover:opacity-90 active:scale-[0.98] transition-all mt-2 shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isPending ? 'Approving...' : 'Approve'}
        </button>
      </form>
    </div>
  );
}
