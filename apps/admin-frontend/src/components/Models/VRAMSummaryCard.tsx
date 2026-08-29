'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useModelStore } from '@/store/useModelStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Cpu } from 'lucide-react';

export function VRAMSummaryCard() {
  const { vram } = useModelStore();

  const usedPercentage = Math.round((vram.used_mb / vram.total_mb) * 100);
  const isBudgetSafe = vram.used_mb <= 6000;

  return (
    <Card className="border-[#262626] bg-[#111111]">
      <CardHeader className="pb-3 border-b border-[#262626]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Cpu className="h-4 w-4 text-[#888888]" />
            <CardTitle className="text-xs font-semibold tracking-wider text-[#ededed]">
              GPU VRAM Budget (6.0 GB Baseline)
            </CardTitle>
          </div>
          <Badge variant={isBudgetSafe ? "success" : "destructive"}>
            {isBudgetSafe ? "Healthy (<6.0 GB)" : "Limit Exceeded"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {/* Single-Color Neutral Track Gauge with Tabular Nums (CLS Prevention) */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-semibold font-mono text-[#ededed] tracking-tight tabular-nums min-w-[75px] inline-block">
                {vram.used_mb.toLocaleString()}
              </span>
              <span className="text-xs font-mono text-[#888888]">/ {vram.total_mb.toLocaleString()} MB</span>
            </div>
            <span className="text-xs font-mono font-medium text-[#ededed] tabular-nums">
              {usedPercentage}% allocated
            </span>
          </div>

          {/* Clean Single-Color Progress Track */}
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#1f1f1f] border border-[#262626]">
            <motion.div
              className="h-full bg-[#0070f3] rounded-full"
              style={{ width: `${usedPercentage}%` }}
              initial={{ width: 0 }}
              animate={{ width: `${usedPercentage}%` }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            />
          </div>
        </div>

        {/* Monochromatic Allocation Breakdown Table */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[#262626]/80 text-xs">
          <div className="space-y-0.5">
            <p className="text-[11px] text-[#888888]">OS & Compositor</p>
            <p className="font-mono text-[#ededed] font-medium tabular-nums">{vram.os_overhead_mb} MB</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[11px] text-[#888888]">Primary Model</p>
            <p className="font-mono text-[#ededed] font-medium tabular-nums">{vram.primary_model_mb} MB</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[11px] text-[#888888]">Secondary Model</p>
            <p className="font-mono text-[#ededed] font-medium tabular-nums">{vram.secondary_model_mb} MB</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[11px] text-[#888888]">KV Cache / Context</p>
            <p className="font-mono text-[#ededed] font-medium tabular-nums">{vram.kv_cache_mb} MB</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
