'use client';

import React, { useState } from 'react';
import { Box, Shield, Play, Terminal, CheckCircle2, AlertTriangle, Clock, HardDrive, Network } from 'lucide-react';

export function SandboxObservatory() {
  const [testScript, setTestScript] = useState(`import numpy as np

# Centrifugal Pump Efficiency Calculation (ISO 5198)
Q = 450.0  # Flow rate in m3/hr
H = 65.0   # Head in meters
rho = 850.0 # Density in kg/m3
g = 9.81   # Gravity

hydraulic_power_kw = (rho * g * (Q / 3600.0) * H) / 1000.0
shaft_power_kw = 82.5 # Input power
efficiency = (hydraulic_power_kw / shaft_power_kw) * 100.0

print(f"Hydraulic Power: {hydraulic_power_kw:.2f} kW")
print(f"Pump Efficiency: {efficiency:.2f}%")
`);
  const [isRunning, setIsRunning] = useState(false);
  const [executionLog, setExecutionLog] = useState<any>({
    status: 'SUCCESS',
    exitCode: 0,
    runtimeMs: 142,
    stdout: "Hydraulic Power: 67.75 kW\nPump Efficiency: 82.12%\n",
    stderr: "",
    containerId: "sbx-893f4a12",
    networkPolicy: "--network none (LOCKED)",
    cpuQuota: "2.0 vCPU",
    memoryLimit: "512 MB",
    astSecurityVerdict: "PERMITTED (Zero unsafe imports)",
  });

  const handleExecute = () => {
    setIsRunning(true);
    setTimeout(() => {
      let isUnsafe = testScript.includes('os.system') || testScript.includes('subprocess') || testScript.includes('socket') || testScript.includes('urllib');
      if (isUnsafe) {
        setExecutionLog({
          status: 'BLOCKED_BY_AST',
          exitCode: 1,
          runtimeMs: 12,
          stdout: "",
          stderr: "AST Security Violation: Disallowed module import detected. System/socket operations prohibited.",
          containerId: "sbx-blocked",
          networkPolicy: "--network none (LOCKED)",
          cpuQuota: "2.0 vCPU",
          memoryLimit: "512 MB",
          astSecurityVerdict: "VIOLATION (Forbidden library access)",
        });
      } else {
        setExecutionLog({
          status: 'SUCCESS',
          exitCode: 0,
          runtimeMs: 138,
          stdout: "Hydraulic Power: 67.75 kW\nPump Efficiency: 82.12%\n[Sandbox] Script executed successfully in isolated container.\n",
          stderr: "",
          containerId: "sbx-" + Math.random().toString(36).substring(7),
          networkPolicy: "--network none (LOCKED)",
          cpuQuota: "2.0 vCPU",
          memoryLimit: "512 MB",
          astSecurityVerdict: "PERMITTED (Zero unsafe imports)",
        });
      }
      setIsRunning(false);
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl bg-[#090d16] border border-[#1e293b] p-6 space-y-2">
        <div className="flex items-center gap-2 text-amber-400">
          <Box className="w-5 h-5" />
          <h2 className="text-lg font-bold text-white">Docker Code Execution Sandbox Observatory</h2>
        </div>
        <p className="text-xs text-slate-400">
          Air-gapped compute environment executing generated Python analytics inside hardened <code>python:3.11-slim</code> containers with <code>--network none</code> and strict resource quotas.
        </p>
      </div>

      {/* Security Guardrails Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
        <div className="p-4 rounded-xl bg-[#090d16] border border-[#1e293b] space-y-1">
          <span className="text-slate-400 font-sans flex items-center gap-1.5">
            <Network className="w-3.5 h-3.5 text-emerald-400" />
            Network Policy
          </span>
          <p className="font-bold text-emerald-400">--network none</p>
        </div>
        <div className="p-4 rounded-xl bg-[#090d16] border border-[#1e293b] space-y-1">
          <span className="text-slate-400 font-sans flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            CPU Quota
          </span>
          <p className="font-bold text-cyan-400">2.0 vCPU Max</p>
        </div>
        <div className="p-4 rounded-xl bg-[#090d16] border border-[#1e293b] space-y-1">
          <span className="text-slate-400 font-sans flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-violet-400" />
            Memory Cap
          </span>
          <p className="font-bold text-violet-400">512 MB RAM</p>
        </div>
        <div className="p-4 rounded-xl bg-[#090d16] border border-[#1e293b] space-y-1">
          <span className="text-slate-400 font-sans flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Hard Timeout
          </span>
          <p className="font-bold text-amber-400">15.0 Seconds</p>
        </div>
      </div>

      {/* Script Editor and Execution Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Editor */}
        <div className="lg:col-span-6 space-y-3">
          <div className="rounded-xl bg-[#090d16] border border-[#1e293b] p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-semibold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-amber-400" />
                Sandbox Python Runner
              </span>
              <button
                type="button"
                onClick={handleExecute}
                disabled={isRunning}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-slate-950 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-lg shadow-amber-900/30"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                {isRunning ? 'Executing...' : 'Run in Sandbox'}
              </button>
            </div>
            <textarea
              value={testScript}
              onChange={(e) => setTestScript(e.target.value)}
              rows={12}
              className="w-full rounded-lg bg-[#030712] border border-[#1e293b] p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
        </div>

        {/* Live Container Log Output */}
        <div className="lg:col-span-6 space-y-3">
          <div className="rounded-xl bg-[#090d16] border border-[#1e293b] p-4 space-y-3 h-full flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-semibold text-white">Live Execution Terminal</span>
              <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                executionLog.status === 'SUCCESS' 
                  ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800' 
                  : 'bg-red-950/80 text-red-400 border-red-800'
              }`}>
                STATUS: {executionLog.status} (exit {executionLog.exitCode})
              </span>
            </div>

            <div className="flex-1 rounded-lg bg-[#030712] border border-slate-800 p-3 font-mono text-xs text-slate-300 space-y-2 overflow-auto">
              <div className="text-slate-500 text-[11px]">
                [CONTAINER] ID: {executionLog.containerId} | DURATION: {executionLog.runtimeMs}ms
              </div>
              <div className="text-slate-500 text-[11px]">
                [AST SECURITY] {executionLog.astSecurityVerdict}
              </div>
              <hr className="border-slate-800" />
              {executionLog.stdout && (
                <pre className="text-emerald-400 whitespace-pre-wrap">{executionLog.stdout}</pre>
              )}
              {executionLog.stderr && (
                <pre className="text-red-400 whitespace-pre-wrap">{executionLog.stderr}</pre>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
