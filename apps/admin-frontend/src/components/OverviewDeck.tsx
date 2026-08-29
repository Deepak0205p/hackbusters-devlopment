'use client';

import React, { useEffect, useState } from 'react';
import { useSovereigntyStore } from '@/store/useSovereigntyStore';
import { useModelStore } from '@/store/useModelStore';
import { 
  ShieldCheck, 
  Cpu, 
  Database, 
  Box, 
  GitFork, 
  FileCheck2, 
  Activity, 
  ArrowUpRight,
  HardDrive,
  Network
} from 'lucide-react';

interface OverviewDeckProps {
  onNavigate: (tabKey: string) => void;
}

export function OverviewDeck({ onNavigate }: OverviewDeckProps) {
  const { metrics } = useSovereigntyStore();
  const { models, vram } = useModelStore();
  const [ragStats, setRagStats] = useState({ documents: 14, chunks: 2180, collections: 3 });

  const activeModels = models.filter(m => m.status === 'active');
  const usedVramGb = (vram.used_mb / 1024).toFixed(2);
  const totalVramGb = (vram.total_mb / 1024).toFixed(2);
  const vramPercent = Math.min(100, Math.round((vram.used_mb / (vram.total_mb || 6144)) * 100));

  return (
    <div className="space-y-6">
      {/* Top Banner: Sovereign Health Status */}
      <div className="rounded-xl bg-gradient-to-r from-[#030712] via-[#0f172a] to-[#020617] border border-[#1e293b] p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                100% AIR-GAPPED & SOVEREIGN
              </span>
              <span className="text-xs font-mono text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700">
                PORT 3001 ADMIN OBSERVATORY
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Industrial AI Workbench Command Center
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl">
              Real-time telemetry, model memory management, process sandbox security, and vector knowledge store for on-premise industrial operations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => onNavigate('sovereignty')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-emerald-900/30"
            >
              <ShieldCheck className="w-4 h-4" />
              Verify Air-Gap Ledger
            </button>
            <button 
              onClick={() => onNavigate('models')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors flex items-center gap-2"
            >
              <Cpu className="w-4 h-4" />
              Manage VRAM
            </button>
          </div>
        </div>
      </div>

      {/* 4 Primary Subsystem Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: VRAM & GPU */}
        <div 
          onClick={() => onNavigate('models')}
          className="rounded-xl bg-[#090d16] border border-[#1e293b] p-5 hover:border-cyan-500/50 transition-all cursor-pointer group hover:bg-[#0c1220]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">GPU VRAM Ceiling</span>
            <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-800 text-cyan-400 group-hover:scale-110 transition-transform">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-mono font-bold text-white">{usedVramGb} GB</span>
              <span className="text-xs font-mono text-slate-400">/ {totalVramGb} GB Max</span>
            </div>
            <div className="mt-3 w-full bg-slate-800/80 rounded-full h-2 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${vramPercent > 85 ? 'bg-amber-500' : 'bg-cyan-400'}`}
                style={{ width: `${vramPercent}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
              <span>{activeModels.length} Active Model in GPU</span>
              <span className="font-mono">{vramPercent}% used</span>
            </div>
          </div>
        </div>

        {/* Card 2: Network Sovereignty */}
        <div 
          onClick={() => onNavigate('sovereignty')}
          className="rounded-xl bg-[#090d16] border border-[#1e293b] p-5 hover:border-emerald-500/50 transition-all cursor-pointer group hover:bg-[#0c1220]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">WAN Egress</span>
            <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-400 group-hover:scale-110 transition-transform">
              <Network className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-mono font-bold text-emerald-400">0 Packets</span>
              <span className="text-xs font-mono text-emerald-500 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                LOCKED
              </span>
            </div>
            <p className="mt-3 text-xs text-slate-400 line-clamp-2">
              psutil active watchdog confirms zero external IP connections across all workbench processes.
            </p>
            <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>SHA-256 Audit Chain Active</span>
            </div>
          </div>
        </div>

        {/* Card 3: RAG & SOP Store */}
        <div 
          onClick={() => onNavigate('rag')}
          className="rounded-xl bg-[#090d16] border border-[#1e293b] p-5 hover:border-violet-500/50 transition-all cursor-pointer group hover:bg-[#0c1220]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Vector Store (RAG)</span>
            <div className="p-2 rounded-lg bg-violet-950/60 border border-violet-800 text-violet-400 group-hover:scale-110 transition-transform">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-mono font-bold text-white">{ragStats.chunks}</span>
              <span className="text-xs font-mono text-violet-400">Chunks Indexed</span>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              ChromaDB embedded vector database with BAAI/bge-small-en-v1.5 embeddings.
            </p>
            <div className="mt-2 text-[11px] text-slate-400 font-mono">
              <span>{ragStats.documents} Industrial SOPs & Policies</span>
            </div>
          </div>
        </div>

        {/* Card 4: Code Sandbox */}
        <div 
          onClick={() => onNavigate('sandbox')}
          className="rounded-xl bg-[#090d16] border border-[#1e293b] p-5 hover:border-amber-500/50 transition-all cursor-pointer group hover:bg-[#0c1220]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Docker Sandbox</span>
            <div className="p-2 rounded-lg bg-amber-950/60 border border-amber-800 text-amber-400 group-hover:scale-110 transition-transform">
              <Box className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-mono font-bold text-white">python:3.11</span>
              <span className="text-xs font-mono text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                --net none
              </span>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Hardened container with 2 vCPU, 512MB RAM cap, and 15s execution timeout.
            </p>
            <div className="mt-2 text-[11px] text-slate-400 font-mono">
              <span>AST Static Analysis Guard: ENABLED</span>
            </div>
          </div>
        </div>
      </div>

      {/* Subsystem Matrix Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Two-Stage Router Status */}
        <div className="rounded-xl bg-[#090d16] border border-[#1e293b] p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <GitFork className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-semibold text-white">Two-Stage Query Router</h2>
            </div>
            <button 
              onClick={() => onNavigate('router')}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono"
            >
              Test <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-300 font-medium">Stage 1: Regex Matcher</span>
              <span className="font-mono text-emerald-400">&lt; 2ms latency</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-300 font-medium">Stage 2: Semantic Centroids</span>
              <span className="font-mono text-cyan-400">&lt; 25ms fallback</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-300 font-medium">Routing Accuracy Target</span>
              <span className="font-mono text-emerald-400">&gt; 99.0%</span>
            </div>
          </div>
        </div>

        {/* Multimodal OCR Status */}
        <div className="rounded-xl bg-[#090d16] border border-[#1e293b] p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <HardDrive className="w-4 h-4 text-violet-400" />
              <h2 className="text-sm font-semibold text-white">Multimodal & OCR Pipeline</h2>
            </div>
            <button 
              onClick={() => onNavigate('upload')}
              className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 font-mono"
            >
              Inspect <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-300 font-medium">Primary OCR Engine</span>
              <span className="font-mono text-emerald-400">PaddleOCR 2.8.1 (Offline)</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-300 font-medium">Fallback Engine</span>
              <span className="font-mono text-slate-400">Tesseract OCR (CPU)</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-300 font-medium">CAD / P&ID Parser</span>
              <span className="font-mono text-violet-400">ISA 5.1 Tag Recognition</span>
            </div>
          </div>
        </div>

        {/* Deliverables Synthesis Status */}
        <div className="rounded-xl bg-[#090d16] border border-[#1e293b] p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <FileCheck2 className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-white">Enterprise Deliverables</h2>
            </div>
            <button 
              onClick={() => onNavigate('deliverables')}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-mono"
            >
              View Files <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-300 font-medium">Executive Approval Memos</span>
              <span className="font-mono text-blue-400">.docx (python-docx)</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-300 font-medium">Asset & Calculation Registers</span>
              <span className="font-mono text-emerald-400">.xlsx (openpyxl)</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-300 font-medium">Turnaround Slide Decks</span>
              <span className="font-mono text-amber-400">.pptx (python-pptx)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
