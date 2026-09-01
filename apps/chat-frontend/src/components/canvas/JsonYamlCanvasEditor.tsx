'use client';

import React, { useState } from 'react';
import { DeliverableItem } from '@/store/useDeliverableStore';
import { useCanvasStore } from '@/store/useCanvasStore';
import {
  Braces,
  Copy,
  Check,
  Sparkles,
  Download,
  CheckCircle2,
  AlertCircle,
  FileJson,
  Layers,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

interface JsonYamlCanvasEditorProps {
  deliverable: DeliverableItem;
}

export function JsonYamlCanvasEditor({ deliverable }: JsonYamlCanvasEditorProps) {
  const { updateEditedContent, editedContent } = useCanvasStore();
  const [copied, setCopied] = useState(false);
  const [fontSize, setFontSize] = useState(13);
  const [validationError, setValidationError] = useState<string | null>(null);

  const defaultJson =
    editedContent[deliverable.id]?.code ||
    JSON.stringify(
      {
        system: "MRPL Sovereign Refinery Intelligence Platform",
        document: deliverable.filename,
        version: "1.0.0",
        classification: "Air-Gapped Confidential",
        data: {
          timestamp: new Date().toISOString(),
          status: "NOMINAL",
          readings: []
        },
        compliance_status: "VERIFIED"
      },
      null,
      2
    );

  const [jsonText, setJsonText] = useState(defaultJson);

  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setJsonText(val);
    updateEditedContent(deliverable.id, { code: val });

    try {
      JSON.parse(val);
      setValidationError(null);
    } catch (err: any) {
      setValidationError(err.message);
    }
  };

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(jsonText);
      const pretty = JSON.stringify(parsed, null, 2);
      setJsonText(pretty);
      setValidationError(null);
      updateEditedContent(deliverable.id, { code: pretty });
    } catch (err: any) {
      setValidationError(err.message);
    }
  };

  const handleMinify = () => {
    try {
      const parsed = JSON.parse(jsonText);
      const min = JSON.stringify(parsed);
      setJsonText(min);
      setValidationError(null);
      updateEditedContent(deliverable.id, { code: min });
    } catch (err: any) {
      setValidationError(err.message);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonText], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = deliverable.filename.endsWith('.json') ? deliverable.filename : `${deliverable.filename}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const lines = jsonText.split('\n');

  return (
    <div className="flex flex-col h-full bg-[#ffffff] text-[#0f172a] select-none font-sans">
      {/* 1. JSON Ribbon Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-[#f8fafc] border-b border-[#e2e8f0] text-xs shrink-0 shadow-sm">
        {/* Left: JSON Schema Badge */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-[#ecfdf5] border border-[#a7f3d0] text-[#047857] font-semibold">
            <Braces className="h-3.5 w-3.5" />
            <span className="font-mono text-xs">{deliverable.filename}</span>
          </div>

          {validationError ? (
            <span className="flex items-center space-x-1 text-rose-600 font-medium text-[11px]">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>Invalid JSON Syntax</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1 text-emerald-700 font-medium text-[11px]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Valid RFC 8259 Schema</span>
            </span>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2">
          {/* Zoom / Font Size */}
          <div className="flex items-center space-x-1 pr-2 border-r border-[#cbd5e1]">
            <button
              onClick={() => setFontSize((s) => Math.max(10, s - 1))}
              className="p-1 rounded hover:bg-[#e2e8f0] text-[#64748b]"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="text-[11px] font-mono text-[#0f172a] font-semibold">{fontSize}px</span>
            <button
              onClick={() => setFontSize((s) => Math.min(22, s + 1))}
              className="p-1 rounded hover:bg-[#e2e8f0] text-[#64748b]"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            onClick={handleFormat}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-[#ffffff] hover:bg-[#f1f5f9] border border-[#cbd5e1] text-[#334155] font-medium"
            title="Prettify / Format JSON"
          >
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
            <span>Format</span>
          </button>

          <button
            onClick={handleMinify}
            className="px-2.5 py-1 rounded-lg bg-[#ffffff] hover:bg-[#f1f5f9] border border-[#cbd5e1] text-[#334155] font-medium"
            title="Minify JSON"
          >
            Minify
          </button>

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
            title="Download JSON"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Error banner if invalid */}
      {validationError && (
        <div className="px-4 py-2 bg-rose-50 border-b border-rose-200 text-rose-700 text-xs font-mono">
          <strong>Syntax Error:</strong> {validationError}
        </div>
      )}

      {/* 3. JSON Text Area */}
      <div className="flex-1 flex overflow-hidden bg-[#ffffff]">
        <div
          style={{ fontSize: `${fontSize}px` }}
          className="w-12 bg-[#f8fafc] text-[#94a3b8] border-r border-[#e2e8f0] text-right pr-2 py-4 select-none font-mono leading-relaxed shrink-0"
        >
          {lines.map((_: string, i: number) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        <textarea
          value={jsonText}
          onChange={handleJsonChange}
          spellCheck={false}
          style={{ fontSize: `${fontSize}px` }}
          className="flex-1 h-full bg-[#ffffff] text-[#0f172a] focus:outline-none resize-none font-mono p-4 leading-relaxed overflow-auto selection:bg-[#bfdbfe]"
        />
      </div>

      {/* 4. Footer */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#f8fafc] border-t border-[#e2e8f0] text-[11px] text-[#64748b] font-mono shrink-0">
        <div>
          Lines: <strong className="text-[#0f172a]">{lines.length}</strong> &bull; Chars: <strong className="text-[#0f172a]">{jsonText.length}</strong>
        </div>
        <span className="text-[#047857] font-sans font-semibold">JSON & Data Schema Studio</span>
      </div>
    </div>
  );
}
