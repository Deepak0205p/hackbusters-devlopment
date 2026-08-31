'use client';

import React from 'react';
import { useSovereigntyStore, DeploymentMode } from '@/store/useSovereigntyStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Laptop, Wifi, Radio } from 'lucide-react';

export function DeploymentModeSwitcher() {
  const { deploymentMode, setDeploymentMode, hostIp, port } = useSovereigntyStore();

  const modes: { id: DeploymentMode; title: string; desc: string; icon: React.ReactNode }[] = [
    {
      id: 'STANDALONE_LOCAL',
      title: '1. Primary Standalone',
      desc: 'Localhost only (127.0.0.1). Zero external sockets.',
      icon: <Laptop className="h-4 w-4" />,
    },
    {
      id: 'LAN_OPTION_A',
      title: '2. Venue LAN (Option A)',
      desc: 'Host & judges share venue Wi-Fi subnet (192.168.1.50).',
      icon: <Wifi className="h-4 w-4" />,
    },
    {
      id: 'HOTSPOT_OPTION_B',
      title: '3. Host Hotspot (Option B)',
      desc: 'Host creates closed Wi-Fi hotspot with Internet Sharing OFF.',
      icon: <Radio className="h-4 w-4" />,
    },
  ];

  return (
    <Card className="border-gray-200 bg-gray-100">
      <CardHeader className="py-2.5 px-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-semibold text-gray-900">
            Deployment Mode &amp; Access Topology
          </CardTitle>
          <Badge variant="active" className="font-mono text-[10px]">
            Target Binding: 0.0.0.0:{port}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {modes.map((m) => {
            const isSelected = deploymentMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setDeploymentMode(m.id)}
                /* WCAG Priority 1: High-visibility focus ring + 44px min touch height + :active scale */
                className={`p-3.5 rounded-md border text-left transition-all flex flex-col justify-between min-h-[96px] focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.98] ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50 text-gray-900 shadow-sm'
                    : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className={isSelected ? 'text-blue-600' : 'text-gray-400'}>
                    {m.icon}
                  </span>
                  <span className="text-xs font-semibold text-gray-900">{m.title}</span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1 leading-snug">
                  {m.desc}
                </p>
                <div className="mt-2 pt-2 border-t border-gray-200/60 font-mono text-[10px] text-gray-400">
                  Active URL: <span className="text-gray-900">http://{isSelected ? hostIp : '...'}:{port}</span>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
