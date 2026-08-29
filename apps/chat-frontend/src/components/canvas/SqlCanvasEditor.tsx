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
  Filter
} from 'lucide-react';

interface SqlCanvasEditorProps {
  deliverable: DeliverableItem;
}

interface TableColumn {
  name: string;
  type: string;
}

export function SqlCanvasEditor({ deliverable }: SqlCanvasEditorProps) {
  const { updateEditedContent, editedContent } = useCanvasStore();
  const [copied, setCopied] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [fontSize, setFontSize] = useState(13);
  const [activeTab, setActiveTab] = useState<'results' | 'messages'>('results');
  const [executionTime, setExecutionTime] = useState<number | null>(null);

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

  const handleExportCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [results.headers.join(','), ...results.rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${deliverable.filename.replace('.sql', '')}_results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const lines = query.split('\n');

  return (
    <div className="flex flex-col h-full bg-[#ffffff] text-[#0f172a] select-none font-sans">
      {/* 1. SQL Ribbon Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-[#f8fafc] border-b border-[#e2e8f0] text-xs shrink-0 shadow-sm">
        {/* Left: DB Engine & File Info */}
        <div className="flex items-center space-x-2.5">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-[#eff6ff] border border-[#bfdbfe] text-[#1e40af] font-semibold">
            <Database className="h-3.5 w-3.5" />
            <span className="font-mono text-xs">{deliverable.filename}</span>
          </div>
          <span className="text-[11px] text-[#64748b] font-medium hidden sm:inline">
            PostgreSQL 16 &bull; Air-Gapped In-Memory Cluster
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-[#ffffff] hover:bg-[#f1f5f9] border border-[#cbd5e1] text-[#334155] font-medium"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Copied' : 'Copy SQL'}</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-[#ffffff] hover:bg-[#f1f5f9] border border-[#cbd5e1] text-[#15803d] font-medium"
            title="Export Results to CSV"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>

          {/* Run Query Button */}
          <button
            onClick={handleRunQuery}
            disabled={isRunning}
            className="flex items-center space-x-1.5 px-4 py-1 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold shadow-sm transition-all hover:scale-[1.02]"
          >
            <Play className={`h-3 w-3 fill-current ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Executing...' : 'Execute Query (Ctrl+Enter)'}</span>
          </button>
        </div>
      </div>

      {/* 2. Main Area: SQL Query Editor (Top) + Interactive Result Table (Bottom) */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* SQL Query Editor */}
        <div className="h-[45%] flex overflow-hidden border-b border-[#cbd5e1] bg-[#ffffff]">
          <div
            style={{ fontSize: `${fontSize}px` }}
            className="w-12 bg-[#f8fafc] text-[#94a3b8] border-r border-[#e2e8f0] text-right pr-2 py-4 select-none font-mono leading-relaxed shrink-0"
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
            className="flex-1 h-full bg-[#ffffff] text-[#0f172a] focus:outline-none resize-none font-mono p-4 leading-relaxed overflow-auto selection:bg-[#bfdbfe]"
          />
        </div>

        {/* Tabular Result Grid */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#ffffff]">
          {/* Result Header Bar */}
          <div className="flex items-center justify-between px-4 py-2 bg-[#f1f5f9] border-b border-[#e2e8f0] text-xs">
            <div className="flex items-center space-x-3">
              <span className="font-bold text-[#0f172a] flex items-center gap-1">
                <TableIcon className="h-3.5 w-3.5 text-[#2563eb]" />
                <span>Query Result Matrix ({results.rows.length} rows)</span>
              </span>
              {executionTime !== null && (
                <span className="text-[11px] font-mono text-emerald-700 font-medium">
                  &bull; Executed in {executionTime}ms
                </span>
              )}
            </div>

            <span className="text-[11px] text-[#64748b]">Read-Only Sandbox Snapshot</span>
          </div>

          {/* Interactive Table Grid */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead className="bg-[#f8fafc] text-[#334155] font-bold border-b border-[#cbd5e1] sticky top-0">
                <tr>
                  <th className="p-2.5 border-r border-[#e2e8f0] w-10 text-center bg-[#f1f5f9] text-[#64748b]">#</th>
                  {results.headers.map((h, idx) => (
                    <th key={idx} className="p-2.5 border-r border-[#e2e8f0] tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.rows.map((row, rIdx) => (
                  <tr key={rIdx} className="border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors">
                    <td className="p-2.5 border-r border-[#e2e8f0] text-center text-[#94a3b8] bg-[#fafafa]">
                      {rIdx + 1}
                    </td>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="p-2.5 border-r border-[#f1f5f9] text-[#1e293b]">
                        {cell === 'SAFE_AUTHORIZED' ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold text-[10px]">
                            ✓ {cell}
                          </span>
                        ) : (
                          String(cell)
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 3. Footer */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#f8fafc] border-t border-[#e2e8f0] text-[11px] text-[#64748b] font-mono shrink-0">
        <div>
          Status: <strong className="text-emerald-700">ONLINE (PostgreSQL 16)</strong>
        </div>
        <span className="text-[#2563eb] font-sans font-semibold">SQL Studio & Query Engine</span>
      </div>
    </div>
  );
}
