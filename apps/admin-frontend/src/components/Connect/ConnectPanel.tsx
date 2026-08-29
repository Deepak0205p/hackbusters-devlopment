'use client';

import React from 'react';
import { useSovereigntyStore } from '@/store/useSovereigntyStore';
import { QRCodeDisplay } from './QRCodeDisplay';
import { HotspotCredentialCard } from './HotspotCredentialCard';
import { ConnectedClientsCard } from './ConnectedClientsCard';
import { DeploymentModeSwitcher } from '@/components/Sovereignty/DeploymentModeSwitcher';

export function ConnectPanel() {
  const { deploymentMode, hostIp, port } = useSovereigntyStore();
  const connectUrl = `http://${hostIp}:${port}`;

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Mode Topology Switcher (Synced with Screen 4) */}
      <DeploymentModeSwitcher />

      {/* Main Grid: QR Code (Left) + Connection Info (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column: Offline QR Code & Direct URL */}
        <QRCodeDisplay connectUrl={connectUrl} deploymentMode={deploymentMode} />

        {/* Right Column: Hotspot Details & Active Remote Clients */}
        <div className="space-y-4 flex flex-col justify-between">
          <HotspotCredentialCard deploymentMode={deploymentMode} />
          <ConnectedClientsCard />
        </div>
      </div>
    </div>
  );
}
