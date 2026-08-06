'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createSessionAdmin } from '../_actions/action';

export interface LocationItem {
  id: string;
  name: string;
  address?: string | null;
}

export interface CoachItem {
  id: string;
  name: string;
  email: string;
  assignedLocations?: string;
}

interface CreateSessionFormProps {
  locations: LocationItem[];
  coaches: CoachItem[];
}

// Generate all 48 half-hour time slots in a day (00:00 to 23:30)
function generateHalfHourSlots() {
  const slots: { value: string; label: string; hour: number; minute: number }[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      const hh = h.toString().padStart(2, '0');
      const mm = m.toString().padStart(2, '0');
      const value = `${hh}:${mm}`;

      // Format to 12-hour string (e.g. "2:00 PM", "2:30 PM")
      const period = h >= 12 ? 'PM' : 'AM';
      const displayHour = h % 12 === 0 ? 12 : h % 12;
      const label = `${displayHour}:${mm} ${period}`;

      slots.push({ value, label, hour: h, minute: m });
    }
  }
  return slots;
}

const ALL_TIME_SLOTS = generateHalfHourSlots();

export function CreateSessionForm({ locations, coaches }: CreateSessionFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const [selectedLocationId, setSelectedLocationId] = useState<string>(locations[0]?.id || '');
  const [selectedCoachId, setSelectedCoachId] = useState<string>(coaches[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Compute availability of time slots based on selected date
  const timeSlotsWithAvailability = useMemo(() => {
    const now = new Date();
    const minAllowedTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 mins in future

    return ALL_TIME_SLOTS.map((slot) => {
      const isNight = slot.hour >= 22 || slot.hour < 3 || (slot.hour === 3 && slot.minute === 0);
      if (isNight) {
        return { ...slot, isDisabled: true, isNight: true };
      }

      if (!selectedDate) return { ...slot, isDisabled: false, isNight: false };

      const [y, m, d] = selectedDate.split('-').map(Number);
      const slotDateTime = new Date(y, m - 1, d, slot.hour, slot.minute, 0, 0);

      const isDisabled = slotDateTime.getTime() < minAllowedTime.getTime();

      return {
        ...slot,
        isDisabled,
        isNight: false,
      };
    });
  }, [selectedDate]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    // Reset selected time if it's now disabled
    if (selectedTime) {
      const [y, m, d] = newDate.split('-').map(Number);
      const [h, min] = selectedTime.split(':').map(Number);
      const slotDate = new Date(y, m - 1, d, h, min, 0, 0);
      const now = new Date();
      if (slotDate.getTime() < now.getTime() + 30 * 60 * 1000) {
        setSelectedTime('');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!selectedLocationId) {
      setErrorMsg('Please select a location.');
      return;
    }
    if (!selectedCoachId) {
      setErrorMsg('Please assign a coach for this session.');
      return;
    }
    if (!selectedDate) {
      setErrorMsg('Please pick a valid session date.');
      return;
    }
    if (!selectedTime) {
      setErrorMsg('Please select a session start time (30-min interval, at least 30 mins in future).');
      return;
    }

    const formData = new FormData();
    formData.append('locationId', selectedLocationId);
    formData.append('coachId', selectedCoachId);
    formData.append('date', selectedDate);
    formData.append('time', selectedTime);

    startTransition(async () => {
      const res = await createSessionAdmin(formData);
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to create session.');
      } else {
        setSuccessMsg('Session successfully scheduled!');
        setTimeout(() => {
          router.push('/admin/sessions/upcoming');
        }, 1200);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-indigo-600">calendar_add_on</span>
          <h2 className="text-xl font-bold text-slate-900">Create New Session</h2>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2.5 shadow-sm">
          <span className="material-symbols-outlined text-base shrink-0">error</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-2.5 shadow-sm">
          <span className="material-symbols-outlined text-base shrink-0">check_circle</span>
          <span>{successMsg}</span>
        </div>
      )}

      {/* Single Consolidated Options Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-5">
        {/* Step 1: Select Location */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-slate-400 text-base">location_on</span>
            1. Select Location
          </label>
          {locations.length === 0 ? (
            <p className="text-xs text-rose-500">No active locations found in academy.</p>
          ) : (
            <select
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} {loc.address ? `(${loc.address})` : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Step 2: Assign Coach for this Session Only */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-slate-400 text-base">sports</span>
              2. Assign Coach
            </label>
            <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100">
              For this session only
            </span>
          </div>
          {coaches.length === 0 ? (
            <p className="text-xs text-rose-500">No active coaches found in academy.</p>
          ) : (
            <select
              value={selectedCoachId}
              onChange={(e) => setSelectedCoachId(e.target.value)}
              className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
            >
              {coaches.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.assignedLocations || c.email}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Step 3: Select Date (Today or Future) */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-slate-400 text-base">calendar_today</span>
            3. Select Date (Today or Future)
          </label>
          <input
            type="date"
            min={todayStr}
            value={selectedDate}
            onChange={handleDateChange}
            className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
          />
        </div>

        {/* Step 4: Select Start Time (30-min interval, >= 30 mins in future) */}
        <div className="space-y-3">
          <div className="flex flex-col gap-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-slate-400 text-base">schedule</span>
              4. Select Start Time
            </label>
            <span className="text-[11px] text-slate-500 font-normal">
              No sessions between 10:00 PM & 3:00 AM.
            </span>
          </div>

          {/* Dropdown for precise selection */}
          <select
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
          >
            <option value="">-- Choose Start Time --</option>
            {timeSlotsWithAvailability.map((slot) => (
              <option key={slot.value} value={slot.value} disabled={slot.isDisabled}>
                {slot.label} {slot.isNight ? 'Not Allowed' : slot.isDisabled ? 'Not Allowed' : ''}
              </option>
            ))}
          </select>

          {/* Quick-Pick Popular Time Slots */}
          <div className="pt-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">
              Popular Daytime Slots:
            </span>
            <div className="grid grid-cols-3 gap-2">
              {['07:00', '08:00', '09:00', '16:00', '16:30', '17:00'].map((timeVal) => {
                const slotInfo = timeSlotsWithAvailability.find((s) => s.value === timeVal);
                if (!slotInfo) return null;
                const isSelected = selectedTime === timeVal;
                return (
                  <button
                    type="button"
                    key={timeVal}
                    disabled={slotInfo.isDisabled}
                    onClick={() => setSelectedTime(timeVal)}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : slotInfo.isDisabled
                        ? 'bg-slate-100 text-slate-300 border-slate-100 cursor-not-allowed'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {slotInfo.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full h-12 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <>
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <span>Scheduling Session...</span>
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-lg">event_available</span>
            <span>Schedule Session</span>
          </>
        )}
      </button>
    </form>
  );
}
