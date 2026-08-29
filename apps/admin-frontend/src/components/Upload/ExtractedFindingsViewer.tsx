'use client';

import React, { useState } from 'react';
import { useUploadStore } from '@/store/useUploadStore';
import { useChatStore } from '@/store/useChatStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, ShieldAlert, ArrowRight, Hash } from 'lucide-react';

export function ExtractedFindingsViewer() {
  const { documents, selectedDocId } = useUploadStore();
  const { setCurrentInput } = useChatStore();
  const [viewTab, setViewTab] = useState<'structured' | 'raw'>('structured');

  const selectedDoc = documents.find((d) => d.id === selectedDocId) || documents[0];

  if (!selectedDoc) {
    return (
      <Card className="border-[#262626] bg-[#111111] p-8 text-center text-xs text-[#666666] min-h-[160px] flex items-center justify-center">
        No document processed yet. Drag &amp; drop a file or load a sample dataset above.
      </Card>
    );
  }

  const handleSendToAgent = () => {
    if (selectedDoc.type === 'inspection_pdf') {
      setCurrentInput("Draft an urgent executive approval note for Crude Distillation Unit furnace F-101 based on this inspection report and verify compliance against MRPL SOPs.");
    } else {
      setCurrentInput("Extract all equipment tags and valves from this P&ID drawing and export an Excel asset register.");
    }
  };

  return (
    <Card className="border-[#262626] bg-[#111111] min-h-[300px]">
      <CardHeader className="py-3 px-4 border-b border-[#262626]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-[#0070f3]" />
            <CardTitle className="text-xs font-semibold text-[#ededed]">
              {selectedDoc.name}
            </CardTitle>
            <Badge variant="outline" className="font-mono text-[10px]">
              {selectedDoc.size_formatted}
            </Badge>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-[11px] font-mono text-[#666666]">
              <Hash className="h-3 w-3" />
              <span>SHA-256: {selectedDoc.sha256_hash.substring(0, 10)}...</span>
            </div>
            <Badge variant="success">Engine: {selectedDoc.ocr_engine}</Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* SOP Breach Warning Banner (if any) */}
        {selectedDoc.sop_violations.length > 0 && (
          <div className="p-3 rounded-md border border-[#e5484d]/40 bg-[#e5484d]/10 space-y-1 text-xs">
            <div className="flex items-center space-x-1.5 text-[#e5484d] font-semibold">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>SOP Compliance Violation Detected</span>
            </div>
            {selectedDoc.sop_violations.map((viol, i) => (
              <p key={i} className="text-[#ededed] text-[11px] pl-5 leading-relaxed">
                &bull; {viol}
              </p>
            ))}
          </div>
        )}

        {/* View Switcher: Structured Table vs Raw Text */}
        <div className="flex items-center justify-between border-b border-[#262626] pb-2 min-h-[48px]">
          <div className="flex space-x-2">
            <button
              onClick={() => setViewTab('structured')}
              className={`text-xs font-medium px-3.5 py-2 rounded min-h-[44px] transition-colors ${
                viewTab === 'structured'
                  ? 'bg-[#1f1f1f] text-white border border-[#333333]'
                  : 'text-[#888888] hover:text-[#ededed]'
              }`}
            >
              Structured Entities ({selectedDoc.findings.length})
            </button>
            <button
              onClick={() => setViewTab('raw')}
              className={`text-xs font-medium px-3.5 py-2 rounded min-h-[44px] transition-colors ${
                viewTab === 'raw'
                  ? 'bg-[#1f1f1f] text-white border border-[#333333]'
                  : 'text-[#888888] hover:text-[#ededed]'
              }`}
            >
              Raw OCR Buffer
            </button>
          </div>

          <Button
            size="sm"
            variant="primary"
            onClick={handleSendToAgent}
            className="min-h-[44px] h-9 px-3.5 text-xs flex items-center space-x-1.5 active:scale-[0.97] transition-transform"
          >
            <span>Pass to Agent Workspace</span>
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>

        {/* Content Body */}
        {viewTab === 'structured' ? (
          <div className="rounded-md border border-[#262626] bg-[#0a0a0a] overflow-hidden min-h-[180px]">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#111111] text-[#888888] text-[11px] font-mono border-b border-[#262626]">
                <tr>
                  <th className="py-2.5 px-3.5">Field / Entity</th>
                  <th className="py-2.5 px-3.5">Extracted Value</th>
                  <th className="py-2.5 px-3.5">Category</th>
                  <th className="py-2.5 px-3.5 text-right">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]/60 font-mono text-[11px]">
                {selectedDoc.findings.map((finding, idx) => (
                  <tr
                    key={idx}
                    className={`hover:bg-[#141414] ${
                      finding.highlight ? 'bg-[#e5484d]/5 font-semibold' : ''
                    }`}
                  >
                    <td className="py-2 px-3.5 text-[#ededed]">{finding.key}</td>
                    <td className="py-2 px-3.5 text-[#ffffff]">
                      {finding.highlight ? (
                        <span className="text-[#e5484d]">{finding.value}</span>
                      ) : (
                        finding.value
                      )}
                    </td>
                    <td className="py-2 px-3.5 text-[#888888]">
                      <span className="px-1.5 py-0.5 rounded bg-[#171717] border border-[#262626] text-[10px]">
                        {finding.category}
                      </span>
                    </td>
                    <td className="py-2 px-3.5 text-right text-[#00e599] tabular-nums">
                      {finding.confidence}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-md border border-[#262626] bg-[#000000] p-3 font-mono text-[11px] text-[#ededed] whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto">
            {selectedDoc.raw_ocr_text}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
