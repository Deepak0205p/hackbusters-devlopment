'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { OverviewDeck } from '@/components/OverviewDeck';
import { socketManager } from '@/lib/socket';
import { useModelStore } from '@/store/useModelStore';
import { useSovereigntyStore } from '@/store/useSovereigntyStore';
import { useRouter } from 'next/navigation';
import { 
  Cpu, 
  GitFork, 
  Box, 
  Database, 
  UploadCloud, 
  Shield, 
  FileText, 
  MessageSquare, 
  QrCode,
  ArrowRight
} from 'lucide-react';

const subsystemTiles = [
  {
    title: '1. Models & VRAM Memory',
    href: '/models',
    icon: Cpu,
    description: 'Dynamic dual-slot LRU VRAM memory manager, active GGUF models, and swap logs.'
  },
  {
    title: '2. Two-Stage Query Router',
    href: '/router',
    icon: GitFork,
    description: 'Interactive route tester (<2ms Regex vs <25ms BGE-small semantic fallback).'
  },
  {
    title: '3. Docker Code Sandbox',
    href: '/sandbox',
    icon: Box,
    description: 'Isolated python:3.11 container runner with --network none and AST security filter.'
  },
  {
    title: '4. RAG Knowledge & Converter',
    href: '/rag',
    icon: Database,
    description: 'Upload SOP/MOP to build ChromaDB embeddings + universal document format converter.'
  },
  {
    title: '5. Multimodal OCR Hub',
    href: '/ocr',
    icon: UploadCloud,
    description: 'Offline PaddleOCR & Tesseract pipeline with ISA 5.1 P&ID tag extraction.'
  },
  {
    title: '6. Air-Gap Sovereignty Watchdog',
    href: '/sovereignty',
    icon: Shield,
    description: 'psutil real-time socket inspection & SHA-256 tamper-evident blockchain ledger.'
  },
  {
    title: '7. Enterprise Deliverables',
    href: '/deliverables',
    icon: FileText,
    description: 'Programmatic synthesis of Word (.docx), Excel (.xlsx), and PowerPoint (.pptx).'
  },
  {
    title: '8. Remote Access & QR Pairing',
    href: '/connect',
    icon: QrCode,
    description: 'Pair evaluator devices over closed host Wi-Fi hotspot without internet gateway.'
  },
];

export default function WorkbenchHomePage() {
  const router = useRouter();
  const fetchModels = useModelStore((s) => s.fetchModels);
  const fetchVRAM = useModelStore((s) => s.fetchVRAM);
  const fetchNetworkStatus = useSovereigntyStore((s) => s.fetchNetworkStatus);

  useEffect(() => {
    socketManager.connectAuditStream();
    fetchModels();
    fetchVRAM();
    fetchNetworkStatus();
  }, [fetchModels, fetchVRAM, fetchNetworkStatus]);

  return (
    <div className="flex flex-col min-h-screen bg-[#000000] text-[#ededed] font-sans">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6 space-y-6">
        {/* Executive Overview Deck */}
        <OverviewDeck onNavigate={(tab) => {
          const mapping: Record<string, string> = {
            models: '/models',
            router: '/router',
            sandbox: '/sandbox',
            rag: '/rag',
            upload: '/ocr',
            sovereignty: '/sovereignty',
            deliverables: '/deliverables',
            chat: '/chat',
            connect: '/connect'
          };
          router.push(mapping[tab] || '/');
        }} />

        {/* Subsystem Navigation Grid */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#888888]">
              Subsystem Observatories & Modules
            </h2>
            <span className="text-[11px] text-[#666666] font-mono">
              Select module to open dedicated workspace
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {subsystemTiles.map((tile) => {
              const Icon = tile.icon;
              return (
                <Link
                  key={tile.href}
                  href={tile.href}
                  className="rounded-md bg-[#0a0a0a] border border-[#262626] p-4 hover:border-[#444444] hover:bg-[#111111] transition-all group flex flex-col justify-between space-y-3 cursor-pointer"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-[#888888] group-hover:text-[#ededed] transition-colors" />
                        <h3 className="text-xs font-medium text-[#ededed] group-hover:text-white transition-colors">
                          {tile.title}
                        </h3>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-[#555555] group-hover:text-[#ededed] group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <p className="text-[11px] text-[#888888] leading-relaxed">
                      {tile.description}
                    </p>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-[10px] font-mono border-t border-[#1f1f1f]">
                    <span className="text-[#666666]">Path: {tile.href}</span>
                    <span className="px-2 py-0.5 rounded bg-[#171717] border border-[#333333] text-[#ededed]">
                      LAUNCH
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
