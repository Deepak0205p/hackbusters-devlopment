'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Route } from 'lucide-react';

interface RouterTagBadgeProps {
  modelId?: string;
  routedBy?: 'stage1_regex' | 'stage2_semantic' | 'manual';
  confidence?: number;
}

export function RouterTagBadge({ modelId = '', routedBy = 'stage1_regex', confidence = 98 }: RouterTagBadgeProps) {
  const modelName = modelId || 'Sovereign Engine';
  const routeType = routedBy === 'stage1_regex' ? 'Stage 1 Rule' : routedBy === 'stage2_semantic' ? 'Stage 2 Semantic' : 'Manual';

  return (
    <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded border border-[#262626] bg-[#0a0a0a] text-[11px] font-mono">
      <Route className="h-3 w-3 text-[#0070f3]" />
      <span className="text-[#888888]">Routed:</span>
      <span className="text-[#ededed] font-medium">{modelName}</span>
      <span className="text-[#333333]">|</span>
      <span className="text-[#888888]">{routeType} ({confidence}%)</span>
    </div>
  );
}
