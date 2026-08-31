'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useUploadStore, ProcessingStage } from '@/store/useUploadStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Loader2, Cpu, Eye, Database, FileSpreadsheet, ShieldCheck } from 'lucide-react';

interface StageDefinition {
  id: ProcessingStage;
  label: string;
  subtext: string;
  icon: React.ReactNode;
}

const STAGES: StageDefinition[] = [
  {
    id: 'uploading',
    label: '1. Payload Ingestion & Validation',
    subtext: 'SHA-256 integrity hash & size boundaries verified locally.',
    icon: <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />,
  },
  {
    id: 'ocr_processing',
    label: '2. PaddleOCR Extraction (CPU)',
    subtext: 'Offline English v4 engine extracting tabular readings.',
    icon: <Cpu className="h-3.5 w-3.5 text-emerald-600" />,
  },
  {
    id: 'vision_analyzing',
    label: '3. Qwen2-VL Spatial Reasoning',
    subtext: 'Multimodal vision parsing layout geometry & P&ID symbols.',
    icon: <Eye className="h-3.5 w-3.5 text-amber-600" />,
  },
  {
    id: 'chromadb_lookup',
    label: '4. ChromaDB SOP Cross-Reference',
    subtext: 'Local vector search against refinery manuals & clauses.',
    icon: <Database className="h-3.5 w-3.5 text-blue-600" />,
  },
  {
    id: 'completed',
    label: '5. Findings Synthesized',
    subtext: 'Structured schema ready for agent reasoning.',
    icon: <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />,
  },
];

const stageOrder: ProcessingStage[] = [
  'idle',
  'uploading',
  'ocr_processing',
  'vision_analyzing',
  'chromadb_lookup',
  'completed',
];

export function ProcessingPipelineTracker() {
  const { currentStage, stageProgress, stageMessage } = useUploadStore();

  if (currentStage === 'idle') return null;

  const currentIdx = stageOrder.indexOf(currentStage);

  return (
    <Card className="border-gray-200 bg-gray-100">
      <CardHeader className="py-3 px-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CardTitle className="text-xs font-semibold text-gray-900">
              Multimodal Ingestion Pipeline
            </CardTitle>
            <Badge variant={currentStage === 'completed' ? 'success' : 'active'}>
              {currentStage === 'completed' ? 'Pipeline Complete' : 'Processing Stage'}
            </Badge>
          </div>

          <span className="text-[11px] font-mono text-gray-500">
            {stageProgress}%
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 border border-gray-200">
            <motion.div
              className="h-full bg-blue-600 rounded-full"
              style={{ width: `${stageProgress}%` }}
              initial={{ width: 0 }}
              animate={{ width: `${stageProgress}%` }}
              transition={{ ease: "easeInOut", duration: 0.3 }}
            />
          </div>
          <p className="text-[11px] font-mono text-gray-500">{stageMessage}</p>
        </div>

        {/* 5-Stage Step Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 pt-2 border-t border-gray-200/60">
          {STAGES.map((stage, idx) => {
            const stageStepIdx = stageOrder.indexOf(stage.id);
            const isDone = currentIdx > stageStepIdx || currentStage === 'completed';
            const isCurrent = currentStage === stage.id && currentStage !== 'completed';

            return (
              <div
                key={stage.id}
                className={`p-2.5 rounded-md border text-xs space-y-1 transition-colors ${
                  isCurrent
                    ? 'border-blue-600/50 bg-blue-50'
                    : isDone
                    ? 'border-gray-200 bg-gray-50'
                    : 'border-gray-200 bg-gray-50/40 opacity-40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    {stage.icon}
                    <span className="font-medium text-gray-900 text-[11px] line-clamp-1">
                      {stage.label}
                    </span>
                  </div>

                  {isDone ? (
                    <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                  ) : isCurrent ? (
                    <Loader2 className="h-3 w-3 text-blue-600 animate-spin shrink-0" />
                  ) : (
                    <Circle className="h-2.5 w-2.5 text-gray-300 shrink-0" />
                  )}
                </div>

                <p className="text-[10px] text-gray-400 leading-tight line-clamp-2">
                  {stage.subtext}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
