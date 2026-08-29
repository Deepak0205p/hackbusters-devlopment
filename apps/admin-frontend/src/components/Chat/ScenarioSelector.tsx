'use client';

import React from 'react';
import { useChatStore } from '@/store/useChatStore';
import { Button } from '@/components/ui/button';
import { Flame, Activity, FileSpreadsheet } from 'lucide-react';

export function ScenarioSelector() {
  const { setCurrentInput } = useChatStore();

  const handleSelectScenario = (scenario: 'furnace' | 'pump' | 'pid') => {
    if (scenario === 'furnace') {
      setCurrentInput("Draft an urgent executive approval note for Crude Distillation Unit furnace F-101 based on inspection report and verify compliance against MRPL SOPs.");
    } else if (scenario === 'pump') {
      setCurrentInput("Calculate hydraulic power and operating efficiency for Crude Charge Pump P-101A with Q=450 m3/h, H=125 m, Pin=160 kW.");
    } else if (scenario === 'pid') {
      setCurrentInput("Analyze P&ID engineering schematic drawing for Crude Pre-Flash Unit and extract all ISA 5.1 instrumentation tags.");
    }
  };

  return (
    /* Reserved height min-h-[48px] to prevent CLS */
    <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs min-h-[48px]">
      <span className="text-[11px] font-mono text-[#666666] shrink-0">Demo Scenarios:</span>
      
      {/* 44px minimum touch targets with :active scale(0.97) micro-motion */}
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleSelectScenario('furnace')}
        className="min-h-[44px] h-10 px-3.5 text-xs shrink-0 hover:border-[#f5a623] active:scale-[0.97] transition-transform"
      >
        <Flame className="h-4 w-4 mr-2 text-[#f5a623]" />
        <span>Scenario 1: Furnace SOP &rarr; Word Memo</span>
      </Button>

      <Button
        size="sm"
        variant="outline"
        onClick={() => handleSelectScenario('pump')}
        className="min-h-[44px] h-10 px-3.5 text-xs shrink-0 hover:border-[#0070f3] active:scale-[0.97] transition-transform"
      >
        <Activity className="h-4 w-4 mr-2 text-[#0070f3]" />
        <span>Scenario 2: Pump Coding &rarr; Docker Sandbox</span>
      </Button>

      <Button
        size="sm"
        variant="outline"
        onClick={() => handleSelectScenario('pid')}
        className="min-h-[44px] h-10 px-3.5 text-xs shrink-0 hover:border-[#00e599] active:scale-[0.97] transition-transform"
      >
        <FileSpreadsheet className="h-4 w-4 mr-2 text-[#00e599]" />
        <span>Scenario 3: P&ID Drawing &rarr; Excel Register</span>
      </Button>
    </div>
  );
}
