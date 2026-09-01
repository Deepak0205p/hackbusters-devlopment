'use client';

import React, { useState } from 'react';
import { GitFork, Send, Sparkles, CheckCircle2, Clock, Cpu, FileCode2, Terminal } from 'lucide-react';

export function RouterObservatory() {
  const [testQuery, setTestQuery] = useState('');
  const [isRouting, setIsRouting] = useState(false);
  const [routeResult, setRouteResult] = useState<any>(null);

  const handleSimulateRoute = () => {
    if (!testQuery.trim()) return;
    setIsRouting(true);
    setTimeout(() => {
      const q = testQuery.toLowerCase();
      let res: any = {};
      if (q.includes('pump') || q.includes('calculate') || q.includes('furnace') && q.includes('efficiency') || q.includes('python')) {
        res = {
          domain: 'CALCULATION_AND_CODE',
          targetModel: 'qwen2.5-coder:3b-q4_k_m',
          stage1Match: true,
          matchedRule: 'INDUSTRIAL_CALC_PATTERN',
          stage1LatencyMs: 0.92,
          stage2LatencyMs: null,
          totalLatencyMs: 0.92,
          confidence: 1.0,
          requiredTools: ['python_sandbox_runner'],
        };
      } else if (q.includes('sop') || q.includes('policy') || q.includes('standard') || q.includes('mrpl') || q.includes('ongc')) {
        res = {
          domain: 'RAG_RETRIEVAL_AND_COMPLIANCE',
          targetModel: 'qwen3:4b-q4_k_m',
          stage1Match: true,
          matchedRule: 'SOP_COMPLIANCE_KEYWORD',
          stage1LatencyMs: 1.15,
          stage2LatencyMs: null,
          totalLatencyMs: 1.15,
          confidence: 0.99,
          requiredTools: ['chromadb_sop_search', 'provenance_citation_formatter'],
        };
      } else if (q.includes('drawing') || q.includes('p&id') || q.includes('diagram') || q.includes('pid') || q.includes('image')) {
        res = {
          domain: 'MULTIMODAL_VISION_AND_CAD',
          targetModel: 'qwen2-vl:2b-q4_k_m',
          stage1Match: true,
          matchedRule: 'CAD_SCHEMATIC_TAG_REGEX',
          stage1LatencyMs: 0.78,
          stage2LatencyMs: null,
          totalLatencyMs: 0.78,
          confidence: 1.0,
          requiredTools: ['paddleocr_extractor', 'isa_5_1_tag_parser'],
        };
      } else {
        res = {
          domain: 'GENERAL_ASSISTANT_FALLBACK',
          targetModel: 'llama3.2:3b-q4_k_m',
          stage1Match: false,
          matchedRule: null,
          stage1LatencyMs: 1.82,
          stage2LatencyMs: 18.4,
          totalLatencyMs: 20.22,
          confidence: 0.94,
          requiredTools: [],
        };
      }
      setRouteResult(res);
      setIsRouting(false);
    }, 400);
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
                        <span key={t} className="px-2 py-0.5 rounded bg-gray-100 text-gray-900 border border-gray-200 text-[10px] font-mono">
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
