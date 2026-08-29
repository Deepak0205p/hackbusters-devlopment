'use client';

import React from 'react';
import { Header } from '@/components/Header';
import { ModelStatusPanel } from '@/components/Models/ModelStatusPanel';

import { useModelStore } from '@/store/useModelStore';

export default function ModelsPage() {
  const fetchModels = useModelStore((s) => s.fetchModels);
  const fetchVRAM = useModelStore((s) => s.fetchVRAM);

  React.useEffect(() => {
    fetchModels();
    fetchVRAM();
  }, [fetchModels, fetchVRAM]);

  return (
    <div className="flex flex-col min-h-screen bg-[#000000] text-[#ededed] font-sans">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6 space-y-6">
        <ModelStatusPanel />
      </main>
    </div>
  );
}
