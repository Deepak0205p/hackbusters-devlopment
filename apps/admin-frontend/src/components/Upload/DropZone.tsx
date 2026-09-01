'use client';

import React, { useRef } from 'react';
import { useUploadStore } from '@/store/useUploadStore';
import { Card } from '@/components/ui/card';
import { UploadCloud, AlertCircle } from 'lucide-react';

export function DropZone() {
  const { 
    uploadDocument, 
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
      <Card
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className={order-dashed border-2 p-6 text-center transition-colors cursor-pointer }
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

      {validationError && (
        <div className="flex items-center space-x-2 p-2.5 rounded-md border border-red-600/40 bg-red-600/10 text-xs text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}
    </div>
  );
}
