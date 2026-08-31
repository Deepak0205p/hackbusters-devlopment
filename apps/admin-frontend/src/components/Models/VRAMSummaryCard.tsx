'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useModelStore } from '@/store/useModelStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Cpu } from 'lucide-react';

export function VRAMSummaryCard() {
  const { vram } = useModelStore();

  const totalMb = vram.total_mb > 0 ? vram.total_mb : 8000;
  const usedPercentage = Math.round((vram.used_mb / totalMb) * 100);
  const isBudgetSafe = vram.used_mb <= totalMb * 0.9;

  return (
    <Card className="border-gray-200 bg-gray-100">
      <CardHeader className="pb-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Cpu className="h-4 w-4 text-gray-500" />
            <div>
              <CardTitle className="text-xs font-semibold tracking-wider text-gray-900">
                {vram.gpu_available ? 'Dedicated GPU VRAM Budget' : 'Host Device Compute & Memory'}
              </CardTitle>
              <p className="text-[11px] font-mono text-gray-500 mt-0.5">
                Hardware: <span className="text-gray-900">{vram.gpu_name || 'Detecting hardware...'}</span>
              </p>
            </div>
          </div>
          <Badge variant={vram.gpu_available ? "success" : "secondary"}>
            {vram.gpu_available ? "GPU ACCELERATED" : "CPU / SHARED MEMORY"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {/* Single-Color Neutral Track Gauge with Tabular Nums (CLS Prevention) */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-semibold font-mono text-gray-900 tracking-tight tabular-nums min-w-[75px] inline-block">
                {vram.used_mb.toLocaleString()}
              </span>
              <span className="text-xs font-mono text-gray-500">/ {vram.total_mb.toLocaleString()} MB</span>
            </div>
            <span className="text-xs font-mono font-medium text-gray-900 tabular-nums">
              {usedPercentage}% allocated
            </span>
          </div>

          {/* Clean Single-Color Progress Track */}
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 border border-gray-200">
            <motion.div
              className="h-full bg-blue-600 rounded-full"
              style={{ width: `${usedPercentage}%` }}
              initial={{ width: 0 }}
              animate={{ width: `${usedPercentage}%` }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            />
          </div>
        </div>

        {/* Monochromatic Allocation Breakdown Table */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-gray-200/80 text-xs">
          <div className="space-y-0.5">
            <p className="text-[11px] text-gray-500">OS & Compositor</p>
            <p className="font-mono text-gray-900 font-medium tabular-nums">{vram.os_overhead_mb} MB</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[11px] text-gray-500">Primary Model</p>
            <p className="font-mono text-gray-900 font-medium tabular-nums">{vram.primary_model_mb} MB</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[11px] text-gray-500">Secondary Model</p>
            <p className="font-mono text-gray-900 font-medium tabular-nums">{vram.secondary_model_mb} MB</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[11px] text-gray-500">KV Cache / Context</p>
            <p className="font-mono text-gray-900 font-medium tabular-nums">{vram.kv_cache_mb} MB</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
