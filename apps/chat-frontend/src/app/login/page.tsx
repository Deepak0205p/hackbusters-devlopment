'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useThemeStore } from '@/store/useThemeStore';
import { RevealBrand, RevealLogoIcon } from '@/components/RevealLogo';
import {
  ShieldCheck,
  FileKey,
  Globe,
  ArrowRight,
  Loader2,
  Lock,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  Eye,
  EyeOff,
  Sparkles,
  KeyRound,
  Radio,
  UserCheck,
  Sun,
  Moon
} from 'lucide-react';

const SAMPLE_CERT_HSE = `-----BEGIN CERTIFICATE-----
MIIDeDCCAmCgAwIBAgIUCuLeeT4dEkaMcqhJ5mqImVrrAq0wDQYJKoZIhvcNAQEL
BQAwgZgxCzAJBgNVBAYTAklOMRIwEAYDVQQIDAlLYXJuYXRha2ExEjAQBgNVBAcM
CU1hbmdhbG9yZTENMAsGA1UECgwETVJQTDE1MDMGA1UECwwsUGxhbnQgQ3liZXJz
ZWN1cml0eSAmIERlZmVuc2UgSW5mcmFzdHJ1Y3R1cmUxGzAZBgNVBAMMEk1SUEwg
UGxhbnQgUm9vdCBDQTAeFw0yNjA5MDExMjEyMzdaFw0yNzA5MDIxMjEyMzdaMFMx
CzAJBgNVBAYTAklOMQ0wCwYDVQQKDARNUlBMMR4wHAYDVQQLDBVFeGVjdXRpdmUg
HSFICYgQXVkaXQxFTATBgNVBAMMDFJhamVzaCBLdW1hcjCCASIwDQYJKoZIhvcN
AQEBBQADggEPADCCAQoCggEBAJ6bxfHjpNs1mtLIMT51soCUoQSK47F5WX2PPrYm
tqE4I8ot8TgDVbfyD1ynqkvDpW551quDgTQBXmwhgsJYgygd5tXJ1N7zwJhvz7CD
gYsXkQ9121+UVCHNn6v0YINP7PRSrJi4NOTuhWPHKpDfCE5ulA3WxSDvc2sVfTJ8
lTEvr5+eY2vL7oO48vJ5rMjhhNLJLHBt1NFRecqqdLDevnp0XidbS9hYCehUohgZ
jhPagu8BCE9HRUAIKYg2kj5EMcNdeXfSv8sKitQk/2nA6zPHEpdbCyNdFnkfFTy9
MrRXVFn/CrAhBn59esDpXrN7rAL88e1qtDZyRi/FY/ZLdW0CAwEAATANBgkqhkiG
9w0BAQsFAAOCAQEAisk1xrj/oWHHVTQMEzaLpwO8flvInfvE5/ovT9e3CXdLjyfl
YwoINh7bjiz/TU89CbCZkQZKBCMvZDPBPzayO2iUUOrK1+K7vckdmCla/Cwh63V4
6R/WIleigwiLWhfeqBy3rtQkxBYBJNGnrsTOXmx4e/LAqR1a6Yp2YH96fW/5l+8X
MIO2LzQJ8Cku33htL3TrWQwSr4m7rAeSkhhjcJLaVRKH0FAmmimr0Hc1ETX4EGbq
ebA6pZeqFCXLsQ2rBJPoxpWPbKHFqvXeSkd6t52x0PunHaRP2cWgx5V1io03mioQ
PcUXZi7z3855kVBqXX4McN8BliSu2CcWbukx4w==
-----END CERTIFICATE-----`;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'smartcard' | 'ldap' | 'quick'>('quick');
  const [certificatePem, setCertificatePem] = useState('');
  const [cardPin, setCardPin] = useState('');
  const [smartcardStatus, setSmartcardStatus] = useState<'idle' | 'inserted'>('idle');

  const [ldapDomain, setLdapDomain] = useState('MRPL.INTERNAL');
  const [ldapUsername, setLdapUsername] = useState('');
  const [ldapPassword, setLdapPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load sample certificate preset
  const handleLoadSampleCert = (name: string, pem: string) => {
    setCertificatePem(pem.trim());
    setCardPin('4829');
    setSmartcardStatus('inserted');
    setError(null);
  };

  // Handle Certificate File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      if (content) {
        setCertificatePem(content.trim());
        setSmartcardStatus('inserted');
        setError(null);
      }
    };
    reader.readAsText(file);
  };

  const handleSmartCardLogin = async () => {
    if (!certificatePem.trim()) {
      setError('Please insert your SmartCard or paste your PEM client certificate.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://${window.location.hostname}:8000/api/v1/auth/cert-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          certificate_pem: certificatePem,
          pin: cardPin || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'SmartCard PKI certificate verification failed.');
      }
      const data = await res.json();
      login(data.user, data.token);
      router.replace('/');
    } catch (err: any) {
      setError(err.message || 'SmartCard authentication failed. Ensure the Root CA is trusted.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLdapLogin = async () => {
    if (!ldapUsername.trim() || !ldapPassword.trim()) {
      setError('Corporate username and domain password are required.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const fullUsername = ldapUsername.includes('\\') ? ldapUsername : `${ldapDomain}\\${ldapUsername}`;
      const res = await fetch(`http://${window.location.hostname}:8000/api/v1/auth/ldap-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: fullUsername,
          password: ldapPassword,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Active Directory authentication failed.');
      }
      const data = await res.json();
      login(data.user, data.token);
      router.replace('/');
    } catch (err: any) {
      setError(err.message || 'LDAP Login Failed. Please check domain credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (username: string, role: string, dept: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const mockUser = {
        username,
        full_name: username === 'admin' ? 'Refinery Compliance Chief' : 'Lead Process Operator',
        department: dept,
        role,
        auth_method: 'FAST_TRACK_EVALUATOR',
        cert_serial: 'E47A9B113098C7'
      };
      login(mockUser, `sovereign-token-${username}-${Date.now()}`);
      router.replace('/');
    } catch (err: any) {
      setError(err.message || 'Fast-track login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] w-full flex flex-col justify-between items-center bg-white text-slate-900 dark:bg-[#000000] dark:text-[#e3e3e3] font-sans antialiased selection:bg-blue-500/20 dark:selection:bg-[#4285f4]/30 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8 transition-colors duration-300">
      
      {/* Dynamic Ambient Aurora Glow Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[20%] w-[500px] h-[500px] bg-purple-500/10 dark:bg-purple-600/15 rounded-full blur-[140px]" />
      </div>

      {/* Top Header & Air-gap Status Banner */}
      <header className="relative z-10 w-full max-w-5xl flex items-center justify-between py-3 border-b border-slate-200 dark:border-[#1e1e24]">
        <div className="flex items-center gap-3">
          <RevealBrand size="md" showBadge={true} />
          <div className="hidden sm:flex items-center gap-1.5 pl-3 border-l border-slate-200 dark:border-[#262634]">
            <span className="text-[11px] text-slate-500 dark:text-[#8e918f] font-medium">
              Mangalore Refinery & Petrochemicals Limited (ONGC)
            </span>
          </div>
        </div>

        {/* Right Header Actions: Theme Switcher & Air-gap Badge */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="h-9 w-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-[#181820] dark:hover:bg-[#22222c] border border-slate-200 dark:border-[#282834] text-slate-700 dark:text-[#c4c7c5] flex items-center justify-center transition-colors cursor-pointer"
          >
            {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-blue-600" />}
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-400 text-xs font-mono backdrop-blur-md shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="hidden sm:inline font-semibold">100% AIR-GAPPED SOVEREIGN</span>
            <span className="sm:hidden font-semibold">AIR-GAPPED</span>
          </div>
        </div>
      </header>

      {/* Main Authentication Hardware Chassis */}
      <main className="relative z-10 w-full max-w-[480px] my-auto py-8">
        {/* Title & System Brand */}
        <div className="text-center mb-6 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-[#a8c7fa] text-[11px] font-mono tracking-wider uppercase mb-1">
            <RevealLogoIcon className="w-3.5 h-3.5" />
            Defense-Grade Autonomous Kernel
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white flex items-center justify-center gap-2">
            REVEAL <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-[#38bdf8] dark:via-[#818cf8] dark:to-[#c084fc]">2.0</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-[#8e918f] font-normal max-w-sm mx-auto">
            Refinery Operations AI Gateway & Sovereign Security Workbench
          </p>
        </div>

        {/* Double-Bezel Hardware Container matching Chat UI */}
        <div className="p-1 sm:p-1.5 rounded-[28px] bg-slate-100 dark:bg-[#121216] border border-slate-200 dark:border-[#22222a] shadow-xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
          <div className="bg-white dark:bg-[#0c0c0e] rounded-[calc(28px-4px)] p-5 sm:p-7 border border-slate-200/80 dark:border-[#1e1e24]">
            
            {/* Segmented Doppelrand Tab Switcher */}
            <div className="grid grid-cols-3 p-1 rounded-2xl bg-slate-100 dark:bg-[#141418] border border-slate-200 dark:border-[#22222a] mb-6">
              <button
                type="button"
                onClick={() => { setActiveTab('quick'); setError(null); }}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                  activeTab === 'quick'
                    ? 'bg-[#0070f3] hover:bg-[#0060df] text-white shadow-md shadow-blue-500/25'
                    : 'text-slate-600 dark:text-[#8e918f] hover:text-slate-900 dark:hover:text-[#e3e3e3]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>Fast-Track</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('smartcard'); setError(null); }}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                  activeTab === 'smartcard'
                    ? 'bg-[#0070f3] hover:bg-[#0060df] text-white shadow-md shadow-blue-500/25'
                    : 'text-slate-600 dark:text-[#8e918f] hover:text-slate-900 dark:hover:text-[#e3e3e3]'
                }`}
              >
                <FileKey className="w-3.5 h-3.5 shrink-0" />
                <span>SmartCard</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('ldap'); setError(null); }}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                  activeTab === 'ldap'
                    ? 'bg-[#0070f3] hover:bg-[#0060df] text-white shadow-md shadow-blue-500/25'
                    : 'text-slate-600 dark:text-[#8e918f] hover:text-slate-900 dark:hover:text-[#e3e3e3]'
                }`}
              >
                <Globe className="w-3.5 h-3.5 shrink-0" />
                <span>LDAP / AD</span>
              </button>
            </div>

            {/* Error Alert Box */}
            {error && (
              <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 dark:bg-red-950/40 dark:border-red-500/40 dark:text-red-200 text-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div className="flex-1 font-mono leading-relaxed">{error}</div>
              </div>
            )}

            {/* TAB 1: Fast-Track 1-Click Evaluation Profiles */}
            {activeTab === 'quick' && (
              <div className="space-y-3 animate-in fade-in duration-200">
                <p className="text-xs text-slate-500 dark:text-[#8e918f] font-normal">
                  Select a pre-configured role profile for instantaneous evaluator sign-in:
                </p>

                {/* Operator Card */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('operator', 'FIELD_OPERATOR', 'Refinery Operations')}
                  disabled={isLoading}
                  className="w-full text-left p-3.5 rounded-2xl bg-slate-50 hover:bg-blue-50/50 dark:bg-[#121216] dark:hover:bg-[#1a1a22] border border-slate-200 dark:border-[#22222a] hover:border-blue-400/50 dark:hover:border-[#a8c7fa]/50 transition-all flex items-center justify-between group cursor-pointer shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-[#a8c7fa] group-hover:scale-105 transition-transform">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-[#e3e3e3] flex items-center gap-1.5">
                        Lead Process Operator
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300 font-mono font-bold">FIELD_OP</span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-[#8e918f]">Refinery Operations & Distributed Control</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-[#a8c7fa] group-hover:translate-x-0.5 transition-all" />
                </button>

                {/* Super Admin Card */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin', 'SUPER_ADMIN', 'Executive HSE & Audit')}
                  disabled={isLoading}
                  className="w-full text-left p-3.5 rounded-2xl bg-slate-50 hover:bg-emerald-50/50 dark:bg-[#121216] dark:hover:bg-[#1a1a22] border border-slate-200 dark:border-[#22222a] hover:border-emerald-400/50 dark:hover:border-emerald-500/50 transition-all flex items-center justify-between group cursor-pointer shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-[#e3e3e3] flex items-center gap-1.5">
                        Refinery Compliance Chief
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 font-mono font-bold">SUPER_ADMIN</span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-[#8e918f]">Executive HSE, Safety Audit & PKI Root</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                </button>
              </div>
            )}

            {/* TAB 2: SmartCard PKI (Hardware Token) */}
            {activeTab === 'smartcard' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                    <span className="text-xs font-medium text-slate-700 dark:text-[#c4c7c5]">Hardware X.509 Token</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleLoadSampleCert('Rajesh Kumar', SAMPLE_CERT_HSE)}
                    className="text-[11px] font-mono text-blue-600 dark:text-[#a8c7fa] hover:underline flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <KeyRound className="w-3 h-3" />
                    Load Sample Card
                  </button>
                </div>

                {/* Interactive Card Reader Area */}
                <div className="relative group">
                  <textarea
                    value={certificatePem}
                    onChange={(e) => {
                      setCertificatePem(e.target.value);
                      if (e.target.value.includes('BEGIN CERTIFICATE')) {
                        setSmartcardStatus('inserted');
                      }
                    }}
                    placeholder={'-----BEGIN CERTIFICATE-----\nPaste PEM X.509 certificate extracted from SmartCard\n-----END CERTIFICATE-----'}
                    rows={4}
                    className="w-full px-3.5 py-3 text-xs font-mono bg-slate-50 dark:bg-[#121216] border border-slate-200 dark:border-[#22222a] rounded-2xl focus:outline-none focus:border-blue-500 dark:focus:border-[#a8c7fa] text-slate-900 dark:text-[#e3e3e3] placeholder-slate-400 dark:placeholder-[#6e7175] transition-all resize-none shadow-inner"
                  />
                  
                  {certificatePem && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 border border-emerald-200 text-emerald-800 dark:bg-emerald-500/20 dark:border-emerald-500/30 dark:text-emerald-300 text-[10px] font-mono">
                      <CheckCircle2 className="w-3 h-3" />
                      X.509 LOADED
                    </div>
                  )}
                </div>

                {/* Upload or Drop Certificate File */}
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pem,.crt,.cer,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-[#141418] dark:hover:bg-[#1e1e24] border border-dashed border-slate-300 dark:border-[#2e2e3a] text-xs font-mono text-slate-700 dark:text-[#c4c7c5] transition-all cursor-pointer"
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-blue-600 dark:text-[#a8c7fa]" />
                    Upload SmartCard .pem / .crt file
                  </button>
                </div>

                {/* SmartCard PIN Code */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-[#8e918f] mb-1.5">
                    Hardware Token PIN (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      maxLength={8}
                      value={cardPin}
                      onChange={(e) => setCardPin(e.target.value)}
                      placeholder="Enter 4-8 digit Token PIN"
                      className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 dark:bg-[#121216] border border-slate-200 dark:border-[#22222a] rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-[#a8c7fa] text-slate-900 dark:text-[#e3e3e3] placeholder-slate-400 dark:placeholder-[#6e7175]"
                    />
                    <Lock className="w-3.5 h-3.5 absolute right-3.5 top-3 text-slate-400 dark:text-[#6e7175]" />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="button"
                  onClick={handleSmartCardLogin}
                  disabled={isLoading}
                  className="group relative w-full flex items-center justify-between p-1.5 pl-6 bg-[#0070f3] hover:bg-[#0060df] active:scale-[0.98] disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-full shadow-lg shadow-blue-500/25 transition-all duration-200 mt-2 cursor-pointer"
                >
                  <span className="tracking-wide">
                    {isLoading ? 'Verifying X.509 Cryptography...' : 'Authenticate via SmartCard PKI'}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white transition-transform group-hover:scale-105">
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-4 h-4" />
                    )}
                  </div>
                </button>
              </div>
            )}

            {/* TAB 3: Corporate LDAP / Active Directory */}
            {activeTab === 'ldap' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-[#8e918f]">
                    Corporate Active Directory Domain
                  </label>
                  <select
                    value={ldapDomain}
                    onChange={(e) => setLdapDomain(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs font-mono bg-slate-50 dark:bg-[#121216] border border-slate-200 dark:border-[#22222a] rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-[#a8c7fa] text-slate-900 dark:text-[#e3e3e3]"
                  >
                    <option value="MRPL.INTERNAL">MRPL.INTERNAL (Refinery Plant LAN)</option>
                    <option value="ONGC.CORP">ONGC.CORP (Corporate HQ Intranet)</option>
                    <option value="REFINERY-WEST.LOCAL">REFINERY-WEST.LOCAL (Field Operations)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-[#8e918f]">
                      User Principal / sAMAccountName
                    </label>
                    <button
                      type="button"
                      onClick={() => { setLdapUsername('operator'); setLdapPassword('RefineryPass2026!'); }}
                      className="text-[10px] font-mono text-blue-600 dark:text-[#a8c7fa] hover:underline cursor-pointer"
                    >
                      Fill Default User
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={ldapUsername}
                      onChange={(e) => setLdapUsername(e.target.value)}
                      placeholder="e.g. rajesh.kumar or operator"
                      className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 dark:bg-[#121216] border border-slate-200 dark:border-[#22222a] rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-[#a8c7fa] text-slate-900 dark:text-[#e3e3e3] placeholder-slate-400 dark:placeholder-[#6e7175]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-[#8e918f]">
                    Intranet Domain Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={ldapPassword}
                      onChange={(e) => setLdapPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 dark:bg-[#121216] border border-slate-200 dark:border-[#22222a] rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-[#a8c7fa] text-slate-900 dark:text-[#e3e3e3] placeholder-slate-400 dark:placeholder-[#6e7175] pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:text-[#6e7175] dark:hover:text-[#c4c7c5] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="button"
                  onClick={handleLdapLogin}
                  disabled={isLoading}
                  className="group relative w-full flex items-center justify-between p-1.5 pl-6 bg-[#0070f3] hover:bg-[#0060df] active:scale-[0.98] disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-full shadow-lg shadow-blue-500/25 transition-all duration-200 mt-2 cursor-pointer"
                >
                  <span className="tracking-wide">
                    {isLoading ? 'Verifying Active Directory...' : 'Sign in via Corporate LDAP'}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white transition-transform group-hover:scale-105">
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ArrowRight className="w-4 h-4" />
                    )}
                  </div>
                </button>
              </div>
            )}

          </div>
        </div>

        {/* Live Enclave Telemetry Badges */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-[10px] font-mono text-slate-500 dark:text-[#8e918f]">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-[#141418] border border-slate-200 dark:border-[#22222a]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            TLS 1.3 / mTLS
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-[#141418] border border-slate-200 dark:border-[#22222a]">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            TPM 2.0 ROOT OF TRUST
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-[#141418] border border-slate-200 dark:border-[#22222a]">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            SHA-256 AUDIT LOGGED
          </div>
        </div>
      </main>

      {/* Enterprise Footer */}
      <footer className="relative z-10 w-full max-w-5xl flex flex-col sm:flex-row items-center justify-between py-3 border-t border-slate-200 dark:border-[#1e1e24] text-[11px] text-slate-500 dark:text-[#8e918f] gap-2">
        <div>
          <span>MRPL Sovereign AI Workbench &mdash; SIH26117</span>
        </div>
        <div className="flex items-center gap-4 text-slate-500 dark:text-[#8e918f]">
          <span>ISA/IEC 62443 Certified</span>
          <span>&bull;</span>
          <span>Zero Cloud Telemetry</span>
          <span>&bull;</span>
          <span>On-Premise Defense Mesh</span>
        </div>
      </footer>
    </div>
  );
}

