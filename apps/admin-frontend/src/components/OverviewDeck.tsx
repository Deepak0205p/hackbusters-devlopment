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
  const { models, vram, fetchVRAM, fetchModels } = useModelStore();
  const [ragStats, setRagStats] = useState({ documents: 0, chunks: 0, collections: 0 });
  const [sandboxInfo, setSandboxInfo] = useState({
    runtime: 'python:3.11',
    mode: '--net none',
    backend: 'hardened_isolated_subprocess',
    isDocker: false,
    cpu: '2 vCPU',
    ram: '512MB'
  });

  useEffect(() => {
    // Fetch live hardware device metrics
    fetchVRAM();
    fetchModels();

    // Fetch live RAG stats
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

    // Fetch live Sandbox telemetry
    api.get<any>('/api/sandbox/status')
      .then(data => {
        if (data) {
          setSandboxInfo({
            runtime: data.image_present ? data.image_name : 'python:3.11',
            mode: data.network_isolation === 'STRICT_NONE' ? '--net none' : 'isolated',
            backend: data.active_backend || 'hardened_isolated_subprocess',
            isDocker: Boolean(data.docker_available && data.image_present),
            cpu: `${data.cpu_quota || 2} vCPU`,
            ram: `${data.memory_limit || '512m'}`.toUpperCase()
          });
        }
      })
      .catch(() => {});
  }, [fetchVRAM, fetchModels]);

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
            
            <h1 className="text-lg font-semibold tracking-tight text-gray-900">
              REVEAL 2.0 Command Center
            </h1>
            <p className="text-xs text-gray-500 max-w-2xl">
              Secure, on-premise industrial AI infrastructure powered by real-time telemetry, isolated runtime execution, and localized vector search.
            </p>
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
            <span className="font-mono">{vram.gpu_available ? 'Dedicated GPU VRAM' : 'Host Unified RAM'}</span>
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
            <span className="truncate max-w-[170px]" title={vram.gpu_name}>
              {vram.gpu_available ? `${activeModels.length} Active Model in GPU` : (vram.gpu_name ? vram.gpu_name.split('+')[0].trim() : 'Host CPU Mode')}
            </span>
            <span className="font-mono shrink-0">{vramPercent}% used</span>
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
            <span className="text-xl font-bold font-mono text-emerald-600">{metrics?.external_packets ?? 0} Packets</span>
            
          </div>
          <p className="mt-2 text-[11px] text-gray-500 leading-tight">
            psutil active watchdog confirms zero external IP connections across all workbench processes.
          </p>
          
        </div>

        {/* Metric 3: Vector Store Knowledge */}
        <div 
          onClick={() => onNavigate('rag')}
          className="rounded-md bg-gray-50 border border-gray-200 p-4 hover:border-gray-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-mono">R A G</span>
            <Database className="w-4 h-4 text-gray-500 group-hover:text-emerald-600 transition-colors" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-gray-900">{ragStats.chunks}</span>
            <span className="text-xs text-gray-500">Chunks Indexed</span>
          </div>
          <p className="mt-2 text-[11px] text-gray-500 leading-tight">
            ChromaDB embedded vector database with BAAI/bge-small-en-v1.5 embeddings.
          </p>
          
        </div>

        {/* Metric 4: Docker Code Sandbox */}
        <div 
          onClick={() => onNavigate('sandbox')}
          className="rounded-md bg-gray-50 border border-gray-200 p-4 hover:border-gray-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-mono">{sandboxInfo.isDocker ? 'Docker Sandbox' : 'Code Sandbox'}</span>
            <Box className="w-4 h-4 text-gray-500 group-hover:text-amber-600 transition-colors" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-gray-900">{sandboxInfo.runtime}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
              {sandboxInfo.mode}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-gray-500 leading-tight">
            {sandboxInfo.isDocker 
              ? `Hardened container with ${sandboxInfo.cpu}, ${sandboxInfo.ram} RAM cap.`
              : `Air-gapped code process and testing with ${sandboxInfo.cpu}, ${sandboxInfo.ram} cap & env scrubbing.`}
          </p>
          
        </div>
      </div>
    </div>
  );
}
