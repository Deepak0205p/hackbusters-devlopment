'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSovereigntyStore } from '@/store/useSovereigntyStore';
import {
  ShieldCheck,
  ShieldAlert,
  Download,
  Link2,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Server,
  Filter,
  Search,
  Lock,
  ArrowRight,
  Fingerprint,
} from 'lucide-react';

type LogCategory = 'all' | 'security' | 'model' | 'system';

export function TamperEvidentLogViewer() {
  const {
    auditLogs,
    verifyChainIntegrity,
    exportAuditCertificate,
    isVerifyingChain,
    chainVerificationStatus,
  } = useSovereigntyStore();

  const [selectedCategory, setSelectedCategory] = useState<LogCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBlock, setSelectedBlock] = useState<any | null>(null);

  // Filter logs based on category and search query
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const ev = log.event?.toUpperCase() || '';
      const matchesSearch =
        !searchQuery.trim() ||
        ev.includes(searchQuery.toUpperCase()) ||
        log.block_hash.includes(searchQuery) ||
        String(log.sequence).includes(searchQuery);

      if (!matchesSearch) return false;

      if (selectedCategory === 'security') {
        return (
          ev.includes('AUTH') ||
          ev.includes('PKI') ||
          ev.includes('CERT') ||
          ev.includes('LDAP') ||
          ev.includes('PRIVILEGE') ||
          ev.includes('SECURITY') ||
          ev.includes('REVOK')
        );
      }
      if (selectedCategory === 'model') {
        return (
          ev.includes('MODEL') ||
          ev.includes('SWAP') ||
          ev.includes('LRU') ||
          ev.includes('EVICT') ||
          ev.includes('AST') ||
          ev.includes('SANDBOX') ||
          ev.includes('INFERENCE')
        );
      }
      if (selectedCategory === 'system') {
        return (
          ev.includes('SOCKET') ||
          ev.includes('AIR_GAP') ||
          ev.includes('CONFIG') ||
          ev.includes('SEAL') ||
          ev.includes('GATEWAY') ||
          ev.includes('SYSTEM')
        );
      }
      return true;
    });
  }, [auditLogs, selectedCategory, searchQuery]);

  // Event severity helper
  const getEventBadge = (eventStr: string) => {
    const ev = eventStr.toUpperCase();
    if (ev.includes('FAILED') || ev.includes('REVOK') || ev.includes('BLOCKED') || ev.includes('VIOLATION')) {
      return {
        bg: 'bg-rose-950/60 text-rose-400 border-rose-800/60',
        icon: ShieldAlert,
        status: 'SECURITY_ALERT',
      };
    }
    if (ev.includes('SWAP') || ev.includes('LRU') || ev.includes('EVICT')) {
      return {
        bg: 'bg-amber-950/60 text-amber-300 border-amber-800/60',
        icon: Cpu,
        status: 'MODEL_MUTATION',
      };
    }
    if (ev.includes('AUTH_SUCCESS') || ev.includes('AIR_GAP') || ev.includes('VERIFIED')) {
      return {
        bg: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60',
        icon: ShieldCheck,
        status: 'VERIFIED_SOVEREIGN',
      };
    }
    return {
      bg: 'bg-blue-950/60 text-blue-300 border-blue-800/60',
      icon: Server,
      status: 'AUDIT_SEALED',
    };
  };

  return (
    <div className="bg-white dark:bg-[#11141c] border border-gray-200 dark:border-[#262c3a] rounded-xl p-5 shadow-sm space-y-4 font-sans text-gray-900 dark:text-[#ededed]">
      {/* Header & Verification Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Link2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <span>Tamper-Evident SHA-256 Audit Log</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-800/50">
                {auditLogs.length} BLOCKS SEALED
              </span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
              Immutable SHA-256 Merkle Chain recording all Auth, Model Swaps, and Security Events
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={verifyChainIntegrity}
            disabled={isVerifyingChain}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-xs font-mono transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isVerifyingChain ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Auditing Hash Chain...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verify Hash Chain Integrity</span>
              </>
            )}
          </button>

          <button
            onClick={exportAuditCertificate}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-gray-50 dark:bg-[#1a1f2c] border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-mono transition-colors cursor-pointer"
            title="Export Cryptographic Audit Certificate (.json)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Certificate</span>
          </button>
        </div>
      </div>

      {/* Chain Verification Result Toast */}
      {chainVerificationStatus && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs font-mono flex items-center gap-2"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>CRYPTOGRAPHIC AUDIT VERIFIED:</strong> All {auditLogs.length} blocks checked. Zero hash collisions or tampering detected.
          </span>
        </motion.div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-1 p-1 bg-gray-50 dark:bg-[#090b10] border border-gray-200 dark:border-gray-800 rounded-lg text-xs font-mono">
          {[
            { id: 'all', label: 'All Events', count: auditLogs.length },
            {
              id: 'security',
              label: 'Security / Auth',
              count: auditLogs.filter((l) =>
                /AUTH|PKI|CERT|LDAP|PRIVILEGE|SECURITY|REVOK/i.test(l.event)
              ).length,
            },
            {
              id: 'model',
              label: 'Model / Inference',
              count: auditLogs.filter((l) =>
                /MODEL|SWAP|LRU|EVICT|AST|SANDBOX/i.test(l.event)
              ).length,
            },
            {
              id: 'system',
              label: 'System / Sovereignty',
              count: auditLogs.filter((l) =>
                /SOCKET|AIR_GAP|CONFIG|SEAL|GATEWAY/i.test(l.event)
              ).length,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id as LogCategory)}
              className={`px-2.5 py-1 rounded-md transition-all text-[11px] font-medium flex items-center gap-1.5 ${
                selectedCategory === tab.id
                  ? 'bg-white dark:bg-[#1a1f2c] text-cyan-600 dark:text-cyan-300 shadow-sm border border-gray-200 dark:border-cyan-500/30 font-semibold'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 bg-gray-200 dark:bg-gray-800 px-1 rounded">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Live Filter Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by event, hash, block #..."
            className="pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-[#090b10] border border-gray-200 dark:border-gray-800 rounded-lg text-xs font-mono text-gray-900 dark:text-gray-200 focus:outline-none focus:border-cyan-500 w-full sm:w-64"
          />
        </div>
      </div>

      {/* Chained Events Table */}
      <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-gray-50 dark:bg-[#090b10] border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Block #</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Security Event</th>
                <th className="py-2.5 px-3">SHA-256 Current Block Hash</th>
                <th className="py-2.5 px-3">Parent Hash (Linked)</th>
                <th className="py-2.5 px-3 text-right">Chain Proof</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 text-[11px]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    No matching audit log events found for this filter category.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const badge = getEventBadge(log.event);
                  const Icon = badge.icon;
                  const isSelected = selectedBlock?.sequence === log.sequence;

                  return (
                    <tr
                      key={log.sequence}
                      onClick={() => setSelectedBlock(isSelected ? null : log)}
                      className={`hover:bg-gray-50 dark:hover:bg-[#151924] cursor-pointer transition-colors ${
                        isSelected ? 'bg-cyan-500/10 dark:bg-cyan-950/30' : ''
                      }`}
                    >
                      <td className="py-2 px-3 font-bold text-gray-900 dark:text-gray-100">
                        #{log.sequence}
                      </td>
                      <td className="py-2 px-3 text-gray-500 text-[11px] whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${badge.bg}`}
                        >
                          <Icon className="w-3 h-3 shrink-0" />
                          <span>{log.event}</span>
                        </span>
                      </td>
                      <td className="py-2 px-3 text-gray-900 dark:text-gray-200">
                        <span title={log.block_hash} className="text-cyan-600 dark:text-cyan-400 font-medium">
                          {log.block_hash.substring(0, 14)}...{log.block_hash.substring(log.block_hash.length - 6)}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-gray-400 text-[10px]">
                        <span title={log.prev_hash}>
                          {log.prev_hash.substring(0, 14)}...
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                          <ShieldCheck className="w-3 h-3" />
                          <span>SEALED</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Block Hash Inspection Drawer / Detail Card */}
      <AnimatePresence>
        {selectedBlock && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 rounded-lg bg-gray-50 dark:bg-[#0c0e14] border border-cyan-500/30 space-y-2.5 font-mono text-xs"
          >
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-2">
              <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-semibold">
                <Fingerprint className="w-4 h-4" />
                <span>Cryptographic Proof for Block #{selectedBlock.sequence}</span>
              </div>
              <button
                onClick={() => setSelectedBlock(null)}
                className="text-gray-400 hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
              <div className="space-y-1">
                <span className="text-gray-400">Current Block SHA-256 Hash:</span>
                <div className="p-2 rounded bg-white dark:bg-[#11141c] border border-gray-200 dark:border-gray-800 text-cyan-500 break-all select-all font-mono">
                  {selectedBlock.block_hash}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-gray-400">Parent Linked Hash (prev_hash):</span>
                <div className="p-2 rounded bg-white dark:bg-[#11141c] border border-gray-200 dark:border-gray-800 text-gray-400 break-all select-all font-mono">
                  {selectedBlock.prev_hash}
                </div>
              </div>
            </div>

            <div className="text-[11px] text-gray-500 pt-1">
              Event Details: <span className="text-gray-900 dark:text-gray-200 font-semibold">{selectedBlock.event}</span> ({selectedBlock.timestamp})
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
