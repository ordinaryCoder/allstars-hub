'use client';

import { useState, useTransition } from 'react';
import type { PendingConflictCheckResult, MatchingConflictPlayer } from './types';
import { resolveUserApproval } from '../../_actions/action';
import { useSnackbar } from '@/components/ui/Snackbar';
import { Spinner } from '@/components/ui/Loading';
import { DobInput } from '@/components/form/DobInput';

interface PlayerConflictModalProps {
  conflictData: PendingConflictCheckResult;
  locations?: Array<{ id: string; name: string }>;
  onClose: () => void;
  onResolved: (userId: string) => void;
}

function formatDate(dateVal?: Date | string | null): string {
  if (!dateVal) return 'Not Provided';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return 'Not Provided';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return 'Not Provided';
  }
}

function toISODate(dateVal?: Date | string | null): string {
  if (!dateVal) return '';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  } catch {
    return '';
  }
}

export function PlayerConflictModal({
  conflictData,
  locations = [],
  onClose,
  onResolved,
}: PlayerConflictModalProps) {
  const { user: signupUser, matchingPlayers } = conflictData;
  const { showSnackbar } = useSnackbar();
  const [isPending, startTransition] = useTransition();

  // If there are multiple matching players, select which one to focus on or merge
  const [selectedPlayerIndex, setSelectedPlayerIndex] = useState(0);
  const activeExistingPlayer: MatchingConflictPlayer | undefined = matchingPlayers[selectedPlayerIndex];

  // State for Option B: Update & Merge Details
  const [isMergeConfigOpen, setIsMergeConfigOpen] = useState(false);
  const [mergedFirstName, setMergedFirstName] = useState(signupUser.firstName);
  const [mergedLastName, setMergedLastName] = useState(signupUser.lastName);
  const [mergedDob, setMergedDob] = useState(signupUser.dob || toISODate(activeExistingPlayer?.dob));
  const [mergedLocationId, setMergedLocationId] = useState(
    signupUser.locationId || activeExistingPlayer?.location?.id || ''
  );
  const [mergedMobile, setMergedMobile] = useState(
    signupUser.mobileNumber || activeExistingPlayer?.mobile_number || ''
  );

  // When active player changes, refresh default merge options
  const handleSelectPlayerIndex = (index: number) => {
    setSelectedPlayerIndex(index);
    const targetPlayer = matchingPlayers[index];
    if (targetPlayer) {
      setMergedDob(signupUser.dob || toISODate(targetPlayer.dob));
      setMergedLocationId(signupUser.locationId || targetPlayer.location?.id || '');
      setMergedMobile(signupUser.mobileNumber || targetPlayer.mobile_number || '');
    }
  };

  // Helper to get status string of existing player
  const getExistingPlayerState = (player: MatchingConflictPlayer) => {
    if (player.linked_user) {
      return `Linked Account (${player.linked_user.email || player.linked_user.first_name})`;
    }
    if (player.parents && player.parents.length > 0) {
      return `Linked to Parent (${player.parents.map((p) => p.parent.first_name).join(', ')})`;
    }
    return 'Unlinked Roster Player (Admin-added)';
  };

  // ── Action Handlers ──

  // Action A: Approve User (Create New Player + Link Existing as Second Child)
  const handleActionA = () => {
    startTransition(async () => {
      const res = await resolveUserApproval({
        userId: signupUser.id,
        action: 'APPROVE_NEW_AND_LINK_EXISTING',
      });

      if (!res.success) {
        showSnackbar({ message: res.error || 'Failed to approve user', type: 'error' });
      } else {
        showSnackbar({
          message: `${signupUser.role === 'parent' ? 'Parent' : 'Player'} account approved and linked successfully`,
          type: 'success',
        });
        onResolved(signupUser.id);
        onClose();
      }
    });
  };

  // Action B: Update and Approve Details (Merge & Claim Single Record)
  const handleActionB = () => {
    if (!activeExistingPlayer) {
      showSnackbar({ message: 'No existing player record selected for merging', type: 'error' });
      return;
    }

    if (!mergedDob) {
      showSnackbar({ message: 'Date of birth is required', type: 'error' });
      return;
    }

    startTransition(async () => {
      const res = await resolveUserApproval({
        userId: signupUser.id,
        action: 'UPDATE_AND_APPROVE_DETAILS',
        mergePlayerId: activeExistingPlayer.id,
        mergedData: {
          firstName: mergedFirstName.trim(),
          lastName: mergedLastName.trim(),
          dob: mergedDob || null,
          locationId: mergedLocationId,
          mobileNumber: mergedMobile.trim() || signupUser.mobileNumber,
        },
      });

      if (!res.success) {
        showSnackbar({ message: res.error || 'Failed to merge player details', type: 'error' });
      } else {
        showSnackbar({
          message: `Player record successfully updated & merged for ${mergedFirstName} ${mergedLastName}`,
          type: 'success',
        });
        onResolved(signupUser.id);
        onClose();
      }
    });
  };

  // Action C: Reject Request
  const handleActionC = () => {
    startTransition(async () => {
      const res = await resolveUserApproval({
        userId: signupUser.id,
        action: 'REJECT_REQUEST',
      });

      if (!res.success) {
        showSnackbar({ message: res.error || 'Failed to reject signup request', type: 'error' });
      } else {
        showSnackbar({ message: 'Signup request rejected', type: 'success' });
        onResolved(signupUser.id);
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[70] flex flex-col items-center justify-end sm:justify-center bg-black/50 backdrop-blur-sm sm:p-4 overflow-hidden overscroll-none animate-in fade-in duration-200">
      <div
        className={`bg-white w-full max-w-[620px] rounded-t-3xl sm:rounded-3xl shadow-2xl relative border border-slate-100 flex flex-col ${
          isMergeConfigOpen
            ? 'h-[92vh] max-h-[820px] overflow-hidden p-5 sm:p-6 gap-3'
            : 'max-h-[90vh] overflow-y-auto p-6 sm:p-7 gap-5'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isPending}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors z-10 disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        {/* Header Alert Badge */}
        <div className="shrink-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold mb-2">
            <span className="material-symbols-outlined text-[15px] text-amber-600">warning</span>
            <span>
              {activeExistingPlayer && signupUser.mobileNumber && activeExistingPlayer.mobile_number === signupUser.mobileNumber &&
               activeExistingPlayer.location?.id === signupUser.locationId &&
               activeExistingPlayer.first_name.trim().toLowerCase() === signupUser.firstName.trim().toLowerCase() &&
               activeExistingPlayer.last_name.trim().toLowerCase() === signupUser.lastName.trim().toLowerCase()
                ? `Match: Phone (+91 ${signupUser.mobileNumber}) & Name at ${signupUser.locationName || 'Branch'}`
                : activeExistingPlayer && signupUser.mobileNumber && activeExistingPlayer.mobile_number === signupUser.mobileNumber
                ? `Existing Player Registered Under +91 ${signupUser.mobileNumber}`
                : `Matching Name at ${signupUser.locationName || 'Branch'} (${activeExistingPlayer?.first_name} ${activeExistingPlayer?.last_name})`}
            </span>
          </div>
          <h3 className="text-xl font-bold text-slate-900">Potential Duplicate Player Detected</h3>
          <p className="text-xs text-slate-500 mt-1">
            This signup matches{' '}
            <strong className="text-slate-700">
              {matchingPlayers.length} existing player{matchingPlayers.length > 1 ? 's' : ''}
            </strong>{' '}
            by phone number or branch name in the academy. Review the comparison below to resolve.
          </p>
        </div>

        {/* Multiple Existing Players Selector (if > 1) */}
        {matchingPlayers.length > 1 && (
          <div className="flex flex-col gap-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200 shrink-0">
            <label className="text-xs font-semibold text-slate-700">
              Select existing player to inspect / merge:
            </label>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {matchingPlayers.map((p, idx) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPlayerIndex(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                    selectedPlayerIndex === idx
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {p.first_name} {p.last_name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Side-by-Side Comparison Matrix */}
        <div
          className={`border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white ${
            isMergeConfigOpen
              ? 'h-[40%] flex-1 min-h-0 flex flex-col shrink-0'
              : ''
          }`}
        >
          <div className="grid grid-cols-12 bg-slate-100 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200 py-2.5 px-3 shrink-0">
            <div className="col-span-4">Attribute</div>
            <div className="col-span-4 text-indigo-900">New Signup Details</div>
            <div className="col-span-4 text-emerald-900">Existing System Record</div>
          </div>

          <div
            className={`divide-y divide-slate-100 text-xs overscroll-contain [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full ${
              isMergeConfigOpen ? 'overflow-y-auto flex-1' : ''
            }`}
          >
            {/* Full Name */}
            <div className="grid grid-cols-12 py-2.5 px-3 items-center">
              <span className="col-span-4 font-semibold text-slate-500">Full Name</span>
              <span className="col-span-4 font-medium text-slate-900 pr-2">
                {signupUser.firstName} {signupUser.lastName}
                {signupUser.role === 'parent' && signupUser.guardianName && (
                  <span className="block text-[11px] text-slate-400">
                    Parent: {signupUser.guardianName}
                  </span>
                )}
              </span>
              <span className="col-span-4 font-medium text-slate-800">
                {activeExistingPlayer
                  ? `${activeExistingPlayer.first_name} ${activeExistingPlayer.last_name}`
                  : 'N/A'}
              </span>
            </div>

            {/* Date of Birth */}
            <div className="grid grid-cols-12 py-2.5 px-3 items-center">
              <span className="col-span-4 font-semibold text-slate-500">Date of Birth</span>
              <span className="col-span-4 font-medium text-slate-900 pr-2">
                {formatDate(signupUser.dob)}
              </span>
              <span className="col-span-4 font-medium text-slate-800">
                {activeExistingPlayer ? formatDate(activeExistingPlayer.dob) : 'N/A'}
              </span>
            </div>

            {/* Mobile Number */}
            <div className="grid grid-cols-12 py-2.5 px-3 items-center">
              <span className="col-span-4 font-semibold text-slate-500">Mobile Number</span>
              <span className="col-span-4 font-medium text-slate-900 pr-2">
                {signupUser.mobileNumber ? `+91 ${signupUser.mobileNumber}` : 'Not Provided'}
              </span>
              <span className="col-span-4 font-medium text-slate-800">
                {activeExistingPlayer?.mobile_number ? `+91 ${activeExistingPlayer.mobile_number}` : 'N/A'}
                {activeExistingPlayer && signupUser.mobileNumber && activeExistingPlayer.mobile_number !== signupUser.mobileNumber && (
                  <span className="block text-[10px] text-amber-600 font-normal">
                    (Different phone number)
                  </span>
                )}
              </span>
            </div>

            {/* Location */}
            <div className="grid grid-cols-12 py-2.5 px-3 items-center">
              <span className="col-span-4 font-semibold text-slate-500">Location</span>
              <span className="col-span-4 font-medium text-slate-900 pr-2">
                {signupUser.locationName || 'Not Set'}
              </span>
              <span className="col-span-4 font-medium text-slate-800">
                {activeExistingPlayer?.location?.name || 'Not Set'}
              </span>
            </div>

            {/* Current State */}
            <div className="grid grid-cols-12 py-2.5 px-3 items-center">
              <span className="col-span-4 font-semibold text-slate-500">Current State</span>
              <span className="col-span-4 font-medium text-amber-700 pr-2">
                Pending ({signupUser.role === 'parent' ? 'Parent' : 'Player'})
              </span>
              <span className="col-span-4 font-medium text-slate-700">
                {activeExistingPlayer ? getExistingPlayerState(activeExistingPlayer) : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Action B: Inline Precedence / Merge Form (Expandable) */}
        {isMergeConfigOpen && (
          <div className="h-[40%] flex-1 min-h-0 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col overflow-hidden shadow-sm animate-in fade-in-50 duration-200">
            <div className="p-3.5 pb-2 border-b border-slate-200/80 bg-slate-50 shrink-0 flex flex-col gap-0.5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Merge & Update Details Preview
                </span>
                <button
                  type="button"
                  onClick={() => setIsMergeConfigOpen(false)}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 px-2 py-0.5 rounded transition-colors"
                >
                  Hide
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Choose which details will be saved to the existing player record (
                {activeExistingPlayer?.first_name} {activeExistingPlayer?.last_name}).
              </p>
            </div>

            {/* Scrollable Form Fields Body */}
            <div className="p-3.5 pt-2.5 overflow-y-auto flex-1 flex flex-col gap-3 overscroll-contain [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">

            {/* First and Last Name */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700">First Name</label>
                <div className="flex gap-1.5 mb-1">
                  <button
                    type="button"
                    onClick={() => setMergedFirstName(signupUser.firstName)}
                    className="text-[10px] text-indigo-600 hover:underline cursor-pointer"
                  >
                    Use Signup ({signupUser.firstName})
                  </button>
                  {activeExistingPlayer && (
                    <button
                      type="button"
                      onClick={() => setMergedFirstName(activeExistingPlayer.first_name)}
                      className="text-[10px] text-slate-500 hover:underline cursor-pointer"
                    >
                      Keep Existing
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={mergedFirstName}
                  onChange={(e) => setMergedFirstName(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700">Last Name</label>
                <div className="flex gap-1.5 mb-1">
                  <button
                    type="button"
                    onClick={() => setMergedLastName(signupUser.lastName)}
                    className="text-[10px] text-indigo-600 hover:underline cursor-pointer"
                  >
                    Use Signup ({signupUser.lastName})
                  </button>
                  {activeExistingPlayer && (
                    <button
                      type="button"
                      onClick={() => setMergedLastName(activeExistingPlayer.last_name)}
                      className="text-[10px] text-slate-500 hover:underline cursor-pointer"
                    >
                      Keep Existing
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={mergedLastName}
                  onChange={(e) => setMergedLastName(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            {/* Date of Birth Field */}
            <div className="flex flex-col gap-1 w-full">
              <label className="text-xs font-semibold text-slate-700">Date of Birth</label>
              <div className="flex gap-1.5 mb-1">
                {signupUser.dob && (
                  <button
                    type="button"
                    onClick={() => setMergedDob(signupUser.dob || '')}
                    className="text-[10px] text-indigo-600 hover:underline cursor-pointer"
                  >
                    Use Signup ({signupUser.dob})
                  </button>
                )}
                {activeExistingPlayer?.dob && (
                  <button
                    type="button"
                    onClick={() => setMergedDob(toISODate(activeExistingPlayer.dob))}
                    className="text-[10px] text-slate-500 hover:underline cursor-pointer"
                  >
                    Keep Existing ({toISODate(activeExistingPlayer.dob)})
                  </button>
                )}
              </div>
              <DobInput value={mergedDob} onChange={setMergedDob} size="sm" required={true} />
            </div>

            {/* Location Field */}
            <div className="flex flex-col gap-1 w-full">
              <label className="text-xs font-semibold text-slate-700">Location</label>
              <div className="flex gap-1.5 mb-1">
                {signupUser.locationId && (
                  <button
                    type="button"
                    onClick={() => setMergedLocationId(signupUser.locationId)}
                    className="text-[10px] text-indigo-600 hover:underline cursor-pointer"
                  >
                    Use Signup ({signupUser.locationName || 'Branch'})
                  </button>
                )}
                {activeExistingPlayer?.location?.id && (
                  <button
                    type="button"
                    onClick={() => setMergedLocationId(activeExistingPlayer.location?.id || '')}
                    className="text-[10px] text-slate-500 hover:underline cursor-pointer"
                  >
                    Keep Existing ({activeExistingPlayer.location.name})
                  </button>
                )}
              </div>
              <select
                value={mergedLocationId}
                onChange={(e) => setMergedLocationId(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="" disabled>
                  Select location
                </option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Mobile Number Field in Merge Form */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Mobile Number</label>
              <div className="flex gap-1.5 mb-1">
                {signupUser.mobileNumber && (
                  <button
                    type="button"
                    onClick={() => setMergedMobile(signupUser.mobileNumber)}
                    className="text-[10px] text-indigo-600 hover:underline cursor-pointer"
                  >
                    Use Signup (+91 {signupUser.mobileNumber})
                  </button>
                )}
                {activeExistingPlayer?.mobile_number && (
                  <button
                    type="button"
                    onClick={() => setMergedMobile(activeExistingPlayer.mobile_number)}
                    className="text-[10px] text-slate-500 hover:underline cursor-pointer"
                  >
                    Keep Existing (+91 {activeExistingPlayer.mobile_number})
                  </button>
                )}
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-slate-400 font-medium text-xs select-none pointer-events-none">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  value={mergedMobile}
                  onChange={(e) => setMergedMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="w-full h-10 pl-11 pr-3 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

              <button
                type="button"
                disabled={isPending}
                onClick={handleActionB}
                className="mt-1 w-full h-11 shrink-0 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {isPending ? <Spinner size="sm" color="white" /> : null}
                <span>Confirm & Merge Record</span>
              </button>
            </div>
          </div>
        )}

        {/* Resolution Options (A, B, C) */}
        {!isMergeConfigOpen && (
          <div className="flex flex-col gap-2.5 pt-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider px-0.5">
              Select Resolution Path
            </span>

            {/* Action A: Approve User (Create New Player + Link Existing as Second Child) */}
            <button
              type="button"
              disabled={isPending}
              onClick={handleActionA}
              className="w-full p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50 text-left transition-all active:scale-[0.99] flex flex-col gap-1 disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">
                  Option A: Approve as New Player + Link Existing
                </span>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Sibling / Second Child
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Creates a new player record for <strong>{signupUser.firstName} {signupUser.lastName}</strong> and links{' '}
                {matchingPlayers.length > 1 ? 'all matching existing players' : 'the existing player'}{' '}
                under this parent account.
              </p>
            </button>

            {/* Action B: Update & Merge Details */}
            <button
              type="button"
              disabled={isPending}
              onClick={() => setIsMergeConfigOpen(true)}
              className="w-full p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 text-left transition-all active:scale-[0.99] flex flex-col gap-1 disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-950">
                  Option B: Update & Merge into Existing Player
                </span>
                <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                  Same Person
                </span>
              </div>
              <p className="text-[11px] text-indigo-900/70">
                Merges login credentials into the existing player record without creating a duplicate row on the roster.
              </p>
            </button>

            {/* Action C: Reject Request */}
            <button
              type="button"
              disabled={isPending}
              onClick={handleActionC}
              className="w-full p-3 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-left transition-all active:scale-[0.99] flex items-center justify-between disabled:opacity-50"
            >
              <div className="flex flex-col">
                <span className="text-xs font-bold text-rose-700">Option C: Reject Request</span>
                <span className="text-[11px] text-rose-600/70">
                  Deactivates this pending signup. Existing player records remain unchanged.
                </span>
              </div>
              <span className="material-symbols-outlined text-rose-500 text-[18px]">block</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
