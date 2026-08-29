'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSovereigntyStore } from '@/store/useSovereigntyStore';
import { useNetworkStore } from '@/store/useNetworkStore';
import { socketManager } from '@/lib/socket';
import { Shield } from 'lucide-react';

export function Header() {
  const { metrics } = useSovereigntyStore();
  const { deploymentMode, hostIp, port } = useNetworkStore();

  useEffect(() => {
    // Initiate resilient 1000ms WebSocket telemetry streaming hook (Plan 44 / 48)
    socketManager.connectAuditStream();
  }, []);

  return (
    <header className="border-b border-[#262626] bg-[#000000] px-6 py-3 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Title */}
        <div className="flex items-center space-x-3">
          <div className="h-5 w-5 rounded bg-[#171717] border border-[#333333] flex items-center justify-center font-mono text-[11px] text-[#ededed] font-semibold">
            M
          </div>
          <span className="text-xs font-semibold tracking-tight text-[#ededed]">
            MRPL Sovereign Workbench
          </span>
          <span className="text-[#333333]">/</span>
          <span className="text-xs font-mono text-[#888888]">
            {deploymentMode} ({hostIp}:{port})
          </span>
        </div>

        {/* Air Gap Status Pill */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-[#111111] border border-[#262626] text-xs font-mono">
            <motion.span
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="h-1.5 w-1.5 rounded-full bg-[#00e599] inline-block"
            />
            <Shield className="h-3 w-3 text-[#00e599]" />
            <span className="text-[#ededed] font-medium text-[11px]">
              0 External Egress
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
