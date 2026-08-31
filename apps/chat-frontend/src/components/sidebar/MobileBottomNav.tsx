'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, FileText, Search, Menu } from 'lucide-react';
import { useSidebarStore } from '@/store/useSidebarStore';
import { useDeliverableStore } from '@/store/useDeliverableStore';

interface MobileBottomNavProps {
  onOpenSearch?: () => void;
}

export function MobileBottomNav({ onOpenSearch }: MobileBottomNavProps) {
  const pathname = usePathname();
  const { toggle } = useSidebarStore();
  const { deliverables } = useDeliverableStore();

  const isChat = pathname === '/' || pathname === '/chat';
  const isArtifacts = pathname === '/artifacts';

  const tabs = [
    {
      label: 'Chats',
      href: '/chat',
      active: isChat,
      icon: <MessageSquare className="h-5 w-5" />,
    },
    {
      label: 'Artifacts',
      href: '/artifacts',
      active: isArtifacts,
      icon: <FileText className="h-5 w-5" />,
      badge: deliverables.length || undefined,
    },
    {
      label: 'Search',
      action: onOpenSearch,
      active: false,
      icon: <Search className="h-5 w-5" />,
    },
    {
      label: 'Menu',
      action: toggle,
      active: false,
      icon: <Menu className="h-5 w-5" />,
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-[#080808]/90 backdrop-blur-xl border-t border-slate-200 dark:border-[#1a1a1a] safe-area-inset-bottom">
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const content = (
            <div className="flex flex-col items-center justify-center w-full h-full gap-0.5 relative">
              <div className="relative">
                {tab.icon}
                {tab.badge && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-blue-600 text-[9px] font-bold font-mono text-white flex items-center justify-center border border-white dark:border-[#080808]">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-semibold ${tab.active ? 'text-blue-600 dark:text-[#a8c7fa]' : 'text-slate-500 dark:text-[#8e918f]'}`}>
                {tab.label}
              </span>
              {tab.active && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-blue-600 dark:bg-[#a8c7fa]" />
              )}
            </div>
          );

          if (tab.href) {
            return (
              <Link
                key={tab.label}
                href={tab.href}
                className={`flex-1 h-full flex items-center justify-center touch-manipulation active:scale-95 transition-transform ${tab.active ? 'text-blue-600 dark:text-[#a8c7fa]' : 'text-slate-500 dark:text-[#8e918f]'}`}
              >
                {content}
              </Link>
            );
          }

          return (
            <button
              key={tab.label}
              onClick={tab.action}
              className="flex-1 h-full flex items-center justify-center touch-manipulation active:scale-95 transition-transform text-slate-500 dark:text-[#8e918f] cursor-pointer"
            >
              {content}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
