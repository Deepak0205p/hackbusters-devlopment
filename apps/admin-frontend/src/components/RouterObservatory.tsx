'use client';

import React, { useState } from 'react';
import { GitFork, Send, Sparkles, CheckCircle2, Clock, Cpu, FileCode2, RefreshCw, ShieldAlert, Building2 } from 'lucide-react';
import { api } from '@/lib/api';

export function RouterObservatory() {
  const [testQuery, setTestQuery] = useState('');
  const [isRouting, setIsRouting] = useState(false);
  const [routeResult, setRouteResult] = useState<any>(null);

  const handleSimulateRoute = async () => {
    if (!testQuery.trim()) return;
    setIsRouting(true);

    try {
      const data = await api.post<any>('/api/v1/router/evaluate', {
        query: testQuery
      });

      setRouteResult({
        domain: data.domain || 'GENERAL',
        targetModel: data.targetModel || 'qwen3-4b',
        stage1Match: Boolean(data.stage1Match),
        routedBy: data.routedBy || 'stage1_regex',
        totalLatencyMs: data.totalLatencyMs ?? 1.2,
        confidence: data.confidence ?? 0.95,
        isInScope: data.isInScope !== false,
        department: data.department,
        requiredTools: data.requiredTools || []
      });
    } catch (err: any) {
      // Graceful fallback if backend is offline
      setRouteResult({
        domain: 'ROUTER_OFFLINE',
        targetModel: 'Unknown (Backend Offline)',
        stage1Match: false,
        routedBy: 'error',
        totalLatencyMs: 0,
        confidence: 0,
        isInScope: true,
        department: null,
        requiredTools: []
      });
    } finally {
      setIsRouting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="rounded-md bg-gray-50 border border-gray-200 p-5 space-y-1.5">
        <div className="flex items-center gap-2 text-gray-900">
          <GitFork className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-semibold text-gray-900">Two-Stage Intelligent Query Router</h2>
        </div>
        <p className="text-xs text-gray-500">
          Determines optimal model routing and tool activation in &lt; 2ms via deterministic Stage 1 regex matching, falling back to sub-25ms Stage 2 BAAI/bge-small dense semantic centroids.
        </p>
      </div>

      {/* Interactive Simulator Bench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-md bg-gray-50 border border-gray-200 p-5 space-y-4">
            <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Live Route Simulator
            </h3>
            <div className="space-y-1.5">
              <label className="text-xs text-gray-500">Sample Prompt / Query</label>
              <textarea
                value={testQuery}
                onChange={(e) => setTestQuery(e.target.value)}
                rows={3}
                className="w-full rounded bg-gray-100 border border-gray-200 p-3 text-xs text-gray-900 font-mono focus:outline-none focus:border-gray-400 transition-colors"
                placeholder="Enter prompt (or click a quick preset below) to evaluate router decision..."
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTestQuery('Summarize SOP-MRPL-FURNACE-01 emergency shutdown sequence')}
                  className="px-2.5 py-1 rounded bg-gray-100 hover:bg-gray-200 border border-gray-200 text-[11px] text-gray-900 transition-colors"
                >
                  SOP Query
                </button>
                <button
                  type="button"
                  onClick={() => setTestQuery('Calculate head loss for centrifugal pump with specified flow rate')}
                  className="px-2.5 py-1 rounded bg-gray-100 hover:bg-gray-200 border border-gray-200 text-[11px] text-gray-900 transition-colors"
                >
                  Calculation
                </button>
              </div>
              <button
                type="button"
                onClick={handleSimulateRoute}
                disabled={isRouting || !testQuery.trim()}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium rounded transition-colors flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                {isRouting ? 'Evaluating...' : 'Simulate Route'}
              </button>
            </div>
          </div>

          {/* Router Benchmark Specs */}
          <div className="rounded-md bg-gray-50 border border-gray-200 p-4 space-y-3">
            <h4 className="text-xs font-semibold text-gray-900">Router Pipeline Specifications</h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded bg-gray-100 border border-gray-200 space-y-1">
                <span className="text-gray-500 font-mono text-[10px]">STAGE 1: DETERMINISTIC</span>
                <p className="font-medium text-gray-900">Regex & Tag Matching</p>
                <p className="text-[11px] text-gray-500">Latency: &lt; 2.0 ms (Zero GPU)</p>
              </div>
              <div className="p-3 rounded bg-gray-100 border border-gray-200 space-y-1">
                <span className="text-gray-500 font-mono text-[10px]">STAGE 2: EMBEDDING</span>
                <p className="font-medium text-gray-900">BAAI/bge-small-en-v1.5</p>
                <p className="text-[11px] text-gray-500">Latency: &lt; 25.0 ms (ONNX Local)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Route Decision Card */}
        <div className="lg:col-span-5">
          <div className="rounded-md bg-gray-50 border border-gray-200 p-5 space-y-4 h-full">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h3 className="text-xs font-semibold text-gray-900">Routing Decision</h3>
              {routeResult && (
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-medium">
                  {routeResult.domain}
                </span>
              )}
            </div>

            {routeResult ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded bg-gray-100 border border-gray-200">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-blue-600" />
                    <span className="text-xs text-gray-500">Target Model</span>
                  </div>
                  <span className="text-xs font-mono font-semibold text-gray-900">{routeResult.targetModel}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded bg-gray-100 border border-gray-200">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs text-gray-500">Total Latency</span>
                  </div>
                  <span className="text-xs font-mono font-semibold text-emerald-600">{routeResult.totalLatencyMs} ms</span>
                </div>

                {routeResult.department && (
                  <div className="flex items-center justify-between p-3 rounded bg-gray-100 border border-gray-200">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-purple-600" />
                      <span className="text-xs text-gray-500">Department</span>
                    </div>
                    <span className="text-xs font-medium text-gray-900">{routeResult.department.name}</span>
                  </div>
                )}

                <div className="flex items-center justify-between p-3 rounded bg-gray-100 border border-gray-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs text-gray-500">Routing Method</span>
                  </div>
                  <span className="text-xs font-mono font-medium text-gray-900">
                    {routeResult.stage1Match ? 'Stage 1 (Regex / Rule Match)' : 'Stage 2 (Dense Centroid)'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded bg-gray-100 border border-gray-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs text-gray-500">Confidence</span>
                  </div>
                  <span className="text-xs font-mono font-semibold text-gray-900">{(routeResult.confidence * 100).toFixed(1)}%</span>
                </div>

                <div className="p-3 rounded bg-gray-100 border border-gray-200 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <FileCode2 className="w-4 h-4 text-gray-500" />
                    <span>Required Industrial Tools</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {routeResult.requiredTools && routeResult.requiredTools.length > 0 ? (
                      routeResult.requiredTools.map((t: string) => (
                        <span key={t} className="px-2 py-0.5 rounded bg-white text-gray-900 border border-gray-200 text-[10px] font-mono">
                          {t}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-gray-400 italic">No external tools required (Pure LLM)</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-gray-400 font-mono flex flex-col items-center justify-center space-y-2">
                <GitFork className="w-6 h-6 text-gray-300" />
                <p>No routing decision evaluated yet. Enter a query and click "Simulate Route".</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
