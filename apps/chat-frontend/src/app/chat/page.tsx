'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useChatStore } from '@/store/useChatStore';
import { socketManager } from '@/lib/socket';
import {
  Plus,
  User,
  ArrowUp,
  Square,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  Mic,
  ArrowLeft,
  Search,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDeliverableStore } from '@/store/useDeliverableStore';
import { ArtifactsModal, getFileIcon, getBadgeColor } from '@/components/ArtifactsModal';
import { useCanvasStore } from '@/store/useCanvasStore';
import { DocumentCanvasPanel } from '@/components/canvas/DocumentCanvasPanel';
import { AppSidebar, GeminiSparkleIcon, SidebarTooltip } from '@/components/sidebar/AppSidebar';

// Ultra-Modern Fluent / Glowing Brand 3D-Style Icon Components
function ExcelIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" fill="none" className={className}>
      <defs>
        <linearGradient id="exBack" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#107C41" />
          <stop offset="100%" stopColor="#0B552C" />
        </linearGradient>
        <linearGradient id="exFront" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22C55E" />
          <stop offset="100%" stopColor="#15803D" />
        </linearGradient>
        <filter id="exGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#22C55E" floodOpacity="0.35" />
        </filter>
      </defs>
      <rect x="4" y="6" width="28" height="24" rx="5" fill="url(#exBack)" />
      <path d="M16 6h11a5 5 0 0 1 5 5v14a5 5 0 0 1-5 5H16V6z" fill="#0B552C" fillOpacity="0.4" />
      <g filter="url(#exGlow)">
        <rect x="2" y="10" width="16" height="16" rx="4" fill="url(#exFront)" />
        <path d="M7 14.5l2.6 3.5L7 21.5h2l1.6-2.4 1.6 2.4h2l-2.6-3.5 2.6-3.5h-2l-1.6 2.4-1.6-2.4H7z" fill="#FFFFFF" />
      </g>
    </svg>
  );
}

function PowerPointIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" fill="none" className={className}>
      <defs>
        <linearGradient id="pptBack" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D83B01" />
          <stop offset="100%" stopColor="#A82B00" />
        </linearGradient>
        <linearGradient id="pptFront" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FB923C" />
          <stop offset="100%" stopColor="#EA580C" />
        </linearGradient>
        <filter id="pptGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#EA580C" floodOpacity="0.35" />
        </filter>
      </defs>
      <rect x="4" y="6" width="28" height="24" rx="5" fill="url(#pptBack)" />
      <path d="M16 6h11a5 5 0 0 1 5 5v14a5 5 0 0 1-5 5H16V6z" fill="#7A1D00" fillOpacity="0.4" />
      <g filter="url(#pptGlow)">
        <rect x="2" y="10" width="16" height="16" rx="4" fill="url(#pptFront)" />
        <path d="M7 14h3.8a2.5 2.5 0 0 1 0 5H8.7v2.5H7V14zm1.7 3.5h2a1 1 0 0 0 0-2H8.7v2z" fill="#FFFFFF" />
      </g>
    </svg>
  );
}

function WordDocsIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" fill="none" className={className}>
      <defs>
        <linearGradient id="docBack" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#005A9E" />
          <stop offset="100%" stopColor="#003966" />
        </linearGradient>
        <linearGradient id="docFront" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2B88D8" />
          <stop offset="100%" stopColor="#106EBE" />
        </linearGradient>
        <filter id="docGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#2B88D8" floodOpacity="0.35" />
        </filter>
      </defs>
      <rect x="4" y="6" width="28" height="24" rx="5" fill="url(#docBack)" />
      <path d="M16 6h11a5 5 0 0 1 5 5v14a5 5 0 0 1-5 5H16V6z" fill="#003966" fillOpacity="0.4" />
      <g filter="url(#docGlow)">
        <rect x="2" y="10" width="16" height="16" rx="4" fill="url(#docFront)" />
        <path d="M7 14.5l2 7h1.6l1.4-5 1.4 5H15l2-7h-1.6l-1.2 4.8L12.8 14.5h-1.6l-1.4 4.8L8.6 14.5H7z" fill="#FFFFFF" />
      </g>
    </svg>
  );
}

function VSCodeIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" fill="none" className={className}>
      <defs>
        <linearGradient id="vsBlue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#007ACC" />
          <stop offset="100%" stopColor="#1F8AD2" />
        </linearGradient>
        <filter id="vsGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#007ACC" floodOpacity="0.4" />
        </filter>
      </defs>
      <rect x="4" y="4" width="28" height="28" rx="7" fill="#181818" stroke="#2D2D2D" strokeWidth="1.5" />
      <g filter="url(#vsGlow)">
        <path d="M25.5 8.5l-6.8 6.3-4.2-3.8-2.5 1.5 4.8 4.5-4.8 4.5 2.5 1.5 4.2-3.8 6.8 6.3V8.5zm-3.5 14.3l-4.5-3.8 4.5-3.8v7.6z" fill="url(#vsBlue)" />
      </g>
    </svg>
  );
}

function VisionCamIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" fill="none" className={className}>
      <defs>
        <linearGradient id="camGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
        <filter id="camGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#10B981" floodOpacity="0.35" />
        </filter>
      </defs>
      <rect x="4" y="4" width="28" height="28" rx="7" fill="#111827" stroke="#1F2937" strokeWidth="1.5" />
      <g filter="url(#camGlow)">
        <path d="M12 11h3l1.5-2h7l1.5 2h3a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2V13a2 2 0 0 1 2-2z" fill="url(#camGrad)" />
        <circle cx="20" cy="19" r="4.5" fill="#FFFFFF" fillOpacity="0.9" />
        <circle cx="20" cy="19" r="2.5" fill="#065F46" />
      </g>
    </svg>
  );
}

function OCRIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" fill="none" className={className}>
      <defs>
        <linearGradient id="ocrGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#6D28D9" />
        </linearGradient>
        <filter id="ocrGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#8B5CF6" floodOpacity="0.35" />
        </filter>
      </defs>
      <rect x="4" y="4" width="28" height="28" rx="7" fill="#1E1B4B" stroke="#312E81" strokeWidth="1.5" />
      <g filter="url(#ocrGlow)">
        <path d="M10 13V10h3m10 0h3v3m0 10v3h-3m-10 0h-3v-3" stroke="url(#ocrGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 18h8M18 14v8" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function MasterHubIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" fill="none" className={className}>
      <defs>
        <linearGradient id="hubGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="50%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#F472B6" />
        </linearGradient>
        <filter id="hubGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#A78BFA" floodOpacity="0.4" />
        </filter>
      </defs>
      <rect x="4" y="4" width="28" height="28" rx="7" fill="#0F172A" stroke="#1E293B" strokeWidth="1.5" />
      <g filter="url(#hubGlow)">
        <circle cx="18" cy="18" r="5" fill="url(#hubGrad)" />
        <circle cx="18" cy="10" r="2.5" fill="#60A5FA" />
        <circle cx="26" cy="18" r="2.5" fill="#A78BFA" />
        <circle cx="18" cy="26" r="2.5" fill="#F472B6" />
        <circle cx="10" cy="18" r="2.5" fill="#38BDF8" />
        <path d="M18 13v2m5 3h-2m-3 5v-2m-5-3h2" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
      </g>
    </svg>
  );
}

// Fluid Animated Atmospheric Aurora Glow Background
function FluidAuroraGlow() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute -top-[25%] left-[20%] w-[650px] h-[650px] rounded-full bg-gradient-to-br from-blue-600/10 via-indigo-600/8 to-transparent blur-[140px] animate-pulse" style={{ animationDuration: '9s' }} />
      <div className="absolute top-[20%] -right-[15%] w-[550px] h-[550px] rounded-full bg-gradient-to-bl from-purple-600/10 via-pink-600/8 to-transparent blur-[130px] animate-pulse" style={{ animationDuration: '12s' }} />
      <div className="absolute -bottom-[20%] left-[30%] w-[600px] h-[600px] rounded-full bg-gradient-to-t from-emerald-600/8 via-cyan-600/6 to-transparent blur-[150px] animate-pulse" style={{ animationDuration: '15s' }} />
    </div>
  );
}

// Collapsible Reasoning / Thinking Accordion
function ChatThinkingAccordion({ steps }: { steps: (any)[] }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!steps || steps.length === 0) return null;

  return (
    <div className="my-2 rounded-xl bg-[#141416] border border-[#252528] overflow-hidden text-xs transition-all">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2 hover:bg-[#1a1a1e] text-[#a8c7fa] transition-colors font-mono text-[11px]"
      >
        <div className="flex items-center space-x-2">
          <div className="h-2 w-2 rounded-full bg-[#a8c7fa] animate-pulse" />
          <span>Thought Process ({steps.length} steps)</span>
        </div>
        {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      {isOpen && (
        <div className="p-3 bg-[#0d0d0f] border-t border-[#1e1e22] space-y-1.5 font-mono text-[11px] text-[#9aa0a6] max-h-48 overflow-y-auto">
          {steps.map((step, idx) => {
            const isObj = typeof step === 'object' && step !== null;
            const content = isObj ? step.content || JSON.stringify(step) : String(step);
            const type = isObj ? step.type : undefined;
            return (
              <div key={idx} className="flex items-start space-x-2">
                <span className="text-[#a8c7fa] shrink-0 font-bold">{idx + 1}.</span>
                <span className="leading-relaxed">
                  {type && <strong className="uppercase text-[#8e918f] mr-1.5">{type}:</strong>}
                  {content}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ChatPage() {
  const {
    sessions,
    activeSessionId,
    selectSession,
    createNewChat,
    addMessage,
    isStreaming,
    activeTraceSteps,
    setStreaming
  } = useChatStore();

  const [currentInput, setCurrentInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRecording, setIsRecording] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const messages = activeSession ? activeSession.messages : [];
  const hasMessages = messages.length > 0;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleSend = () => {
    if (!currentInput.trim()) return;
    const text = currentInput;
    setCurrentInput('');

    addMessage({
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    socketManager.sendChatTask(text, []);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (id: string, text: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  const handleStop = () => {
    setStreaming(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const host = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
    const port = typeof window !== 'undefined' ? window.location.port : '8000';
    const apiBase = (port === '8000' || port === '3000' || port === '') ? '' : `http://${host}:8000`;
    const formData = new FormData();
    formData.append('file', file);

    addMessage({
      id: `usr-${Date.now()}`,
      role: 'user',
      content: `Uploaded attachment: ${file.name} (${(file.size / 1024).toFixed(1)} KB). Please analyze this document.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    try {
      const res = await fetch(`${apiBase}/api/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      socketManager.sendChatTask(`Analyze uploaded document ${file.name}: ${JSON.stringify(data.findings || [])}`, []);
    } catch {
      socketManager.sendChatTask(`Analyze inspection report ${file.name}`, []);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showArtifactsModal, setShowArtifactsModal] = useState(false);
  const [activeModelRole, setActiveModelRole] = useState<'orchestrator' | 'code' | 'vision' | 'docs' | 'excel' | 'ppt' | 'ocr'>('orchestrator');
  const [showModelBoard, setShowModelBoard] = useState(false);

  const { deliverables, selectDeliverable, downloadDeliverable } = useDeliverableStore();
  const { openCanvas } = useCanvasStore();

  const MODEL_ROLES = [
    { id: 'orchestrator', label: 'Orchestrator', icon: <MasterHubIcon className="h-6 w-6" />, color: 'text-[#a8c7fa]', glow: 'shadow-blue-500/20', border: 'border-blue-400/60' },
    { id: 'code', label: 'Code', icon: <VSCodeIcon className="h-6 w-6" />, color: 'text-blue-400', glow: 'shadow-blue-500/20', border: 'border-blue-400/60' },
    { id: 'vision', label: 'Vision', icon: <VisionCamIcon className="h-6 w-6" />, color: 'text-emerald-400', glow: 'shadow-emerald-500/20', border: 'border-emerald-400/60' },
    { id: 'docs', label: 'Docs', icon: <WordDocsIcon className="h-6 w-6" />, color: 'text-blue-500', glow: 'shadow-blue-600/20', border: 'border-blue-500/60' },
    { id: 'excel', label: 'Excel', icon: <ExcelIcon className="h-6 w-6" />, color: 'text-emerald-500', glow: 'shadow-emerald-600/20', border: 'border-emerald-500/60' },
    { id: 'ppt', label: 'PowerPoint', icon: <PowerPointIcon className="h-6 w-6" />, color: 'text-orange-500', glow: 'shadow-orange-600/20', border: 'border-orange-500/60' },
    { id: 'ocr', label: 'OCR', icon: <OCRIcon className="h-6 w-6" />, color: 'text-purple-400', glow: 'shadow-purple-500/20', border: 'border-purple-400/60' },
  ];

  const filteredSessions = searchQuery.trim()
    ? sessions.filter(s => s.title?.toLowerCase().includes(searchQuery.toLowerCase()) || s.messages.some(m => m.content.toLowerCase().includes(searchQuery.toLowerCase())))
    : sessions;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#000000] text-[#e3e3e3] font-sans antialiased selection:bg-[#4285f4]/30 selection:text-white">
      {/* 1. Shared Modular Responsive Sidebar */}
      <AppSidebar
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        onOpenSearchModal={() => setShowSearchModal(true)}
        activePage="chat"
      />

      {/* 2. Main Window: Conversational Chat Interface */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Dynamic Fluid Animated Aurora Glow */}
        <FluidAuroraGlow />

        {/* Mobile Top Navigation Header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#080808]/90 border-b border-[#1a1a1a] backdrop-blur-xl z-30 shrink-0">
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleSidebar}
              aria-label="Open sidebar"
              className="h-11 w-11 -ml-2 rounded-full hover:bg-[#1e1f20] active:bg-[#282a2c] flex items-center justify-center text-[#c4c7c5] hover:text-white transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <line x1="4" x2="20" y1="12" y2="12" />
                <line x1="4" x2="20" y1="6" y2="6" />
                <line x1="4" x2="20" y1="18" y2="18" />
              </svg>
            </button>
            <div className="flex items-center space-x-2">
              <GeminiSparkleIcon className="h-5 w-5" animated={true} />
              <span className="text-sm font-semibold tracking-tight text-[#e3e3e3]">
                MRPL Sovereign AI
              </span>
            </div>
          </div>

          <button
            onClick={createNewChat}
            aria-label="New chat"
            className="h-11 w-11 rounded-full bg-[#1e1f20] hover:bg-[#282a2c] active:scale-95 border border-[#3c4043]/40 flex items-center justify-center text-[#e3e3e3] hover:text-[#a8c7fa] transition-all shadow-sm"
          >
            <Plus className="h-4 w-4" />
          </button>
        </header>

        {/* Conversational Scroll Area */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-6 pt-2 pb-6 flex flex-col z-10">
          {hasMessages ? (
            <div className="max-w-3xl w-full mx-auto space-y-5 sm:space-y-6 py-3 sm:py-4">
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
                    className={`w-full flex gap-2.5 sm:gap-4 ${
                      isUser ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {!isUser && (
                      <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-[#1e1f20] border border-[#a8c7fa]/30 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                        <GeminiSparkleIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" animated={false} />
                      </div>
                    )}

                    <div className={`flex flex-col space-y-1.5 max-w-[88%] sm:max-w-3xl ${
                      isUser ? 'items-end' : 'items-start flex-1 min-w-0'
                    }`}>
                      <div className="flex items-center space-x-2 text-[10px] sm:text-[11px] text-[#8e918f]">
                        <span className="font-medium text-[#c4c7c5]">{isUser ? 'You' : (msg.model_id ? `${msg.model_id}` : 'MRPL Sovereign AI')}</span>
                        <span>&bull;</span>
                        <span>{msg.timestamp}</span>
                      </div>

                      {/* Reasoning/Thinking Accordion */}
                      {!isUser && msg.trace_steps && msg.trace_steps.length > 0 && (
                        <ChatThinkingAccordion steps={msg.trace_steps} />
                      )}

                      {/* Message Body Bubble */}
                      <div
                        className={`text-[14px] sm:text-[15px] leading-relaxed whitespace-pre-wrap select-text break-words overflow-hidden ${
                          isUser
                            ? 'px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-[#1e1f20] text-[#e3e3e3] border border-[#2e2f33] shadow-sm'
                            : 'text-[#e3e3e3] w-full font-sans'
                        }`}
                      >
                        {msg.content}
                      </div>

                      {/* Generated Deliverables Interactive Badges */}
                      {msg.deliverable_ids && msg.deliverable_ids.length > 0 && (
                        <div className="pt-2 flex flex-wrap gap-2 w-full">
                          {msg.deliverable_ids.map((deliv) => (
                            <div
                              key={deliv}
                              className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-[#121215] hover:bg-[#19191e] border border-[#2a2a32] text-xs text-[#e3e3e3] font-medium transition-all group shadow-sm w-full sm:w-auto"
                            >
                              <button
                                onClick={() => openCanvas(deliv)}
                                className="flex items-center space-x-2 text-left truncate flex-1 hover:text-[#a8c7fa] transition-colors"
                                title="Open & Edit Live in Interactive Workspace"
                              >
                                <Sparkles className="h-4 w-4 text-[#a8c7fa] shrink-0" />
                                <span className="truncate max-w-[200px]">{deliv}</span>
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#1c2230] text-[#a8c7fa] border border-[#2f3d5a]">
                                  Edit Live
                                </span>
                              </button>
                              <a
                                href={`/api/files/download/${deliv}`}
                                download
                                title="Download original file"
                                className="p-1 rounded hover:bg-[#282834] text-[#8e918f] hover:text-[#e3e3e3] transition-colors ml-1"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </a>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Action Bar (Copy Button) */}
                      {!isUser && msg.content && (
                        <div className="flex items-center space-x-1 pt-1 text-[#8e918f]">
                          <button
                            onClick={() => handleCopy(msg.id, msg.content)}
                            aria-label="Copy response"
                            className="h-9 w-9 -ml-1.5 rounded-full hover:bg-[#1e1f20] active:bg-[#282a2c] flex items-center justify-center hover:text-white transition-colors"
                          >
                            {copiedId === msg.id ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </div>
                      )}
                    </div>

                    {isUser && (
                      <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-[#282a2c] border border-[#3c4043] flex items-center justify-center shrink-0 text-[#e3e3e3] shadow-sm mt-0.5">
                        <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </div>
                    )}
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            /* Gemini Welcoming Centered Hero Section */
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4 max-w-2xl mx-auto my-auto py-12">
              <div className="relative mb-6">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-2xl opacity-60 animate-pulse pointer-events-none" />
                <div className="relative">
                  <GeminiSparkleIcon className="h-12 w-12 sm:h-14 sm:w-14 drop-shadow-[0_0_20px_rgba(168,199,250,0.35)]" animated={true} />
                </div>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight mb-3">
                <span className="bg-gradient-to-r from-[#4285f4] via-[#9b72cb] to-[#d96570] bg-clip-text text-transparent font-medium">
                  Hello, Operations Engineer
                </span>
              </h1>
              <p className="text-base sm:text-lg text-[#c4c7c5] max-w-lg mb-8 font-light">
                How can I assist with MRPL refinery operations today?
              </p>
            </div>
          )}
        </div>

        {/* Floating Gemini Prompt Input Capsule */}
        <div className="w-full px-3 sm:px-6 pb-4 sm:pb-5 max-w-3xl mx-auto shrink-0 z-20">
          <div className="relative rounded-[28px] bg-[#1e1f20] border border-[#3c4043]/70 focus-within:border-[#a8c7fa] focus-within:ring-2 focus-within:ring-[#a8c7fa]/20 transition-all duration-300 shadow-2xl backdrop-blur-xl">
            <textarea
              ref={textareaRef}
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Orchestrator or query refinery operating standards..."
              rows={1}
              className="w-full bg-transparent px-5 pt-3.5 pb-2 text-[14px] sm:text-[15px] placeholder-[#8e918f] text-[#e3e3e3] focus:outline-none resize-none font-sans leading-relaxed min-h-[46px] max-h-[220px]"
            />

            <div className="flex items-center justify-between px-3 sm:px-4 pb-2.5 pt-1">
              <div className="flex items-center space-x-1 sm:space-x-1.5 relative">
                <SidebarTooltip text="Attach Inspection Report or Document" position="top">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Upload file"
                    className="h-10 w-10 sm:h-9 sm:w-9 rounded-full hover:bg-[#282a2c] active:bg-[#333538] flex items-center justify-center text-[#c4c7c5] hover:text-white transition-all duration-150"
                  >
                    <Plus className="h-5 w-5 stroke-[2]" />
                  </button>
                </SidebarTooltip>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept=".pdf,.docx,.xlsx,.txt,.csv,.jpg,.jpeg,.png"
                />

                {/* Specialized Model Dispatch Trigger Pill */}
                <div className="relative">
                  <button
                    onClick={() => setShowModelBoard(!showModelBoard)}
                    className="flex items-center space-x-2 px-2.5 py-1.5 rounded-full bg-[#131314] hover:bg-[#242426] border border-[#2e2f33] text-xs transition-all duration-150"
                  >
                    <div className="h-4 w-4 shrink-0">
                      {MODEL_ROLES.find(r => r.id === activeModelRole)?.icon}
                    </div>
                    <span className="text-[11px] font-medium text-[#c4c7c5] hidden sm:inline">
                      {MODEL_ROLES.find(r => r.id === activeModelRole)?.label}
                    </span>
                    <ChevronDown className="h-3 w-3 text-[#8e918f]" />
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-1 sm:space-x-1.5">
                {/* Voice Input Trigger */}
                <SidebarTooltip text={isRecording ? "Listening..." : "Voice Query"} position="top">
                  <button
                    onClick={toggleRecording}
                    className={`h-10 w-10 sm:h-9 sm:w-9 rounded-full flex items-center justify-center transition-all ${
                      isRecording
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'hover:bg-[#282a2c] text-[#c4c7c5] hover:text-white'
                    }`}
                  >
                    <Mic className="h-4 w-4" />
                  </button>
                </SidebarTooltip>

                {/* Submit / Stop Button */}
                {isStreaming ? (
                  <button
                    onClick={handleStop}
                    className="h-10 sm:h-9 px-3.5 rounded-full bg-rose-500/20 hover:bg-rose-500/30 active:bg-rose-500/40 text-rose-300 text-xs font-medium flex items-center space-x-1.5 transition-all"
                  >
                    <Square className="h-3.5 w-3.5 fill-current" />
                    <span>Stop</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleSend()}
                    disabled={!currentInput.trim()}
                    aria-label="Send message"
                    className={`h-10 w-10 sm:h-9 sm:w-9 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm ${
                      currentInput.trim()
                        ? 'bg-white text-[#131314] hover:bg-[#e3e3e3] active:scale-95'
                        : 'bg-[#1a1a1c] text-[#8e918f] cursor-not-allowed opacity-60'
                    }`}
                  >
                    <ArrowUp className="h-[19px] w-[19px] sm:h-[18px] sm:w-[18px] stroke-[2.5]" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="text-center text-[9px] sm:text-[10px] text-[#8e918f] pt-1.5 sm:pt-2 font-sans px-2 leading-tight">
            MRPL Sovereign AI operates 100% on-premise without external network egress. Verify critical engineering directives.
          </div>
        </div>
      </main>

      {/* 3. Enterprise Artifacts & Deliverables Vault Modal Inspector */}
      <ArtifactsModal
        isOpen={showArtifactsModal}
        onClose={() => setShowArtifactsModal(false)}
      />

      {/* 4. Gemini / Claude-Style Interactive Document Canvas Side Panel */}
      <DocumentCanvasPanel />
    </div>
  );
}
