'use client';

import React, { useState } from 'react';
import { DeliverableItem } from '@/store/useDeliverableStore';
import { useCanvasStore } from '@/store/useCanvasStore';
import {
  Globe,
  Code2,
  Copy,
  Check,
  RotateCcw,
  Smartphone,
  Tablet,
  Monitor,
  Download,
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface WebCanvasEditorProps {
  deliverable: DeliverableItem;
}

export function WebCanvasEditor({ deliverable }: WebCanvasEditorProps) {
  const { updateEditedContent, editedContent } = useCanvasStore();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'split'>('split');
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const defaultHtml =
    editedContent[deliverable.id]?.code ||
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>MRPL Process Telemetry Dashboard</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #f8fafc;
      color: #0f172a;
      margin: 0;
      padding: 24px;
    }
    .header {
      background: #ffffff;
      padding: 20px 24px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    h1 { font-size: 18px; margin: 0; color: #1e3a8a; }
    .badge {
      background: #dcfce7;
      color: #15803d;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 600;
      border: 1px solid #bbf7d0;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }
    .card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.04);
    }
    .metric-label { font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; }
    .metric-val { font-size: 24px; font-weight: 700; font-family: monospace; color: #0f172a; margin-top: 6px; }
    .metric-status { font-size: 11px; color: #16a34a; font-weight: 600; margin-top: 4px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Operational Telemetry Dashboard</h1>
      <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Live Process Monitoring & OISD Atmospheric Gas Standards</div>
    </div>
    <span class="badge">✓ AIR-GAP VERIFIED</span>
  </div>

  <div class="grid">
    <div class="card">
      <div class="metric-label">Crude Throughput</div>
      <div class="metric-val">310.5 KBPD</div>
      <div class="metric-status">▲ 101.4% Capacity</div>
    </div>
    <div class="card">
      <div class="metric-label">Combustible Gas (%LEL)</div>
      <div class="metric-val" style="color: #16a34a;">0.0% LEL</div>
      <div class="metric-status">✓ OISD-105 Safe</div>
    </div>
    <div class="card">
      <div class="metric-label">Specific Energy (MBN)</div>
      <div class="metric-val">54.2</div>
      <div class="metric-status">✓ Target Met (&lt; 58.0)</div>
    </div>
    <div class="card">
      <div class="metric-label">Safe Man-Hours</div>
      <div class="metric-val">4.82 M</div>
      <div class="metric-status">✓ Zero LTI Record</div>
    </div>
  </div>
</body>
</html>`;

  const [htmlCode, setHtmlCode] = useState(defaultHtml);

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setHtmlCode(val);
    updateEditedContent(deliverable.id, { code: val });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(htmlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([htmlCode], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = deliverable.filename.endsWith('.html') ? deliverable.filename : `${deliverable.filename}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getViewportWidth = () => {
    switch (viewport) {
      case 'mobile':
        return 'w-[375px]';
      case 'tablet':
        return 'w-[768px]';
      case 'desktop':
      default:
        return 'w-full';
    }
  };

  const lines = htmlCode.split('\n');

  return (
    <div className="flex flex-col h-full bg-[#ffffff] text-[#0f172a] select-none font-sans">
      {/* 1. Web Ribbon Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-[#f8fafc] border-b border-[#e2e8f0] text-xs shrink-0 shadow-sm">
        {/* Left: View Mode Switcher */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-[#fff7ed] border border-[#fed7aa] text-[#c2410c] font-semibold">
            <Globe className="h-3.5 w-3.5" />
            <span className="font-mono text-xs">{deliverable.filename}</span>
          </div>

          <div className="flex items-center bg-[#ffffff] border border-[#cbd5e1] rounded-lg p-0.5 shadow-sm">
            <button
              onClick={() => setActiveTab('split')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'split' ? 'bg-[#ea580c] text-white' : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              Split View
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'preview' ? 'bg-[#ea580c] text-white' : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              Live Browser
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'code' ? 'bg-[#ea580c] text-white' : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              HTML Source
            </button>
          </div>
        </div>

        {/* Right: Device Viewport & Actions */}
        <div className="flex items-center space-x-2">
          {/* Viewport Width Controls */}
          <div className="flex items-center bg-[#ffffff] border border-[#cbd5e1] rounded-lg p-0.5 pr-1 space-x-0.5">
            <button
              onClick={() => setViewport('desktop')}
              className={`p-1 rounded ${viewport === 'desktop' ? 'bg-[#e2e8f0] text-[#0f172a]' : 'text-[#94a3b8]'}`}
              title="Desktop (100%)"
            >
              <Monitor className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewport('tablet')}
              className={`p-1 rounded ${viewport === 'tablet' ? 'bg-[#e2e8f0] text-[#0f172a]' : 'text-[#94a3b8]'}`}
              title="Tablet (768px)"
            >
              <Tablet className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewport('mobile')}
              className={`p-1 rounded ${viewport === 'mobile' ? 'bg-[#e2e8f0] text-[#0f172a]' : 'text-[#94a3b8]'}`}
              title="Mobile (375px)"
            >
              <Smartphone className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-[#ffffff] hover:bg-[#f1f5f9] border border-[#cbd5e1] text-[#334155] font-medium"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="p-1.5 rounded-lg bg-[#ffffff] hover:bg-[#f1f5f9] border border-[#cbd5e1] text-[#334155]"
            title="Download HTML"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Workspace */}
      <div className="flex-1 flex overflow-hidden bg-[#e2e8f0]">
        {/* Left: HTML Code (Visible in Split or Code mode) */}
        {(activeTab === 'split' || activeTab === 'code') && (
          <div className={`${activeTab === 'split' ? 'w-1/2' : 'w-full'} flex border-r border-[#cbd5e1] bg-[#ffffff] overflow-hidden`}>
            <div className="w-10 bg-[#f8fafc] text-[#94a3b8] border-r border-[#e2e8f0] text-right pr-2 py-4 select-none font-mono text-xs leading-relaxed shrink-0">
              {lines.map((_: string, i: number) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            <textarea
              value={htmlCode}
              onChange={handleCodeChange}
              spellCheck={false}
              className="flex-1 h-full bg-[#ffffff] text-[#0f172a] focus:outline-none resize-none font-mono text-xs p-4 leading-relaxed overflow-auto selection:bg-[#bfdbfe]"
            />
          </div>
        )}

        {/* Right: Live Interactive Browser Frame (Visible in Split or Preview mode) */}
        {(activeTab === 'split' || activeTab === 'preview') && (
          <div className={`${activeTab === 'split' ? 'w-1/2' : 'w-full'} flex flex-col items-center justify-center p-4 overflow-auto bg-[#e2e8f0]`}>
            <div className={`${getViewportWidth()} h-full bg-[#ffffff] rounded-xl border border-[#cbd5e1] shadow-xl overflow-hidden transition-all flex flex-col`}>
              {/* Browser chrome URL bar mockup */}
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-[#f1f5f9] border-b border-[#e2e8f0] text-[11px] text-[#64748b]">
                <div className="flex space-x-1">
                  <div className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="flex-1 bg-[#ffffff] px-2 py-0.5 rounded border border-[#e2e8f0] text-center font-mono text-[10px] text-[#475569] truncate">
                  http://localhost:3000/sandbox/{deliverable.filename}
                </div>
              </div>

              {/* Rendered Iframe */}
              <iframe
                srcDoc={htmlCode}
                title="Live HTML DOM Preview"
                className="flex-1 w-full border-none bg-[#ffffff]"
                sandbox="allow-scripts"
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. Footer */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#f8fafc] border-t border-[#e2e8f0] text-[11px] text-[#64748b] font-mono shrink-0">
        <div>DOM Status: <strong className="text-emerald-700">LIVE RENDER READY</strong></div>
        <span className="text-[#ea580c] font-sans font-semibold">Web & Markup Studio</span>
      </div>
    </div>
  );
}
