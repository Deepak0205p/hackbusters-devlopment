'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useThemeStore } from '@/store/useThemeStore';
import { RevealBrand, RevealLogoIcon } from '@/components/RevealLogo';
import {
  ShieldCheck,
  ArrowRight,
  Loader2,
  Lock,
  User,
  AlertCircle,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Building2,
  KeyRound,
  CheckCircle2
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both your Username and Password.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://${window.location.hostname}:8000/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Invalid username or password.');
      }
      const data = await res.json();
      login(data.user, data.token);
      router.replace('/');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillQuickUser = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div className="relative min-h-[100dvh] w-full flex flex-col justify-between bg-slate-50 text-slate-900 dark:bg-[#08080a] dark:text-[#e3e3e3] font-sans antialiased selection:bg-blue-500/20 dark:selection:bg-[#4285f4]/30 overflow-x-hidden transition-colors duration-300">
      
      {/* Dynamic Ambient Aurora Background matching Chat Header */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[25%] left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-gradient-to-b from-blue-500/10 via-purple-500/5 to-transparent dark:from-blue-600/15 dark:via-purple-600/10 dark:to-transparent rounded-full blur-[120px]" />
        <div className="absolute -bottom-[20%] right-[-10%] w-[600px] h-[400px] bg-emerald-500/5 dark:bg-emerald-600/10 rounded-full blur-[140px]" />
      </div>

      {/* Top Header & Air-gap Status Banner */}
      <header className="relative z-10 w-full max-w-7xl mx-auto flex items-center justify-between px-6 py-4 border-b border-slate-200/80 dark:border-white/[0.06] backdrop-blur-md">
        <div className="flex items-center gap-4">
          <RevealBrand size="md" showBadge={true} />
          <span className="hidden sm:inline-block h-4 w-[1px] bg-slate-300 dark:bg-white/10" />
          <div className="hidden sm:flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-slate-400 dark:text-[#8e918f]" />
            <span className="text-xs text-slate-500 dark:text-[#8e918f] font-medium tracking-tight">
              Mangalore Refinery and Petrochemicals Limited
            </span>
          </div>
        </div>

        {/* Right Header Actions: Theme Switcher & Air-gap Badge */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="h-9 w-9 rounded-full bg-white hover:bg-slate-100 dark:bg-[#141418] dark:hover:bg-[#1e1e24] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-[#c4c7c5] flex items-center justify-center transition-all shadow-xs cursor-pointer active:scale-95"
          >
            {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-blue-600" />}
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/25 dark:text-emerald-400 text-xs font-mono backdrop-blur-md shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="hidden sm:inline font-semibold">100% AIR-GAPPED</span>
            <span className="sm:hidden font-semibold">AIR-GAP</span>
          </div>
        </div>
      </header>

      {/* Main Authentication Section */}
      <main className="relative z-10 w-full max-w-md mx-auto my-auto px-4 py-8 sm:py-12 flex flex-col items-center">
        
        {/* Brand Hero Greeting */}
        <div className="text-center mb-8 space-y-3 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-[#141418] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-[#a8c7fa] text-xs font-mono shadow-xs">
            <RevealLogoIcon className="w-3.5 h-3.5" />
            <span>Industrial AI Gateway & Security Workbench</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-[#4285f4] dark:via-[#9b72cf] dark:to-[#d96570] bg-clip-text text-transparent">
            Sign In to REVEAL 2.0
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-[#8e918f] font-normal max-w-xs leading-relaxed">
            Enter your refinery operational credentials to access the sovereign intelligence workbench
          </p>
        </div>

        {/* Clean Modern Card Container */}
        <div className="w-full bg-white dark:bg-[#101115] rounded-3xl border border-slate-200/90 dark:border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.04),0_12px_48px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.6)] p-6 sm:p-8 backdrop-blur-xl">
          
          {/* Error Alert Box */}
          {error && (
            <div className="mb-5 p-3 rounded-2xl bg-red-50 border border-red-200/80 text-red-700 dark:bg-red-950/30 dark:border-red-500/30 dark:text-red-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed font-medium">{error}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#c4c7c5]">
                Username / Operator ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. operator or admin"
                  autoFocus
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 dark:bg-[#15161c] border border-slate-200 dark:border-white/[0.08] rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-[#a8c7fa] text-slate-900 dark:text-[#e3e3e3] placeholder-slate-400 dark:placeholder-[#6e7175] transition-all"
                />
                <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 dark:text-[#6e7175]" />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#c4c7c5]">
                Account Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 dark:bg-[#15161c] border border-slate-200 dark:border-white/[0.08] rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-[#a8c7fa] text-slate-900 dark:text-[#e3e3e3] placeholder-slate-400 dark:placeholder-[#6e7175] transition-all"
                />
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 dark:text-[#6e7175]" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:text-[#6e7175] dark:hover:text-[#c4c7c5] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Preset Helper Pills */}
            <div className="pt-1 flex items-center justify-between text-[11px]">
              <span className="text-slate-400 dark:text-[#8e918f]">Default Accounts:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fillQuickUser('operator', 'RefineryPass2026!')}
                  className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-blue-600 dark:text-[#a8c7fa] font-mono font-medium transition-colors cursor-pointer"
                >
                  operator
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickUser('admin', 'AdminPass2026!')}
                  className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-emerald-600 dark:text-emerald-400 font-mono font-medium transition-colors cursor-pointer"
                >
                  admin
                </button>
              </div>
            </div>

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#0070f3] hover:bg-[#0060df] active:scale-[0.98] disabled:opacity-50 text-white font-bold text-sm transition-all shadow-md shadow-blue-500/20 cursor-pointer mt-4"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Enclave</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

        </div>

        {/* Security Compliance Badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-[11px] font-mono text-slate-400 dark:text-[#8e918f]">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-[#121216] border border-slate-200 dark:border-white/[0.06] shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Argon2id Encrypted
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-[#121216] border border-slate-200 dark:border-white/[0.06] shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            XAMPP MySQL
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-[#121216] border border-slate-200 dark:border-white/[0.06] shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            SHA-256 Audited
          </div>
        </div>
      </main>

      {/* Enterprise Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-slate-200/80 dark:border-white/[0.06] text-xs text-slate-400 dark:text-[#8e918f] gap-2">
        <div className="flex items-center gap-2 font-medium">
          <span>MRPL Sovereign AI Workbench</span>
          <span>&bull;</span>
          <span className="font-mono">SIH26117</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span>ISA/IEC 62443 Certified</span>
          <span>&bull;</span>
          <span>Zero External Egress</span>
          <span>&bull;</span>
          <span>Air-Gapped Sovereign Mesh</span>
        </div>
      </footer>
    </div>
  );
}


