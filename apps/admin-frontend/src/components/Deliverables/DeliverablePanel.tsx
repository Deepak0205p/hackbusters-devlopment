'use client';

import React from 'react';
import { DeliverableFilterToolbar } from './DeliverableFilterToolbar';
import { DeliverableCardGrid } from './DeliverableCardGrid';
import { DeliverablePreviewModal } from './DeliverablePreviewModal';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FileCheck, ShieldCheck } from 'lucide-react';

export function DeliverablePanel() {
  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header Info Banner */}
      <Card className="border-[#262626] bg-[#111111]">
        <CardHeader className="py-3 px-4 border-b border-[#262626]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <FileCheck className="h-4 w-4 text-[#0070f3]" />
              <CardTitle className="text-xs font-semibold text-[#ededed]">
                Enterprise Deliverable Registry
              </CardTitle>
            </div>

            <span className="text-[11px] font-mono text-[#00e599] flex items-center">
              <ShieldCheck className="h-3.5 w-3.5 mr-1" />
              Locally Generated &amp; SHA-256 Hashed
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-3">
          <p className="text-xs text-[#888888] leading-relaxed">
            All artifacts (.docx, .xlsx, .pptx, .py) are generated programmatically on-premise without external cloud APIs. Every deliverable is cryptographically hashed and grounded in MRPL standard operating procedures.
          </p>

          {/* Filter & Search Toolbar */}
          <DeliverableFilterToolbar />
        </CardContent>
      </Card>

      {/* Deliverable Grid */}
      <DeliverableCardGrid />

      {/* Preview Dialog */}
      <DeliverablePreviewModal />
    </div>
  );
}
