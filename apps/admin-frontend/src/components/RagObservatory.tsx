'use client';

import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Search, 
  UploadCloud, 
  FileText, 
  RefreshCw, 
  CheckCircle2, 
  Bookmark, 
  Layers, 
  HardDrive,
  FileCode,
  Download,
  FileSpreadsheet,
  Presentation,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export function RagObservatory() {
  // RAG Ingestion State
  const [selectedCategory, setSelectedCategory] = useState('sop_mops');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestStatus, setIngestStatus] = useState<any>(null);

  // Document Conversion State
  const [convertFile, setConvertFile] = useState<File | null>(null);
  const [targetFormat, setTargetFormat] = useState('docx');
  const [isConverting, setIsConverting] = useState(false);
  const [convertStatus, setConvertStatus] = useState<string | null>(null);
  const [existingFiles, setExistingFiles] = useState<any[]>([]);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Sub-Tab Selection State ('ingest' | 'converter') synced with URL Hash #ingest / #converter
  const [activeTab, setActiveTab] = useState<'ingest' | 'converter'>('ingest');

  useEffect(() => {
    // Sync tab from URL Hash on mount or hash change
    const syncFromHash = () => {
      const hash = window.location.hash.toLowerCase().replace('#', '');
      if (hash === 'converter' || hash === 'format-converter') {
        setActiveTab('converter');
      } else if (hash === 'ingest' || hash === 'rag-ingest') {
        setActiveTab('ingest');
      }
    };

    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, []);

  const changeTab = (tab: 'ingest' | 'converter') => {
    setActiveTab(tab);
    window.location.hash = tab === 'converter' ? 'converter' : 'ingest';
  };

  useEffect(() => {
    // Fetch live codebase file inventory
    fetch('http://localhost:8000/api/rag-admin/files')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.files) {
          setExistingFiles(data.files);
        }
      })
      .catch(() => {});
  }, []);

  const handleIngestFile = async () => {
    if (!uploadFile) return;
    setIsIngesting(true);
    setIngestStatus(null);

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('category', selectedCategory);
    formData.append('doc_type', 'SOP_OR_POLICY');

    try {
      const res = await fetch('http://localhost:8000/api/rag-admin/ingest-file', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setIngestStatus(data);
    } catch (err: any) {
      setIngestStatus({ success: false, detail: err.message || 'Ingestion failed' });
    } finally {
      setIsIngesting(false);
    }
  };

  const handleConvertDocument = async () => {
    if (!convertFile) return;
    setIsConverting(true);
    setConvertStatus(null);

    const formData = new FormData();
    formData.append('file', convertFile);
    formData.append('target_format', targetFormat);

    try {
      const res = await fetch('http://localhost:8000/api/rag-admin/convert-document', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const baseName = convertFile.name.substring(0, convertFile.name.lastIndexOf('.')) || convertFile.name;
      a.download = `${baseName}_converted.${targetFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setConvertStatus('Conversion complete! File download started.');
    } catch (err: any) {
      setConvertStatus(`Error converting: ${err.message}`);
    } finally {
      setIsConverting(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setHasSearched(true);

    try {
      const res = await fetch(`http://localhost:8000/api/rag-admin/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.results);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="rounded-md bg-[#0a0a0a] border border-[#262626] p-5 space-y-1.5">
        <div className="flex items-center gap-2 text-[#ededed]">
          <Database className="w-4 h-4 text-[#0070f3]" />
          <h2 className="text-sm font-semibold text-[#ededed]">RAG Knowledge Engine & Document Operations</h2>
        </div>
        <p className="text-xs text-[#888888]">
          On-premise ChromaDB vector database with BAAI/bge-small-en-v1.5 embeddings, instant SOP/Policy ingestor, and universal multi-format document converter.
        </p>
      </div>

      {/* Sub-Tab Navigation Strip (Synced with URL Hash /rag#ingest and /rag#converter) */}
      <div className="flex items-center gap-2 border-b border-[#262626] pb-2">
        <button
          type="button"
          onClick={() => changeTab('ingest')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-medium transition-all ${
            activeTab === 'ingest'
              ? 'bg-[#171717] text-[#0070f3] border border-[#0070f3]/40 shadow-sm font-semibold'
              : 'text-[#888888] hover:text-[#ededed] hover:bg-[#111111] border border-transparent'
          }`}
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>1. Ingest SOP / MOP / Security Policy into RAG</span>
          <span className="text-[10px] font-mono text-[#666666] ml-1">#ingest</span>
        </button>

        <button
          type="button"
          onClick={() => changeTab('converter')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-medium transition-all ${
            activeTab === 'converter'
              ? 'bg-[#171717] text-[#00e599] border border-[#00e599]/40 shadow-sm font-semibold'
              : 'text-[#888888] hover:text-[#ededed] hover:bg-[#111111] border border-transparent'
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>2. Universal Document Format Converter</span>
          <span className="text-[10px] font-mono text-[#666666] ml-1">#converter</span>
        </button>
      </div>

      {/* SECTION 1: INGESTION & SEMANTIC VECTOR SEARCH */}
      {activeTab === 'ingest' && (
        <div className="space-y-4">
          {/* Ingest SOP Card */}
          <div className="rounded-md bg-[#0a0a0a] border border-[#262626] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <h3 className="text-xs font-semibold text-[#ededed] flex items-center gap-2">
                <UploadCloud className="w-3.5 h-3.5 text-[#0070f3]" />
                Ingest SOP / MOP / Security Policy into RAG
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#111111] text-[#00e599] border border-[#262626]">
                REAL-TIME UPSERT
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-[#888888]">Knowledge Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full rounded bg-[#111111] border border-[#262626] p-2.5 text-xs text-[#ededed] focus:outline-none focus:border-[#444444]"
                >
                  <option value="sop_mops">Refinery SOPs & MOPs (Operations)</option>
                  <option value="security_policies">Security Policies & Statutory Compliance</option>
                  <option value="mrpl_engineering">MRPL Technical Engineering Standards</option>
                  <option value="ongc_compliance">ONGC Corporate Compliance Standards</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-[#888888]">Select Document (.pdf, .docx, .txt, .md)</label>
                <input
                  type="file"
                  accept=".pdf,.docx,.txt,.md"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-[#888888] file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-[#171717] file:text-[#ededed] hover:file:bg-[#262626] cursor-pointer"
                />
              </div>
            </div>

            <button
              onClick={handleIngestFile}
              disabled={!uploadFile || isIngesting}
              className="w-full py-2.5 bg-[#0070f3] hover:bg-[#0060df] disabled:opacity-50 text-white text-xs font-medium rounded transition-colors flex items-center justify-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isIngesting ? 'animate-spin' : ''}`} />
              {isIngesting ? 'Extracting Clauses & Embedding...' : 'Build / Upsert to ChromaDB RAG'}
            </button>

            {ingestStatus && (
              <div className={`p-3 rounded border text-xs font-mono space-y-1 ${
                ingestStatus.status === 'success' || ingestStatus.success
                  ? 'bg-[#111111] text-[#00e599] border-[#262626]' 
                  : 'bg-[#111111] text-[#e5484d] border-[#262626]'
              }`}>
                <div className="font-semibold flex items-center gap-1.5">
                  {ingestStatus.status === 'success' || ingestStatus.success ? <CheckCircle2 className="w-3.5 h-3.5 text-[#00e599]" /> : <AlertCircle className="w-3.5 h-3.5 text-[#e5484d]" />}
                  <span>{ingestStatus.message || ingestStatus.detail}</span>
                </div>
                {ingestStatus.chunks_indexed !== undefined && (
                  <div className="text-[11px] text-[#888888]">
                    Processed: {ingestStatus.chunks_indexed} chunks | Total KB Chunks: {ingestStatus.total_in_chromadb || ingestStatus.total_collection_chunks}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Semantic Search Tester */}
          <div className="rounded-md bg-[#0a0a0a] border border-[#262626] p-5 space-y-4">
            <h3 className="text-xs font-semibold text-[#ededed] flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-[#0070f3]" />
              Semantic RAG Knowledge Explorer
            </h3>

            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 rounded bg-[#111111] border border-[#262626] p-2.5 text-xs text-[#ededed] font-mono focus:outline-none focus:border-[#444444]"
                placeholder="Type query (e.g., furnace shutdown, pump pressure) to search vector store..."
              />
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="px-4 py-2 bg-[#0070f3] hover:bg-[#0060df] disabled:opacity-50 text-white text-xs font-medium rounded transition-colors flex items-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5" />
                {isSearching ? 'Querying...' : 'Search'}
              </button>
            </div>

            {hasSearched && (
              <div className="space-y-2 pt-1">
                {searchResults.length === 0 ? (
                  <div className="p-4 rounded bg-[#111111] border border-[#262626] text-center text-xs text-[#666666] font-mono">
                    No matching document clauses found in ChromaDB for "{searchQuery}".
                  </div>
                ) : (
                  searchResults.map((res, i) => (
                    <div key={res.id || i} className="p-3 rounded bg-[#111111] border border-[#262626] space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Bookmark className="w-3.5 h-3.5 text-[#0070f3]" />
                          <span className="font-semibold text-[#ededed]">{res.document}</span>
                          <span className="text-[#888888] font-mono text-[11px]">{res.clause}</span>
                        </div>
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#171717] text-[#00e599] border border-[#333333]">
                          Score: {(res.similarityScore * 100).toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-xs text-[#888888] font-mono leading-relaxed pl-5">
                        "{res.content}"
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: UNIVERSAL DOCUMENT FORMAT CONVERTER & AVAILABLE REPOSITORY FORMATS */}
      {activeTab === 'converter' && (
        <div className="space-y-4">
          {/* Converter Action Box */}
          <div className="rounded-md bg-[#0a0a0a] border border-[#262626] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <h3 className="text-xs font-semibold text-[#ededed] flex items-center gap-2">
                <Download className="w-3.5 h-3.5 text-[#00e599]" />
                Universal Document Format Converter
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#111111] text-[#00e599] border border-[#262626]">
                ON-PREMISE ENGINE
              </span>
            </div>

            <div className="space-y-4 max-w-3xl">
              <div className="space-y-1.5">
                <label className="text-xs text-[#888888]">Input File (.pdf, .docx, .txt, .csv, .xlsx, .pptx)</label>
                <input
                  type="file"
                  accept=".pdf,.docx,.txt,.csv,.xlsx,.pptx"
                  onChange={(e) => setConvertFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-[#888888] file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-[#171717] file:text-[#ededed] hover:file:bg-[#262626] cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-[#888888]">Target Export Format</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'docx', label: 'Word (.docx)', icon: FileText },
                    { id: 'xlsx', label: 'Excel (.xlsx)', icon: FileSpreadsheet },
                    { id: 'pptx', label: 'PowerPoint (.pptx)', icon: Presentation },
                    { id: 'txt', label: 'Text (.txt)', icon: FileCode },
                  ].map((fmt) => {
                    const Icon = fmt.icon;
                    const isSel = targetFormat === fmt.id;
                    return (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => setTargetFormat(fmt.id)}
                        className={`p-3 rounded border text-center flex flex-col items-center gap-1.5 transition-all ${
                          isSel
                            ? 'bg-[#171717] border-[#00e599] text-[#ededed]'
                            : 'bg-[#111111] border-[#262626] text-[#888888] hover:border-[#444444]'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isSel ? 'text-[#00e599]' : 'text-[#888888]'}`} />
                        <span className="text-xs font-medium">{fmt.id.toUpperCase()}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={handleConvertDocument}
                disabled={!convertFile || isConverting}
                className="w-full py-2.5 bg-[#171717] hover:bg-[#262626] text-[#ededed] border border-[#333333] disabled:opacity-50 text-xs font-medium rounded transition-colors flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-[#00e599]" />
                {isConverting ? 'Converting Document...' : 'Convert & Download File'}
              </button>

              {convertStatus && (
                <div className="p-3 rounded bg-[#111111] border border-[#262626] text-xs font-mono text-[#00e599] flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00e599]" />
                  <span>{convertStatus}</span>
                </div>
              )}
            </div>
          </div>

          {/* Supported File Formats & Conversion Matrix */}
          <div className="rounded-md bg-[#0a0a0a] border border-[#262626] p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#262626] pb-3">
              <div>
                <h3 className="text-xs font-semibold text-[#ededed] flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-[#0070f3]" />
                  Supported Document Formats &amp; Engine Specifications
                </h3>
                <p className="text-[11px] text-[#888888] mt-0.5">
                  Universal multi-format parser and generator running 100% on-premise without external cloud APIs.
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#111111] text-[#00e599] border border-[#262626]">
                6 NATIVE FORMATS
              </span>
            </div>

            {/* Format Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                {
                  ext: 'DOCX',
                  label: 'Microsoft Word Document',
                  mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                  engine: 'python-docx',
                  color: 'text-[#0070f3] border-[#0070f3]/30 bg-[#0070f3]/10',
                  icon: FileText,
                  useCase: 'Refinery Inspection Notes, SOP Formats & Approval Memorandums'
                },
                {
                  ext: 'XLSX',
                  label: 'Microsoft Excel Spreadsheet',
                  mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                  engine: 'openpyxl & pandas',
                  color: 'text-[#00e599] border-[#00e599]/30 bg-[#00e599]/10',
                  icon: FileSpreadsheet,
                  useCase: 'Hydraulic Calculations, Asset Registers & Multi-tab Data Sheets'
                },
                {
                  ext: 'PPTX',
                  label: 'PowerPoint Presentation',
                  mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                  engine: 'python-pptx',
                  color: 'text-[#f5a623] border-[#f5a623]/30 bg-[#f5a623]/10',
                  icon: Presentation,
                  useCase: 'Executive Turnaround Briefings & Safety Training Slide Decks'
                },
                {
                  ext: 'PDF',
                  label: 'Portable Document Format',
                  mime: 'application/pdf',
                  engine: 'pypdf & PyMuPDF (fitz)',
                  color: 'text-[#e5484d] border-[#e5484d]/30 bg-[#e5484d]/10',
                  icon: FileText,
                  useCase: 'Statutory Policies, Contractor Safety Guidelines & Audit Reports'
                },
                {
                  ext: 'TXT / MD',
                  label: 'Plain Text & Markdown',
                  mime: 'text/plain, text/markdown',
                  engine: 'Native UTF-8 Stream Parser',
                  color: 'text-[#ededed] border-[#333333] bg-[#1a1a1a]',
                  icon: FileCode,
                  useCase: 'Raw Semantic Clauses, System Logs & Technical Transcripts'
                },
                {
                  ext: 'PY / CODE',
                  label: 'Executable Python Calculation',
                  mime: 'text/x-python',
                  engine: 'Docker Sandbox (python:3.11-slim)',
                  color: 'text-[#a78bfa] border-[#a78bfa]/30 bg-[#a78bfa]/10',
                  icon: FileCode,
                  useCase: 'Deterministic Engineering & Hydraulic Simulation Scripts'
                },
              ].map((fmt) => {
                const Icon = fmt.icon;
                return (
                  <div key={fmt.ext} className="p-3.5 rounded-md bg-[#111111] border border-[#262626] space-y-2 hover:border-[#333333] transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-[#888888]" />
                        <span className="text-xs font-semibold text-[#ededed]">{fmt.label}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${fmt.color}`}>
                        .{fmt.ext}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#888888] leading-relaxed">
                      {fmt.useCase}
                    </p>

                    <div className="pt-2 border-t border-[#1f1f1f] flex items-center justify-between text-[10px] font-mono text-[#666666]">
                      <span>Engine: <span className="text-[#ededed]">{fmt.engine}</span></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Physical Document Library */}
          <div className="rounded-md bg-[#0a0a0a] border border-[#262626] p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#262626] pb-3">
              <div>
                <h3 className="text-xs font-semibold text-[#ededed] flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-[#0070f3]" />
                  Codebase Physical Documents Library
                </h3>
                <p className="text-[11px] text-[#888888] mt-0.5">
                  Live inventory of all physical documents and manuals stored across repository directories.
                </p>
              </div>
              <span className="text-[10px] font-mono text-[#888888]">
                Total: <span className="text-[#ededed]">{existingFiles.length} files</span>
              </span>
            </div>

            {/* Live Document Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#111111] text-[#888888] text-[11px] font-mono border-b border-[#262626]">
                  <tr>
                    <th className="py-2 px-3">Document Name</th>
                    <th className="py-2 px-3">Format</th>
                    <th className="py-2 px-3">Category</th>
                    <th className="py-2 px-3 text-right">Size</th>
                    <th className="py-2 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262626]/50 font-mono text-[11px]">
                  {existingFiles.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-[#666666]">
                        Loading codebase document library...
                      </td>
                    </tr>
                  ) : (
                    existingFiles.map((doc) => {
                      const extColor = 
                        doc.format === 'pdf' ? 'text-[#e5484d] border-[#e5484d]/30 bg-[#e5484d]/10' :
                        doc.format === 'docx' ? 'text-[#0070f3] border-[#0070f3]/30 bg-[#0070f3]/10' :
                        doc.format === 'xlsx' ? 'text-[#00e599] border-[#00e599]/30 bg-[#00e599]/10' :
                        doc.format === 'pptx' ? 'text-[#f5a623] border-[#f5a623]/30 bg-[#f5a623]/10' :
                        'text-[#ededed] border-[#333333] bg-[#1a1a1a]';

                      return (
                        <tr key={doc.id} className="hover:bg-[#111111]">
                          <td className="py-2 px-3 text-[#ededed] font-medium flex items-center gap-2">
                            <FileText className="w-3 h-3 text-[#888888]" />
                            <span>{doc.name}</span>
                          </td>
                          <td className="py-2 px-3">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${extColor}`}>
                              .{doc.format.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-[#888888]">{doc.category}</td>
                          <td className="py-2 px-3 text-right text-[#666666]">{doc.size_kb} KB</td>
                          <td className="py-2 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setConvertFile(new File([""], doc.name));
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="px-2 py-0.5 rounded bg-[#171717] hover:bg-[#222222] border border-[#333333] text-[#ededed] text-[10px] transition-colors"
                            >
                              Select for Convert
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
