'use client';

import React from 'react';
import { VRAMSummaryCard } from './VRAMSummaryCard';
import { ModelCardGrid } from './ModelCardGrid';
import { SwapEventLog } from './SwapEventLog';

export function ModelStatusPanel() {
  return (
    <div className="space-y-4">
      {/* VRAM Budget & Live Allocation Bar */}
      <VRAMSummaryCard />

      {/* 4 Models Registry Grid */}
      <ModelCardGrid />

      {/* LRU Paging Log */}
      <SwapEventLog />
    </div>
  );
}
