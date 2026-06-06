'use client';

import { useState } from 'react';

export type Batch = {
  id: string;
  name: string;
  locationId: string;
  locationName: string;
  playerCount: number;
};

export function NewSessionForm({ batches }: { batches: Batch[] }) {
  const [sessionType, setSessionType] = useState<'one-time' | 'recurring'>('one-time');
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [isBatchDropdownOpen, setIsBatchDropdownOpen] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [newGoal, setNewGoal] = useState('');

  const addGoal = () => {
    if (newGoal.trim()) {
      setGoals([...goals, newGoal.trim()]);
      setNewGoal('');
    }
  };

  const updateGoal = (index: number, value: string) => {
    const updatedGoals = [...goals];
    updatedGoals[index] = value;
    setGoals(updatedGoals);
  };

  const removeGoal = (index: number) => {
    setGoals(goals.filter((_, i) => i !== index));
  };

  const toggleBatch = (id: string) => {
    if (selectedBatchIds.includes(id)) {
      setSelectedBatchIds(selectedBatchIds.filter((b) => b !== id));
    } else {
      setSelectedBatchIds([...selectedBatchIds, id]);
    }
  };

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const selectedBatches = batches.filter((b) => selectedBatchIds.includes(b.id));
  const uniqueLocations = Array.from(new Set(selectedBatches.map((b) => b.locationName)));
  const locationString = uniqueLocations.length > 0 ? uniqueLocations.join(', ') : 'Select batches to see location';

  const daysOfWeek = [
    { label: 'Mon', value: '1' },
    { label: 'Tue', value: '2' },
    { label: 'Wed', value: '3' },
    { label: 'Thu', value: '4' },
    { label: 'Fri', value: '5' },
    { label: 'Sat', value: '6' },
    { label: 'Sun', value: '0' },
  ];

  return (
    <>
      <main className="flex-1 px-4 py-6 space-y-6">
        {/* Session Type Toggle */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Session Type</h2>
          <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
            <button
              onClick={() => setSessionType('one-time')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${sessionType === 'one-time' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              One-time
            </button>
            <button
              onClick={() => setSessionType('recurring')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${sessionType === 'recurring' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Recurring
            </button>
          </div>
        </section>

        {/* Group / Team Selector Card */}
        <section className="space-y-3 relative">
          <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Group / Team</h2>
          <div
            onClick={() => setIsBatchDropdownOpen(!isBatchDropdownOpen)}
            className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 transition-transform cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                  <span className="material-symbols-outlined">groups</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Select Batches</p>
                  <p className="text-xs text-slate-500">{selectedBatchIds.length} Selected</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-slate-400">{isBatchDropdownOpen ? 'expand_less' : 'expand_more'}</span>
            </div>
            {selectedBatchIds.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 mt-2">
                {selectedBatches.map((b) => (
                  <span key={b.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-100">
                    {b.name}
                    <button onClick={(e) => { e.stopPropagation(); toggleBatch(b.id); }} className="hover:text-indigo-900">
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          
          {isBatchDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
              {batches.length === 0 ? (
                <div className="p-4 text-sm text-slate-500 text-center">No batches available</div>
              ) : (
                batches.map((batch) => (
                  <div key={batch.id} onClick={() => toggleBatch(batch.id)} className="flex items-center justify-between p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{batch.name}</p>
                      <p className="text-xs text-slate-500">{batch.playerCount} Players • {batch.locationName}</p>
                    </div>
                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${selectedBatchIds.includes(batch.id) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                      {selectedBatchIds.includes(batch.id) && <span className="material-symbols-outlined text-white text-[14px]">check</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </section>

        {/* Date & Time Section */}
        {sessionType === 'one-time' ? (
          <section className="space-y-4">
            <div className="space-y-3">
              <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Date</h2>
              <div className="bg-white rounded-2xl px-4 py-2 shadow-sm border border-slate-200 flex items-center gap-3 h-[56px] focus-within:ring-2 focus-within:ring-indigo-500">
                <span className="material-symbols-outlined text-slate-400 text-[20px]">calendar_today</span>
                <input type="date" className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Start Time</h2>
                <div className="bg-white rounded-2xl px-4 py-2 shadow-sm border border-slate-200 flex items-center gap-3 h-[56px] focus-within:ring-2 focus-within:ring-indigo-500">
                  <span className="material-symbols-outlined text-slate-400 text-[20px]">schedule</span>
                  <input type="time" className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none" />
                </div>
              </div>
              <div className="space-y-3">
                <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">End Time</h2>
                <div className="bg-white rounded-2xl px-4 py-2 shadow-sm border border-slate-200 flex items-center gap-3 h-[56px] focus-within:ring-2 focus-within:ring-indigo-500">
                  <span className="material-symbols-outlined text-slate-400 text-[20px]">schedule</span>
                  <input type="time" className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none" />
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="space-y-4">
            <div className="space-y-3">
              <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Days of Week</h2>
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex justify-between gap-1">
                {daysOfWeek.map((day) => (
                  <button
                    key={day.value}
                    onClick={() => toggleDay(day.value)}
                    className={`flex flex-col items-center justify-center w-10 h-10 rounded-full transition-colors ${selectedDays.includes(day.value) ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    <span className="text-xs font-semibold">{day.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Start Time</h2>
                <div className="bg-white rounded-2xl px-4 py-2 shadow-sm border border-slate-200 flex items-center gap-3 h-[56px] focus-within:ring-2 focus-within:ring-indigo-500">
                  <span className="material-symbols-outlined text-slate-400 text-[20px]">schedule</span>
                  <input type="time" className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none" />
                </div>
              </div>
              <div className="space-y-3">
                <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">End Time</h2>
                <div className="bg-white rounded-2xl px-4 py-2 shadow-sm border border-slate-200 flex items-center gap-3 h-[56px] focus-within:ring-2 focus-within:ring-indigo-500">
                  <span className="material-symbols-outlined text-slate-400 text-[20px]">schedule</span>
                  <input type="time" className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none" />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Location Section */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Location</h2>
          <div className="bg-slate-100 rounded-2xl p-4 shadow-inner border border-slate-200 space-y-4 flex items-center gap-3">
            <span className="material-symbols-outlined text-slate-500">location_on</span>
            <span className="text-sm font-medium text-slate-700 truncate">{locationString}</span>
          </div>
        </section>

        {/* Goals Section */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Goals</h2>
          <div className="space-y-2">
            {goals.map((goal, index) => (
              <div key={index} className="flex items-center gap-2 bg-white rounded-xl p-3 border border-slate-200 shadow-sm focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
                <span className="material-symbols-outlined text-slate-400 text-[20px]">flag</span>
                <input 
                  type="text" 
                  value={goal} 
                  onChange={(e) => updateGoal(index, e.target.value)} 
                  className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none" 
                  placeholder="e.g. Dribbling practice"
                />
                <button 
                  onClick={() => removeGoal(index)} 
                  className="text-slate-400 hover:text-red-500 transition-colors flex items-center justify-center w-8 h-8 rounded-full hover:bg-red-50"
                  title="Remove goal"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            ))}
            <div className="flex items-center gap-2 bg-white rounded-xl p-3 border border-slate-200 shadow-sm focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
              <span className="material-symbols-outlined text-indigo-400 text-[20px]">add</span>
              <input 
                type="text" 
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addGoal();
                  }
                }}
                className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400" 
                placeholder="Add a new goal..."
              />
              <button 
                onClick={addGoal}
                disabled={!newGoal.trim()}
                className="text-indigo-600 disabled:text-slate-300 disabled:bg-transparent font-medium text-sm px-3 py-1 rounded-md hover:bg-indigo-50 transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Bottom Navigation Cluster */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[448px] mx-auto w-full bg-white border-t border-slate-200 z-50 p-4 shadow-[0_-4px_12px_0_rgba(0,0,0,0.03)]" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
        <button className="w-full bg-slate-900 text-white text-lg font-bold py-4 rounded-xl active:scale-[0.97] transition-all flex items-center justify-center gap-2">
          Create Session
        </button>
      </div>
    </>
  );
}