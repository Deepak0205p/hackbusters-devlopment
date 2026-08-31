'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useSovereigntyStore } from '@/store/useSovereigntyStore';
import { useNetworkStore } from '@/store/useNetworkStore';
import { socketManager } from '@/lib/socket';
import { Shield, ArrowLeft, Sun, Moon } from 'lucide-react';

export function Header() {
  const pathname = usePathname();
  const { metrics } = useSovereigntyStore();
  const { deploymentMode, hostIp, port } = useNetworkStore();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    socketManager.connectAuditStream();

    // Initialize theme from localStorage or document element
    const savedTheme = localStorage.getItem('reveal_theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else {
      const isDark = document.documentElement.classList.contains('dark');
      setTheme(isDark ? 'dark' : 'light');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('reveal_theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const isSubpage = pathname !== '/';

  return (
    <header className="border-b border-gray-200 dark:border-[#262626] bg-white dark:bg-[#000000] px-6 py-3 sticky top-0 z-50 transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Title */}
        <div className="flex items-center space-x-3">
          {isSubpage ? (
            <Link
              href="/"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-gray-100 dark:bg-[#111111] border border-gray-200 dark:border-[#333333] hover:border-gray-300 dark:hover:border-[#555555] text-xs text-gray-900 dark:text-[#ededed] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-emerald-600 dark:text-[#00e599]" />
              <span className="font-mono text-[11px]">Overview</span>
            </Link>
          ) : (
            <Link href="/" className="h-5 w-5 rounded bg-gray-100 dark:bg-[#171717] border border-gray-200 dark:border-[#333333] flex items-center justify-center font-mono text-[11px] text-gray-900 dark:text-[#ededed] font-semibold">
              M
            </Link>
          )}

          <Link href="/" className="text-xs font-semibold tracking-tight text-gray-900 dark:text-[#ededed] hover:text-gray-700 dark:hover:text-white transition-colors">
            MRPL Sovereign Workbench
          </Link>
          <span className="text-gray-300 dark:text-[#333333]">/</span>
          <span className="text-xs font-mono text-gray-500 dark:text-[#888888]">
            {deploymentMode} ({hostIp}:{port})
          </span>
        </div>

        {/* Controls: Theme Toggle & Air Gap Status Pill */}
        <div className="flex items-center space-x-2">
          {/* Light / Dark Theme Switcher Button */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 dark:bg-[#111111] border border-gray-200 dark:border-[#262626] hover:bg-gray-200 dark:hover:bg-[#1f1f1f] text-xs font-mono text-gray-900 dark:text-[#ededed] transition-colors cursor-pointer"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Theme`}
          >
            {theme === 'light' ? (
              <>
                <Moon className="h-3.5 w-3.5 text-indigo-600" />
                <span className="text-[11px] font-medium">Dark Mode</span>
              </>
            ) : (
              <>
                <Sun className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-[11px] font-medium">Light Mode</span>
              </>
            )}
          </button>

          {/* Air Gap Status Pill */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-[#262626] text-xs font-mono">
            <motion.span
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-[#00e599] inline-block"
            />
            <Shield className="h-3 w-3 text-emerald-600 dark:text-[#00e599]" />
            <span className="text-gray-900 dark:text-[#ededed] font-medium text-[11px]">
              0 External Egress
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
