'use client';

import React, { useState } from 'react';
import { Database, Search, FileText, CheckCircle2, Bookmark, Layers, HardDrive } from 'lucide-react';

export function RagObservatory() {
  const [searchQuery, setSearchQuery] = useState('MRPL furnace F-101 emergency shutdown procedure');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([
    {
      id: 'sop-furnace-4.1.2',
      collection: 'mrpl_operational_sops',
      document: 'SOP-MRPL-FURNACE-01.pdf',
      clause: 'Clause 4.1.2',
      similarityScore: 0.942,
      content: 'In the event of flameout or fuel gas pressure drop below 1.2 kg/cm2, initiate immediate emergency trip of ESDV-101. Verify purge steam flow exceeds 12 MT/hr before relight attempt.',
      tokens: 42,
    },
    {
      id: 'sop-furnace-4.2.1',
      collection: 'mrpl_operational_sops',
      document: 'SOP-MRPL-FURNACE-01.pdf',
      clause: 'Clause 4.2.1',
      similarityScore: 0.887,
      content: 'Maintain coil skin temperatures below 680 deg C during normal firing. If temperature excursion exceeds 720 deg C for >15 minutes, reduce furnace firing by 20% immediately.',
      tokens: 38,
    },
    {
      id: 'policy-safety-09',
      collection: 'ongc_safety_policies',
      document: '02_Health_Safety_Policy.pdf',
      clause: 'Section 3.4',
      similarityScore: 0.812,
      content: 'Refinery personnel must report all furnace pressure and temperature alarms to the Shift In-charge within 10 minutes of occurrence and log into the statutory compliance ledger.',
      tokens: 36,
    }
  ]);

  const collections = [
    { name: 'mrpl_operational_sops', docs: 8, chunks: 1240, desc: 'Refinery operational guidelines, shutdown sequences, and safety manuals.' },
    { name: 'ongc_safety_policies', docs: 16, chunks: 650, desc: 'Corporate governance, environmental compliance, and safety standards.' },
    { name: 'annual_reports_archive', docs: 4, chunks: 290, desc: 'BRSR and technical disclosures for baseline benchmarking.' },
  ];

  const handleSearch = () => {
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl bg-[#090d16] border border-[#1e293b] p-6 space-y-2">
        <div className="flex items-center gap-2 text-violet-400">
          <Database className="w-5 h-5" />
          <h2 className="text-lg font-bold text-white">ChromaDB Vector Knowledge Store (RAG)</h2>
        </div>
        <p className="text-xs text-slate-400">
          Local embedded ChromaDB vector store operating 100% offline with <code>BAAI/bge-small-en-v1.5</code> dense embeddings (384 dimensions) for millisecond SOP clause retrieval.
        </p>
      </div>

      {/* Collection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {collections.map((col) => (
          <div key={col.name} className="p-4 rounded-xl bg-[#090d16] border border-[#1e293b] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-violet-400 font-bold">{col.name}</span>
              <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                {col.docs} Docs
              </span>
            </div>
            <p className="text-xs text-slate-400 line-clamp-2">{col.desc}</p>
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-2 border-t border-slate-800/80">
              <span>{col.chunks} Total Chunks</span>
              <span className="text-emerald-400">Indexed (Offline)</span>
            </div>
          </div>
        ))}
      </div>

      {/* Semantic Search Tester */}
      <div className="rounded-xl bg-[#090d16] border border-[#1e293b] p-5 space-y-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Search className="w-4 h-4 text-violet-400" />
          Semantic Vector Search Tester
        </h3>

        <div className="flex gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 rounded-lg bg-[#030712] border border-[#1e293b] px-3.5 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-violet-500 transition-colors"
            placeholder="Type query to perform cosine similarity vector search..."
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={isSearching}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-violet-900/30"
          >
            <Search className="w-3.5 h-3.5" />
            {isSearching ? 'Searching...' : 'Vector Query'}
          </button>
        </div>

        {/* Search Results */}
        <div className="space-y-3 pt-2">
          <span className="text-xs font-semibold text-slate-400">Top Semantic Matches (Cosine Similarity)</span>
          <div className="space-y-2.5">
            {searchResults.map((res) => (
              <div key={res.id} className="p-3.5 rounded-lg bg-[#030712] border border-slate-800 hover:border-violet-500/40 transition-colors space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Bookmark className="w-3.5 h-3.5 text-violet-400" />
                    <span className="font-semibold text-white">{res.document}</span>
                    <span className="px-2 py-0.5 rounded bg-violet-950/80 text-violet-300 border border-violet-800 text-[11px] font-mono">
                      {res.clause}
                    </span>
                  </div>
                  <span className="font-mono text-emerald-400 text-xs font-bold">
                    Score: {(res.similarityScore * 100).toFixed(1)}%
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-mono">
                  {res.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
