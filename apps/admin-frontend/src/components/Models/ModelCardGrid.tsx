'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useModelStore } from '@/store/useModelStore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRightLeft, CheckCircle2 } from 'lucide-react';

export function ModelCardGrid() {
  const { models, activePrimaryId, activeSecondaryId, isSwapping, triggerModelSwap } = useModelStore();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {models.map((model) => {
        const isPrimaryActive = model.id === activePrimaryId;
        const isSecondaryActive = model.id === activeSecondaryId;
        const isLoadedInVram = isPrimaryActive || isSecondaryActive;

        return (
          <motion.div
            key={model.id}
            initial={{ opacity: 0, transform: "scale(0.98) translateY(4px)" }}
            animate={{ opacity: 1, transform: "scale(1) translateY(0px)" }}
            transition={{ type: "spring", stiffness: 120, damping: 22 }}
          >
            <Card className={`border transition-colors min-h-[220px] flex flex-col justify-between ${
              isLoadedInVram 
                ? 'border-[#0070f3]/40 bg-[#141414]' 
                : 'border-[#262626] bg-[#111111]'
            }`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-mono text-[#888888] uppercase tracking-wider">
                      {model.domain}
                    </span>
                    <CardTitle className="text-xs font-semibold text-[#ededed]">
                      {model.display_name || model.name}
                    </CardTitle>
                  </div>

                  <div className="flex items-center space-x-1.5 min-w-[70px] justify-end">
                    {isPrimaryActive && (
                      <Badge variant="active">PRIMARY</Badge>
                    )}
                    {isSecondaryActive && (
                      <Badge variant="active">ACTIVE</Badge>
                    )}
                    {!isLoadedInVram && (
                      <Badge variant="secondary">STANDBY</Badge>
                    )}
                  </div>
                </div>
                {/* Reserved height to prevent CLS */}
                <CardDescription className="text-xs text-[#888888] mt-1 min-h-[32px] line-clamp-2">
                  {model.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="py-2 text-xs">
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded bg-[#0a0a0a] border border-[#262626] font-mono text-[11px]">
                  <div>
                    <span className="text-[#666666]">Architecture: </span>
                    <span className="text-[#ededed]">Air-Gapped Sovereign</span>
                  </div>
                  <div>
                    <span className="text-[#666666]">Quant: </span>
                    <span className="text-[#ededed]">{model.quantization}</span>
                  </div>
                  <div>
                    <span className="text-[#666666]">Footprint: </span>
                    <span className="text-[#ededed] font-medium tabular-nums">{model.vram_mb} MB</span>
                  </div>
                  <div>
                    <span className="text-[#666666]">Memory State: </span>
                    <span className={isLoadedInVram ? "text-[#00e599]" : "text-[#666666]"}>
                      {isLoadedInVram ? "Loaded in VRAM" : "Paged out (LRU)"}
                    </span>
                  </div>
                </div>

                {/* 1-IP Hybrid Node Binding */}
                <div className="mt-2.5 flex items-center justify-between px-2.5 py-1.5 rounded bg-[#0d0d0d] border border-[#222222] font-mono text-[11px]">
                  <div className="flex items-center space-x-1.5">
                    <div className={`h-1.5 w-1.5 rounded-full ${model.node_ip && model.node_ip !== '127.0.0.1' ? 'bg-[#0070f3] animate-pulse' : 'bg-[#00e599]'}`} />
                    <span className="text-[#888888]">Compute Node:</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-[#ededed] bg-[#1a1a1a] px-1.5 py-0.5 rounded border border-[#333333] text-[10px]">
                      {model.node_ip || '127.0.0.1'}
                    </span>
                    <span className="text-[10px] text-[#666666]">
                      {model.node_ip === '127.0.0.1' || !model.node_ip ? '(Local GPU)' : '(LAN Laptop)'}
                    </span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-2 flex justify-between items-center mt-2 border-t border-[#262626]/50 min-h-[52px]">
                <span className="text-[11px] text-[#666666] font-mono">
                  Swap Latency: &lt;1.2s
                </span>

                {!model.is_primary && (
                  /* 44px touch target envelope (ui-ux-pro-max Priority 2) */
                  <div className="flex items-center min-h-[44px]">
                    <Button
                      size="sm"
                      variant={isSecondaryActive ? "secondary" : "outline"}
                      disabled={isSecondaryActive || isSwapping}
                      onClick={() => triggerModelSwap(model.id)}
                      className="h-9 px-3.5 text-xs flex items-center space-x-1.5 active:scale-[0.97] transition-transform"
                    >
                      <ArrowRightLeft className={`h-3.5 w-3.5 ${isSwapping ? 'animate-spin' : ''}`} />
                      <span>{isSecondaryActive ? 'Loaded in VRAM' : 'Swap In (LRU)'}</span>
                    </Button>
                  </div>
                )}

                {model.is_primary && (
                  <div className="flex items-center space-x-1.5 text-[#00e599] text-xs font-mono min-h-[44px]">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Permanent Lock</span>
                  </div>
                )}
              </CardFooter>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

