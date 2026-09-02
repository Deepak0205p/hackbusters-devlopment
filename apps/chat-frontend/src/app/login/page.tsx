'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { ShieldCheck, FileKey, Globe, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'smartcard' | 'ldap'>('smartcard');
  const [certificatePem, setCertificatePem] = useState('');
  const [ldapUsername, setLdapUsername] = useState('');
  const [ldapPassword, setLdapPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSmartCardLogin = async () => {
    if (!certificatePem.trim()) {
      setError('Please paste your PEM certificate from your smart card.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://${window.location.hostname}:8000/api/v1/auth/cert-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certificate_pem: certificatePem }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Certificate authentication failed');
      }
      const data = await res.json();
      login(data.user, data.token);
      router.replace('/');
    } catch (err: any) {
      setError(err.message || 'Smart card login failed. Ensure your PKI certificate is valid.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLdapLogin = async () => {
    if (!ldapUsername.trim() || !ldapPassword.trim()) {
      setError('Both username and password are required for LDAP login.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://${window.location.hostname}:8000/api/v1/auth/ldap-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: ldapUsername, password: ldapPassword }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'LDAP authentication failed');
      }
      const data = await res.json();
      login(data.user, data.token);
      router.replace('/');
    } catch (err: any) {
      setError(err.message || 'LDAP login failed. Verify your Active Directory credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0f] px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 text-xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            100% AIR-GAPPED SOVEREIGN
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">REVEAL 2.0</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            MRPL Sovereign AI Workbench — Operator Login
          </p>
        </div>

        <div className="bg-white dark:bg-[#111116] border border-gray-200 dark:border-white/[0.08] rounded-xl shadow-lg p-6">
          <div className="flex border-b border-gray-200 dark:border-white/[0.08] mb-6">
            <button
              onClick={() => { setActiveTab('smartcard'); setError(null); }}
              className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'smartcard'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileKey className="w-4 h-4 inline mr-1.5" />
              SmartCard PKI
            </button>
            <button
              onClick={() => { setActiveTab('ldap'); setError(null); }}
              className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'ldap'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Globe className="w-4 h-4 inline mr-1.5" />
              Corporate LDAP
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs">
              {error}
            </div>
          )}

          {activeTab === 'smartcard' ? (
            <div className="space-y-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Paste your PEM-encoded certificate extracted from your PKI smart card.
              </p>
              <textarea
                value={certificatePem}
                onChange={(e) => setCertificatePem(e.target.value)}
                placeholder={'-----BEGIN CERTIFICATE-----\nMIIE...\n-----END CERTIFICATE-----'}
                className="w-full h-32 px-3 py-2 text-xs font-mono bg-gray-50 dark:bg-[#0d0d12] border border-gray-200 dark:border-white/[0.08] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
              />
              <button
                onClick={handleSmartCardLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Authenticate via PKI Certificate
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Sign in with your Active Directory / corporate intranet credentials.
              </p>
              <input
                type="text"
                value={ldapUsername}
                onChange={(e) => setLdapUsername(e.target.value)}
                placeholder="DOMAIN\\username"
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-[#0d0d12] border border-gray-200 dark:border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
              />
              <input
                type="password"
                value={ldapPassword}
                onChange={(e) => setLdapPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-[#0d0d12] border border-gray-200 dark:border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
              />
              <button
                onClick={handleLdapLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Globe className="w-4 h-4" />
                    Sign in with LDAP
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-[11px] text-gray-400 dark:text-gray-600">
          MRPL Sovereign AI Workbench &mdash; SIH26117
        </p>
      </div>
    </div>
  );
}
