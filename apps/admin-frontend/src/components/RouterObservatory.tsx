'use client';

import React, { useState } from 'react';
import { GitFork, Send, Sparkles, CheckCircle2, Clock, Cpu, FileCode2, Terminal } from 'lucide-react';

export function RouterObservatory() {
  const [testQuery, setTestQuery] = useState('Calculate head loss for P-101A centrifugal pump with flow rate 450 m3/hr');
  const [isRouting, setIsRouting] = useState(false);
  const [routeResult, setRouteResult] = useState<any>({
    domain: 'CALCULATION_AND_CODE',
    targetModel: 'qwen2.5-coder:3b-q4_k_m',
    stage1Match: true,
    matchedRule: 'PUMP_HYDRAULIC_CALC_REGEX',
    stage1LatencyMs: 0.84,
    stage2LatencyMs: null,
    totalLatencyMs: 0.84,
    confidence: 1.0,
    requiredTools: ['python_sandbox_runner', 'hydraulic_calculator'],
  });

  const handleSimulateRoute = () => {
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
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl bg-[#090d16] border border-[#1e293b] p-6 space-y-2">
        <div className="flex items-center gap-2 text-cyan-400">
          <GitFork className="w-5 h-5" />
          <h2 className="text-lg font-bold text-white">Two-Stage Intelligent Query Router</h2>
        </div>
        <p className="text-xs text-slate-400">
          Determines optimal model routing and tool activation in &lt; 2ms via deterministic Stage 1 regex matching, falling back to sub-25ms Stage 2 BAAI/bge-small dense semantic centroids.
        </p>
      </div>

      {/* Interactive Simulator Bench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-xl bg-[#090d16] border border-[#1e293b] p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Live Route Simulator
            </h3>
            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-medium">Sample Prompt / Query</label>
              <textarea
                value={testQuery}
                onChange={(e) => setTestQuery(e.target.value)}
                rows={3}
                className="w-full rounded-lg bg-[#030712] border border-[#1e293b] p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500 transition-colors"
                placeholder="Enter prompt to evaluate router decision..."
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTestQuery('Summarize SOP-MRPL-FURNACE-01 emergency shutdown sequence')}
                  className="px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-[11px] text-slate-300 transition-colors"
                >
                  SOP Query
                </button>
                <button
                  type="button"
                  onClick={() => setTestQuery('Extract all control valves and tags from P&ID drawing')}
                  className="px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-[11px] text-slate-300 transition-colors"
                >
                  P&ID Tag Query
                </button>
              </div>
              <button
                type="button"
                onClick={handleSimulateRoute}
                disabled={isRouting}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-cyan-900/30"
              >
                <Send className="w-3.5 h-3.5" />
                {isRouting ? 'Evaluating...' : 'Simulate Route'}
              </button>
            </div>
          </div>

          {/* Router Benchmark Specs */}
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-[#090d16] border border-[#1e293b] space-y-1">
              <span className="text-slate-400">Stage 1 Latency</span>
              <p className="font-mono font-bold text-emerald-400">&lt; 2.0 ms</p>
            </div>
            <div className="p-3 rounded-lg bg-[#090d16] border border-[#1e293b] space-y-1">
              <span className="text-slate-400">Stage 2 Latency</span>
              <p className="font-mono font-bold text-cyan-400">&lt; 25.0 ms</p>
            </div>
            <div className="p-3 rounded-lg bg-[#090d16] border border-[#1e293b] space-y-1">
              <span className="text-slate-400">Accuracy Target</span>
              <p className="font-mono font-bold text-emerald-400">&gt; 99.0%</p>
            </div>
          </div>
        </div>

        {/* Route Decision Outcome */}
        <div className="lg:col-span-5">
          <div className="rounded-xl bg-[#090d16] border border-[#1e293b] p-5 space-y-4 h-full">
            <h3 className="text-sm font-semibold text-white flex items-center justify-between pb-3 border-b border-slate-800">
              <span>Routing Decision Analysis</span>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                TOTAL: {routeResult.totalLatencyMs} ms
              </span>
            </h3>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-[#030712] border border-slate-800 space-y-1">
                <span className="text-slate-500 text-[10px] uppercase font-sans">Target Domain</span>
                <p className="text-cyan-400 font-bold">{routeResult.domain}</p>
              </div>

              <div className="p-3 rounded-lg bg-[#030712] border border-slate-800 space-y-1">
                <span className="text-slate-500 text-[10px] uppercase font-sans">Assigned Model</span>
                <p className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5" />
                  {routeResult.targetModel}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#030712] border border-slate-800 space-y-1">
                <span className="text-slate-500 text-[10px] uppercase font-sans">Stage Match Status</span>
                <p className="text-slate-200">
                  {routeResult.stage1Match 
                    ? `Stage 1 Deterministic Regex (${routeResult.matchedRule})`
                    : `Stage 2 BGE-small Dense Semantic Fallback`}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#030712] border border-slate-800 space-y-2">
                <span className="text-slate-500 text-[10px] uppercase font-sans">Activated ReAct Tools</span>
                <div className="flex flex-wrap gap-1.5">
                  {routeResult.requiredTools.length > 0 ? (
                    routeResult.requiredTools.map((t: string) => (
                      <span key={t} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] border border-slate-700">
                        {t}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-500 italic">No external tools required (Direct Generation)</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
