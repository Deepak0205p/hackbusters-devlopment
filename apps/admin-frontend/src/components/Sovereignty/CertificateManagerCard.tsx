'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  ShieldCheck,
  Key,
  RefreshCw,
  Search,
  AlertTriangle,
  FileX2,
  CheckCircle2,
  Clock,
  Lock,
  PlusCircle,
  Database,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore, CRLStatus } from '@/store/useAuthStore';

export function CertificateManagerCard() {
  const { user } = useAuthStore();
  const [crlData, setCrlData] = useState<CRLStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Serial check state
  const [searchSerial, setSearchSerial] = useState('');
  const [verificationResult, setVerificationResult] = useState<{
    serial: string;
    isRevoked: boolean;
    reason?: string;
    revokedAt?: string;
  } | null>(null);

  // Revocation modal/form state
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revokeSerial, setRevokeSerial] = useState('');
  const [revokeReason, setRevokeReason] = useState('KEY_COMPROMISE');
  const [isRevoking, setIsRevoking] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchCrlStatus = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.get<CRLStatus>('/api/v1/auth/crl/status');
      setCrlData(data);
    } catch (err: any) {
      console.error('Failed to fetch CRL status:', err);
      setError(err.message || 'Failed to fetch Certificate Revocation List (CRL).');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCrlStatus();
  }, []);

  const handleVerifySerial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchSerial.trim() || !crlData) return;

    const query = searchSerial.trim().toLowerCase();
    const match = crlData.revoked_certificates?.find(
      (c) => c.serial_number.toLowerCase() === query || c.serial_number.toLowerCase().includes(query)
    );

    if (match) {
      setVerificationResult({
        serial: match.serial_number,
        isRevoked: true,
        reason: match.reason,
        revokedAt: match.revoked_at,
      });
    } else {
      setVerificationResult({
        serial: searchSerial.trim(),
        isRevoked: false,
      });
    }
  };

  const handleRevokeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revokeSerial.trim()) return;

    setIsRevoking(true);
    setActionMessage(null);
    try {
      await api.post('/api/v1/auth/crl/revoke', {
        serial_number: revokeSerial.trim(),
        reason: revokeReason,
      });
      setActionMessage(`Certificate '${revokeSerial}' revoked successfully and added to blacklist.`);
      setShowRevokeModal(false);
      setRevokeSerial('');
      fetchCrlStatus();
    } catch (err: any) {
      setActionMessage(`Revocation failed: ${err.message}`);
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#11141c] border border-gray-200 dark:border-[#262c3a] rounded-xl p-5 shadow-sm space-y-4 font-sans">
      {/* Header & Telemetry Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800/80 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Key className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <span>Plant PKI &amp; Certificate Revocation List (CRL)</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-800/50">
                ACTIVE V2
              </span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
              Real-time X.509 Client Certificate Blacklist &amp; mTLS Cryptographic Guard
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user?.role === 'SUPER_ADMIN' && (
            <button
              onClick={() => setShowRevokeModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-xs font-mono transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Revoke Certificate</span>
            </button>
          )}

          <button
            onClick={fetchCrlStatus}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-gray-50 dark:bg-[#1a1f2c] border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-mono transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh CRL Cache"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-800/50 text-cyan-300 text-xs font-mono flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-cyan-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Root CA Status */}
        <div className="p-3 rounded-lg bg-gray-50 dark:bg-[#0c0e14] border border-gray-100 dark:border-gray-800/70 space-y-1">
          <div className="text-[11px] font-mono text-gray-500 dark:text-gray-400 uppercase flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Root Certificate Authority</span>
          </div>
          <div className="text-xs font-semibold text-gray-900 dark:text-gray-200 truncate">
            {crlData?.root_ca || 'MRPL Internal Root CA v2'}
          </div>
          <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>SHA256 / RSA4096 (Air-Gapped)</span>
          </div>
        </div>

        {/* Total Revoked Counter */}
        <div className="p-3 rounded-lg bg-gray-50 dark:bg-[#0c0e14] border border-gray-100 dark:border-gray-800/70 space-y-1">
          <div className="text-[11px] font-mono text-gray-500 dark:text-gray-400 uppercase flex items-center gap-1.5">
            <FileX2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Revoked Certificates</span>
          </div>
          <div className="text-xl font-bold font-mono text-gray-900 dark:text-gray-100">
            {crlData?.total_revoked ?? 0}
          </div>
          <div className="text-[10px] font-mono text-gray-500">
            {crlData?.total_revoked ? 'Blacklist entries active' : 'Zero compromised certs'}
          </div>
        </div>

        {/* CRL Cache Timestamps */}
        <div className="p-3 rounded-lg bg-gray-50 dark:bg-[#0c0e14] border border-gray-100 dark:border-gray-800/70 space-y-1">
          <div className="text-[11px] font-mono text-gray-500 dark:text-gray-400 uppercase flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-500" />
            <span>CRL Cache Status</span>
          </div>
          <div className="text-xs font-mono text-gray-900 dark:text-gray-200">
            Sync: {crlData?.last_updated || 'Live In-Memory'}
          </div>
          <div className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 truncate">
            Next Audit: {crlData?.next_update || 'Continuous Daemon Watch'}
          </div>
        </div>
      </div>

      {/* Live Certificate Serial Number Tester */}
      <div className="p-3.5 rounded-lg bg-gray-50 dark:bg-[#0c0e14] border border-gray-200 dark:border-gray-800 space-y-2.5">
        <div className="text-xs font-semibold text-gray-900 dark:text-gray-200 flex items-center gap-1.5">
          <Search className="w-3.5 h-3.5 text-cyan-500" />
          <span>Live Certificate Revocation Tester</span>
        </div>

        <form onSubmit={handleVerifySerial} className="flex gap-2">
          <input
            type="text"
            value={searchSerial}
            onChange={(e) => setSearchSerial(e.target.value)}
            placeholder="Enter Certificate Serial (e.g. 0x01A4B2 or 12345678)"
            className="flex-1 px-3 py-1.5 bg-white dark:bg-[#11141c] border border-gray-300 dark:border-gray-700 rounded-md text-xs font-mono text-gray-900 dark:text-gray-200 focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            disabled={!searchSerial.trim()}
            className="px-3.5 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
          >
            Check CRL
          </button>
        </form>

        {verificationResult && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-2.5 rounded-md text-xs font-mono flex items-center justify-between ${
              verificationResult.isRevoked
                ? 'bg-rose-950/40 border border-rose-800/60 text-rose-300'
                : 'bg-emerald-950/40 border border-emerald-800/60 text-emerald-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {verificationResult.isRevoked ? (
                <>
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>
                    <strong>REVOKED / BLACKLISTED:</strong> Serial {verificationResult.serial} ({verificationResult.reason})
                  </span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>
                    <strong>VALID &amp; TRUSTED:</strong> Serial {verificationResult.serial} is not present in the CRL blacklist.
                  </span>
                </>
              )}
            </div>
            <button
              onClick={() => setVerificationResult(null)}
              className="text-gray-400 hover:text-gray-200 text-xs"
            >
              ✕
            </button>
          </motion.div>
        )}
      </div>

      {/* Revoked Certificates Blacklist Table */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-gray-900 dark:text-gray-200 flex items-center justify-between">
          <span>Active Revocation Database Entries</span>
          <span className="text-[10px] font-mono text-gray-500">
            {crlData?.revoked_certificates?.length || 0} Records
          </span>
        </div>

        <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-gray-50 dark:bg-[#090b10] border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 text-[10px]">
              <tr>
                <th className="py-2 px-3">Serial Number</th>
                <th className="py-2 px-3">Revocation Time</th>
                <th className="py-2 px-3">Reason</th>
                <th className="py-2 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
              {crlData?.revoked_certificates && crlData.revoked_certificates.length > 0 ? (
                crlData.revoked_certificates.map((cert, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-[#151924] transition-colors">
                    <td className="py-2 px-3 font-semibold text-rose-600 dark:text-rose-400">
                      {cert.serial_number}
                    </td>
                    <td className="py-2 px-3 text-gray-600 dark:text-gray-400 text-[11px]">
                      {cert.revoked_at}
                    </td>
                    <td className="py-2 px-3 text-gray-700 dark:text-gray-300 text-[11px]">
                      {cert.reason}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <span className="inline-block px-1.5 py-0.5 rounded bg-rose-950/60 text-rose-300 text-[9px] border border-rose-800/50">
                        REVOKED
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-gray-400 text-xs">
                    No revoked certificates found in the local CRL database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revoke Certificate Modal */}
      <AnimatePresence>
        {showRevokeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-[#11141c] border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl p-5 space-y-4 font-sans text-xs"
            >
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2.5">
                <div className="flex items-center gap-2 text-rose-500 font-semibold">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Revoke X.509 Client Certificate</span>
                </div>
                <button
                  onClick={() => setShowRevokeModal(false)}
                  className="text-gray-400 hover:text-gray-200"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleRevokeSubmit} className="space-y-3 font-mono">
                <div className="space-y-1">
                  <label className="text-[11px] text-gray-400">Certificate Serial Number:</label>
                  <input
                    type="text"
                    value={revokeSerial}
                    onChange={(e) => setRevokeSerial(e.target.value)}
                    placeholder="e.g. 0x01A4B2"
                    required
                    className="w-full px-3 py-1.5 bg-gray-50 dark:bg-[#090b10] border border-gray-300 dark:border-gray-700 rounded text-xs text-gray-900 dark:text-gray-200 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-gray-400">Revocation Reason:</label>
                  <select
                    value={revokeReason}
                    onChange={(e) => setRevokeReason(e.target.value)}
                    className="w-full px-3 py-1.5 bg-gray-50 dark:bg-[#090b10] border border-gray-300 dark:border-gray-700 rounded text-xs text-gray-900 dark:text-gray-200 focus:outline-none focus:border-rose-500"
                  >
                    <option value="KEY_COMPROMISE">Key Compromise (Private key exposed)</option>
                    <option value="AFFILIATION_CHANGED">Affiliation Changed (Engineer transferred/resigned)</option>
                    <option value="SUPERSEDED">Superseded (Replaced by new SmartCard)</option>
                    <option value="CESSATION_OF_OPERATION">Cessation of Operation</option>
                    <option value="SECURITY_POLICY_VIOLATION">Security Policy Violation</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRevokeModal(false)}
                    className="px-3 py-1.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isRevoking || !revokeSerial.trim()}
                    className="px-3.5 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-medium disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isRevoking ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileX2 className="w-3.5 h-3.5" />}
                    <span>Confirm Revocation</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
