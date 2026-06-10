'use client';

import React, { useState, useEffect } from 'react';

interface DobInputProps {
  id?: string;
  name?: string;
  label: string;
  value: string; // Expected format: YYYY-MM-DD
  onChange: (value: string) => void;
  required?: boolean;
}

export function DobInput({ id, name, label, value, onChange, required }: DobInputProps) {
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  // Initialize from value prop
  useEffect(() => {
    if (value) {
      const [y, m, d] = value.split('-');
      if (y && m && d) {
        setYear(y);
        setMonth(parseInt(m, 10).toString());
        setDay(parseInt(d, 10).toString());
      }
    }
  }, [value]);

  const handleDateChange = (type: 'day' | 'month' | 'year', val: string) => {
    let newDay = day;
    let newMonth = month;
    let newYear = year;

    if (type === 'day') newDay = val;
    if (type === 'month') newMonth = val;
    if (type === 'year') newYear = val;

    // Handle maximum days in a month if month/year changes
    if ((type === 'month' || type === 'year') && newMonth && newDay) {
      const maxDays = new Date(parseInt(newYear || '2000', 10), parseInt(newMonth, 10), 0).getDate();
      if (parseInt(newDay, 10) > maxDays) {
        newDay = maxDays.toString();
      }
    }

    setDay(newDay);
    setMonth(newMonth);
    setYear(newYear);

    if (newDay && newMonth && newYear) {
      const formattedDay = newDay.padStart(2, '0');
      const formattedMonth = newMonth.padStart(2, '0');
      onChange(`${newYear}-${formattedMonth}-${formattedDay}`);
    } else {
      onChange('');
    }
  };

  // Generate options
  const daysInMonth = month ? new Date(parseInt(year || '2000', 10), parseInt(month, 10), 0).getDate() : 31;
  const days = Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString());
  
  const months = [
    { value: '1', label: 'January' }, { value: '2', label: 'February' },
    { value: '3', label: 'March' }, { value: '4', label: 'April' },
    { value: '5', label: 'May' }, { value: '6', label: 'June' },
    { value: '7', label: 'July' }, { value: '8', label: 'August' },
    { value: '9', label: 'September' }, { value: '10', label: 'October' },
    { value: '11', label: 'November' }, { value: '12', label: 'December' },
  ];
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => (currentYear - i).toString());

  const selectClasses = "h-12 px-3 bg-white border border-gray-300 rounded-xl text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all hover:border-gray-400 cursor-pointer";

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-900" htmlFor={id}>
        {label}
      </label>
      <div className="flex gap-2 sm:gap-3">
        <select
          value={month}
          onChange={(e) => handleDateChange('month', e.target.value)}
          className={`flex-[3] ${selectClasses}`}
          required={required}
        >
          <option value="" disabled>Month</option>
          {months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>

        <select
          value={day}
          onChange={(e) => handleDateChange('day', e.target.value)}
          className={`flex-[2] ${selectClasses}`}
          required={required}
        >
          <option value="" disabled>Day</option>
          {days.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>

        <select
          value={year}
          onChange={(e) => handleDateChange('year', e.target.value)}
          className={`flex-[3] ${selectClasses}`}
          required={required}
        >
          <option value="" disabled>Year</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      {/* Hidden input to ensure native form submission works perfectly */}
      <input type="hidden" id={id} name={name} value={value} />
    </div>
  );
}