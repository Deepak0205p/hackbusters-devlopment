'use client';

import React, { useState, useEffect } from 'react';
import { Box, Play, Terminal, Clock, HardDrive, Network, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';

export function SandboxObservatory() {
  const [testScript, setTestScript] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [executionLog, setExecutionLog] = useState<any>(null);
  const [sandboxConfig, setSandboxConfig] = useState({
    status: 'ONLINE',
    active_backend: 'hardened_isolated_subprocess',
    image_name: 'mrpl-sandbox-runtime:latest',
    network_isolation: 'STRICT_NONE',
    memory_limit: '512m',
    cpu_quota: 2.0,
    timeout_seconds: 15.0,
    ast_screener_rules: 24,
    docker_available: false,
    image_present: false
  });

  useEffect(() => {
    api.get<any>('/api/sandbox/status')
      .then(data => {
        if (data) {
          setSandboxConfig({
            status: data.status || 'ONLINE',
            active_backend: data.active_backend || 'hardened_isolated_subprocess',
            image_name: data.image_name || 'python:3.11',
            network_isolation: data.network_isolation || 'STRICT_NONE',
            memory_limit: data.memory_limit || '512m',
            cpu_quota: data.cpu_quota || 2.0,
            timeout_seconds: data.timeout_seconds || 15.0,
            ast_screener_rules: data.ast_screener_rules || 24,
            docker_available: Boolean(data.docker_available),
            image_present: Boolean(data.image_present)
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleExecute = async () => {
    if (!testScript.trim()) return;
    setIsRunning(true);

    try {
      const data = await api.post<any>('/api/sandbox/execute', {
        code: testScript,
        timeout_seconds: sandboxConfig.timeout_seconds
      });

      setExecutionLog({
        status: data.success ? 'SUCCESS' : (data.security_verdict === 'BLOCKED' ? 'BLOCKED_BY_AST' : 'FAILED'),
        exitCode: data.exit_code ?? 0,
        runtimeMs: data.duration_ms ?? 0,
        stdout: data.stdout || '',
        stderr: data.stderr || '',
        containerId: data.sha256_hash ? `sbx-${data.sha256_hash.substring(0, 10)}` : `sbx-${data.execution_engine || 'subproc'}`,
        networkPolicy: data.network_mode === 'none' ? '--network none (LOCKED)' : data.network_mode,
        cpuQuota: `${sandboxConfig.cpu_quota} vCPU`,
        memoryLimit: `${sandboxConfig.memory_limit}`.toUpperCase(),
        astSecurityVerdict: data.ast_screening?.is_safe === false
          ? `VIOLATION: ${data.ast_screening?.violations?.join(', ')}`
          : (data.security_verdict || 'PERMITTED'),
        engine: data.execution_engine || sandboxConfig.active_backend
      });
    } catch (err: any) {
      setExecutionLog({
        status: 'ERROR',
        exitCode: 1,
        runtimeMs: 0,
        stdout: '',
        stderr: err?.message || 'Execution error: Unable to connect to sandbox runtime service.',
        containerId: 'sbx-error',
        networkPolicy: '--network none (LOCKED)',
        cpuQuota: `${sandboxConfig.cpu_quota} vCPU`,
        memoryLimit: `${sandboxConfig.memory_limit}`.toUpperCase(),
        astSecurityVerdict: 'UNKNOWN',
        engine: sandboxConfig.active_backend
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-4 font-sans text-gray-900">
      {/* Header Banner */}
      <div className="rounded-md bg-gray-50 border border-gray-200 p-5 space-y-1.5">
        <div className="flex items-center gap-2 text-gray-900">
          <Box className="w-4 h-4 text-amber-600" />
          <h2 className="text-sm font-semibold text-gray-900">Code Sandbox</h2>
        </div>
        <p className="text-xs text-gray-500">
          Isolated runtime environment for engineering workloads and mathematical modeling, featuring compile-time Abstract Syntax Tree (AST) validation and kernel-level zero-egress containment to prevent unauthorized network traffic and arbitrary code execution.
        </p>
      </div>

      {/* Main Execution Bench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Code Editor Simulator */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-md bg-gray-50 border border-gray-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-amber-600" />
                Python Script
              </h3>
              
            </div>

            <textarea
              value={testScript}
              onChange={(e) => setTestScript(e.target.value)}
              placeholder="Enter or paste Python script to execute safely..."
              rows={11}
              className="w-full rounded bg-white border border-gray-200 p-3 text-xs text-gray-900 font-mono focus:outline-none focus:border-gray-400 transition-colors resize-none leading-relaxed placeholder:text-gray-400"
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] font-mono text-gray-400">
                {testScript ? `${testScript.split('\n').length} lines | ${testScript.length} chars` : 'Ready'}
              </span>

              <button
                type="button"
                onClick={handleExecute}
                disabled={isRunning || !testScript.trim()}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black font-semibold text-xs rounded transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Executing...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-black" />
                    <span>R U N</span>
                  </>
                )}
              </button>
            </div>
          </div>

          </div>
          

        {/* Right: Terminal Output & Logs */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-md bg-gray-50 border border-gray-200 p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-gray-500" />
                Output
              </h3>
              {executionLog && (
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${
                  executionLog.status === 'SUCCESS'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {executionLog.status}
                </span>
              )}
            </div>

            {executionLog ? (
              <>
                <div className="bg-white rounded p-3 border border-gray-200 font-mono text-xs text-gray-900 min-h-[160px] whitespace-pre-wrap leading-relaxed">
                  {executionLog.stdout && <div>{executionLog.stdout}</div>}
                  {executionLog.stderr && <div className="text-red-600">{executionLog.stderr}</div>}
                </div>

                <div className="space-y-2 text-xs pt-1">
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-500">AST Policy Check</span>
                    <span className={`font-mono text-[11px] ${executionLog.status === 'SUCCESS' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {executionLog.astSecurityVerdict}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-500">Execution Runtime</span>
                    <span className="font-mono text-[11px] text-gray-900">{executionLog.runtimeMs} ms</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">Sandbox ID</span>
                    <span className="font-mono text-[11px] text-gray-500">{executionLog.containerId}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-xs text-gray-400 font-mono flex flex-col items-center justify-center space-y-2">
                <Terminal className="w-6 h-6 text-gray-300" />
                <p>No sandbox execution initiated. Enter code and click "Run in Sandbox" to execute.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
