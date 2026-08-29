'use client';

import React, { useState } from 'react';
import {
  FileText,
  Download,
  Search,
  Check,
  Copy,
  Sparkles,
  LayoutGrid,
  Columns,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';
import { useDeliverableStore, DeliverableItem } from '@/store/useDeliverableStore';
import { useCanvasStore } from '@/store/useCanvasStore';
import { DocumentCanvasPanel } from '@/components/canvas/DocumentCanvasPanel';
import { AppSidebar } from '@/components/sidebar/AppSidebar';
import { motion } from 'framer-motion';

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
      {/* 2x2 Clean Spreadsheet Grid */}
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
      {/* Slide Presentation Frame with Pie / Chart */}
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
      {/* Code Terminal Brackets </> */}
      <path d="M9.5 10.5L6.5 14l3 3.5M18.5 10.5l3 3.5-3 3.5M15 9l-2 10" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Professional Metadata & Badging Helpers
function getProfessionalFileMeta(type: string) {
  switch (type.toLowerCase()) {
    case 'docx':
      return {
        label: 'Word Document',
        ext: 'DOCX',
        color: 'text-blue-400',
        badgeBg: 'bg-blue-500/10 text-blue-400 border-blue-500/25',
        glowColor: 'group-hover:border-blue-500/40 group-hover:shadow-[0_0_30px_rgba(37,99,235,0.15)]',
        icon: <ModernWordLogo className="h-6 w-6 shrink-0" />
      };
    case 'xlsx':
      return {
        label: 'Excel Spreadsheet',
        ext: 'XLSX',
        color: 'text-emerald-400',
        badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
        glowColor: 'group-hover:border-emerald-500/40 group-hover:shadow-[0_0_30px_rgba(5,150,105,0.15)]',
        icon: <ModernExcelLogo className="h-6 w-6 shrink-0" />
      };
    case 'pptx':
      return {
        label: 'PowerPoint Deck',
        ext: 'PPTX',
        color: 'text-orange-400',
        badgeBg: 'bg-orange-500/10 text-orange-400 border-orange-500/25',
        glowColor: 'group-hover:border-orange-500/40 group-hover:shadow-[0_0_30px_rgba(234,88,12,0.15)]',
        icon: <ModernPowerPointLogo className="h-6 w-6 shrink-0" />
      };
    case 'py':
      return {
        label: 'Python Algorithm',
        ext: 'PYTHON',
        color: 'text-purple-400',
        badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/25',
        glowColor: 'group-hover:border-purple-500/40 group-hover:shadow-[0_0_30px_rgba(124,58,237,0.15)]',
        icon: <ModernPythonLogo className="h-6 w-6 shrink-0" />
      };
    default:
      return {
        label: 'Document',
        ext: type.toUpperCase(),
        color: 'text-slate-300',
        badgeBg: 'bg-slate-500/10 text-slate-300 border-slate-500/25',
        glowColor: 'group-hover:border-slate-500/40',
        icon: <FileText className="h-6 w-6 text-slate-300 shrink-0" />
      };
  }
}

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
  } = useDeliverableStore();

  const { openCanvas } = useCanvasStore();

  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'split'>('grid');

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

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

  const CATEGORIES = [
    { id: 'ALL', label: 'All Artifacts' },
    { id: 'docx', label: 'Documents' },
    { id: 'xlsx', label: 'Spreadsheets' },
    { id: 'pptx', label: 'Presentations' },
    { id: 'py', label: 'Python Scripts' }
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#050507] text-[#e3e3e3] font-sans antialiased selection:bg-[#4285f4]/30 selection:text-white">
      {/* 1. Shared Modular Sidebar */}
      <AppSidebar
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        activePage="artifacts"
      />

      {/* 2. Main Window: High-End Artifacts Workspace */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#07070a] relative">
        {/* Top Filter & Search Controls Header */}
        <div className="px-6 py-3.5 bg-[#0a0a0e]/95 backdrop-blur-xl border-b border-[#181820] flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0 z-10">
          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs py-0.5 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const isActive = filterType.toLowerCase() === cat.id.toLowerCase();
              return (
                <button
                  key={cat.id}
                  onClick={() => setFilterType(cat.id as any)}
                  className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all duration-150 whitespace-nowrap ${
                    isActive
                      ? 'bg-[#181a24] text-[#a8c7fa] border border-[#2f354a] shadow-sm shadow-blue-500/5'
                      : 'text-[#8e918f] hover:bg-[#121217] hover:text-[#e3e3e3] border border-transparent'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Right Controls: Search Box + View Mode Toggle */}
          <div className="flex items-center space-x-3">
            {/* Search Box */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#8e918f]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search deliverables..."
                className="w-full pl-8 pr-8 py-1.5 text-xs rounded-full bg-[#111116] border border-[#202028] text-[#e3e3e3] placeholder-[#6e7175] focus:outline-none focus:border-[#4285f4] focus:ring-1 focus:ring-[#4285f4]/30 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-[10px] text-[#8e918f] hover:text-white"
                >
                  &times;
                </button>
              )}
            </div>

            {/* View Mode Switcher: Grid vs Split */}
            <div className="flex items-center bg-[#111116] border border-[#202028] rounded-full p-0.5 shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  viewMode === 'grid'
                    ? 'bg-[#1e1f29] text-[#a8c7fa] shadow-sm'
                    : 'text-[#8e918f] hover:text-[#e3e3e3]'
                }`}
                title="Grid Gallery View"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-[11px]">Grid</span>
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  viewMode === 'split'
                    ? 'bg-[#1e1f29] text-[#a8c7fa] shadow-sm'
                    : 'text-[#8e918f] hover:text-[#e3e3e3]'
                }`}
                title="Inspector View"
              >
                <Columns className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-[11px]">Inspector</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3. Main Body View: Grid Mode vs Split Inspector Mode */}
        {viewMode === 'grid' ? (
          /* ========================================================
             REDESIGNED CLEAN PROFESSIONAL GRID CARDS
             ======================================================== */
          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
              {filteredItems.length === 0 ? (
                <div className="py-24 text-center text-xs text-[#8e918f] bg-[#0c0c10] rounded-3xl border border-[#1a1a22]">
                  No deliverables match the selected filter or search term.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredItems.map((item) => {
                    const meta = getProfessionalFileMeta(item.type);
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`group relative flex flex-col justify-between rounded-2xl bg-[#0c0d14] hover:bg-[#10121b] border border-[#1a1c28] ${meta.glowColor} transition-all duration-300 hover:-translate-y-1 overflow-hidden shadow-xl`}
                      >
                        {/* Top Subtle Gradient Ambient Line */}
                        <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#ffffff]/15 to-transparent pointer-events-none" />

                        {/* Card Header Area */}
                        <div className="p-5 pb-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center space-x-3 min-w-0">
                              <div className="p-2 rounded-xl bg-[#141724] border border-[#22283c] shadow-md shrink-0 group-hover:scale-105 transition-transform duration-200">
                                {meta.icon}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="text-[13px] font-semibold text-[#f1f3f4] truncate tracking-tight group-hover:text-[#a8c7fa] transition-colors" title={item.filename}>
                                  {item.filename}
                                </h3>
                                <div className="text-[11px] text-[#8e918f] mt-0.5">
                                  <span>{meta.label}</span>
                                </div>
                              </div>
                            </div>

                            {/* Clean Type Badge */}
                            <span className={`text-[10px] font-mono font-bold tracking-wider px-2.5 py-0.5 rounded-full border shrink-0 ${meta.badgeBg}`}>
                              {meta.ext}
                            </span>
                          </div>

                          {/* Document Executive Summary */}
                          <div className="mt-4 pt-3 border-t border-[#161824]">
                            <p className="text-[12px] text-[#b5b8c4] leading-relaxed line-clamp-3 font-sans">
                              {item.summary}
                            </p>
                          </div>

                          {/* Key Performance Metrics Chips */}
                          {item.key_metrics && item.key_metrics.length > 0 && (
                            <div className="mt-3.5 grid grid-cols-2 gap-2">
                              {item.key_metrics.slice(0, 2).map((m, idx) => (
                                <div
                                  key={idx}
                                  className="px-2.5 py-1.5 rounded-xl bg-[#12141f] border border-[#1e2334] flex flex-col justify-between"
                                >
                                  <span className="text-[9px] text-[#717686] uppercase font-semibold tracking-wider truncate">
                                    {m.label}
                                  </span>
                                  <span className="text-[11px] font-mono font-bold text-[#e3e6ee] mt-0.5 truncate">
                                    {m.value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Card Professional Footer */}
                        <div className="px-5 py-3.5 bg-[#090a10] border-t border-[#151722] flex items-center justify-between">
                          {/* Generating Model Subtitle Badge */}
                          <div className="flex items-center space-x-1.5 text-[11px] text-[#717686]">
                            <span className="text-[#a8c7fa]/80 font-medium truncate max-w-[140px]">
                              {item.generating_model}
                            </span>
                          </div>

                          {/* Redesigned Clean Action Buttons Cluster */}
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => downloadDeliverable(item.id)}
                              aria-label="Download document"
                              className="p-2 rounded-xl bg-[#12141e] hover:bg-[#1a1e2e] border border-[#22283a] text-[#8e918f] hover:text-[#f1f3f4] transition-all"
                              title="Download original file"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </button>

                            {/* Redesigned Ultra-Sleek Open Button */}
                            <button
                              onClick={() => openCanvas(item)}
                              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-[#0070f3] hover:bg-[#0060df] text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all hover:scale-[1.03] active:scale-[0.97]"
                            >
                              <span>Open</span>
                              <ArrowUpRight className="h-3.5 w-3.5 stroke-[2.5]" />
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
          /* ========================================================
             SPLIT MASTER-DETAIL INSPECTOR VIEW
             ======================================================== */
          <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
            {/* Left Column: Explorer List */}
            <div className="w-full md:w-80 lg:w-96 border-r border-[#1a1c26] bg-[#090a0f] flex flex-col shrink-0">
              <div className="px-4 py-3 border-b border-[#181a24] flex items-center justify-between text-xs text-[#8e918f]">
                <span className="font-semibold uppercase tracking-wider text-[11px]">Artifacts</span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-[#13151f] border border-[#222638]">
                  {filteredItems.length} files
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {filteredItems.map((item) => {
                  const meta = getProfessionalFileMeta(item.type);
                  const isSelected = activeItem?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => selectDeliverable(item.id)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                        isSelected
                          ? 'bg-[#131520] border-blue-500/50 shadow-md shadow-blue-500/10'
                          : 'bg-[#0d0e14] border-[#1a1c26] hover:bg-[#11131c] hover:border-[#262a3c]'
                      }`}
                    >
                      <div className="p-2 rounded-lg bg-[#141622] shrink-0 mt-0.5 border border-[#22273a]">
                        {meta.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-xs text-[#f1f3f4] truncate">
                          {item.filename}
                        </div>
                        <p className="text-[11px] text-[#8e918f] line-clamp-2 mt-0.5 leading-relaxed font-sans">
                          {item.summary}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-[#6e7175] mt-2 font-mono">
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

            {/* Right Column: Detailed Document Inspector Pane */}
            {activeItem ? (
              <div className="flex-1 bg-[#090a0f] flex flex-col min-h-0 overflow-y-auto p-6 lg:p-8 space-y-6">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#1a1c26]">
                  <div className="flex items-start gap-4">
                    <div className="p-3.5 rounded-2xl bg-[#12141e] border border-[#202538] shadow-inner shrink-0">
                      {getProfessionalFileMeta(activeItem.type).icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-[#f1f3f4] break-all">
                          {activeItem.filename}
                        </h2>
                        <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${getProfessionalFileMeta(activeItem.type).badgeBg}`}>
                          {getProfessionalFileMeta(activeItem.type).ext}
                        </span>
                      </div>
                      <p className="text-xs text-[#8e918f] mt-1">
                        Generated by <span className="text-[#a8c7fa] font-medium">{activeItem.generating_model}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => openCanvas(activeItem)}
                      className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#0070f3] hover:bg-[#0060df] text-white text-xs font-semibold shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <span>Open Canvas</span>
                      <ArrowUpRight className="h-3.5 w-3.5 stroke-[2.5]" />
                    </button>
                    <button
                      onClick={() => downloadDeliverable(activeItem.id)}
                      className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#141622] hover:bg-[#1a1e2e] border border-[#252b40] text-[#e3e3e3] text-xs font-medium transition-all"
                    >
                      <Download className="h-3.5 w-3.5 text-[#a8c7fa]" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>

                {/* Executive Summary Card */}
                <div className="p-5 rounded-2xl bg-[#0d0e14] border border-[#1a1c26]">
                  <h3 className="text-[11px] font-semibold text-[#8e918f] uppercase tracking-wider mb-2">
                    Executive Document Summary
                  </h3>
                  <p className="text-xs sm:text-sm text-[#d0d3d6] leading-relaxed font-sans">
                    {activeItem.summary}
                  </p>
                </div>

                {/* Key Quantitative Metrics Grid */}
                {activeItem.key_metrics && activeItem.key_metrics.length > 0 && (
                  <div>
                    <h3 className="text-[11px] font-semibold text-[#8e918f] uppercase tracking-wider mb-3">
                      Key Metrics & Parameters
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {activeItem.key_metrics.map((metric, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl bg-[#0d0e14] border border-[#1a1c26] flex flex-col justify-between"
                        >
                          <span className="text-[11px] text-[#8e918f] leading-tight mb-1">
                            {metric.label}
                          </span>
                          <span className="text-base sm:text-lg font-bold text-[#f1f3f4] font-mono">
                            {metric.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Regulatory SOP Citations */}
                {activeItem.sop_citations && activeItem.sop_citations.length > 0 && (
                  <div>
                    <h3 className="text-[11px] font-semibold text-[#8e918f] uppercase tracking-wider mb-3">
                      Referenced SOPs & Industry Standards
                    </h3>
                    <div className="space-y-2">
                      {activeItem.sop_citations.map((cite, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-[#0d0e14] border border-[#1a1c26] flex items-center justify-between text-xs text-[#c4c7c5]"
                        >
                          <div className="flex items-center space-x-2">
                            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                            <span>{cite}</span>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            VERIFIED
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SHA-256 Air-Gapped Signature */}
                <div className="p-4 rounded-2xl bg-[#0b0c12] border border-[#1a1c26] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-[#8e918f]">
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                      <span>SHA-256 Air-Gapped Signature</span>
                    </div>
                    <div className="font-mono text-[11px] text-[#a8c7fa] break-all">
                      {activeItem.sha256_hash}
                    </div>
                  </div>

                  <button
                    onClick={() => handleCopy(activeItem.sha256_hash, activeItem.id)}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-[#141622] hover:bg-[#1a1e2e] border border-[#252b40] text-[#c4c7c5] hover:text-white shrink-0 transition-colors"
                  >
                    {copiedHash === activeItem.id ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
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
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8 text-center text-xs text-[#8e918f]">
                Select an artifact from the list to view details and launch the live editor.
              </div>
            )}
          </div>
        )}

        {/* Mount Live Univer Canvas Panel */}
        <DocumentCanvasPanel />
      </main>
    </div>
  );
}
