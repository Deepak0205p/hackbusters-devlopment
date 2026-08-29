'use client';

import React from 'react';
import { Header } from '@/components/Header';
import { SovereigntyDashboard } from '@/components/Sovereignty/SovereigntyDashboard';
import { useSovereigntyStore } from '@/store/useSovereigntyStore';

export default function SovereigntyPage() {
  const fetchNetworkStatus = useSovereigntyStore((s) => s.fetchNetworkStatus);

  React.useEffect(() => {
    fetchNetworkStatus();
  }, [fetchNetworkStatus]);

  return (
    <div className="flex flex-col min-h-screen bg-[#000000] text-[#ededed] font-sans">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6 space-y-6">
        <SovereigntyDashboard />
      </main>
    </div>
  );
}
