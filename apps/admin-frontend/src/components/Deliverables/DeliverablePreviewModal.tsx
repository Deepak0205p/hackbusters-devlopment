'use client';

import React from 'react';
import { useDeliverableStore } from '@/store/useDeliverableStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Download, Hash, ShieldCheck, Cpu } from 'lucide-react';

export function DeliverablePreviewModal() {
  const { selectedDeliverable, selectDeliverable, downloadDeliverable } = useDeliverableStore();

  const isOpen = !!selectedDeliverable;

  if (!selectedDeliverable) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && selectDeliverable(null)}>
      <DialogContent className="max-w-xl bg-gray-100 border-gray-200 text-gray-900">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <DialogTitle className="text-sm font-semibold">
              {selectedDeliverable.filename}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-gray-500">
            {selectedDeliverable.source_scenario} &bull; {selectedDeliverable.size_formatted}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          {/* Executive Summary */}
          <div className="p-3 rounded-md bg-gray-50 border border-gray-200 space-y-1">
            <span className="text-[11px] font-mono text-gray-500 uppercase">Summary Overview</span>
            <p className="text-gray-900 leading-relaxed text-[11px]">
              {selectedDeliverable.summary}
            </p>
          </div>

          {/* Key Metrics / Structured Snippet */}
          {selectedDeliverable.key_metrics.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono text-gray-500 uppercase">Extracted Engineering Parameters</span>
              <div className="grid grid-cols-2 gap-2">
                {selectedDeliverable.key_metrics.map((m, idx) => (
                  <div key={idx} className="p-2 rounded bg-gray-50 border border-gray-200 text-[11px] font-mono">
                    <span className="text-gray-400">{m.label}: </span>
                    <span className="text-gray-900 font-medium">{m.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SOP Citations */}
          {selectedDeliverable.sop_citations.length > 0 && (
            <div className="p-2.5 rounded bg-emerald-50 border border-emerald-600/30 text-[11px] font-mono space-y-1">
              <div className="flex items-center space-x-1.5 text-emerald-600 font-medium">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Grounded SOP Citations</span>
              </div>
              {selectedDeliverable.sop_citations.map((cite, i) => (
                <p key={i} className="text-gray-900 pl-5">
                  &bull; {cite}
                </p>
              ))}
            </div>
          )}

          {/* Metadata Bar */}
          <div className="p-2 rounded bg-gray-50 border border-gray-200 font-mono text-[10px] space-y-1 text-gray-400">
            <div className="flex items-center justify-between">
              <span>Generating Model:</span>
              <span className="text-gray-900">{selectedDeliverable.generating_model}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>SHA-256 Hash:</span>
              <span className="text-gray-900">{selectedDeliverable.sha256_hash}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => selectDeliverable(null)}
            className="h-8 text-xs text-gray-500"
          >
            Close
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={() => {
              downloadDeliverable(selectedDeliverable.id);
              selectDeliverable(null);
            }}
            className="h-8 text-xs flex items-center space-x-1"
          >
            <Download className="h-3.5 w-3.5 mr-1" />
            <span>Download Artifact</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
