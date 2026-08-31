'use client';

import React, { useRef } from 'react';
import { useUploadStore } from '@/store/useUploadStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UploadCloud, FileText, Image, AlertCircle } from 'lucide-react';

export function DropZone() {
  const { 
    uploadDocument, 
    loadSampleInspectionPDF, 
    loadSamplePIDDrawing, 
    validationError, 
    currentStage 
  } = useUploadStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isBusy = currentStage !== 'idle' && currentStage !== 'completed' && currentStage !== 'error';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadDocument({
        name: file.name,
        size: file.size,
        type: file.type
      });
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      uploadDocument({
        name: file.name,
        size: file.size,
        type: file.type
      });
    }
  };

  return (
    <div className="space-y-3">
      {/* Drop Target Card */}
      <Card
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className={`border-dashed border-2 p-6 text-center transition-colors cursor-pointer ${
          isBusy
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed opacity-75'
            : 'border-gray-200 bg-gray-100 hover:border-blue-600/60 hover:bg-gray-200'
        }`}
        onClick={() => !isBusy && fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,.png,.jpg,.jpeg"
          className="hidden"
          disabled={isBusy}
        />

        <div className="flex flex-col items-center justify-center space-y-2.5">
          <div className="h-10 w-10 rounded-full bg-gray-200 border border-gray-200 flex items-center justify-center">
            <UploadCloud className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-900">
              Drag and drop refinery document or click to browse
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Supports Scanned PDFs, P&ID Drawings (PNG/JPG), and handwritten logs (Max 50MB)
            </p>
          </div>

          <div className="flex items-center space-x-2 pt-1 text-[11px] font-mono text-gray-400">
            <span>Local Engine: PaddleOCR CPU v4</span>
            <span>&bull;</span>
            <span>Zero Cloud Transmission</span>
          </div>
        </div>
      </Card>

      {/* Validation Error Alert (if triggered) */}
      {validationError && (
        <div className="flex items-center space-x-2 p-2.5 rounded-md border border-red-600/40 bg-red-600/10 text-xs text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Quick-Load Demo Artifact Buttons (Demo Scenarios 1 & 3) with 44px Touch Envelope */}
      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs min-h-[48px]">
        <span className="text-[11px] font-mono text-gray-400">Sample Datasets:</span>

        <Button
          size="sm"
          variant="outline"
          disabled={isBusy}
          onClick={loadSampleInspectionPDF}
          className="min-h-[44px] h-10 px-3.5 text-xs hover:border-blue-600 active:scale-[0.97] hover:scale-[1.01] transition-transform duration-150"
        >
          <FileText className="h-4 w-4 mr-2 text-blue-600" />
          <span>Load Sample Inspection PDF (Furnace F-101)</span>
        </Button>

        <Button
          size="sm"
          variant="outline"
          disabled={isBusy}
          onClick={loadSamplePIDDrawing}
          className="min-h-[44px] h-10 px-3.5 text-xs hover:border-emerald-600 active:scale-[0.97] hover:scale-[1.01] transition-transform duration-150"
        >
          <Image className="h-4 w-4 mr-2 text-emerald-600" />
          <span>Load Sample P&ID Drawing (DWG-CDU-004)</span>
        </Button>
      </div>
    </div>
  );
}
