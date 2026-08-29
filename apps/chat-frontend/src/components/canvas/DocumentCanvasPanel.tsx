'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useDeliverableStore } from '@/store/useDeliverableStore';
import dynamic from 'next/dynamic';

const UniverSheetEditor = dynamic(
  () => import('./UniverSheetEditor').then((mod) => mod.UniverSheetEditor),
  { ssr: false }
);
const UniverDocEditor = dynamic(
  () => import('./UniverDocEditor').then((mod) => mod.UniverDocEditor),
  { ssr: false }
);
const UniverSlideEditor = dynamic(
  () => import('./UniverSlideEditor').then((mod) => mod.UniverSlideEditor),
  { ssr: false }
);
const PythonCanvasEditor = dynamic(
  () => import('./PythonCanvasEditor').then((mod) => mod.PythonCanvasEditor),
  { ssr: false }
);
const SqlCanvasEditor = dynamic(
  () => import('./SqlCanvasEditor').then((mod) => mod.SqlCanvasEditor),
  { ssr: false }
);
const WebCanvasEditor = dynamic(
  () => import('./WebCanvasEditor').then((mod) => mod.WebCanvasEditor),
  { ssr: false }
);
const JsonYamlCanvasEditor = dynamic(
  () => import('./JsonYamlCanvasEditor').then((mod) => mod.JsonYamlCanvasEditor),
  { ssr: false }
);
const TsJsCanvasEditor = dynamic(
  () => import('./TsJsCanvasEditor').then((mod) => mod.TsJsCanvasEditor),
  { ssr: false }
);
const ShellSystemsCanvasEditor = dynamic(
  () => import('./ShellSystemsCanvasEditor').then((mod) => mod.ShellSystemsCanvasEditor),
  { ssr: false }
);

import {
  X,
  Maximize2,
  Minimize2,
  Download,
  Save,
  FileText,
  FileSpreadsheet,
  Presentation,
  Code,
  Database,
  Globe,
  Braces,
  Terminal,
  FileCode2
} from 'lucide-react';

export function DocumentCanvasPanel() {
  const {
    isOpen,
    isExpanded,
    activeDeliverable,
    closeCanvas,
    toggleExpand,
    saveChanges,
    hasUnsavedChanges,
    isSaving,
  } = useCanvasStore();

  const { downloadDeliverable } = useDeliverableStore();

  if (!isOpen || !activeDeliverable) return null;

  const filename = activeDeliverable.filename.toLowerCase();
  const deliverableType = (activeDeliverable.type || '').toLowerCase();

  // 1. Automatic Extension & Language Category Resolver
  const getExtension = () => {
    const dotIdx = filename.lastIndexOf('.');
    if (dotIdx !== -1) return filename.slice(dotIdx);
    return `.${deliverableType}`;
  };

  const ext = getExtension();

  // 2. Icon Resolver based on extension
  const renderFileIcon = () => {
    if (['.xlsx', '.xls', '.csv'].includes(ext) || deliverableType === 'xlsx') {
      return <FileSpreadsheet className="h-5 w-5 text-emerald-600" />;
    }
    if (['.pptx', '.ppt'].includes(ext) || deliverableType === 'pptx') {
      return <Presentation className="h-5 w-5 text-orange-600" />;
    }
    if (['.docx', '.doc'].includes(ext) || deliverableType === 'docx') {
      return <FileText className="h-5 w-5 text-blue-600" />;
    }
    if (['.py', '.ipynb'].includes(ext) || deliverableType === 'py') {
      return <span className="text-base">🐍</span>;
    }
    if (['.sql'].includes(ext)) {
      return <Database className="h-5 w-5 text-blue-600" />;
    }
    if (['.html', '.htm', '.svg', '.xml', '.css'].includes(ext)) {
      return <Globe className="h-5 w-5 text-orange-500" />;
    }
    if (['.json', '.yaml', '.yml', '.env', '.toml'].includes(ext)) {
      return <Braces className="h-5 w-5 text-emerald-600" />;
    }
    if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
      return <FileCode2 className="h-5 w-5 text-blue-500" />;
    }
    return <Terminal className="h-5 w-5 text-slate-700" />;
  };

  // 3. Dedicated Language Viewer Component Resolver
  const renderEditorComponent = () => {
    // Spreadsheets
    if (['.xlsx', '.xls', '.csv'].includes(ext) || deliverableType === 'xlsx') {
      return <UniverSheetEditor deliverable={activeDeliverable} />;
    }
    // Presentations
    if (['.pptx', '.ppt'].includes(ext) || deliverableType === 'pptx') {
      return <UniverSlideEditor deliverable={activeDeliverable} />;
    }
    // Word Documents
    if (['.docx', '.doc'].includes(ext) || deliverableType === 'docx') {
      return <UniverDocEditor deliverable={activeDeliverable} />;
    }
    // Python Logic & Data Scripts
    if (['.py', '.ipynb'].includes(ext) || deliverableType === 'py') {
      return <PythonCanvasEditor deliverable={activeDeliverable} />;
    }
    // SQL Queries & Database Views
    if (['.sql'].includes(ext)) {
      return <SqlCanvasEditor deliverable={activeDeliverable} />;
    }
    // Web HTML / CSS / SVG Markup
    if (['.html', '.htm', '.svg', '.xml', '.css'].includes(ext)) {
      return <WebCanvasEditor deliverable={activeDeliverable} />;
    }
    // JSON / YAML Data Schemas
    if (['.json', '.yaml', '.yml', '.env', '.toml'].includes(ext)) {
      return <JsonYamlCanvasEditor deliverable={activeDeliverable} />;
    }
    // TypeScript & JavaScript
    if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
      return <TsJsCanvasEditor deliverable={activeDeliverable} />;
    }
    // Shell, Systems Code, Markdown & Logs
    return <ShellSystemsCanvasEditor deliverable={activeDeliverable} />;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 220 }}
        className={`fixed inset-y-0 right-0 z-40 bg-[#ffffff] border-l border-[#cbd5e1] flex flex-col shadow-2xl transition-all duration-300 ${
          isExpanded ? 'w-full md:w-full' : 'w-full md:w-[60vw] lg:w-[54vw] xl:w-[50vw]'
        }`}
      >
        {/* 1. Canvas Top Header (Clean Light Theme) */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#ffffff] border-b border-[#e2e8f0] shrink-0 shadow-sm">
          {/* Left: Document Info & Badges */}
          <div className="flex items-center space-x-3 min-w-0">
            <div className="p-2 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] shrink-0">
              {renderFileIcon()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-semibold text-[#0f172a] truncate">
                  {activeDeliverable.filename}
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#f1f5f9] border border-[#cbd5e1] text-[#334155]">
                  {ext.replace('.', '') || activeDeliverable.type}
                </span>
                {hasUnsavedChanges && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                    Unsaved
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#64748b] truncate">
                {activeDeliverable.source_scenario} &bull; {activeDeliverable.generating_model}
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => saveChanges(activeDeliverable.id)}
              disabled={isSaving}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 transition-colors shadow-sm"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save'}</span>
            </button>

            <button
              onClick={() => downloadDeliverable(activeDeliverable.id)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#f8fafc] hover:bg-[#f1f5f9] text-[#1e293b] border border-[#cbd5e1] transition-colors"
              title="Download Original Deliverable"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>

            <button
              onClick={toggleExpand}
              className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#64748b] hover:text-[#0f172a] transition-colors"
              title={isExpanded ? 'Split Screen' : 'Expand Fullscreen'}
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>

            <button
              onClick={closeCanvas}
              className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#64748b] hover:text-[#0f172a] transition-colors"
              title="Close Canvas"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 2. Direct Dedicated Language Viewer Component */}
        <div className="flex-1 overflow-hidden relative bg-[#ffffff]">
          {renderEditorComponent()}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
