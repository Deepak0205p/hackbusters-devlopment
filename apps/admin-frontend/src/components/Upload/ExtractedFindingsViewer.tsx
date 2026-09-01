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
      <Card className="border-gray-200 bg-gray-100 p-8 text-center text-xs text-gray-400 min-h-[160px] flex items-center justify-center">
        No document processed yet. Upload a refinery document to begin extraction.
      </Card>
    );
  }

  const handleSendToAgent = () => {
    if (selectedDoc.type === 'inspection_pdf') {
      setCurrentInput("Draft an executive approval note based on this inspection report and verify compliance against applicable SOPs.");
    } else {
      setCurrentInput("Extract all equipment tags and valves from this P&ID drawing and export an Excel asset register.");
    }
  };

  return (
    <Card className="border-gray-200 bg-gray-100 min-h-[300px]">
      <CardHeader className="py-3 px-4 border-b border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-blue-600" />
            <CardTitle className="text-xs font-semibold text-gray-900">
              {selectedDoc.name}
            </CardTitle>
            <Badge variant="outline" className="font-mono text-[10px]">
              {selectedDoc.size_formatted}
            </Badge>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-[11px] font-mono text-gray-400">
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
          <div className="p-3 rounded-md border border-red-600/40 bg-red-600/10 space-y-1 text-xs">
            <div className="flex items-center space-x-1.5 text-red-600 font-semibold">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>SOP Compliance Violation Detected</span>
            </div>
            {selectedDoc.sop_violations.map((viol, i) => (
              <p key={i} className="text-gray-900 text-[11px] pl-5 leading-relaxed">
                &bull; {viol}
              </p>
            ))}
          </div>
        )}

        {/* View Switcher: Structured Table vs Raw Text */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-2 min-h-[48px]">
          <div className="flex space-x-2">
            <button
              onClick={() => setViewTab('structured')}
              className={`text-xs font-medium px-3.5 py-2 rounded min-h-[44px] transition-colors ${
                viewTab === 'structured'
                  ? 'bg-gray-200 text-gray-900 border border-gray-300'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Structured Entities ({selectedDoc.findings.length})
            </button>
            <button
              onClick={() => setViewTab('raw')}
              className={`text-xs font-medium px-3.5 py-2 rounded min-h-[44px] transition-colors ${
                viewTab === 'raw'
                  ? 'bg-gray-200 text-gray-900 border border-gray-300'
                  : 'text-gray-500 hover:text-gray-900'
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
          <div className="rounded-md border border-gray-200 bg-gray-50 overflow-hidden min-h-[180px]">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-100 text-gray-500 text-[11px] font-mono border-b border-gray-200">
                <tr>
                  <th className="py-2.5 px-3.5">Field / Entity</th>
                  <th className="py-2.5 px-3.5">Extracted Value</th>
                  <th className="py-2.5 px-3.5">Category</th>
                  <th className="py-2.5 px-3.5 text-right">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/60 font-mono text-[11px]">
                {selectedDoc.findings.map((finding, idx) => (
                  <tr
                    key={idx}
                    className={`hover:bg-gray-200 ${
                      finding.highlight ? 'bg-red-600/5 font-semibold' : ''
                    }`}
                  >
                    <td className="py-2 px-3.5 text-gray-900">{finding.key}</td>
                    <td className="py-2 px-3.5 text-gray-900">
                      {finding.highlight ? (
                        <span className="text-red-600">{finding.value}</span>
                      ) : (
                        finding.value
                      )}
                    </td>
                    <td className="py-2 px-3.5 text-gray-500">
                      <span className="px-1.5 py-0.5 rounded bg-gray-100 border border-gray-200 text-[10px]">
                        {finding.category}
                      </span>
                    </td>
                    <td className="py-2 px-3.5 text-right text-emerald-600 tabular-nums">
                      {finding.confidence}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-md border border-gray-200 bg-white p-3 font-mono text-[11px] text-gray-900 whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto">
            {selectedDoc.raw_ocr_text}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
