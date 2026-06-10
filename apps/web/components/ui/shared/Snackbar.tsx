'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

type SnackbarType = 'success' | 'error' | 'info';

interface SnackbarOptions {
  message: string;
  type?: SnackbarType;
  duration?: number;
}

interface SnackbarContextType {
  showSnackbar: (options: SnackbarOptions) => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

export function useSnackbar() {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }
  return context;
}

export function SnackbarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<SnackbarType>('info');
  const [duration, setDuration] = useState(3000);

  const showSnackbar = useCallback(({ message, type = 'info', duration = 3000 }: SnackbarOptions) => {
    setMessage(message);
    setType(type);
    setDuration(duration);
    setIsOpen(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setIsOpen(false), duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration]);

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      {isOpen && (
        <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 text-sm font-medium transition-all animate-in slide-in-from-bottom-5 fade-in ${
          type === 'success' ? 'bg-green-100 text-green-900 border border-green-200' :
          type === 'error' ? 'bg-red-100 text-red-900 border border-red-200' :
          'bg-slate-800 text-white'
        }`}>
          {type === 'success' && <span className="material-symbols-outlined text-[18px]">check_circle</span>}
          {type === 'error' && <span className="material-symbols-outlined text-[18px]">error</span>}
          {type === 'info' && <span className="material-symbols-outlined text-[18px]">info</span>}
          <span>{message}</span>
        </div>
      )}
    </SnackbarContext.Provider>
  );
}