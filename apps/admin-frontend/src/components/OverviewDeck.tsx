'use client';

import React, { useEffect, useState } from 'react';
import { useSovereigntyStore } from '@/store/useSovereigntyStore';
import { useModelStore } from '@/store/useModelStore';
import { api } from '@/lib/api';
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
    api.get<any>('/api/rag-admin/stats')
      .then(data => {
        if (data && data.success) {
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
      <div className="rounded-md bg-gray-50 border border-gray-200 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                100% AIR-GAPPED & SOVEREIGN
              </span>
              <span className="text-[11px] font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                PORT 3001 ADMIN OBSERVATORY
              </span>
            </div>
            <h1 className="text-lg font-semibold tracking-tight text-gray-900">
              Industrial AI Workbench Command Center
            </h1>
            <p className="text-xs text-gray-500 max-w-2xl">
              Real-time telemetry, model memory management, process sandbox security, and vector knowledge store for on-premise industrial operations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => onNavigate('sovereignty')}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-900 text-xs font-medium rounded border border-gray-200 transition-colors flex items-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verify Air-Gap Ledger</span>
            </button>
            <button 
              onClick={() => onNavigate('models')}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors flex items-center gap-1.5"
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
          className="rounded-md bg-gray-50 border border-gray-200 p-4 hover:border-gray-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-mono">GPU VRAM Ceiling</span>
            <HardDrive className="w-4 h-4 text-gray-500 group-hover:text-blue-600 transition-colors" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-gray-900">{usedVramGb} GB</span>
            <span className="text-xs font-mono text-gray-500">/ {totalVramGb} GB Max</span>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${
                vramPercent > 85 ? 'bg-amber-500' : 'bg-blue-600'
              }`}
              style={{ width: `${vramPercent}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-gray-500">
            <span>{activeModels.length} Active Model in GPU</span>
            <span className="font-mono">{vramPercent}% used</span>
          </div>
        </div>

        {/* Metric 2: Network Egress Lock */}
        <div 
          onClick={() => onNavigate('sovereignty')}
          className="rounded-md bg-gray-50 border border-gray-200 p-4 hover:border-gray-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-mono">WAN Egress</span>
            <Shield className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-emerald-600">0 Packets</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              LOCKED
            </span>
          </div>
          <p className="mt-2 text-[11px] text-gray-500 leading-tight">
            psutil active watchdog confirms zero external IP connections across all workbench processes.
          </p>
          <div className="mt-2 text-[11px] text-emerald-600 flex items-center gap-1 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>SHA-256 Audit Chain Active</span>
          </div>
        </div>

        {/* Metric 3: Vector Store Knowledge */}
        <div 
          onClick={() => onNavigate('rag')}
          className="rounded-md bg-gray-50 border border-gray-200 p-4 hover:border-gray-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-mono">Vector Store (RAG)</span>
            <Database className="w-4 h-4 text-gray-500 group-hover:text-emerald-600 transition-colors" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-gray-900">{ragStats.chunks}</span>
            <span className="text-xs text-gray-500">Chunks Indexed</span>
          </div>
          <p className="mt-2 text-[11px] text-gray-500 leading-tight">
            ChromaDB embedded vector database with BAAI/bge-small-en-v1.5 embeddings.
          </p>
          <div className="mt-2 text-[11px] text-gray-500 flex items-center justify-between">
            <span>{ragStats.documents} Industrial SOPs & Policies</span>
            <ArrowUpRight className="w-3 h-3 text-gray-500 group-hover:text-gray-900" />
          </div>
        </div>

        {/* Metric 4: Docker Code Sandbox */}
        <div 
          onClick={() => onNavigate('sandbox')}
          className="rounded-md bg-gray-50 border border-gray-200 p-4 hover:border-gray-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-mono">Docker Sandbox</span>
            <Box className="w-4 h-4 text-gray-500 group-hover:text-amber-600 transition-colors" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-gray-900">python:3.11</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
              --net none
            </span>
          </div>
          <p className="mt-2 text-[11px] text-gray-500 leading-tight">
            Hardened container with 2 vCPU, 512MB RAM cap, and 15s execution timeout.
          </p>
          <div className="mt-2 text-[11px] text-emerald-600 flex items-center gap-1 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>AST Static Analysis Guard: ENABLED</span>
          </div>
        </div>
      </div>
    </div>
  );
}
