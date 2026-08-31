'use client';

import React, { useState, useCallback } from 'react';
import {
  FileText,
  Download,
  Search,
  Check,
  Copy,
  LayoutGrid,
  Columns,
  ArrowUpRight,
  ShieldCheck,
  X,
  ChevronDown,
  MoreVertical,
  ArrowLeft,
} from 'lucide-react';
import { useDeliverableStore, DeliverableItem } from '@/store/useDeliverableStore';
import { useCanvasStore } from '@/store/useCanvasStore';
import { DocumentCanvasPanel } from '@/components/canvas/DocumentCanvasPanel';
import { AppSidebar } from '@/components/sidebar/AppSidebar';
import { useSidebarStore } from '@/store/useSidebarStore';
import { SearchChatsModal } from '@/components/SearchChatsModal';
import { motion, AnimatePresence } from 'framer-motion';

// Premium Refined Vector Logos for Document Types
function ModernWordLogo({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" fill="none" className={className}>
      <defs>
        <linearGradient id="docBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="22" height="22" rx="6" fill="url(#docBlueGrad)" />
      <path d="M8 8h12M8 12h12M8 16h8" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="15" y="14" width="7" height="6" rx="2" fill="#60A5FA" />
      <path d="M17 16l1.5 2 2.5-3" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ModernExcelLogo({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" fill="none" className={className}>
      <defs>
        <linearGradient id="sheetGreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="22" height="22" rx="6" fill="url(#sheetGreenGrad)" />
      <rect x="7" y="7" width="6.5" height="6.5" rx="1.5" fill="#FFFFFF" fillOpacity="0.9" />
      <rect x="14.5" y="7" width="6.5" height="6.5" rx="1.5" fill="#34D399" />
      <rect x="7" y="14.5" width="6.5" height="6.5" rx="1.5" fill="#34D399" />
      <rect x="14.5" y="14.5" width="6.5" height="6.5" rx="1.5" fill="#FFFFFF" fillOpacity="0.9" />
    </svg>
  );
}

function ModernPowerPointLogo({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" fill="none" className={className}>
      <defs>
        <linearGradient id="pptOrangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EA580C" />
          <stop offset="100%" stopColor="#C2410C" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="22" height="22" rx="6" fill="url(#pptOrangeGrad)" />
      <path d="M7 17V8a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1Z" stroke="#FED7AA" strokeWidth="1.5" />
      <path d="M14 18v3m-3 0h6" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="14" cy="12.5" r="2.5" fill="#FFFFFF" />
      <path d="M14 10a2.5 2.5 0 0 1 2.5 2.5H14V10z" fill="#FB923C" />
    </svg>
  );
}

function ModernPythonLogo({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" fill="none" className={className}>
      <defs>
        <linearGradient id="pyPurpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#6D28D9" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="22" height="22" rx="6" fill="url(#pyPurpleGrad)" />
      <path d="M9.5 10.5L6.5 14l3 3.5M18.5 10.5l3 3.5-3 3.5M15 9l-2 10" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function getProfessionalFileMeta(type: string) {
  switch (type.toLowerCase()) {
    case 'docx':
      return {
        label: 'Word Document',
        ext: 'DOCX',
        color: 'text-blue-600 dark:text-blue-400',
        badgeBg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/25',
        glowColor: 'hover:border-blue-500/40 hover:shadow-[0_0_30px_rgba(59,130,246,0.12)]',
        icon: <ModernWordLogo className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" />
      };
    case 'xlsx':
      return {
        label: 'Excel Spreadsheet',
        ext: 'XLSX',
        color: 'text-emerald-600 dark:text-emerald-400',
        badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/25',
        glowColor: 'hover:border-emerald-500/40 hover:shadow-[0_0_30px_rgba(16,185,129,0.12)]',
        icon: <ModernExcelLogo className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" />
      };
    case 'pptx':
      return {
        label: 'PowerPoint Deck',
        ext: 'PPTX',
        color: 'text-orange-600 dark:text-orange-400',
        badgeBg: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/25',
        glowColor: 'hover:border-orange-500/40 hover:shadow-[0_0_30px_rgba(249,115,22,0.12)]',
        icon: <ModernPowerPointLogo className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" />
      };
    case 'py':
      return {
        label: 'Python Simulation',
        ext: 'PYTHON',
        color: 'text-purple-600 dark:text-purple-400',
        badgeBg: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/25',
        glowColor: 'hover:border-purple-500/40 hover:shadow-[0_0_30px_rgba(124,58,237,0.12)]',
        icon: <ModernPythonLogo className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" />
      };
    default:
      return {
        label: 'Document',
        ext: type.toUpperCase(),
        color: 'text-slate-600 dark:text-slate-300',
        badgeBg: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:border-slate-500/25',
        glowColor: 'hover:border-slate-400',
        icon: <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-slate-500 shrink-0" />
      };
  }
}

const CATEGORIES = [
  { id: 'ALL', label: 'All' },
  { id: 'docx', label: 'Docs' },
  { id: 'xlsx', label: 'Sheets' },
  { id: 'pptx', label: 'Slides' },
  { id: 'py', label: 'Code' }
];

export default function ArtifactsPage() {
  const {
    deliverables,
    selectedDeliverable,
    selectDeliverable,
    downloadDeliverable,
    filterType,
    setFilterType,
    searchQuery,
    setSearchQuery,
    fetchDiskDeliverables,
  } = useDeliverableStore();

  const { openCanvas } = useCanvasStore();

  React.useEffect(() => {
    // Artifacts list starts completely empty until deliverables are generated during chat sessions!
  }, []);

  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'split'>('grid');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { open: openSidebar, toggle } = useSidebarStore();

  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      openSidebar();
    }
  }, [openSidebar]);

  const filteredItems = deliverables.filter((item) => {
    const matchesType = filterType === 'ALL' || item.type.toLowerCase() === filterType.toLowerCase();
    const matchesSearch =
      item.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.generating_model.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const activeItem: DeliverableItem =
    selectedDeliverable || filteredItems[0] || deliverables[0];

  const handleCopy = (text: string, id: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(text);
      setCopiedHash(id);
      setTimeout(() => setCopiedHash(null), 2000);
    }
  };

  const handleMobileItemTap = useCallback((item: DeliverableItem) => {
    selectDeliverable(item.id);
    setMobileDetailOpen(true);
  }, [selectDeliverable]);

  const closeMobileDetail = useCallback(() => {
    setMobileDetailOpen(false);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 dark:bg-[#050507] dark:text-[#e3e3e3] font-sans antialiased selection:bg-blue-500/20 dark:selection:bg-[#4285f4]/30">
      {/* 1. Shared Modular Sidebar */}
      <AppSidebar
        onOpenSearchModal={() => setShowSearchModal(true)}
        activePage="artifacts"
      />

      {/* 2. Main Window */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100/60 dark:bg-[#07070a] relative">

        {/* ============================================================
            MOBILE HEADER — Single compact bar (< md)
            ============================================================ */}
        <div className="md:hidden flex items-center justify-between px-3 py-2 bg-white/95 border-b border-slate-200 text-slate-900 dark:bg-[#080808]/95 dark:border-[#1a1a1a] dark:text-[#e3e3e3] backdrop-blur-xl z-20 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              aria-label="Open sidebar"
              className="h-11 w-11 rounded-xl hover:bg-slate-100 dark:hover:bg-[#1e1f20] active:bg-slate-200 dark:active:bg-[#282a2c] flex items-center justify-center text-slate-700 dark:text-[#c4c7c5] transition-colors cursor-pointer touch-manipulation"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <line x1="4" x2="20" y1="12" y2="12" />
                <line x1="4" x2="20" y1="6" y2="6" />
                <line x1="4" x2="20" y1="18" y2="18" />
              </svg>
            </button>
            <span className="text-sm font-bold text-slate-900 dark:text-[#e3e3e3]">
              Artifacts
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="h-11 w-11 rounded-xl hover:bg-slate-100 dark:hover:bg-[#1e1f20] text-slate-600 dark:text-[#c4c7c5] flex items-center justify-center cursor-pointer touch-manipulation"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>
            <div className="relative">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="h-11 w-11 rounded-xl hover:bg-slate-100 dark:hover:bg-[#1e1f20] text-slate-600 dark:text-[#c4c7c5] flex items-center justify-center cursor-pointer touch-manipulation"
                aria-label="More options"
              >
                <MoreVertical className="h-5 w-5" />
              </button>
              <AnimatePresence>
                {mobileMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMobileMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-12 z-50 w-48 py-1.5 bg-white dark:bg-[#141622] border border-slate-200 dark:border-[#22283a] rounded-xl shadow-lg"
                    >
                      <button
                        onClick={() => { setViewMode('grid'); setMobileMenuOpen(false); }}
                        className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm cursor-pointer touch-manipulation ${
                          viewMode === 'grid'
                            ? 'text-blue-600 dark:text-[#a8c7fa] bg-blue-50 dark:bg-[#181a24]'
                            : 'text-slate-700 dark:text-[#c4c7c5] hover:bg-slate-50 dark:hover:bg-[#1a1e2e]'
                        }`}
                      >
                        <LayoutGrid className="h-4 w-4" />
                        Grid View
                      </button>
                      <button
                        onClick={() => { setViewMode('split'); setMobileMenuOpen(false); }}
                        className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm cursor-pointer touch-manipulation ${
                          viewMode === 'split'
                            ? 'text-blue-600 dark:text-[#a8c7fa] bg-blue-50 dark:bg-[#181a24]'
                            : 'text-slate-700 dark:text-[#c4c7c5] hover:bg-slate-50 dark:hover:bg-[#1a1e2e]'
                        }`}
                      >
                        <Columns className="h-4 w-4" />
                        Inspector View
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Mobile Collapsible Search Bar */}
        <AnimatePresence>
          {mobileSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden border-b border-slate-200 dark:border-[#1a1a1a] bg-white/95 dark:bg-[#080808]/95 backdrop-blur-xl z-10 shrink-0"
            >
              <div className="px-3 py-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-[#8e918f]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search deliverables..."
                    autoFocus
                    className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-[#111116] border border-slate-200 dark:border-[#202028] text-slate-900 dark:text-[#e3e3e3] placeholder-slate-400 dark:placeholder-[#6e7175] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 hover:text-slate-900 dark:text-[#8e918f] dark:hover:text-white cursor-pointer flex items-center justify-center"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ============================================================
            DESKTOP TOOLBAR — Filter tabs + Search + View toggle (md+)
            ============================================================ */}
        <div className="hidden md:flex px-6 py-3.5 bg-white/95 dark:bg-[#0a0a0e]/95 backdrop-blur-xl border-b border-slate-200 dark:border-[#181820] items-center justify-between gap-3 shrink-0 z-10 shadow-xs">
          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs py-0.5 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const isActive = filterType.toLowerCase() === cat.id.toLowerCase();
              return (
                <button
                  key={cat.id}
                  onClick={() => setFilterType(cat.id as any)}
                  className={`px-3.5 py-1.5 rounded-full text-[12px] font-bold transition-all duration-150 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs dark:bg-[#181a24] dark:text-[#a8c7fa] dark:border-[#2f354a]'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-[#8e918f] dark:hover:bg-[#121217] dark:hover:text-[#e3e3e3] border border-transparent font-medium'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 dark:text-[#8e918f]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search deliverables..."
                className="w-full pl-8 pr-8 py-1.5 text-xs rounded-full bg-slate-50 dark:bg-[#111116] border border-slate-200 dark:border-[#202028] text-slate-900 dark:text-[#e3e3e3] placeholder-slate-400 dark:placeholder-[#6e7175] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-[10px] text-slate-400 hover:text-slate-900 dark:text-[#8e918f] dark:hover:text-white cursor-pointer"
                >
                  &times;
                </button>
              )}
            </div>

            <div className="flex items-center bg-slate-100 dark:bg-[#111116] border border-slate-200 dark:border-[#202028] rounded-full p-0.5 shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-blue-700 shadow-xs dark:bg-[#1e1f29] dark:text-[#a8c7fa]'
                    : 'text-slate-600 hover:text-slate-900 dark:text-[#8e918f] dark:hover:text-[#e3e3e3]'
                }`}
                title="Grid Gallery View"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="text-[11px]">Grid</span>
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'split'
                    ? 'bg-white text-blue-700 shadow-xs dark:bg-[#1e1f29] dark:text-[#a8c7fa]'
                    : 'text-slate-600 hover:text-slate-900 dark:text-[#8e918f] dark:hover:text-[#e3e3e3]'
                }`}
                title="Inspector View"
              >
                <Columns className="h-3.5 w-3.5" />
                <span className="text-[11px]">Inspector</span>
              </button>
            </div>
          </div>
        </div>

        {/* ============================================================
            MOBILE FILTER PILLS — Horizontal scroll (< md)
            ============================================================ */}
        <div className="md:hidden px-3 py-2 bg-white/95 dark:bg-[#080808]/95 border-b border-slate-200 dark:border-[#1a1a1a] shrink-0 z-10">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
            {CATEGORIES.map((cat) => {
              const isActive = filterType.toLowerCase() === cat.id.toLowerCase();
              return (
                <button
                  key={cat.id}
                  onClick={() => setFilterType(cat.id as any)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-150 whitespace-nowrap cursor-pointer touch-manipulation ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs dark:bg-[#181a24] dark:text-[#a8c7fa] dark:border-[#2f354a]'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-[#8e918f] dark:hover:bg-[#121217] dark:hover:text-[#e3e3e3] border border-transparent'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ============================================================
            MAIN BODY VIEW
            ============================================================ */}
        {viewMode === 'grid' ? (
          /* ==================== GRID MODE ==================== */
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
              {filteredItems.length === 0 ? (
                <div className="py-24 text-center text-xs text-slate-500 dark:text-[#8e918f] bg-white dark:bg-[#0c0c10] rounded-2xl md:rounded-3xl border border-slate-200 dark:border-[#1a1a22]">
                  No deliverables match the selected filter or search term.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
                  {filteredItems.map((item) => {
                    const meta = getProfessionalFileMeta(item.type);
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.15 }}
                        onClick={() => handleMobileItemTap(item)}
                        className={`group relative flex flex-col justify-between rounded-xl md:rounded-2xl bg-white hover:bg-slate-50/90 border border-slate-200 dark:bg-[#0c0d14] dark:hover:bg-[#10121b] dark:border-[#1a1c28] ${meta.glowColor} transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md cursor-pointer active:scale-[0.98] touch-manipulation`}
                      >
                        {/* Card Body */}
                        <div className="p-3 sm:p-4 md:p-5 pb-2 md:pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="p-1.5 md:p-2 rounded-lg md:rounded-xl bg-slate-100 dark:bg-[#141724] border border-slate-200 dark:border-[#22283c] shadow-xs shrink-0 group-hover:scale-105 transition-transform duration-200">
                                {meta.icon}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="text-xs md:text-[13px] font-bold text-slate-900 dark:text-[#f1f3f4] truncate tracking-tight group-hover:text-blue-600 dark:group-hover:text-[#a8c7fa] transition-colors" title={item.filename}>
                                  {item.filename}
                                </h3>
                                <div className="text-[10px] md:text-[11px] text-slate-500 dark:text-[#8e918f] mt-0.5">
                                  <span>{meta.label}</span>
                                </div>
                              </div>
                            </div>
                            <span className={`text-[9px] md:text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${meta.badgeBg}`}>
                              {meta.ext}
                            </span>
                          </div>

                          {/* Summary — shorter on mobile */}
                          <div className="mt-2.5 md:mt-4 pt-2.5 md:pt-3 border-t border-slate-100 dark:border-[#161824]">
                            <p className="text-[11px] md:text-[12px] text-slate-600 dark:text-[#b5b8c4] leading-relaxed line-clamp-2 md:line-clamp-3 font-sans">
                              {item.summary}
                            </p>
                          </div>

                          {/* Metrics — hidden on mobile, visible on sm+ */}
                          {item.key_metrics && item.key_metrics.length > 0 && (
                            <div className="hidden sm:grid mt-3 grid grid-cols-2 gap-2">
                              {item.key_metrics.slice(0, 2).map((m, idx) => (
                                <div
                                  key={idx}
                                  className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-[#12141f] border border-slate-200 dark:border-[#1e2334] flex flex-col justify-between"
                                >
                                  <span className="text-[9px] text-slate-500 dark:text-[#717686] uppercase font-bold tracking-wider truncate">
                                    {m.label}
                                  </span>
                                  <span className="text-[11px] font-mono font-bold text-slate-800 dark:text-[#e3e6ee] mt-0.5 truncate">
                                    {m.value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Card Footer — Compact on mobile */}
                        <div className="px-3 sm:px-4 md:px-5 py-2.5 md:py-3.5 bg-slate-50 dark:bg-[#090a10] border-t border-slate-100 dark:border-[#151722] flex items-center justify-between">
                          <span className="text-[10px] md:text-[11px] text-blue-600 dark:text-[#a8c7fa]/80 font-bold truncate max-w-[100px] md:max-w-[140px]">
                            {item.generating_model}
                          </span>
                          <div className="flex items-center gap-1.5 md:gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); downloadDeliverable(item.id); }}
                              aria-label="Download document"
                              className="h-9 w-9 md:h-auto md:w-auto md:p-2 rounded-lg md:rounded-xl bg-white hover:bg-slate-100 dark:bg-[#12141e] dark:hover:bg-[#1a1e2e] border border-slate-200 dark:border-[#22283a] text-slate-600 dark:text-[#8e918f] hover:text-slate-900 dark:hover:text-[#f1f3f4] transition-all cursor-pointer flex items-center justify-center touch-manipulation"
                              title="Download"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); openCanvas(item); }}
                              className="h-9 md:h-auto px-3 md:px-3.5 py-1.5 rounded-lg md:rounded-xl bg-[#0070f3] hover:bg-[#0060df] text-white text-[11px] md:text-xs font-bold shadow-sm shadow-blue-500/20 transition-all active:scale-[0.97] cursor-pointer flex items-center gap-1.5 touch-manipulation"
                            >
                              <span>Open</span>
                              <ArrowUpRight className="h-3 w-3 md:h-3.5 md:w-3.5 stroke-[2.5]" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ==================== SPLIT / INSPECTOR MODE ==================== */
          <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
            {/* Left Column: Explorer List */}
            <div className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-slate-200 dark:border-[#1a1c26] bg-white dark:bg-[#090a0f] flex flex-col shrink-0">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-[#181a24] flex items-center justify-between text-xs text-slate-600 dark:text-[#8e918f]">
                <span className="font-bold uppercase tracking-wider text-[11px]">Artifacts</span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#13151f] border border-slate-200 dark:border-[#222638] font-semibold">
                  {filteredItems.length} files
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-2.5 md:p-3 space-y-1.5 md:space-y-2">
                {filteredItems.map((item) => {
                  const meta = getProfessionalFileMeta(item.type);
                  const isSelected = activeItem?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleMobileItemTap(item)}
                      className={`w-full text-left p-3 md:p-3.5 rounded-xl border transition-all flex items-start gap-2.5 md:gap-3 cursor-pointer touch-manipulation ${
                        isSelected
                          ? 'bg-blue-50/70 border-blue-500/60 shadow-xs dark:bg-[#131520] dark:border-blue-500/50'
                          : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 dark:bg-[#0d0e14] dark:border-[#1a1c26] dark:hover:bg-[#11131c]'
                      }`}
                    >
                      <div className="p-1.5 md:p-2 rounded-lg bg-slate-100 dark:bg-[#141622] shrink-0 mt-0.5 border border-slate-200 dark:border-[#22273a]">
                        {meta.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs text-slate-900 dark:text-[#f1f3f4] truncate">
                          {item.filename}
                        </div>
                        <p className="text-[10px] md:text-[11px] text-slate-500 dark:text-[#8e918f] line-clamp-2 mt-0.5 leading-relaxed font-sans">
                          {item.summary}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-[#6e7175] mt-1.5 md:mt-2 font-mono">
                          <span className={`px-2 py-0.5 rounded-full font-sans font-bold ${meta.badgeBg}`}>
                            {meta.ext}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Detail Inspector (desktop only) */}
            <div className="hidden md:flex flex-1 bg-slate-50/50 dark:bg-[#090a0f] flex-col min-h-0 overflow-y-auto p-6 lg:p-8 space-y-6">
              {activeItem ? (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-[#1a1c26]">
                    <div className="flex items-start gap-4">
                      <div className="p-3.5 rounded-2xl bg-white dark:bg-[#12141e] border border-slate-200 dark:border-[#202538] shadow-xs shrink-0">
                        {getProfessionalFileMeta(activeItem.type).icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-extrabold text-slate-900 dark:text-[#f1f3f4] break-all">
                            {activeItem.filename}
                          </h2>
                          <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${getProfessionalFileMeta(activeItem.type).badgeBg}`}>
                            {getProfessionalFileMeta(activeItem.type).ext}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-[#8e918f] mt-1">
                          Generated by <span className="text-blue-600 dark:text-[#a8c7fa] font-bold">{activeItem.generating_model}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => openCanvas(activeItem)}
                        className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#0070f3] hover:bg-[#0060df] text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                      >
                        <span>Open Canvas</span>
                        <ArrowUpRight className="h-3.5 w-3.5 stroke-[2.5]" />
                      </button>
                      <button
                        onClick={() => downloadDeliverable(activeItem.id)}
                        className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 dark:bg-[#141622] dark:hover:bg-[#1a1e2e] border border-slate-200 dark:border-[#252b40] text-slate-800 dark:text-[#e3e3e3] text-xs font-semibold transition-all cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5 text-blue-600 dark:text-[#a8c7fa]" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="p-5 rounded-2xl bg-white dark:bg-[#0d0e14] border border-slate-200 dark:border-[#1a1c26] shadow-xs">
                    <h3 className="text-[11px] font-bold text-slate-500 dark:text-[#8e918f] uppercase tracking-wider mb-2">
                      Executive Document Summary
                    </h3>
                    <p className="text-sm text-slate-700 dark:text-[#d0d3d6] leading-relaxed font-sans">
                      {activeItem.summary}
                    </p>
                  </div>

                  {/* Metrics */}
                  {activeItem.key_metrics && activeItem.key_metrics.length > 0 && (
                    <div>
                      <h3 className="text-[11px] font-bold text-slate-500 dark:text-[#8e918f] uppercase tracking-wider mb-3">
                        Key Metrics & Parameters
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {activeItem.key_metrics.map((metric, idx) => (
                          <div
                            key={idx}
                            className="p-4 rounded-xl bg-white dark:bg-[#0d0e14] border border-slate-200 dark:border-[#1a1c26] flex flex-col justify-between shadow-xs"
                          >
                            <span className="text-[11px] text-slate-500 dark:text-[#8e918f] leading-tight mb-1 font-medium">
                              {metric.label}
                            </span>
                            <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#f1f3f4] font-mono">
                              {metric.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SOP Citations */}
                  {activeItem.sop_citations && activeItem.sop_citations.length > 0 && (
                    <div>
                      <h3 className="text-[11px] font-bold text-slate-500 dark:text-[#8e918f] uppercase tracking-wider mb-3">
                        Referenced SOPs & Industry Standards
                      </h3>
                      <div className="space-y-2">
                        {activeItem.sop_citations.map((cite, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-white dark:bg-[#0d0e14] border border-slate-200 dark:border-[#1a1c26] flex items-center justify-between text-xs text-slate-700 dark:text-[#c4c7c5] shadow-xs"
                          >
                            <div className="flex items-center space-x-2">
                              <ShieldCheck className="h-4 w-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
                              <span className="font-semibold">{cite}</span>
                            </div>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30">
                              VERIFIED
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SHA-256 */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#0b0c12] border border-slate-200 dark:border-[#1a1c26] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-slate-500 dark:text-[#8e918f]">
                        <ShieldCheck className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                        <span className="font-bold">SHA-256 Air-Gapped Signature</span>
                      </div>
                      <div className="font-mono text-[11px] text-blue-600 dark:text-[#a8c7fa] break-all font-semibold">
                        {activeItem.sha256_hash}
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopy(activeItem.sha256_hash, activeItem.id)}
                      className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#141622] dark:hover:bg-[#1a1e2e] border border-slate-200 dark:border-[#252b40] text-slate-700 dark:text-[#c4c7c5] hover:text-slate-900 dark:hover:text-white shrink-0 transition-colors cursor-pointer font-medium"
                    >
                      {copiedHash === activeItem.id ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy Hash</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center p-8 text-center text-xs text-slate-500 dark:text-[#8e918f]">
                  Select an artifact from the list to view details and launch the live editor.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================
            MOBILE DETAIL BOTTOM SHEET — Full-screen slide-up (< md)
            ============================================================ */}
        <AnimatePresence>
          {mobileDetailOpen && activeItem && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="md:hidden fixed inset-0 bg-black/40 z-40"
                onClick={closeMobileDetail}
              />
              {/* Sheet */}
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="md:hidden fixed inset-x-0 bottom-0 top-12 z-50 bg-slate-50 dark:bg-[#07070a] rounded-t-2xl overflow-hidden flex flex-col"
              >
                {/* Sheet Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-[#0a0a0e] border-b border-slate-200 dark:border-[#1a1a1a] shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={closeMobileDetail}
                      className="h-10 w-10 rounded-xl hover:bg-slate-100 dark:hover:bg-[#1e1f20] flex items-center justify-center text-slate-600 dark:text-[#c4c7c5] cursor-pointer touch-manipulation shrink-0"
                      aria-label="Go back"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div className="min-w-0">
                      <h2 className="text-sm font-bold text-slate-900 dark:text-[#f1f3f4] truncate">
                        {activeItem.filename}
                      </h2>
                      <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${getProfessionalFileMeta(activeItem.type).badgeBg}`}>
                        {getProfessionalFileMeta(activeItem.type).ext}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sheet Body — Scrollable */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Summary */}
                  <div className="p-4 rounded-xl bg-white dark:bg-[#0d0e14] border border-slate-200 dark:border-[#1a1c26] shadow-xs">
                    <h3 className="text-[10px] font-bold text-slate-500 dark:text-[#8e918f] uppercase tracking-wider mb-2">
                      Executive Summary
                    </h3>
                    <p className="text-[13px] text-slate-700 dark:text-[#d0d3d6] leading-relaxed font-sans">
                      {activeItem.summary}
                    </p>
                  </div>

                  {/* Metrics */}
                  {activeItem.key_metrics && activeItem.key_metrics.length > 0 && (
                    <div>
                      <h3 className="text-[10px] font-bold text-slate-500 dark:text-[#8e918f] uppercase tracking-wider mb-2">
                        Key Metrics
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {activeItem.key_metrics.map((metric, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-white dark:bg-[#0d0e14] border border-slate-200 dark:border-[#1a1c26] flex flex-col justify-between shadow-xs"
                          >
                            <span className="text-[10px] text-slate-500 dark:text-[#8e918f] leading-tight mb-1 font-medium">
                              {metric.label}
                            </span>
                            <span className="text-sm font-bold text-slate-900 dark:text-[#f1f3f4] font-mono">
                              {metric.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SOP Citations */}
                  {activeItem.sop_citations && activeItem.sop_citations.length > 0 && (
                    <div>
                      <h3 className="text-[10px] font-bold text-slate-500 dark:text-[#8e918f] uppercase tracking-wider mb-2">
                        SOPs & Standards
                      </h3>
                      <div className="space-y-1.5">
                        {activeItem.sop_citations.map((cite, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-white dark:bg-[#0d0e14] border border-slate-200 dark:border-[#1a1c26] flex items-center gap-2 text-[11px] text-slate-700 dark:text-[#c4c7c5] shadow-xs"
                          >
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                            <span className="font-semibold flex-1 truncate">{cite}</span>
                            <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 shrink-0">
                              OK
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SHA-256 */}
                  <div className="p-3 rounded-xl bg-white dark:bg-[#0b0c12] border border-slate-200 dark:border-[#1a1c26] shadow-xs">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-[#8e918f] mb-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
                      <span className="font-bold text-[10px]">SHA-256 Signature</span>
                    </div>
                    <div className="font-mono text-[10px] text-blue-600 dark:text-[#a8c7fa] break-all font-semibold mb-2">
                      {activeItem.sha256_hash}
                    </div>
                    <button
                      onClick={() => handleCopy(activeItem.sha256_hash, activeItem.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#141622] dark:hover:bg-[#1a1e2e] border border-slate-200 dark:border-[#252b40] text-slate-700 dark:text-[#c4c7c5] text-[11px] font-medium cursor-pointer touch-manipulation"
                    >
                      {copiedHash === activeItem.id ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-500 dark:text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy Hash</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Sheet Footer — Fixed action bar */}
                <div className="px-4 py-3 bg-white dark:bg-[#0a0a0e] border-t border-slate-200 dark:border-[#1a1a1a] flex items-center gap-2 shrink-0 safe-area-bottom">
                  <button
                    onClick={() => { downloadDeliverable(activeItem.id); }}
                    className="h-12 flex-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#141622] dark:hover:bg-[#1a1e2e] border border-slate-200 dark:border-[#252b40] text-slate-800 dark:text-[#e3e3e3] text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 touch-manipulation"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </button>
                  <button
                    onClick={() => { openCanvas(activeItem); closeMobileDetail(); }}
                    className="h-12 flex-1 rounded-xl bg-[#0070f3] hover:bg-[#0060df] text-white text-sm font-bold shadow-md shadow-blue-500/20 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 touch-manipulation"
                  >
                    <span>Open Canvas</span>
                    <ArrowUpRight className="h-4 w-4 stroke-[2.5]" />
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Mount Live Univer Canvas Panel */}
        <DocumentCanvasPanel />

        {/* Global Search Chats Command Palette Modal */}
        <SearchChatsModal
          isOpen={showSearchModal}
          onClose={() => setShowSearchModal(false)}
        />
      </main>
    </div>
  );
}
