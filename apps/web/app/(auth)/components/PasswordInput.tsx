'use client';

import React, { useState } from 'react';
import { VisibilityIcon, VisibilityOffIcon } from '../../../components/ui/icons';

interface PasswordInputProps {
  id?: string;
  name?: string;
  label?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  autoComplete?: string;
}

export function PasswordInput({
  id = 'password',
  name = 'password',
  label = 'Password',
  value,
  onChange,
  placeholder = '••••••••',
  required = true,
  disabled = false,
  className = '',
  autoComplete = 'current-password',
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-gray-900" htmlFor={id}>
            {label}
          </label>
        </div>
      )}
      <div className="relative">
        <input
          id={id}
          name={name}
          type={showPassword ? 'text' : 'password'}
          required={required}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          aria-label={label}
          disabled={disabled}
          autoComplete={autoComplete}
          className={`w-full h-14 pl-4 pr-12 bg-white border border-gray-300 rounded-xl text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all disabled:opacity-50 disabled:bg-gray-50 ${className}`}
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          disabled={disabled}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center text-gray-500 hover:text-gray-900 focus:outline-none disabled:opacity-50 transition-colors"
        >
          {showPassword ? (
            <VisibilityIcon className="w-5 h-5" />
          ) : (
            <VisibilityOffIcon className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}
