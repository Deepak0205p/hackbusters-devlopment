'use client';

import React from 'react';
import { useModelStore } from '@/store/useModelStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRightLeft } from 'lucide-react';

export function SwapEventLog() {
  const { swapHistory } = useModelStore();

  return (
    <Card className="border-gray-200 bg-gray-100">
      <CardHeader className="py-3 px-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-semibold tracking-wider text-gray-900">
            Model Swapping History
          </CardTitle>
          <span className="text-[11px] font-mono text-gray-400">
            LRU Threshold: 5m
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-3">
        {swapHistory.length === 0 ? (
          <div className="text-xs text-gray-400 py-3 text-center">No swap events recorded yet.</div>
        ) : (
          <div className="space-y-1.5">
            {swapHistory.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-2 rounded bg-gray-50 border border-gray-200 text-xs font-mono"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400 text-[11px]">{event.timestamp}</span>
                  <ArrowRightLeft className="h-3 w-3 text-blue-600" />
                  <span className="text-gray-500">{event.from_model}</span>
                  <span className="text-gray-400">&rarr;</span>
                  <span className="text-gray-900 font-medium">{event.to_model}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] text-gray-500">{event.duration_ms}ms</span>
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
