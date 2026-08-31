'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useSovereigntyStore } from '@/store/useSovereigntyStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Laptop, ShieldCheck, Activity } from 'lucide-react';

export function ConnectedClientsCard() {
  const { metrics, deploymentMode, hostIp, port } = useSovereigntyStore();

  const isConnected = metrics.lan_hotspot_sockets > 0;

  return (
    <Card className="border-gray-200 bg-gray-100 min-h-[220px] flex flex-col justify-between">
      <CardHeader className="py-3 px-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Smartphone className="h-4 w-4 text-emerald-600" />
            <CardTitle className="text-xs font-semibold text-gray-900">
              Active Evaluator Sessions
            </CardTitle>
          </div>
          <Badge variant={isConnected ? "success" : "secondary"}>
            {isConnected ? "Client Active" : "Listening"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-baseline space-x-2">
              <motion.span
                key={metrics.lan_hotspot_sockets}
                initial={{ scale: 1.2, opacity: 0.5 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-3xl font-black font-mono text-gray-900"
              >
                {metrics.lan_hotspot_sockets}
              </motion.span>
              <span className="text-xs text-gray-500">Connected Remote Client(s)</span>
            </div>
            <p className="text-[11px] font-mono text-gray-400 mt-0.5">
              Multi-Device Real-Time Synchronization via WebSocket
            </p>
          </div>

          <div className="p-3 rounded-full bg-gray-100 border border-gray-200">
            <Activity className="h-5 w-5 text-blue-600" />
          </div>
        </div>

        <div className="p-2.5 rounded bg-gray-50 border border-gray-200 space-y-1.5 font-mono text-[11px]">
          <div className="flex items-center justify-between text-gray-500">
            <span>Latency (LAN/Hotspot):</span>
            <span className="text-emerald-600 font-medium">&lt; 15 ms</span>
          </div>
          <div className="flex items-center justify-between text-gray-500">
            <span>External Internet Egress:</span>
            <span className="text-emerald-600 font-semibold flex items-center">
              <ShieldCheck className="h-3 w-3 mr-1" />
              0 Packets (Sovereign)
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
