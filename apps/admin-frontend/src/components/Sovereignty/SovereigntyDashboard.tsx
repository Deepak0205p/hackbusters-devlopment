'use client';

import React from 'react';
import { SovereigntyBanner } from './SovereigntyBanner';
import { DeploymentModeSwitcher } from './DeploymentModeSwitcher';
import { CertificateManagerCard } from './CertificateManagerCard';
import { ActiveSocketTable } from './ActiveSocketTable';
import { TamperEvidentLogViewer } from './TamperEvidentLogViewer';

export function SovereigntyDashboard() {
  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* 3-Tier Traffic Breakdown Summary */}
      <SovereigntyBanner />

      {/* Mode Topology Switcher */}
      <DeploymentModeSwitcher />

      {/* Plant PKI & Live CRL Revocation Management */}
      <CertificateManagerCard />

      {/* Active Sockets Live Sniffer Table */}
      <ActiveSocketTable />

      {/* SHA-256 Chained Immutable Audit Log */}
      <TamperEvidentLogViewer />
    </div>
  );
}
