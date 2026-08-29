'use client';

import React from 'react';
import { useModelStore } from '@/store/useModelStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRightLeft } from 'lucide-react';

export function SwapEventLog() {
  const { swapHistory } = useModelStore();

  return (
    <Card className="border-[#262626] bg-[#111111]">
      <CardHeader className="py-3 px-4 border-b border-[#262626]">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-semibold tracking-wider text-[#ededed]">
            Model Swapping History
          </CardTitle>
          <span className="text-[11px] font-mono text-[#666666]">
            LRU Threshold: 5m
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-3">
        {swapHistory.length === 0 ? (
          <div className="text-xs text-[#666666] py-3 text-center">No swap events recorded yet.</div>
        ) : (
          <div className="space-y-1.5">
            {swapHistory.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-2 rounded bg-[#0a0a0a] border border-[#262626] text-xs font-mono"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-[#666666] text-[11px]">{event.timestamp}</span>
                  <ArrowRightLeft className="h-3 w-3 text-[#0070f3]" />
                  <span className="text-[#888888]">{event.from_model}</span>
                  <span className="text-[#666666]">&rarr;</span>
                  <span className="text-[#ededed] font-medium">{event.to_model}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] text-[#888888]">{event.duration_ms}ms</span>
                  <Badge variant="success" className="text-[10px] py-0 px-1.5">
                    OK
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
