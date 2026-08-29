'use client';

import React from 'react';
import { Header } from '@/components/Header';
import { RouterObservatory } from '@/components/RouterObservatory';

export default function RouterPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#000000] text-[#ededed] font-sans">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6 space-y-6">
        <RouterObservatory />
      </main>
    </div>
  );
}
