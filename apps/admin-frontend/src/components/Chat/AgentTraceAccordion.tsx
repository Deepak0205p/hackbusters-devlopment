'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TraceStep } from '@/store/useChatStore';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Terminal, Sparkles, Wrench, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';

interface AgentTraceAccordionProps {
  steps: TraceStep[];
}

const typeIconMap = {
  thought: <Sparkles className="h-3.5 w-3.5 text-blue-600" />,
  action: <Wrench className="h-3.5 w-3.5 text-amber-500" />,
  observation: <Terminal className="h-3.5 w-3.5 text-emerald-600" />,
  correction: <AlertCircle className="h-3.5 w-3.5 text-red-500" />,
};

const typeLabelMap = {
  thought: 'Reasoning Step',
  action: 'Tool Execution',
  observation: 'Environment Output',
  correction: 'Self-Correction Fix',
};

export function AgentTraceAccordion({ steps }: AgentTraceAccordionProps) {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="my-2.5 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden transition-all">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="trace-parent" className="border-none">
          <AccordionTrigger className="px-3.5 py-2 hover:bg-gray-100 hover:no-underline text-[11px] font-mono text-gray-500">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-emerald-600" />
              <span className="text-gray-900 font-medium">ReAct Reasoning Chain</span>
              <span className="text-gray-400">({steps.length} steps executed)</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-1 pb-2 px-3 border-t border-gray-100 space-y-2">
            {steps.map((step, idx) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, transform: "translateY(3px)" }}
                animate={{ opacity: 1, transform: "translateY(0px)" }}
                transition={{ type: "spring", stiffness: 120, damping: 20, delay: idx * 0.03 }}
                className="rounded-md border border-gray-200 bg-gray-100 p-2.5 space-y-1.5"
              >
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <div className="flex items-center space-x-1.5">
                    {typeIconMap[step.type]}
                    <span className="text-gray-900 font-medium">
                      {step.step_number}. {typeLabelMap[step.type]}
                    </span>
                  </div>
                  {step.tool_name && (
                    <Badge variant="outline" className="text-[9px] py-0 px-1.5 font-mono text-blue-600 border-blue-600/30">
                      {step.tool_name}
                    </Badge>
                  )}
                </div>

                <div className="font-mono text-[11px] text-gray-500 whitespace-pre-wrap leading-relaxed pl-5 border-l border-gray-200">
                  {step.content}
                </div>
              </motion.div>
            ))}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
