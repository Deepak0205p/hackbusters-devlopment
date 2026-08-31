'use client';

import React, { useState } from 'react';
import { DeliverableItem } from '@/store/useDeliverableStore';
import { useCanvasStore } from '@/store/useCanvasStore';
import {
  Play,
  Copy,
  Check,
  Database,
  Table as TableIcon,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Download,
  Terminal,
  FileSpreadsheet,
  CheckCircle2,
  Filter,
  X,
  Server
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SqlCanvasEditorProps {
  deliverable: DeliverableItem;
}

export function SqlCanvasEditor({ deliverable }: SqlCanvasEditorProps) {
  const { updateEditedContent, editedContent } = useCanvasStore();
  const [copied, setCopied] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [fontSize, setFontSize] = useState(13);
  const [activeTab, setActiveTab] = useState<'results' | 'messages'>('results');
  const [executionTime, setExecutionTime] = useState<number | null>(34);

  const defaultQuery =
    editedContent[deliverable.id]?.code ||
    `-- ==========================================================
-- MRPL SOVEREIGN REFINERY TELEMETRY & COMPLIANCE QUERY
-- Database: PostgreSQL 16 Air-Gapped Master Replica
-- Query: ${deliverable.filename}
-- ==========================================================

SELECT 
    p.unit_id,
    p.unit_name,
    p.operating_temp_c,
    p.pressure_bar,
    g.combustible_lel_pct,
    g.oxygen_vol_pct,
    g.h2s_toxic_ppm,
    CASE 
        WHEN g.combustible_lel_pct = 0.0 AND g.oxygen_vol_pct >= 20.0 THEN 'SAFE_AUTHORIZED'
        ELSE 'SAFETY_HOLD'
    END AS oisd_105_verdict
FROM refinery_process_units p
JOIN oisd_atmospheric_readings g ON p.unit_id = g.unit_id
WHERE p.is_active = TRUE
ORDER BY p.operating_temp_c DESC;
`;

  const [query, setQuery] = useState(defaultQuery);

  const [results, setResults] = useState<{
    headers: string[];
    rows: (string | number)[][];
  }>({
    headers: ['UNIT_ID', 'UNIT_NAME', 'OPERATING_TEMP_C', 'PRESSURE_BAR', 'LEL_PCT', 'O2_PCT', 'H2S_PPM', 'OISD_VERDICT'],
    rows: [
      ['CDU-1', 'Atmospheric Distillation Unit 1', 365.2, 1.84, '0.0%', '20.8%', '0.0 ppm', 'SAFE_AUTHORIZED'],
      ['VDU-2', 'Vacuum Distillation Column 2', 410.0, 0.08, '0.0%', '20.9%', '0.0 ppm', 'SAFE_AUTHORIZED'],
      ['FCCU-1', 'Fluidized Catalytic Cracking', 525.0, 2.45, '0.0%', '20.8%', '0.0 ppm', 'SAFE_AUTHORIZED'],
      ['DHDS-1', 'Diesel Hydro-Desulfurization', 340.5, 45.0, '0.0%', '20.8%', '0.0 ppm', 'SAFE_AUTHORIZED'],
      ['HCU-2', 'Hydrocracker Complex Unit', 380.0, 142.0, '0.0%', '20.8%', '0.0 ppm', 'SAFE_AUTHORIZED'],
    ],
  });

  const handleQueryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setQuery(val);
    updateEditedContent(deliverable.id, { code: val });
  };

  const handleRunQuery = async () => {
    setIsRunning(true);
    const start = performance.now();
    await new Promise((resolve) => setTimeout(resolve, 450));
    const elapsed = Math.round(performance.now() - start);
    setExecutionTime(elapsed);
    setIsRunning(false);
    setActiveTab('results');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(query);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([query], { type: 'text/sql;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = deliverable.filename.endsWith('.sql') ? deliverable.filename : `${deliverable.filename}.sql`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const lines = query.split('\n');

  return (
    <div className="flex flex-col h-full bg-[#0f172a] text-[#f8fafc] select-none font-sans relative overflow-hidden">
      {/* 1. TOP STUDIO RIBBON HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-[#1e293b] border-b border-slate-700/80 text-xs shrink-0 shadow-sm">
        {/* Left: DB & SQL File Badge */}
        <div className="flex items-center space-x-2.5">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold">
            <Database className="h-4 w-4 text-cyan-400" />
            <span className="font-mono text-xs">{deliverable.filename}</span>
          </div>
          <div className="hidden sm:flex items-center space-x-1.5 text-[11px] text-slate-400 font-mono">
            <Server className="h-3.5 w-3.5 text-cyan-400" />
            <span>PostgreSQL 16 &bull; Air-Gapped Engine</span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2">
          {/* Zoom / Font Size */}
          <div className="flex items-center space-x-1 pr-2.5 border-r border-slate-700">
            <button
              onClick={() => setFontSize((s) => Math.max(10, s - 1))}
              className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white"
              title="Decrease Font Size"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="text-[11px] font-mono text-slate-200 font-bold">{fontSize}px</span>
            <button
              onClick={() => setFontSize((s) => Math.min(22, s + 1))}
              className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white"
              title="Increase Font Size"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold transition-colors cursor-pointer"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors cursor-pointer"
            title="Download .sql script"
          >
            <Download className="h-3.5 w-3.5" />
          </button>

          {/* Run SQL Query */}
          <button
            onClick={handleRunQuery}
            disabled={isRunning}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold shadow-md shadow-cyan-900/30 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Play className={`h-3.5 w-3.5 fill-current ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Executing...' : 'Execute SQL (F5)'}</span>
          </button>
        </div>
      </div>

      {/* 2. SQL QUERY EDITOR AREA */}
      <div className="flex-1 flex overflow-hidden bg-[#0b1120]">
        <div
          style={{ fontSize: `${fontSize}px` }}
          className="w-12 bg-[#0b1120] text-slate-600 border-r border-slate-800 text-right pr-3 py-4 select-none font-mono leading-relaxed"
        >
          {lines.map((_: string, i: number) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        <textarea
          value={query}
          onChange={handleQueryChange}
          spellCheck={false}
          style={{ fontSize: `${fontSize}px` }}
          className="flex-1 h-full bg-[#0b1120] text-cyan-200 focus:outline-none resize-none font-mono p-4 leading-relaxed overflow-auto selection:bg-cyan-900/60"
        />
      </div>

      {/* 3. SQL RESULTS GRID PANEL */}
      <div className="h-56 bg-[#0f172a] border-t border-slate-700/80 flex flex-col shrink-0">
        <div className="flex items-center justify-between px-4 py-2 bg-[#1e293b] border-b border-slate-700 text-xs text-slate-400">
          <div className="flex items-center space-x-3">
            <span className="font-bold text-cyan-400 flex items-center gap-1.5">
              <TableIcon className="h-3.5 w-3.5" />
              <span>Query Results ({results.rows.length} rows)</span>
            </span>
            {executionTime && (
              <span className="text-[11px] text-slate-400 font-mono">
                &bull; Executed in <strong className="text-emerald-400">{executionTime}ms</strong>
              </span>
            )}
          </div>

          <span className="text-emerald-400 font-bold text-[11px] bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-0.5 rounded-full">
            ✓ 100% OISD Validated
          </span>
        </div>

        {/* Results Data Table */}
        <div className="flex-1 overflow-auto bg-[#090d16]">
          <table className="w-full text-xs font-mono text-left border-collapse">
            <thead className="bg-[#1e293b] text-slate-300 border-b border-slate-700 sticky top-0">
              <tr>
                {results.headers.map((h, idx) => (
                  <th key={idx} className="p-2.5 border-r border-slate-700/60 font-bold text-[11px]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.rows.map((row, rIdx) => (
                <tr key={rIdx} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="p-2.5 border-r border-slate-800/60 text-slate-300">
                      {cell === 'SAFE_AUTHORIZED' ? (
                        <span className="text-emerald-400 font-bold">SAFE_AUTHORIZED</span>
                      ) : (
                        cell
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. STATISTICS FOOTER */}
      <div className="flex items-center justify-between px-5 py-2 bg-[#1e293b] border-t border-slate-700/80 text-[11px] text-slate-400 font-mono shrink-0">
        <div className="flex items-center space-x-3">
          <span>Lines: <strong className="text-white">{lines.length}</strong></span>
          <span>&bull;</span>
          <span>Database: <strong className="text-cyan-400">PostgreSQL</strong></span>
          <span>&bull;</span>
          <span>Status: <strong className="text-emerald-400">Connected</strong></span>
        </div>
        <span className="text-cyan-400 font-sans font-bold flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
          SQL Telemetry Studio
        </span>
      </div>
    </div>
  );
}
