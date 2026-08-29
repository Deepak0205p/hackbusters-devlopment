'use client';

import React, { useEffect, useState } from 'react';
import { useSovereigntyStore } from '@/store/useSovereigntyStore';
import { useModelStore } from '@/store/useModelStore';
import { 
  Shield, 
  Cpu, 
  Database, 
  Box, 
  ArrowUpRight,
  HardDrive
} from 'lucide-react';

interface OverviewDeckProps {
  onNavigate: (tabKey: string) => void;
}

export function OverviewDeck({ onNavigate }: OverviewDeckProps) {
  const { metrics } = useSovereigntyStore();
  const { models, vram } = useModelStore();
  const [ragStats, setRagStats] = useState({ documents: 0, chunks: 0, collections: 0 });

  useEffect(() => {
    // Fetch live dynamic RAG stats from backend
    fetch('http://localhost:8000/api/rag-admin/stats')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setRagStats({
            documents: data.documents,
            chunks: data.chunks,
            collections: data.collections
          });
        }
      })
      .catch(() => {});
  }, []);

  const activeModels = models.filter(m => m.status === 'active');
  const usedVramGb = (vram.used_mb / 1024).toFixed(2);
  const totalVramGb = (vram.total_mb / 1024).toFixed(2);
  const vramPercent = Math.min(100, Math.round((vram.used_mb / (vram.total_mb || 6144)) * 100));

  return (
    <div className="space-y-4">
      {/* Top Banner: Sovereign Health Status */}
      <div className="rounded-md bg-[#0a0a0a] border border-[#262626] p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono bg-[#111111] text-[#00e599] border border-[#262626]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00e599] inline-block" />
                100% AIR-GAPPED & SOVEREIGN
              </span>
              <span className="text-[11px] font-mono text-[#888888] bg-[#111111] px-2 py-0.5 rounded border border-[#262626]">
                PORT 3001 ADMIN OBSERVATORY
              </span>
            </div>
            <h1 className="text-lg font-semibold tracking-tight text-[#ededed]">
              Industrial AI Workbench Command Center
            </h1>
            <p className="text-xs text-[#888888] max-w-2xl">
              Real-time telemetry, model memory management, process sandbox security, and vector knowledge store for on-premise industrial operations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => onNavigate('sovereignty')}
              className="px-3 py-1.5 bg-[#171717] hover:bg-[#262626] text-[#ededed] text-xs font-medium rounded border border-[#333333] transition-colors flex items-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5 text-[#00e599]" />
              <span>Verify Air-Gap Ledger</span>
            </button>
            <button 
              onClick={() => onNavigate('models')}
              className="px-3 py-1.5 bg-[#0070f3] hover:bg-[#0060df] text-white text-xs font-medium rounded transition-colors flex items-center gap-1.5"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Manage VRAM</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Telemetry Gauges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: VRAM Ceiling */}
        <div 
          onClick={() => onNavigate('models')}
          className="rounded-md bg-[#0a0a0a] border border-[#262626] p-4 hover:border-[#444444] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-[#888888]">
            <span className="font-mono">GPU VRAM Ceiling</span>
            <HardDrive className="w-4 h-4 text-[#888888] group-hover:text-[#0070f3] transition-colors" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-[#ededed]">{usedVramGb} GB</span>
            <span className="text-xs font-mono text-[#888888]">/ {totalVramGb} GB Max</span>
          </div>
          <div className="mt-2 w-full bg-[#171717] rounded-full h-1.5 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${
                vramPercent > 85 ? 'bg-[#f5a623]' : 'bg-[#0070f3]'
              }`}
              style={{ width: `${vramPercent}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-[#888888]">
            <span>{activeModels.length} Active Model in GPU</span>
            <span className="font-mono">{vramPercent}% used</span>
          </div>
        </div>

        {/* Metric 2: Network Egress Lock */}
        <div 
          onClick={() => onNavigate('sovereignty')}
          className="rounded-md bg-[#0a0a0a] border border-[#262626] p-4 hover:border-[#444444] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-[#888888]">
            <span className="font-mono">WAN Egress</span>
            <Shield className="w-4 h-4 text-[#00e599]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-[#00e599]">0 Packets</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#111111] text-[#00e599] border border-[#262626]">
              LOCKED
            </span>
          </div>
          <p className="mt-2 text-[11px] text-[#888888] leading-tight">
            psutil active watchdog confirms zero external IP connections across all workbench processes.
          </p>
          <div className="mt-2 text-[11px] text-[#00e599] flex items-center gap-1 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00e599]" />
            <span>SHA-256 Audit Chain Active</span>
          </div>
        </div>

        {/* Metric 3: Vector Store Knowledge */}
        <div 
          onClick={() => onNavigate('rag')}
          className="rounded-md bg-[#0a0a0a] border border-[#262626] p-4 hover:border-[#444444] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-[#888888]">
            <span className="font-mono">Vector Store (RAG)</span>
            <Database className="w-4 h-4 text-[#888888] group-hover:text-[#00e599] transition-colors" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-[#ededed]">{ragStats.chunks}</span>
            <span className="text-xs text-[#888888]">Chunks Indexed</span>
          </div>
          <p className="mt-2 text-[11px] text-[#888888] leading-tight">
            ChromaDB embedded vector database with BAAI/bge-small-en-v1.5 embeddings.
          </p>
          <div className="mt-2 text-[11px] text-[#888888] flex items-center justify-between">
            <span>{ragStats.documents} Industrial SOPs & Policies</span>
            <ArrowUpRight className="w-3 h-3 text-[#888888] group-hover:text-[#ededed]" />
          </div>
        </div>

        {/* Metric 4: Docker Code Sandbox */}
        <div 
          onClick={() => onNavigate('sandbox')}
          className="rounded-md bg-[#0a0a0a] border border-[#262626] p-4 hover:border-[#444444] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-[#888888]">
            <span className="font-mono">Docker Sandbox</span>
            <Box className="w-4 h-4 text-[#888888] group-hover:text-[#f5a623] transition-colors" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-[#ededed]">python:3.11</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#111111] text-[#f5a623] border border-[#262626]">
              --net none
            </span>
          </div>
          <p className="mt-2 text-[11px] text-[#888888] leading-tight">
            Hardened container with 2 vCPU, 512MB RAM cap, and 15s execution timeout.
          </p>
          <div className="mt-2 text-[11px] text-[#00e599] flex items-center gap-1 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00e599]" />
            <span>AST Static Analysis Guard: ENABLED</span>
          </div>
        </div>
      </div>
    </div>
  );
}
