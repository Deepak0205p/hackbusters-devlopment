'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ModelStatusPanel } from '@/components/Models/ModelStatusPanel';
import { ChatWorkspace } from '@/components/Chat/ChatWorkspace';
import { OCRHub } from '@/components/Upload/OCRHub';
import { SovereigntyDashboard } from '@/components/Sovereignty/SovereigntyDashboard';
import { DeliverablePanel } from '@/components/Deliverables/DeliverablePanel';
import { ConnectPanel } from '@/components/Connect/ConnectPanel';
import { socketManager } from '@/lib/socket';
import { useModelStore } from '@/store/useModelStore';
import { useSovereigntyStore } from '@/store/useSovereigntyStore';
import { Cpu, MessageSquare, UploadCloud, Shield, FileText, QrCode } from 'lucide-react';

export default function WorkbenchPage() {
  const [activeTab, setActiveTab] = useState('models');
  const fetchModels = useModelStore((s) => s.fetchModels);
  const fetchVRAM = useModelStore((s) => s.fetchVRAM);
  const fetchNetworkStatus = useSovereigntyStore((s) => s.fetchNetworkStatus);

  useEffect(() => {
    // 1. Start continuous 1000ms WebSocket Sovereignty & VRAM Stream
    socketManager.connectAuditStream();

    // 2. Initial state synchronization with live backend
    fetchModels();
    fetchVRAM();
    fetchNetworkStatus();
  }, [fetchModels, fetchVRAM, fetchNetworkStatus]);

  return (
    <div className="flex flex-col min-h-screen bg-[#000000]">
      {/* Top Header */}
      <Header />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6 space-y-6">
        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start h-9 p-1 bg-[#0a0a0a] border border-[#262626]">
            <TabsTrigger value="models" className="flex items-center space-x-1.5 px-3">
              <Cpu className="h-3.5 w-3.5" />
              <span>1. Models & VRAM</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center space-x-1.5 px-3">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>2. Chat & Agent</span>
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center space-x-1.5 px-3">
              <UploadCloud className="h-3.5 w-3.5" />
              <span>3. File Ingestion</span>
            </TabsTrigger>
            <TabsTrigger value="sovereignty" className="flex items-center space-x-1.5 px-3">
              <Shield className="h-3.5 w-3.5" />
              <span>4. Sovereignty</span>
            </TabsTrigger>
            <TabsTrigger value="deliverables" className="flex items-center space-x-1.5 px-3">
              <FileText className="h-3.5 w-3.5" />
              <span>5. Deliverables</span>
            </TabsTrigger>
            <TabsTrigger value="connect" className="flex items-center space-x-1.5 px-3">
              <QrCode className="h-3.5 w-3.5" />
              <span>6. Remote Access</span>
            </TabsTrigger>
          </TabsList>

          {/* Screen 1: Model Status Panel */}
          <TabsContent value="models">
            <ModelStatusPanel />
          </TabsContent>

          {/* Screen 2: Chat & Agent Workspace */}
          <TabsContent value="chat">
            <ChatWorkspace />
          </TabsContent>

          {/* Screen 3: File Ingestion & OCR Hub */}
          <TabsContent value="upload">
            <OCRHub />
          </TabsContent>

          {/* Screen 4: Sovereignty Audit Dashboard */}
          <TabsContent value="sovereignty">
            <SovereigntyDashboard />
          </TabsContent>

          {/* Screen 5: Generated Deliverables Panel */}
          <TabsContent value="deliverables">
            <DeliverablePanel />
          </TabsContent>

          {/* Screen 6: Connect From Another Device Panel */}
          <TabsContent value="connect">
            <ConnectPanel />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
