'use client';

import React from 'react';
import { DropZone } from './DropZone';
import { ProcessingPipelineTracker } from './ProcessingPipelineTracker';
import { ExtractedFindingsViewer } from './ExtractedFindingsViewer';

export function OCRHub() {
  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* File Ingestion Target & Sample Loaders */}
      <DropZone />

      {/* 5-Stage Multimodal Pipeline Tracker */}
      <ProcessingPipelineTracker />

      {/* Extracted Entities & Verification Table */}
      <ExtractedFindingsViewer />
    </div>
  );
}
