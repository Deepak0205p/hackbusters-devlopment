'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  MessageSquare,
  Sparkles,
  X,
  Plus,
  Trash2,
  FileText,
  FileSpreadsheet,
  Presentation,
  Code,
  ArrowRight,
  Calculator,
  ShieldCheck,
  CornerDownLeft,
  Command
} from 'lucide-react';
import { useChatStore } from '@/store/useChatStore';
import { useDeliverableStore } from '@/store/useDeliverableStore';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useRouter, usePathname } from 'next/navigation';

interface SearchChatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FilterTab = 'all' | 'chats' | 'artifacts' | 'actions';

export function SearchChatsModal({ isOpen, onClose }: SearchChatsModalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { sessions, activeSessionId, selectSession, createNewChat, deleteSession } = useChatStore();
  const { deliverables } = useDeliverableStore();
  const { openCanvas } = useCanvasStore();

  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveTab('all');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Global keydown handler (Escape to close, Cmd/Ctrl+K to toggle)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Static Quick Actions
  const QUICK_ACTIONS = useMemo(() => [
    {
      id: 'action-new-chat',
      title: 'Create New Conversation',
      category: 'actions',
      desc: 'Start a fresh sovereign reasoning thread',
      icon: <Plus className="h-4 w-4 text-blue-600 dark:text-[#a8c7fa]" />,
      action: async () => {
        const newId = await createNewChat();
        router.push(`/chat/${newId}`);
        onClose();
      }
    },
    {
      id: 'action-artifacts',
      title: 'Open Artifacts & Deliverables Vault',
      category: 'actions',
      desc: 'Browse Word, Excel, PPTX, and Python outputs',
      icon: <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
      action: () => {
        router.push('/artifacts');
        onClose();
      }
    },
    {
      id: 'action-pump-calc',
      title: 'Run Pump Hydraulic Efficiency Sandbox',
      category: 'actions',
      desc: 'Execute ISO/API pump power equation in Python',
      icon: <Calculator className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
      action: () => {
        const pyItem = deliverables.find(d => d.type === 'py') || deliverables[0];
        if (pyItem) openCanvas(pyItem);
        onClose();
      }
    },
    {
      id: 'action-sop-audit',
      title: 'Audit CDU-1 Furnace F-101 SOP Limits',
      category: 'actions',
      desc: 'Verify tube skin temperature thresholds against SOP-MRPL-FURNACE-01',
      icon: <ShieldCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />,
      action: () => {
        const docItem = deliverables.find(d => d.type === 'docx') || deliverables[0];
        if (docItem) openCanvas(docItem);
        onClose();
      }
    }
  ], [createNewChat, deliverables, onClose, openCanvas, pathname, router]);

  // Filtered Results
  const filteredSessions = useMemo(() => {
    if (activeTab === 'artifacts' || activeTab === 'actions') return [];
    if (!query.trim()) return sessions;
    const q = query.toLowerCase();
    return sessions.filter((s) => {
      const matchesTitle = s.title?.toLowerCase().includes(q);
      const matchesMessages = s.messages.some((m) => m.content.toLowerCase().includes(q));
      return matchesTitle || matchesMessages;
    });
  }, [activeTab, query, sessions]);

  const filteredDeliverables = useMemo(() => {
    if (activeTab === 'chats' || activeTab === 'actions') return [];
    if (!query.trim()) return deliverables.slice(0, 4);
    const q = query.toLowerCase();
    return deliverables.filter((d) => {
      return (
        d.filename.toLowerCase().includes(q) ||
        d.summary.toLowerCase().includes(q) ||
        d.type.toLowerCase().includes(q)
      );
    });
  }, [activeTab, query, deliverables]);

  const filteredActions = useMemo(() => {
    if (activeTab === 'chats' || activeTab === 'artifacts') return [];
    if (!query.trim()) return QUICK_ACTIONS;
    const q = query.toLowerCase();
    return QUICK_ACTIONS.filter((a) => {
      return a.title.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q);
    });
  }, [activeTab, query, QUICK_ACTIONS]);

  // Unified items list for keyboard navigation
  const allItems = useMemo(() => {
    const list: Array<{ id: string; type: 'session' | 'deliverable' | 'action'; data: any }> = [];
    filteredSessions.forEach(s => list.push({ id: s.id, type: 'session', data: s }));
    filteredDeliverables.forEach(d => list.push({ id: d.id, type: 'deliverable', data: d }));
    filteredActions.forEach(a => list.push({ id: a.id, type: 'action', data: a }));
    return list;
  }, [filteredSessions, filteredDeliverables, filteredActions]);

  const handleSelectSession = (sessionId: string) => {
    selectSession(sessionId);
    router.push(`/chat/${sessionId}`);
    onClose();
  };

  const handleSelectDeliverable = (item: any) => {
    openCanvas(item);
    onClose();
  };

  const handleExecuteSelected = (index: number) => {
    const item = allItems[index];
    if (!item) return;
    if (item.type === 'session') {
      handleSelectSession(item.data.id);
    } else if (item.type === 'deliverable') {
      handleSelectDeliverable(item.data);
    } else if (item.type === 'action') {
      item.data.action();
    }
  };

  const handleListKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < allItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : allItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allItems.length > 0) {
        handleExecuteSelected(selectedIndex);
      } else {
        createNewChat();
        if (pathname !== '/' && pathname !== '/chat') router.push('/chat');
        onClose();
      }
    }
  };

  const getDeliverableIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'docx':
        return <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      case 'xlsx':
        return <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
      case 'pptx':
        return <Presentation className="h-4 w-4 text-orange-600 dark:text-orange-400" />;
      case 'py':
        return <Code className="h-4 w-4 text-purple-600 dark:text-purple-400" />;
      default:
        return <FileText className="h-4 w-4 text-slate-500" />;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-14 sm:pt-20 p-4 select-none">
        {/* Modern Frosted Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 dark:bg-black/75 backdrop-blur-sm"
        />

        {/* Linear / Raycast Style Command Palette Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: -8 }}
          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-2xl bg-white dark:bg-[#111215] border border-slate-200/90 dark:border-[#22242b] rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col z-10 font-sans"
        >
          {/* 1. Header Search Bar */}
          <div className="flex items-center px-4 py-3.5 border-b border-slate-100 dark:border-[#1c1e24] bg-white dark:bg-[#111215]">
            <Search className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0 mr-3" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleListKeyDown}
              placeholder="Type a command or search conversations..."
              className="w-full bg-transparent text-[14px] text-slate-900 dark:text-[#ededed] placeholder-slate-400 dark:placeholder-slate-500 outline-none font-sans font-normal"
            />

            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 mr-2 cursor-pointer transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}

            <div className="flex items-center space-x-1 shrink-0">
              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#1c1d22] border border-slate-200 dark:border-[#282a32]">
                ESC
              </span>
            </div>
          </div>

          {/* 2. Filter Category Pills Row */}
          <div className="flex items-center gap-1.5 px-3.5 py-2 border-b border-slate-100 dark:border-[#1a1b22] bg-slate-50/50 dark:bg-[#0e0f12] text-[11px] overflow-x-auto scrollbar-none">
            {[
              { id: 'all', label: 'All' },
              { id: 'chats', label: 'Conversations' },
              { id: 'artifacts', label: 'Artifacts' },
              { id: 'actions', label: 'Actions' }
            ].map((tab) => {
              const isTabActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setSelectedIndex(0);
                  }}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    isTabActive
                      ? 'bg-white dark:bg-[#20222a] text-slate-900 dark:text-white shadow-2xs border border-slate-200 dark:border-[#2e313b]'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-[#16171d]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* 3. Results Container */}
          <div className="max-h-[380px] overflow-y-auto p-2 space-y-3">
            {allItems.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  No matching results for &ldquo;{query}&rdquo;
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                  Try searching for furnace SOPs, pump calculations, or start a new chat.
                </p>
              </div>
            ) : (
              <>
                {/* Conversations Section */}
                {filteredSessions.length > 0 && (
                  <div>
                    <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Conversations
                    </div>
                    <div className="space-y-0.5 mt-0.5">
                      {filteredSessions.map((sess) => {
                        const globalIndex = allItems.findIndex(i => i.id === sess.id);
                        const isSelected = selectedIndex === globalIndex;
                        const isActive = sess.id === activeSessionId;
                        const lastMsg = sess.messages[sess.messages.length - 1];

                        // Find snippet containing query
                        let snippet = lastMsg ? lastMsg.content : '';
                        if (query.trim()) {
                          const matched = sess.messages.find(m => m.content.toLowerCase().includes(query.toLowerCase()));
                          if (matched) snippet = matched.content;
                        }

                        return (
                          <div
                            key={sess.id}
                            onClick={() => handleSelectSession(sess.id)}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                            className={`group w-full px-3 py-2 rounded-lg transition-all flex items-center justify-between gap-3 cursor-pointer ${
                              isSelected
                                ? 'bg-slate-100 dark:bg-[#1a1c23] text-slate-900 dark:text-white'
                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#14151b]'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                              <MessageSquare className={`h-4 w-4 shrink-0 ${
                                isSelected ? 'text-blue-600 dark:text-[#a8c7fa]' : 'text-slate-400 dark:text-slate-500'
                              }`} />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="text-[13px] font-semibold truncate tracking-tight">
                                    {sess.title || 'New Conversation'}
                                  </span>
                                  {isActive && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30">
                                      Active
                                    </span>
                                  )}
                                </div>
                                {snippet && (
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5 leading-normal">
                                    {snippet}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 shrink-0">
                              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                                {sess.messages.length} msg
                              </span>
                              {sessions.length > 1 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteSession(sess.id);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 transition-all cursor-pointer"
                                  title="Delete chat"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                              {isSelected && (
                                <CornerDownLeft className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Artifacts Section */}
                {filteredDeliverables.length > 0 && (
                  <div>
                    <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Artifacts & Deliverables
                    </div>
                    <div className="space-y-0.5 mt-0.5">
                      {filteredDeliverables.map((item) => {
                        const globalIndex = allItems.findIndex(i => i.id === item.id);
                        const isSelected = selectedIndex === globalIndex;

                        return (
                          <div
                            key={item.id}
                            onClick={() => handleSelectDeliverable(item)}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                            className={`group w-full px-3 py-2 rounded-lg transition-all flex items-center justify-between gap-3 cursor-pointer ${
                              isSelected
                                ? 'bg-slate-100 dark:bg-[#1a1c23] text-slate-900 dark:text-white'
                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#14151b]'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                              <div className="shrink-0">
                                {getDeliverableIcon(item.type)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="text-[13px] font-semibold truncate tracking-tight">
                                    {item.filename}
                                  </span>
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                    {item.type}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                                  {item.summary}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 shrink-0">
                              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                                {item.size_formatted}
                              </span>
                              {isSelected && (
                                <CornerDownLeft className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quick Actions Section */}
                {filteredActions.length > 0 && (
                  <div>
                    <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Quick Actions
                    </div>
                    <div className="space-y-0.5 mt-0.5">
                      {filteredActions.map((act) => {
                        const globalIndex = allItems.findIndex(i => i.id === act.id);
                        const isSelected = selectedIndex === globalIndex;

                        return (
                          <div
                            key={act.id}
                            onClick={() => act.action()}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                            className={`group w-full px-3 py-2 rounded-lg transition-all flex items-center justify-between gap-3 cursor-pointer ${
                              isSelected
                                ? 'bg-slate-100 dark:bg-[#1a1c23] text-slate-900 dark:text-white'
                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#14151b]'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                              <div className="shrink-0">
                                {act.icon}
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="text-[13px] font-semibold truncate tracking-tight block">
                                  {act.title}
                                </span>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                                  {act.desc}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 shrink-0">
                              {isSelected && (
                                <CornerDownLeft className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* 4. Footer Command Bar */}
          <div className="px-4 py-2.5 bg-slate-50 dark:bg-[#0c0d10] border-t border-slate-100 dark:border-[#1c1e24] flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <div className="flex items-center space-x-3">
              <span className="flex items-center space-x-1">
                <kbd className="px-1.5 py-0.5 font-mono text-[9px] bg-white dark:bg-[#181920] border border-slate-200 dark:border-[#282a32] rounded text-slate-600 dark:text-slate-300">↑↓</kbd>
                <span>Navigate</span>
              </span>
              <span className="flex items-center space-x-1">
                <kbd className="px-1.5 py-0.5 font-mono text-[9px] bg-white dark:bg-[#181920] border border-slate-200 dark:border-[#282a32] rounded text-slate-600 dark:text-slate-300">↵</kbd>
                <span>Select</span>
              </span>
              <span className="flex items-center space-x-1">
                <kbd className="px-1.5 py-0.5 font-mono text-[9px] bg-white dark:bg-[#181920] border border-slate-200 dark:border-[#282a32] rounded text-slate-600 dark:text-slate-300">ESC</kbd>
                <span>Close</span>
              </span>
            </div>

            <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Air-Gap Sovereign</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
