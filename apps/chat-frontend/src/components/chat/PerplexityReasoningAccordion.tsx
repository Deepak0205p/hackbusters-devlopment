'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles, CheckCircle2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface TraceStep {
  id?: string;
  type?: string;
  content: string;
  duration_ms?: number;
}

interface Props {
  steps: TraceStep[];
  isStreaming?: boolean;
}

export function PerplexityReasoningAccordion({ steps, isStreaming = false }: Props) {
  const [isOpen, setIsOpen] = useState(isStreaming);

  if (!steps || steps.length === 0) return null;

  const totalSteps = steps.length;
  const lastStep = steps[steps.length - 1];

  return (
    <div className="w-full mb-2 rounded-xl border border-blue-500/20 bg-blue-50/50 dark:bg-[#121624]/60 overflow-hidden text-xs transition-all">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-blue-100/50 dark:hover:bg-white/[0.04] transition-colors"
      >
        <div className="flex items-center space-x-2 min-w-0">
          <div className="h-4 w-4 rounded-full bg-blue-500/10 dark:bg-blue-400/20 flex items-center justify-center shrink-0">
            {isStreaming ? (
              <div className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-ping" />
            ) : (
              <Sparkles className="h-2.5 w-2.5 text-blue-600 dark:text-blue-400" />
            )}
          </div>
          <span className="font-semibold text-blue-700 dark:text-blue-300">
            {isStreaming ? 'Thinking & Reasoning...' : `Thought for ${totalSteps} step${totalSteps > 1 ? 's' : ''}`}
          </span>
          {isStreaming && lastStep && (
            <span className="text-slate-500 dark:text-slate-400 truncate text-[11px] hidden sm:inline">
              — {lastStep.content}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-1.5 shrink-0 text-slate-400 dark:text-slate-500">
          <span className="text-[11px]">{isOpen ? 'Hide' : 'View'}</span>
          {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="px-3.5 pb-3 pt-1 border-t border-blue-500/10 space-y-2"
          >
            {steps.map((step, idx) => {
              const isCurrent = isStreaming && idx === steps.length - 1;
              return (
                <div key={step.id || idx} className="flex items-start space-x-2 text-slate-600 dark:text-slate-300">
                  <div className="mt-0.5 shrink-0">
                    {isCurrent ? (
                      <div className="h-3 w-3 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`leading-relaxed ${isCurrent ? 'text-blue-600 dark:text-blue-400 font-medium' : ''}`}>
                      {step.content}
                    </p>
                    {step.duration_ms !== undefined && step.duration_ms > 0 && (
                      <span className="text-[10px] text-slate-400 flex items-center gap-0.5 mt-0.5">
                        <Clock className="h-2.5 w-2.5" /> {step.duration_ms}ms
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
