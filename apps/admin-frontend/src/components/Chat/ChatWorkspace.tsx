'use client';

import React from 'react';
import { ChatContainer } from './ChatContainer';
import { PromptInputDock } from './PromptInputDock';
import { ScenarioSelector } from './ScenarioSelector';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Bot, Zap } from 'lucide-react';

export function ChatWorkspace() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      {/* Main Conversation & Trace Viewport (3 Cols) */}
      <div className="lg:col-span-3 space-y-3 flex flex-col">
        {/* Scenario Quick-Launch Bar */}
        <ScenarioSelector />

        {/* Chat Scroll Container */}
        <Card className="flex-1 border-[#262626] bg-[#111111] p-4 flex flex-col justify-between min-h-[460px]">
          <ChatContainer />
          
          {/* Input Dock at Bottom */}
          <div className="pt-3 border-t border-[#262626]/80 mt-2">
            <PromptInputDock />
          </div>
        </Card>
      </div>

      {/* Side Telemetry & Router Panel (1 Col) */}
      <div className="space-y-3">
        <Card className="border-[#262626] bg-[#111111]">
          <CardHeader className="py-2.5 px-3.5 border-b border-[#262626]">
            <div className="flex items-center space-x-1.5">
              <Bot className="h-3.5 w-3.5 text-[#0070f3]" />
              <CardTitle className="text-xs font-semibold text-[#ededed]">
                Agent Guardrails
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-3 text-xs space-y-2.5 font-mono text-[11px]">
            <div>
              <p className="text-[#888888]">ReAct Loop Cap:</p>
              <p className="text-[#ededed] font-medium">Max 10 Iterations</p>
            </div>
            <div>
              <p className="text-[#888888]">Sandbox Mode:</p>
              <p className="text-[#00e599] font-medium">--network none (Isolated)</p>
            </div>
            <div>
              <p className="text-[#888888]">Memory Cap:</p>
              <p className="text-[#ededed] font-medium">512 MB RAM / 2 vCPU</p>
            </div>
            <div>
              <p className="text-[#888888]">Execution Timeout:</p>
              <p className="text-[#ededed] font-medium">15.0 Seconds</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#262626] bg-[#111111]">
          <CardHeader className="py-2.5 px-3.5 border-b border-[#262626]">
            <div className="flex items-center space-x-1.5">
              <Zap className="h-3.5 w-3.5 text-[#f5a623]" />
              <CardTitle className="text-xs font-semibold text-[#ededed]">
                Two-Stage Router
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-3 text-xs space-y-2 text-[11px]">
            <p className="text-[#888888]">
              <strong className="text-[#ededed]">Stage 1:</strong> Pre-compiled regex patterns (&lt;1ms latency).
            </p>
            <p className="text-[#888888]">
              <strong className="text-[#ededed]">Stage 2:</strong> BGE dense embedding cosine similarity.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
