'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  FileText,
  MessageSquare,
  Search,
  Download,
  Plus,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react';
import { useChatStore } from '@/store/useChatStore';
import { useDeliverableStore } from '@/store/useDeliverableStore';
import { motion, AnimatePresence } from 'framer-motion';

// Google Gemini 4-Pointed Sparkle Icon
export function GeminiSparkleIcon({ className = "h-5 w-5", animated = false }: { className?: string; animated?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} ${animated ? 'animate-pulse' : ''}`}
    >
      <path
        d="M12 2C12 7.52285 7.52285 12 2 12C7.52285 12 12 16.4771 12 22C12 16.4771 16.4771 12 22 12C16.4771 12 12 7.52285 12 2Z"
        fill="url(#gemini-sparkle-grad-sidebar)"
      />
      <defs>
        <linearGradient id="gemini-sparkle-grad-sidebar" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4285F4" />
          <stop offset="0.5" stopColor="#9B72CF" />
          <stop offset="1" stopColor="#D96570" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Accessible Hover Tooltip Component
export function SidebarTooltip({ children, text, position = 'right' }: { children: React.ReactNode; text: string; position?: 'right' | 'top' }) {
  const [show, setShow] = useState(false);

  return (
    <div
      className="relative flex items-center justify-center"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 pointer-events-none px-2.5 py-1 text-[11px] font-medium text-[#e3e3e3] bg-[#1e1f20] border border-[#3c4043] rounded-lg shadow-xl whitespace-nowrap ${
              position === 'right' ? 'left-full ml-3.5 top-1/2 -translate-y-1/2' : 'bottom-full mb-2 left-1/2 -translate-x-1/2'
            }`}
          >
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface AppSidebarProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  onOpenSearchModal?: () => void;
  activePage?: 'chat' | 'artifacts';
}

export function AppSidebar({
  isSidebarOpen,
  toggleSidebar,
  onOpenSearchModal,
  activePage = 'chat'
}: AppSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { sessions, activeSessionId, selectSession, createNewChat } = useChatStore();
  const { deliverables } = useDeliverableStore();

  const isArtifactsActive = activePage === 'artifacts' || pathname === '/artifacts';
  const isChatActive = activePage === 'chat' && pathname !== '/artifacts';

  const handleNewChat = () => {
    createNewChat();
    if (pathname !== '/' && pathname !== '/chat') {
      router.push('/chat');
    }
    if (typeof window !== 'undefined' && window.innerWidth < 768 && isSidebarOpen) {
      toggleSidebar();
    }
  };

  const handleSelectSession = (sessionId: string) => {
    selectSession(sessionId);
    if (pathname !== '/' && pathname !== '/chat') {
      router.push('/chat');
    }
    if (typeof window !== 'undefined' && window.innerWidth < 768 && isSidebarOpen) {
      toggleSidebar();
    }
  };

  return (
    <>
      {/* Mobile Off-Canvas Backdrop */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleSidebar}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Main Responsive Sidebar Drawer/Column */}
      <aside
        className={`fixed md:relative inset-y-0 left-0 z-50 h-full bg-[#080808] border-r border-[#1a1a1a]/80 flex flex-col justify-between py-4 select-none transition-all duration-300 ease-in-out shrink-0 ${
          isSidebarOpen
            ? 'w-72 px-3 translate-x-0'
            : 'w-0 md:w-[68px] px-0 md:px-3 -translate-x-full md:translate-x-0 items-center overflow-hidden'
        }`}
      >
        <div className="flex flex-col space-y-5 w-full min-w-0">
          {/* Top Brand Header & Sidebar Toggle */}
          <div className={`flex items-center w-full ${isSidebarOpen ? 'justify-between px-1' : 'justify-center'}`}>
            {isSidebarOpen ? (
              <>
                <Link href="/chat" className="flex items-center space-x-2.5 group">
                  <GeminiSparkleIcon className="h-5 w-5" animated={true} />
                  <span className="text-sm font-semibold tracking-tight text-[#e3e3e3] group-hover:text-white transition-colors">
                    MRPL Sovereign
                  </span>
                </Link>

                <SidebarTooltip text="Collapse sidebar" position="right">
                  <button
                    onClick={toggleSidebar}
                    aria-label="Collapse sidebar"
                    className="h-9 w-9 rounded-full hover:bg-[#1e1f20] active:bg-[#282a2c] flex items-center justify-center text-[#8e918f] hover:text-[#e3e3e3] transition-colors"
                  >
                    <PanelLeftClose className="h-4 w-4" />
                  </button>
                </SidebarTooltip>
              </>
            ) : (
              <SidebarTooltip text="Expand sidebar" position="right">
                <button
                  onClick={toggleSidebar}
                  aria-label="Expand sidebar"
                  className="h-11 w-11 rounded-full hover:bg-[#1e1f20] active:bg-[#282a2c] hidden md:flex items-center justify-center text-[#c4c7c5] hover:text-white transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <PanelLeft className="h-5 w-5" />
                </button>
              </SidebarTooltip>
            )}
          </div>

          {/* Navigation Actions Group */}
          <div className={`w-full flex flex-col ${isSidebarOpen ? 'space-y-2' : 'space-y-4 items-center'}`}>
            {/* New Chat Button */}
            {isSidebarOpen ? (
              <button
                onClick={handleNewChat}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-full bg-[#1e1f20] hover:bg-[#282a2c] text-xs text-[#e3e3e3] font-medium border border-[#3c4043]/50 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-sm min-h-[44px]"
              >
                <Plus className="h-4 w-4 text-[#a8c7fa] shrink-0" />
                <span>New chat</span>
              </button>
            ) : (
              <SidebarTooltip text="New chat" position="right">
                <button
                  onClick={handleNewChat}
                  aria-label="New chat"
                  className="h-11 w-11 rounded-full bg-[#1e1f20] hover:bg-[#282a2c] border border-[#3c4043]/40 hidden md:flex items-center justify-center text-[#e3e3e3] hover:text-[#a8c7fa] transition-all duration-200 hover:scale-105 active:scale-95 shadow-md"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </SidebarTooltip>
            )}

            {/* Search Chats Button */}
            {isSidebarOpen ? (
              <button
                onClick={() => onOpenSearchModal && onOpenSearchModal()}
                className="w-full flex items-center space-x-3 rounded-full hover:bg-[#1e1f20] text-xs text-[#c4c7c5] hover:text-white transition-colors px-3 py-2.5 min-h-[44px]"
              >
                <Search className="h-4 w-4 shrink-0" />
                <span>Search chats</span>
              </button>
            ) : (
              <SidebarTooltip text="Search chats" position="right">
                <button
                  onClick={() => onOpenSearchModal && onOpenSearchModal()}
                  aria-label="Search chats"
                  className="h-11 w-11 hidden md:flex items-center justify-center rounded-full hover:bg-[#1e1f20] text-[#c4c7c5] hover:text-white transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <Search className="h-4 w-4 shrink-0" />
                </button>
              </SidebarTooltip>
            )}

            {/* Artifacts Navigation Button */}
            {isSidebarOpen ? (
              <Link
                href="/artifacts"
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-full text-xs transition-colors min-h-[44px] ${
                  isArtifactsActive
                    ? 'bg-[#1e1f20] text-[#a8c7fa] border border-[#3c4043]/60 font-medium'
                    : 'hover:bg-[#1e1f20] text-[#c4c7c5] hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <FileText className="h-4 w-4 text-[#a8c7fa] shrink-0" />
                  <span>Artifacts</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  {deliverables.length}
                </span>
              </Link>
            ) : (
              <SidebarTooltip text={`Artifacts (${deliverables.length})`} position="right">
                <Link
                  href="/artifacts"
                  aria-label="Artifacts"
                  className={`relative h-11 w-11 hidden md:flex items-center justify-center rounded-full transition-all duration-200 hover:scale-105 active:scale-95 ${
                    isArtifactsActive
                      ? 'bg-[#1e1f20] text-[#a8c7fa]'
                      : 'hover:bg-[#1e1f20] text-[#c4c7c5] hover:text-white'
                  }`}
                >
                  <FileText className="h-4 w-4 text-[#a8c7fa]" />
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-blue-500 text-[9px] font-bold font-mono text-white flex items-center justify-center border border-black shadow-sm">
                    {deliverables.length}
                  </span>
                </Link>
              </SidebarTooltip>
            )}
          </div>

          {/* Expanded Recent Conversations Drawer */}
          {isSidebarOpen && (
            <div className="pt-2 border-t border-[#282a2c]/60 max-h-[35vh] overflow-y-auto space-y-1 w-full">
              <div className="px-2 pb-1 text-[11px] font-semibold text-[#8e918f] uppercase tracking-wider">
                Recent
              </div>
              {sessions.map((sess) => {
                const isActive = sess.id === activeSessionId && isChatActive;
                return (
                  <button
                    key={sess.id}
                    onClick={() => handleSelectSession(sess.id)}
                    className={`w-full text-left px-3 py-2 rounded-full text-xs transition-all flex items-center space-x-2.5 truncate min-h-[38px] ${
                      isActive
                        ? 'bg-[#1e1f20] text-[#a8c7fa] font-medium'
                        : 'text-[#c4c7c5] hover:bg-[#1e1f20]/60 hover:text-white'
                    }`}
                  >
                    <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-70" />
                    <span className="truncate">{sess.title || 'New conversation'}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
