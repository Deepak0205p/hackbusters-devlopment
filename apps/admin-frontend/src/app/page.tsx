'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { OverviewDeck } from '@/components/OverviewDeck';
import { ModelStatusPanel } from '@/components/Models/ModelStatusPanel';
import { RouterObservatory } from '@/components/RouterObservatory';
import { SandboxObservatory } from '@/components/SandboxObservatory';
import { RagObservatory } from '@/components/RagObservatory';
import { ChatWorkspace } from '@/components/Chat/ChatWorkspace';
import { OCRHub } from '@/components/Upload/OCRHub';
import { SovereigntyDashboard } from '@/components/Sovereignty/SovereigntyDashboard';
import { DeliverablePanel } from '@/components/Deliverables/DeliverablePanel';
import { ConnectPanel } from '@/components/Connect/ConnectPanel';
import { socketManager } from '@/lib/socket';
import { useModelStore } from '@/store/useModelStore';
import { useSovereigntyStore } from '@/store/useSovereigntyStore';
import { 
  LayoutDashboard, 
  Cpu, 
  GitFork, 
  Box, 
  Database, 
  UploadCloud, 
  Shield, 
  FileText, 
  QrCode,
  MessageSquare
} from 'lucide-react';

export default function WorkbenchPage() {
  const [activeTab, setActiveTab] = useState('overview');
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
    <div className="flex flex-col min-h-screen bg-[#030712] text-slate-100 font-sans">
      {/* Top Header */}
      <Header />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6 space-y-6">
        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start h-10 p-1 bg-[#090d16] border border-[#1e293b] rounded-xl overflow-x-auto gap-1">
            <TabsTrigger value="overview" className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg data-[state=active]:bg-cyan-950 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-800 transition-all">
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>Overview</span>
            </TabsTrigger>

            <TabsTrigger value="models" className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg data-[state=active]:bg-cyan-950 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-800 transition-all">
              <Cpu className="h-3.5 w-3.5" />
              <span>Models & VRAM</span>
            </TabsTrigger>

            <TabsTrigger value="router" className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg data-[state=active]:bg-cyan-950 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-800 transition-all">
              <GitFork className="h-3.5 w-3.5" />
              <span>Query Router</span>
            </TabsTrigger>

            <TabsTrigger value="sandbox" className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg data-[state=active]:bg-amber-950 data-[state=active]:text-amber-400 data-[state=active]:border data-[state=active]:border-amber-800 transition-all">
              <Box className="h-3.5 w-3.5" />
              <span>Docker Sandbox</span>
            </TabsTrigger>

            <TabsTrigger value="rag" className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg data-[state=active]:bg-violet-950 data-[state=active]:text-violet-400 data-[state=active]:border data-[state=active]:border-violet-800 transition-all">
              <Database className="h-3.5 w-3.5" />
              <span>RAG Knowledge</span>
            </TabsTrigger>

            <TabsTrigger value="upload" className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg data-[state=active]:bg-violet-950 data-[state=active]:text-violet-400 data-[state=active]:border data-[state=active]:border-violet-800 transition-all">
              <UploadCloud className="h-3.5 w-3.5" />
              <span>OCR Hub</span>
            </TabsTrigger>

            <TabsTrigger value="sovereignty" className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg data-[state=active]:bg-emerald-950 data-[state=active]:text-emerald-400 data-[state=active]:border data-[state=active]:border-emerald-800 transition-all">
              <Shield className="h-3.5 w-3.5" />
              <span>Air-Gap Sovereignty</span>
            </TabsTrigger>

            <TabsTrigger value="deliverables" className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg data-[state=active]:bg-emerald-950 data-[state=active]:text-emerald-400 data-[state=active]:border data-[state=active]:border-emerald-800 transition-all">
              <FileText className="h-3.5 w-3.5" />
              <span>Deliverables</span>
            </TabsTrigger>

            <TabsTrigger value="chat" className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg data-[state=active]:bg-slate-800 data-[state=active]:text-slate-200 transition-all">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Agent Console</span>
            </TabsTrigger>

            <TabsTrigger value="connect" className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg data-[state=active]:bg-slate-800 data-[state=active]:text-slate-200 transition-all">
              <QrCode className="h-3.5 w-3.5" />
              <span>Remote Access</span>
            </TabsTrigger>
          </TabsList>

          {/* Screen 0: Executive Command Deck Overview */}
          <TabsContent value="overview" className="mt-6">
            <OverviewDeck onNavigate={(tab) => setActiveTab(tab)} />
          </TabsContent>

          {/* Screen 1: Model Status Panel */}
          <TabsContent value="models" className="mt-6">
            <ModelStatusPanel />
          </TabsContent>

          {/* Screen 2: Query Router Observatory */}
          <TabsContent value="router" className="mt-6">
            <RouterObservatory />
          </TabsContent>

          {/* Screen 3: Docker Sandbox Observatory */}
          <TabsContent value="sandbox" className="mt-6">
            <SandboxObservatory />
          </TabsContent>

          {/* Screen 4: RAG Vector Knowledge Observatory */}
          <TabsContent value="rag" className="mt-6">
            <RagObservatory />
          </TabsContent>

          {/* Screen 5: File Ingestion & OCR Hub */}
          <TabsContent value="upload" className="mt-6">
            <OCRHub />
          </TabsContent>

          {/* Screen 6: Sovereignty Audit Dashboard */}
          <TabsContent value="sovereignty" className="mt-6">
            <SovereigntyDashboard />
          </TabsContent>

          {/* Screen 7: Generated Deliverables Panel */}
          <TabsContent value="deliverables" className="mt-6">
            <DeliverablePanel />
          </TabsContent>

          {/* Screen 8: Chat & Agent Workspace */}
          <TabsContent value="chat" className="mt-6">
            <ChatWorkspace />
          </TabsContent>

          {/* Screen 9: Connect From Another Device Panel */}
          <TabsContent value="connect" className="mt-6">
            <ConnectPanel />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
