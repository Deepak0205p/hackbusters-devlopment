'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface DropdownOption<T = string | number> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  badge?: string;
  description?: string;
}

export interface CustomDropdownProps<T = string | number> {
  value: T;
  options: (DropdownOption<T> | string | number)[];
  onChange: (value: T) => void;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  size?: 'xs' | 'sm' | 'md';
  align?: 'left' | 'right';
  disabled?: boolean;
}

export function CustomDropdown<T extends string | number = string>({
  value,
  options,
  onChange,
  placeholder = 'Select...',
  className = '',
  buttonClassName = '',
  menuClassName = '',
  size = 'sm',
  align = 'left',
  disabled = false,
}: CustomDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const normalizedOptions: DropdownOption<T>[] = options.map((opt) => {
    if (typeof opt === 'object' && opt !== null && 'value' in opt) {
      return opt as DropdownOption<T>;
    }
    return {
      value: opt as unknown as T,
      label: String(opt),
    };
  });

  const selectedOption = normalizedOptions.find((o) => o.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const sizeStyles = {
    xs: {
      btn: 'px-2.5 py-1 text-[11px] h-7 rounded-lg',
      menu: 'p-1 text-[11px]',
      item: 'px-2 py-1 rounded-md text-[11px]',
      icon: 'h-3 w-3',
    },
    sm: {
      btn: 'px-3 py-2 text-xs h-9 rounded-xl',
      menu: 'p-1.5 text-xs',
      item: 'px-2.5 py-1.5 rounded-lg text-xs',
      icon: 'h-3.5 w-3.5',
    },
    md: {
      btn: 'px-3.5 py-2.5 text-sm h-10 rounded-xl',
      menu: 'p-2 text-sm',
      item: 'px-3 py-2 rounded-xl text-sm',
      icon: 'h-4 w-4',
    },
  }[size];

  return (
    <div ref={containerRef} className={`relative inline-block w-full ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 font-medium transition-all select-none cursor-pointer border ${
          sizeStyles.btn
        } ${
          isOpen
            ? 'bg-white border-blue-500 text-gray-900 shadow-sm'
            : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-900'
        } disabled:opacity-50 disabled:cursor-not-allowed ${buttonClassName}`}
      >
        <span className="flex items-center gap-2 truncate">
          {selectedOption?.icon}
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        </span>
        <ChevronDown
          className={`${sizeStyles.icon} text-gray-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-blue-600' : ''
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.14, ease: [0.2, 0, 0, 1] }}
            className={`absolute z-[100] mt-1.5 w-full min-w-[200px] max-h-64 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-2xl backdrop-blur-xl scrollbar-thin ${
              align === 'right' ? 'right-0' : 'left-0'
            } ${sizeStyles.menu} ${menuClassName}`}
          >
            {normalizedOptions.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-2 text-left font-medium transition-colors cursor-pointer ${
                    sizeStyles.item
                  } ${
                    isSelected
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {opt.icon}
                    <div className="truncate">
                      <div>{opt.label}</div>
                      {opt.description && (
                        <div className={`text-[10px] ${isSelected ? 'text-blue-100' : 'text-gray-400'}`}>
                          {opt.description}
                        </div>
                      )}
                    </div>
                  </div>
                  {isSelected && <Check className={`${sizeStyles.icon} shrink-0 stroke-[2.5]`} />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
