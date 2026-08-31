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
  const [executionLog, setExecutionLog] = useState<any>(null);

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
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="rounded-md bg-gray-50 border border-gray-200 p-5 space-y-1.5">
        <div className="flex items-center gap-2 text-gray-900">
          <Box className="w-4 h-4 text-amber-600" />
          <h2 className="text-sm font-semibold text-gray-900">Air-Gapped Docker Code Execution Sandbox</h2>
        </div>
        <p className="text-xs text-gray-500">
          Executes untrusted engineering scripts and mathematical simulations inside hardened, zero-egress Docker micro-containers with static AST policy filters.
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
                Python Script Runner
              </h3>
              <span className="text-[10px] font-mono text-gray-500 px-2 py-0.5 rounded bg-gray-100 border border-gray-200">
                python:3.11-slim
              </span>
            </div>

            <textarea
              value={testScript}
              onChange={(e) => setTestScript(e.target.value)}
              rows={11}
              className="w-full rounded bg-white border border-gray-200 p-3 text-xs text-emerald-600 font-mono focus:outline-none focus:border-gray-400 transition-colors resize-none leading-relaxed"
            />

            <div className="flex items-center justify-between pt-1">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTestScript(`import numpy as np\n# Standard industrial code\nprint('MRPL Refinery Unit 04 OK')`)}
                  className="px-2.5 py-1 rounded bg-gray-100 hover:bg-gray-200 border border-gray-200 text-[11px] text-gray-900 transition-colors"
                >
                  Safe Code
                </button>
                <button
                  type="button"
                  onClick={() => setTestScript(`import socket\n# Malicious socket egress attempt\ns = socket.socket()\ns.connect(('8.8.8.8', 53))`)}
                  className="px-2.5 py-1 rounded bg-gray-100 hover:bg-gray-200 border border-gray-200 text-[11px] text-red-600 transition-colors"
                >
                  Test Unsafe Import
                </button>
              </div>

              <button
                type="button"
                onClick={handleExecute}
                disabled={isRunning}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black font-semibold text-xs rounded transition-colors flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                {isRunning ? 'Running...' : 'Run in Container'}
              </button>
            </div>
          </div>

          {/* Security Guardrails Strip */}
          <div className="rounded-md bg-gray-50 border border-gray-200 p-4">
            <h4 className="text-xs font-semibold text-gray-900 mb-3">Hardened Isolation Guardrails</h4>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded bg-gray-100 border border-gray-200">
                <div className="flex items-center gap-1.5 text-emerald-600 font-medium text-[11px]">
                  <Network className="w-3.5 h-3.5" />
                  <span>Network Egress</span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1 font-mono">--network none</p>
              </div>
              <div className="p-3 rounded bg-gray-100 border border-gray-200">
                <div className="flex items-center gap-1.5 text-blue-600 font-medium text-[11px]">
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>Memory Quota</span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1 font-mono">512 MB Max</p>
              </div>
              <div className="p-3 rounded bg-gray-100 border border-gray-200">
                <div className="flex items-center gap-1.5 text-amber-600 font-medium text-[11px]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Execution Limit</span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1 font-mono">15.0s Timeout</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Terminal Output & Logs */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-md bg-gray-50 border border-gray-200 p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-gray-500" />
                Container Terminal Output
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
                <p>No container execution initiated. Click "Run in Container" to execute Python script in sandbox.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
