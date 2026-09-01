'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  CreditCard,
  Building2,
  Lock,
  User,
  Key,
  UploadCloud,
  FileCheck,
  AlertCircle,
  Cpu,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

// Sample pre-configured test certificate for 1-click hardware smartcard simulation
const SAMPLE_SMARTCARD_CERT = `-----BEGIN CERTIFICATE-----
MIICljCCAX4CCQD6mH5S9q4t4TANBgkqhkiG9w0BAQsFADBLMQswCQYDVQQGEwJJ
TjESMBAGA1UECAwJS2FybmF0YWthMREwDwYDVQQHDAhNYW5nYWxvcmUxGDAWBgNV
BAoMD01SUEwgUmVmaW5lcnkgQ0EwHhcNMjYwOTAxMDAwMDAwWhcNMjcwOTAxMDAw
MDAwWjBBMQswCQYDVQQGEwJJTjESMBAGA1UECgwJTVJQTF9QU1UxFDASBgNVBAsM
C1NFQ19BRE1JTlMxEzARBgNVBAMMCm1ycGxfYWRtaW4wggEiMA0GCSqGSIb3DQEB
AQUAA4IBDwAwggEKAoIBAQC8uS8k9lCj1m2u5vX2h5j+0k3x7n9m8v1x2y4z6a8b
0c2d4e6f8a0b2c4d6e8f0a2b4c6d8e0f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d
3e5f7a9b1c3d5e7f9a1b3c5d7e9f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5f
7a9b1c3d5e7f9a1b3c5d7e9f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5f7a9b
AgMBAAEwDQYJKoZIhvcNAQELBQADggEBAJH7x6y5k4l3m2n1o0p9q8r7s6t5u4v3
w2x1y0z9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1
e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9
a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7
c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5
-----END CERTIFICATE-----`;

export default function LoginPage() {
  const router = useRouter();
  const { loginWithCert, loginWithLdap, loginWithStandard, isAuthenticated, isLoading, error, clearError } =
    useAuthStore();

  const [activeTab, setActiveTab] = useState<'cert' | 'ldap' | 'local'>('cert');
  const [certPem, setCertPem] = useState('');
  const [certPin, setCertPin] = useState('');
  const [parsedCertInfo, setParsedCertInfo] = useState<{ cn?: string; ou?: string; serial?: string } | null>(null);

  // LDAP form state
  const [ldapUsername, setLdapUsername] = useState('');
  const [ldapPassword, setLdapPassword] = useState('');
  const [department, setDepartment] = useState('MRPL_SEC_ADMINS');

  // Local form state
  const [localUsername, setLocalUsername] = useState('');
  const [localPassword, setLocalPassword] = useState('');

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  // Parse certificate information client-side for feedback
  useEffect(() => {
    if (!certPem) {
      setParsedCertInfo(null);
      return;
    }
    try {
      let cn = 'MRPL Authorized Engineer';
      let ou = 'Plant Operations';
      let serial = '0x' + Math.abs(hashCode(certPem)).toString(16).toUpperCase().padStart(8, '0');

      if (certPem.includes('CN=')) {
        const match = certPem.match(/CN=([^,/\\n]+)/i);
        if (match) cn = match[1];
      }
      if (certPem.includes('OU=')) {
        const match = certPem.match(/OU=([^,/\\n]+)/i);
        if (match) ou = match[1];
      }
      setParsedCertInfo({ cn, ou, serial });
    } catch {
      setParsedCertInfo(null);
    }
  }, [certPem]);

  function hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    clearError();
    const file = e.dataTransfer.files[0];
    if (file) {
      readCertFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearError();
    const file = e.target.files?.[0];
    if (file) {
      readCertFile(file);
    }
  };

  const readCertFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setCertPem(content);
      }
    };
    reader.readAsText(file);
  };

  const handleCertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certPem.trim()) return;
    const success = await loginWithCert(certPem, certPin);
    if (success) {
      router.push('/');
    }
  };

  const handleLdapSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ldapUsername.trim() || !ldapPassword.trim()) return;
    const success = await loginWithLdap(ldapUsername, ldapPassword);
    if (success) {
      router.push('/');
    }
  };

  const handleLocalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localUsername.trim() || !localPassword.trim()) return;
    const success = await loginWithStandard(localUsername, localPassword);
    if (success) {
      router.push('/');
    }
  };

  const handleSimulateSmartCard = () => {
    clearError();
    setCertPem(SAMPLE_SMARTCARD_CERT);
    setCertPin('9421');
  };

  const handleFillDemoLdap = (user: string, role: string) => {
    clearError();
    setLdapUsername(user);
    setLdapPassword('MRPL#Secure2026');
    setDepartment(role);
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] text-[#ededed] flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Background Subtle Gradient Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f24300a_1px,transparent_1px),linear-gradient(to_bottom,#1f24300a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-[128px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md z-10 space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-800/50 text-cyan-400 text-xs font-mono mb-1 shadow-inner">
            <Cpu className="w-3.5 h-3.5" />
            <span>MRPL Sovereign AI Workbench (SIH PS 26117)</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            <ShieldCheck className="w-7 h-7 text-emerald-400" />
            <span>Industrial Security Gateway</span>
          </h1>
          <p className="text-xs text-gray-400 font-mono">
            Air-Gapped Sovereign Authentication &amp; Hardware PKI
          </p>
        </div>

        {/* Tabbed Login Card */}
        <div className="bg-[#11141c] border border-gray-800/80 rounded-xl shadow-2xl p-6 backdrop-blur-md relative overflow-hidden">
          {/* Mode Selector Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#090b10] border border-gray-800/60 rounded-lg mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab('cert');
                clearError();
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-xs font-medium transition-all ${
                activeTab === 'cert'
                  ? 'bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/30'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>SmartCard PKI</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('ldap');
                clearError();
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-xs font-medium transition-all ${
                activeTab === 'ldap'
                  ? 'bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-blue-300 border border-blue-500/30 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/30'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Intranet LDAP</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('local');
                clearError();
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-xs font-medium transition-all ${
                activeTab === 'local'
                  ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-purple-300 border border-purple-500/30 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/30'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>Local Auth</span>
            </button>
          </div>

          {/* Error Banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-4 p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1 font-mono text-[11px] leading-relaxed">{error}</div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* TAB 1: SmartCard / X.509 PKI Certificate */}
          {activeTab === 'cert' && (
            <form onSubmit={handleCertSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>X.509 Client Certificate (PEM)</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleSimulateSmartCard}
                    className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 underline transition-colors"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Simulate Token Injection</span>
                  </button>
                </div>

                {/* Dropzone / Upload Area */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border border-dashed rounded-lg p-3 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-cyan-400 bg-cyan-950/20'
                      : certPem
                      ? 'border-emerald-500/50 bg-emerald-950/10'
                      : 'border-gray-700/80 bg-[#0c0e14] hover:border-gray-600'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".crt,.pem,.cer"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {certPem ? (
                    <div className="flex items-center justify-center gap-2 text-emerald-400 text-xs font-mono">
                      <FileCheck className="w-4 h-4" />
                      <span>Certificate Loaded ({certPem.length} bytes)</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-gray-400 text-xs">
                      <UploadCloud className="w-5 h-5 text-gray-500" />
                      <span>Drop .crt / .pem certificate file here, or click to browse</span>
                    </div>
                  )}
                </div>

                {/* Raw PEM Textarea */}
                <textarea
                  value={certPem}
                  onChange={(e) => {
                    setCertPem(e.target.value);
                    clearError();
                  }}
                  placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                  rows={3}
                  className="w-full px-3 py-2 bg-[#090b10] border border-gray-800 rounded-lg text-[11px] font-mono text-gray-300 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 resize-none transition-all placeholder:text-gray-600"
                />
              </div>

              {/* Parsed Certificate Identity Feedback Card */}
              {parsedCertInfo && (
                <div className="p-2.5 rounded-lg bg-cyan-950/20 border border-cyan-800/40 text-xs space-y-1 font-mono">
                  <div className="text-cyan-300 font-semibold flex items-center justify-between text-[11px]">
                    <span>CN: {parsedCertInfo.cn}</span>
                    <span className="text-[10px] text-cyan-400/80 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-700/40">
                      SERIAL: {parsedCertInfo.serial}
                    </span>
                  </div>
                  <div className="text-gray-400 text-[10px]">OU: {parsedCertInfo.ou}</div>
                </div>
              )}

              {/* SmartCard Hardware PIN */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-gray-400" />
                  <span>SmartCard Hardware PIN (Optional)</span>
                </label>
                <input
                  type="password"
                  value={certPin}
                  onChange={(e) => setCertPin(e.target.value)}
                  placeholder="Enter 4-8 digit hardware PIN"
                  className="w-full px-3 py-2 bg-[#090b10] border border-gray-800 rounded-lg text-xs font-mono text-gray-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-gray-600"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !certPem.trim()}
                className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying mTLS Certificate...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Authenticate via SmartCard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: Corporate Intranet LDAP / Active Directory */}
          {activeTab === 'ldap' && (
            <form onSubmit={handleLdapSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  <span>sAMAccountName / Corporate ID</span>
                </label>
                <input
                  type="text"
                  value={ldapUsername}
                  onChange={(e) => {
                    setLdapUsername(e.target.value);
                    clearError();
                  }}
                  placeholder="e.g. mrpl_admin or emp_9421"
                  className="w-full px-3 py-2 bg-[#090b10] border border-gray-800 rounded-lg text-xs font-mono text-gray-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-gray-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-blue-400" />
                  <span>Active Directory Password</span>
                </label>
                <input
                  type="password"
                  value={ldapPassword}
                  onChange={(e) => {
                    setLdapPassword(e.target.value);
                    clearError();
                  }}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 bg-[#090b10] border border-gray-800 rounded-lg text-xs font-mono text-gray-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-gray-600"
                />
              </div>

              {/* Department Group Quick Presets */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-gray-400">Intranet Role Presets:</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleFillDemoLdap('mrpl_admin', 'MRPL_SEC_ADMINS')}
                    className="py-1 px-2 text-[10px] font-mono rounded bg-gray-900 border border-gray-800 text-gray-300 hover:border-blue-500/50 hover:text-blue-300 text-left transition-colors"
                  >
                    👑 Security Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFillDemoLdap('lead_ops', 'MRPL_PROCESS_LEADS')}
                    className="py-1 px-2 text-[10px] font-mono rounded bg-gray-900 border border-gray-800 text-gray-300 hover:border-blue-500/50 hover:text-blue-300 text-left transition-colors"
                  >
                    ⚙️ Process Lead
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFillDemoLdap('hse_auditor', 'MRPL_HSE_AUDITORS')}
                    className="py-1 px-2 text-[10px] font-mono rounded bg-gray-900 border border-gray-800 text-gray-300 hover:border-blue-500/50 hover:text-blue-300 text-left transition-colors"
                  >
                    🦺 HSE Auditor
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFillDemoLdap('field_op', 'MRPL_OPERATORS')}
                    className="py-1 px-2 text-[10px] font-mono rounded bg-gray-900 border border-gray-800 text-gray-300 hover:border-blue-500/50 hover:text-blue-300 text-left transition-colors"
                  >
                    📟 Field Operator
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !ldapUsername.trim() || !ldapPassword.trim()}
                className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-950/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Binding to Intranet LDAP...</span>
                  </>
                ) : (
                  <>
                    <Building2 className="w-4 h-4" />
                    <span>Login with Corporate AD</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 3: Local Standalone Fallback */}
          {activeTab === 'local' && (
            <form onSubmit={handleLocalSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-purple-400" />
                  <span>Local Administrator Username</span>
                </label>
                <input
                  type="text"
                  value={localUsername}
                  onChange={(e) => {
                    setLocalUsername(e.target.value);
                    clearError();
                  }}
                  placeholder="admin or sovereign_user"
                  className="w-full px-3 py-2 bg-[#090b10] border border-gray-800 rounded-lg text-xs font-mono text-gray-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all placeholder:text-gray-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-purple-400" />
                  <span>Password</span>
                </label>
                <input
                  type="password"
                  value={localPassword}
                  onChange={(e) => {
                    setLocalPassword(e.target.value);
                    clearError();
                  }}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 bg-[#090b10] border border-gray-800 rounded-lg text-xs font-mono text-gray-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all placeholder:text-gray-600"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLocalUsername('admin');
                    setLocalPassword('admin123');
                    clearError();
                  }}
                  className="py-1 px-2.5 text-[10px] font-mono rounded bg-gray-900 border border-gray-800 text-gray-300 hover:border-purple-500/50 hover:text-purple-300 transition-colors"
                >
                  Quick Fill (admin)
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading || !localUsername.trim() || !localPassword.trim()}
                className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-950/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    <span>Local Console Login</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Air-Gap Sovereignty Guarantees Footer Badges */}
        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-gray-400">
          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-[#0d1017] border border-gray-800/60">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>100% Air-Gapped Auth</span>
          </div>
          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-[#0d1017] border border-gray-800/60">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>MRPL Root CA Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
}
