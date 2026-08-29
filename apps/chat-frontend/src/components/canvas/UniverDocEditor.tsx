'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DeliverableItem } from '@/store/useDeliverableStore';
import { useCanvasStore } from '@/store/useCanvasStore';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  ShieldCheck,
  Download,
  Copy,
  Check,
  Printer,
  Sparkles,
  FileText,
  AlertCircle,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Subscript,
  Superscript,
  Highlighter,
  Eraser,
  Table,
  Minus,
  CheckSquare,
  Search,
  ZoomIn,
  ZoomOut,
  Calendar,
  Layers,
  FileCheck2,
  Type,
  ChevronDown,
  Palette
} from 'lucide-react';

interface UniverDocEditorProps {
  deliverable: DeliverableItem;
}

const FONT_COLORS = [
  { label: 'Automatic (Dark)', value: '#0f172a' },
  { label: 'Blue', value: '#2563eb' },
  { label: 'Navy', value: '#1e3a8a' },
  { label: 'Emerald Green', value: '#16a34a' },
  { label: 'Dark Green', value: '#14532d' },
  { label: 'Red / Safety', value: '#dc2626' },
  { label: 'Orange / Warning', value: '#ea580c' },
  { label: 'Purple', value: '#7c3aed' },
  { label: 'Teal', value: '#0d9488' },
  { label: 'Muted Gray', value: '#64748b' }
];

const HIGHLIGHT_COLORS = [
  { label: 'Yellow', value: '#fef08a' },
  { label: 'Cyan', value: '#a5f3fc' },
  { label: 'Light Green', value: '#bbf7d0' },
  { label: 'Pink', value: '#fbcfe8' },
  { label: 'Orange', value: '#fed7aa' },
  { label: 'No Color', value: 'transparent' }
];

export function UniverDocEditor({ deliverable }: UniverDocEditorProps) {
  const { updateEditedContent, editedContent } = useCanvasStore();
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'insert' | 'layout' | 'review' | 'view'>('home');
  const [copied, setCopied] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [selectedFont, setSelectedFont] = useState('Inter');
  const [selectedFontSize, setSelectedFontSize] = useState('3');
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  const [showHighlightDropdown, setShowHighlightDropdown] = useState(false);
  const [selectedTextColor, setSelectedTextColor] = useState('#0f172a');
  const [selectedHighlightColor, setSelectedHighlightColor] = useState('#fef08a');

  // Pre-configured refinery SOP document templates based on filename/ID (Clean Light Theme Styling)
  const getInitialDocHtml = (): string => {
    if (editedContent[deliverable.id]?.html) {
      return editedContent[deliverable.id].html;
    }

    if (deliverable.filename.toLowerCase().includes('oisd') || deliverable.filename.toLowerCase().includes('hw-b')) {
      return `
        <h1 style="color: #1e40af; border-bottom: 2px solid #cbd5e1; padding-bottom: 8px; font-size: 20px; font-weight: 700;">MRPL HOT WORK & NAKED FLAME PERMIT (FORM B)</h1>
        <p style="color: #475569; font-size: 13px;"><strong>Permit Serial No:</strong> MRPL/HSE/2026/HW-8902 &nbsp;|&nbsp; <strong>Date:</strong> 27-AUG-2026 &nbsp;|&nbsp; <strong>Valid Up To:</strong> 18:00 HRS IST</p>
        <p style="color: #475569; font-size: 13px;"><strong>Work Location / Plant Unit:</strong> CDU-2 / VDU Distillation Column Top Platform (Elev. +38.5m)</p>
        
        <h2 style="color: #0369a1; margin-top: 22px; font-size: 16px; font-weight: 600;">1. Scope & Description of Work</h2>
        <p style="color: #1e293b; line-height: 1.6;">Replacement and plasma bevel cutting of 8-inch high-pressure crude transfer line spool (P-104A discharge). Welding and grinding work requires continuous firewatch and spark containment enclosure.</p>

        <h2 style="color: #0369a1; margin-top: 22px; font-size: 16px; font-weight: 600;">2. Mandatory Pre-Entry Atmospheric 4-Gas Test Matrix</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 16px; border: 1px solid #cbd5e1; font-size: 13px;">
          <thead>
            <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
              <th style="padding: 10px; text-align: left; border: 1px solid #cbd5e1; color: #1e293b;">Gas Parameter</th>
              <th style="padding: 10px; text-align: right; border: 1px solid #cbd5e1; color: #1e293b;">Permissible Limit</th>
              <th style="padding: 10px; text-align: right; border: 1px solid #cbd5e1; color: #1e293b;">Measured Value</th>
              <th style="padding: 10px; text-align: center; border: 1px solid #cbd5e1; color: #1e293b;">Verdict</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border: 1px solid #e2e8f0; background-color: #ffffff;">
              <td style="padding: 8px 10px; border: 1px solid #e2e8f0; color: #334155;">Combustible Hydrocarbons (%LEL)</td>
              <td style="padding: 8px 10px; text-align: right; border: 1px solid #e2e8f0; color: #334155;">0.0% LEL</td>
              <td style="padding: 8px 10px; text-align: right; border: 1px solid #e2e8f0; color: #15803d; font-weight: 600;">0.0%</td>
              <td style="padding: 8px 10px; text-align: center; border: 1px solid #e2e8f0; color: #15803d; font-weight: 700;">PASS</td>
            </tr>
            <tr style="border: 1px solid #e2e8f0; background-color: #f8fafc;">
              <td style="padding: 8px 10px; border: 1px solid #e2e8f0; color: #334155;">Oxygen Concentration (O₂)</td>
              <td style="padding: 8px 10px; text-align: right; border: 1px solid #e2e8f0; color: #334155;">19.5% - 21.0%</td>
              <td style="padding: 8px 10px; text-align: right; border: 1px solid #e2e8f0; color: #15803d; font-weight: 600;">20.8%</td>
              <td style="padding: 8px 10px; text-align: center; border: 1px solid #e2e8f0; color: #15803d; font-weight: 700;">SAFE</td>
            </tr>
            <tr style="border: 1px solid #e2e8f0; background-color: #ffffff;">
              <td style="padding: 8px 10px; border: 1px solid #e2e8f0; color: #334155;">Hydrogen Sulfide (H₂S)</td>
              <td style="padding: 8px 10px; text-align: right; border: 1px solid #e2e8f0; color: #334155;">&lt; 10.0 ppm</td>
              <td style="padding: 8px 10px; text-align: right; border: 1px solid #e2e8f0; color: #15803d; font-weight: 600;">0.0 ppm</td>
              <td style="padding: 8px 10px; text-align: center; border: 1px solid #e2e8f0; color: #15803d; font-weight: 700;">PASS</td>
            </tr>
            <tr style="border: 1px solid #e2e8f0; background-color: #f8fafc;">
              <td style="padding: 8px 10px; border: 1px solid #e2e8f0; color: #334155;">Carbon Monoxide (CO)</td>
              <td style="padding: 8px 10px; text-align: right; border: 1px solid #e2e8f0; color: #334155;">&lt; 25.0 ppm</td>
              <td style="padding: 8px 10px; text-align: right; border: 1px solid #e2e8f0; color: #15803d; font-weight: 600;">2.1 ppm</td>
              <td style="padding: 8px 10px; text-align: center; border: 1px solid #e2e8f0; color: #15803d; font-weight: 700;">PASS</td>
            </tr>
          </tbody>
        </table>

        <h2 style="color: #0369a1; margin-top: 22px; font-size: 16px; font-weight: 600;">3. Safety Precautions & Checkpoints (OISD-STD-105)</h2>
        <ul style="color: #1e293b; line-height: 1.7;">
          <li>Equipment isolated from live hydrocarbon header by slip blinds / spectacles (Blind Tag #BL-4402).</li>
          <li>Surrounding sewer manholes, catch basins, and open drains covered with fire-resistant tarpaulins within 15m radius.</li>
          <li>Pressurized water hose and dual 10kg DCP extinguishers stationed at work deck.</li>
          <li>Continuous personal multi-gas detector deployed with audio-visual alarm preset.</li>
        </ul>

        <h2 style="color: #0369a1; margin-top: 22px; font-size: 16px; font-weight: 600;">4. Statutory Authorizations & Signatures</h2>
        <p style="color: #334155; line-height: 1.6;"><strong>Permit Issuer (Operations Shift In-Charge):</strong> Er. R. Nair (Emp ID: 4109) &nbsp;&bull;&nbsp; <em>Signed digitally at 07:45 HRS</em></p>
        <p style="color: #334155; line-height: 1.6;"><strong>Permit Receiver (Maintenance Lead):</strong> Er. K. Verma (Emp ID: 5218) &nbsp;&bull;&nbsp; <em>Signed digitally at 07:50 HRS</em></p>
        <p style="color: #334155; line-height: 1.6;"><strong>HSE & Fire Safety Inspector:</strong> S. Patil (Emp ID: 1042) &nbsp;&bull;&nbsp; <em>Certified & Approved</em></p>
      `;
    }

    return `
      <h1 style="color: #1e40af; border-bottom: 2px solid #cbd5e1; padding-bottom: 8px; font-size: 20px; font-weight: 700;">${deliverable.filename.replace(/\.[^/.]+$/, '').toUpperCase()}</h1>
      <p style="color: #475569; font-size: 13px;"><strong>Classification:</strong> Confidential Refinery Standard Operating Procedure &bull; <strong>Status:</strong> AUTHORIZED</p>
      <p style="color: #1e293b; line-height: 1.6; margin-top: 10px;"><strong>Summary:</strong> ${deliverable.summary}</p>
      
      <h2 style="color: #0369a1; margin-top: 22px; font-size: 16px; font-weight: 600;">1. Operational Overview & Objectives</h2>
      <p style="color: #1e293b; line-height: 1.6;">This technical procedure enforces all statutory norms mandated by OISD, Petroleum and Explosives Safety Organization (PESO), and internal MRPL technical benchmarks.</p>

      <h2 style="color: #0369a1; margin-top: 22px; font-size: 16px; font-weight: 600;">2. Key Compliance & Performance Criteria</h2>
      <ul style="color: #1e293b; line-height: 1.7;">
        ${deliverable.key_metrics.map(m => `<li><strong>${m.label}:</strong> ${m.value}</li>`).join('')}
      </ul>

      <h2 style="color: #0369a1; margin-top: 22px; font-size: 16px; font-weight: 600;">3. Referenced SOPs and Regulatory Standards</h2>
      <ul style="color: #1e293b; line-height: 1.7;">
        ${deliverable.sop_citations.map(c => `<li>${c}</li>`).join('')}
      </ul>
    `;
  };

  const [docHtml, setDocHtml] = useState(getInitialDocHtml);

  useEffect(() => {
    const initial = getInitialDocHtml();
    setDocHtml(initial);
    if (editorRef.current) {
      editorRef.current.innerHTML = initial;
      updateStats(editorRef.current.innerText || '');
    }
  }, [deliverable.id]);

  const updateStats = (text: string) => {
    const words = text.trim().split(/\s+/).filter(Boolean);
    setWordCount(words.length);
    setCharCount(text.length);
  };

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      setDocHtml(html);
      updateStats(editorRef.current.innerText || '');
      updateEditedContent(deliverable.id, { html });
    }
  };

  const exec = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      handleInput();
    }
  };

  const applyFontColor = (colorHex: string) => {
    setSelectedTextColor(colorHex);
    exec('foreColor', colorHex);
    setShowColorDropdown(false);
  };

  const applyHighlightColor = (colorHex: string) => {
    setSelectedHighlightColor(colorHex);
    exec('hiliteColor', colorHex);
    setShowHighlightDropdown(false);
  };

  const insertCustomHtml = (htmlString: string) => {
    exec('insertHTML', htmlString);
  };

  return (
    <div className="flex flex-col h-full bg-[#f1f5f9] text-[#1e293b] select-none font-sans">
      {/* 1. Word Ribbon Navigation Tabs (Light Theme) */}
      <div className="flex items-center space-x-1 px-3 pt-2 bg-[#f8fafc] border-b border-[#e2e8f0] text-xs">
        <button
          onClick={() => setActiveTab('home')}
          className={`px-3 py-1.5 rounded-t-md font-medium transition-all ${
            activeTab === 'home'
              ? 'bg-[#ffffff] text-[#1d4ed8] border-t-2 border-t-[#2563eb] border-x border-[#e2e8f0] shadow-sm'
              : 'text-[#64748b] hover:text-[#0f172a]'
          }`}
        >
          Home
        </button>
        <button
          onClick={() => setActiveTab('insert')}
          className={`px-3 py-1.5 rounded-t-md font-medium transition-all ${
            activeTab === 'insert'
              ? 'bg-[#ffffff] text-[#1d4ed8] border-t-2 border-t-[#2563eb] border-x border-[#e2e8f0] shadow-sm'
              : 'text-[#64748b] hover:text-[#0f172a]'
          }`}
        >
          Insert
        </button>
        <button
          onClick={() => setActiveTab('layout')}
          className={`px-3 py-1.5 rounded-t-md font-medium transition-all ${
            activeTab === 'layout'
              ? 'bg-[#ffffff] text-[#1d4ed8] border-t-2 border-t-[#2563eb] border-x border-[#e2e8f0] shadow-sm'
              : 'text-[#64748b] hover:text-[#0f172a]'
          }`}
        >
          Layout
        </button>
        <button
          onClick={() => setActiveTab('review')}
          className={`px-3 py-1.5 rounded-t-md font-medium transition-all ${
            activeTab === 'review'
              ? 'bg-[#ffffff] text-[#1d4ed8] border-t-2 border-t-[#2563eb] border-x border-[#e2e8f0] shadow-sm'
              : 'text-[#64748b] hover:text-[#0f172a]'
          }`}
        >
          Review & Compliance
        </button>
        <button
          onClick={() => setActiveTab('view')}
          className={`px-3 py-1.5 rounded-t-md font-medium transition-all ${
            activeTab === 'view'
              ? 'bg-[#ffffff] text-[#1d4ed8] border-t-2 border-t-[#2563eb] border-x border-[#e2e8f0] shadow-sm'
              : 'text-[#64748b] hover:text-[#0f172a]'
          }`}
        >
          View
        </button>
      </div>

      {/* 2. Word Formatting Ribbon Toolbars (Light Theme) */}
      <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 bg-[#ffffff] border-b border-[#e2e8f0] text-xs shadow-sm relative z-20">
        {activeTab === 'home' && (
          <>
            {/* Font Selector & Size */}
            <div className="flex items-center space-x-1 pr-2 border-r border-[#e2e8f0]">
              <select
                value={selectedFont}
                onChange={(e) => {
                  setSelectedFont(e.target.value);
                  exec('fontName', e.target.value);
                }}
                className="bg-[#f8fafc] text-[#1e293b] px-2 py-1 rounded border border-[#cbd5e1] text-xs focus:outline-none"
              >
                <option value="Inter">Inter</option>
                <option value="Arial">Arial</option>
                <option value="Georgia">Georgia</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Courier New">Courier</option>
              </select>

              <select
                value={selectedFontSize}
                onChange={(e) => {
                  setSelectedFontSize(e.target.value);
                  exec('fontSize', e.target.value);
                }}
                className="bg-[#f8fafc] text-[#1e293b] px-2 py-1 rounded border border-[#cbd5e1] text-xs focus:outline-none w-14"
              >
                <option value="1">8pt</option>
                <option value="2">10pt</option>
                <option value="3">12pt</option>
                <option value="4">14pt</option>
                <option value="5">18pt</option>
                <option value="6">24pt</option>
                <option value="7">36pt</option>
              </select>
            </div>

            {/* Basic Typography */}
            <div className="flex items-center space-x-0.5 pr-2 border-r border-[#e2e8f0]">
              <button
                onClick={() => exec('bold')}
                title="Bold (Ctrl+B)"
                className="p-1.5 rounded hover:bg-[#f1f5f9] text-[#334155] hover:text-[#0f172a]"
              >
                <Bold className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => exec('italic')}
                title="Italic (Ctrl+I)"
                className="p-1.5 rounded hover:bg-[#f1f5f9] text-[#334155] hover:text-[#0f172a]"
              >
                <Italic className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => exec('underline')}
                title="Underline (Ctrl+U)"
                className="p-1.5 rounded hover:bg-[#f1f5f9] text-[#334155] hover:text-[#0f172a]"
              >
                <Underline className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => exec('strikeThrough')}
                title="Strikethrough"
                className="p-1.5 rounded hover:bg-[#f1f5f9] text-[#334155] hover:text-[#0f172a]"
              >
                <Strikethrough className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Interactive Font Color & Highlight Picker */}
            <div className="flex items-center space-x-1 pr-2 border-r border-[#e2e8f0] relative">
              {/* Font Color Picker Button with Dropdown Palette */}
              <div className="relative">
                <div className="flex items-center rounded border border-[#cbd5e1] hover:bg-[#f1f5f9]">
                  <button
                    onClick={() => exec('foreColor', selectedTextColor)}
                    title={`Apply Font Color (${selectedTextColor})`}
                    className="p-1.5 flex flex-col items-center justify-center text-[#1e293b]"
                  >
                    <span className="font-bold text-xs leading-none font-serif">A</span>
                    <div
                      className="h-1 w-3.5 rounded-full mt-0.5"
                      style={{ backgroundColor: selectedTextColor }}
                    />
                  </button>
                  <button
                    onClick={() => {
                      setShowColorDropdown(!showColorDropdown);
                      setShowHighlightDropdown(false);
                    }}
                    className="px-1 py-1.5 border-l border-[#e2e8f0] text-[#64748b] hover:text-[#0f172a]"
                    title="Choose Font Color"
                  >
                    <ChevronDown className="h-2.5 w-2.5" />
                  </button>
                </div>

                {/* Font Color Selection Popover */}
                {showColorDropdown && (
                  <div className="absolute left-0 top-full mt-1.5 w-48 p-2.5 bg-[#ffffff] border border-[#cbd5e1] rounded-xl shadow-2xl z-50">
                    <div className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wider mb-2 px-1">
                      Theme Colors
                    </div>
                    <div className="grid grid-cols-5 gap-1.5 mb-3">
                      {FONT_COLORS.map((c) => (
                        <button
                          key={c.value}
                          onClick={() => applyFontColor(c.value)}
                          title={c.label}
                          style={{ backgroundColor: c.value }}
                          className="h-6 w-6 rounded-md border border-[#cbd5e1] hover:scale-110 transition-transform shadow-sm"
                        />
                      ))}
                    </div>

                    <div className="pt-2 border-t border-[#e2e8f0] flex items-center justify-between">
                      <span className="text-[11px] text-[#475569] font-medium">Custom Color:</span>
                      <input
                        type="color"
                        value={selectedTextColor}
                        onChange={(e) => applyFontColor(e.target.value)}
                        className="h-6 w-8 cursor-pointer rounded border border-[#cbd5e1] p-0.5 bg-transparent"
                        title="Pick Custom Color"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Text Highlight / Background Color Picker */}
              <div className="relative">
                <div className="flex items-center rounded border border-[#cbd5e1] hover:bg-[#f1f5f9]">
                  <button
                    onClick={() => exec('hiliteColor', selectedHighlightColor)}
                    title={`Highlight Text (${selectedHighlightColor})`}
                    className="p-1.5 flex flex-col items-center justify-center text-[#1e293b]"
                  >
                    <Highlighter className="h-3.5 w-3.5 text-yellow-600" />
                    <div
                      className="h-1 w-3.5 rounded-full mt-0.5"
                      style={{ backgroundColor: selectedHighlightColor }}
                    />
                  </button>
                  <button
                    onClick={() => {
                      setShowHighlightDropdown(!showHighlightDropdown);
                      setShowColorDropdown(false);
                    }}
                    className="px-1 py-1.5 border-l border-[#e2e8f0] text-[#64748b] hover:text-[#0f172a]"
                    title="Choose Highlight Color"
                  >
                    <ChevronDown className="h-2.5 w-2.5" />
                  </button>
                </div>

                {/* Highlight Selection Popover */}
                {showHighlightDropdown && (
                  <div className="absolute left-0 top-full mt-1.5 w-48 p-2.5 bg-[#ffffff] border border-[#cbd5e1] rounded-xl shadow-2xl z-50">
                    <div className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wider mb-2 px-1">
                      Highlight Colors
                    </div>
                    <div className="grid grid-cols-6 gap-1.5 mb-2">
                      {HIGHLIGHT_COLORS.map((c) => (
                        <button
                          key={c.value}
                          onClick={() => applyHighlightColor(c.value)}
                          title={c.label}
                          style={{ backgroundColor: c.value === 'transparent' ? '#ffffff' : c.value }}
                          className="h-6 w-6 rounded-md border border-[#cbd5e1] hover:scale-110 transition-transform shadow-sm flex items-center justify-center text-[10px]"
                        >
                          {c.value === 'transparent' ? '✕' : ''}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Clear Formatting */}
              <button
                onClick={() => exec('removeFormat')}
                title="Clear Formatting"
                className="p-1.5 rounded hover:bg-[#f1f5f9] text-[#64748b] hover:text-[#0f172a]"
              >
                <Eraser className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Paragraph Alignment */}
            <div className="flex items-center space-x-0.5 pr-2 border-r border-[#e2e8f0]">
              <button onClick={() => exec('justifyLeft')} title="Align Left" className="p-1.5 rounded hover:bg-[#f1f5f9] text-[#334155]">
                <AlignLeft className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => exec('justifyCenter')} title="Center" className="p-1.5 rounded hover:bg-[#f1f5f9] text-[#334155]">
                <AlignCenter className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => exec('justifyRight')} title="Align Right" className="p-1.5 rounded hover:bg-[#f1f5f9] text-[#334155]">
                <AlignRight className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => exec('justifyFull')} title="Justify" className="p-1.5 rounded hover:bg-[#f1f5f9] text-[#334155]">
                <AlignJustify className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Lists & Bullets */}
            <div className="flex items-center space-x-0.5 pr-2 border-r border-[#e2e8f0]">
              <button onClick={() => exec('insertUnorderedList')} title="Bullet List" className="p-1.5 rounded hover:bg-[#f1f5f9] text-[#334155]">
                <List className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => exec('insertOrderedList')} title="Numbered List" className="p-1.5 rounded hover:bg-[#f1f5f9] text-[#334155]">
                <ListOrdered className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Quick Headings */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => exec('formatBlock', '<h1>')}
                className="px-2 py-1 rounded hover:bg-[#f1f5f9] text-[#1e293b] font-bold text-xs"
              >
                H1
              </button>
              <button
                onClick={() => exec('formatBlock', '<h2>')}
                className="px-2 py-1 rounded hover:bg-[#f1f5f9] text-[#1e293b] font-semibold text-xs"
              >
                H2
              </button>
              <button
                onClick={() => exec('formatBlock', '<p>')}
                className="px-2 py-1 rounded hover:bg-[#f1f5f9] text-[#475569] text-xs"
              >
                Normal
              </button>
            </div>
          </>
        )}

        {activeTab === 'insert' && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() =>
                insertCustomHtml(`
                <table style="width: 100%; border-collapse: collapse; margin: 12px 0; border: 1px solid #cbd5e1;">
                  <thead>
                    <tr style="background-color: #f1f5f9;">
                      <th style="border: 1px solid #cbd5e1; padding: 8px;">Parameter</th>
                      <th style="border: 1px solid #cbd5e1; padding: 8px;">Target Value</th>
                      <th style="border: 1px solid #cbd5e1; padding: 8px;">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style="border: 1px solid #e2e8f0; padding: 8px;">Pressure Gauge P-102</td>
                      <td style="border: 1px solid #e2e8f0; padding: 8px;">14.2 bar</td>
                      <td style="border: 1px solid #e2e8f0; padding: 8px; color: #16a34a; font-weight: bold;">NORMAL</td>
                    </tr>
                  </tbody>
                </table>
              `)
              }
              className="flex items-center space-x-1 px-2.5 py-1 rounded bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#cbd5e1] text-[#1e293b]"
            >
              <Table className="h-3.5 w-3.5 text-blue-600" />
              <span>Insert Table</span>
            </button>

            <button
              onClick={() =>
                insertCustomHtml(`
                <div style="margin: 16px 0; padding: 12px 16px; border-left: 4px solid #eab308; background: #fefce8; border-radius: 4px; color: #854d0e;">
                  <strong>⚠️ MANDATORY SAFETY ADVISORY:</strong> Strict personal protective equipment (PPE Level C) must be worn at all times in this operational perimeter.
                </div>
              `)
              }
              className="flex items-center space-x-1 px-2.5 py-1 rounded bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#cbd5e1] text-amber-700"
            >
              <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
              <span>Safety Callout</span>
            </button>

            <button
              onClick={() =>
                insertCustomHtml(`
                <div style="margin-top: 24px; padding: 12px 16px; border: 1px dashed #16a34a; border-radius: 8px; background: #f0fdf4; display: inline-block;">
                  <strong style="color: #15803d; font-size: 11px; letter-spacing: 1px;">✓ AIR-GAPPED DIGITAL APPROVAL STAMP</strong>
                  <div style="font-size: 11px; color: #4b5563; margin-top: 4px;">Certified by Sovereign Intelligence System &bull; ${new Date().toLocaleString()}</div>
                </div>
              `)
              }
              className="flex items-center space-x-1 px-2.5 py-1 rounded bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#cbd5e1] text-emerald-700"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Approval Seal</span>
            </button>
          </div>
        )}

        {activeTab === 'layout' && (
          <div className="flex items-center space-x-3 text-[#475569]">
            <span>Paper Size: <strong className="text-[#0f172a]">A4 (210 x 297 mm)</strong></span>
            <span>&bull;</span>
            <span>Orientation: <strong className="text-[#0f172a]">Portrait</strong></span>
            <span>&bull;</span>
            <span>Margins: <strong className="text-[#0f172a]">25.4mm Normal</strong></span>
          </div>
        )}

        {activeTab === 'review' && (
          <div className="flex items-center space-x-3 text-xs">
            <span className="flex items-center space-x-1 text-emerald-600 font-medium">
              <Check className="h-3.5 w-3.5" />
              <span>OISD Standard 105 Compliant</span>
            </span>
            <span className="text-[#94a3b8]">&bull;</span>
            <span className="text-[#475569]">Estimated Reading Time: <strong className="text-[#0f172a]">{Math.ceil(wordCount / 200)} min</strong></span>
          </div>
        )}

        {activeTab === 'view' && (
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 bg-[#f8fafc] border border-[#cbd5e1] rounded-lg px-2 py-0.5">
              <button onClick={() => setZoomLevel((z) => Math.max(50, z - 15))} className="p-1 hover:bg-[#e2e8f0] rounded">
                <ZoomOut className="h-3.5 w-3.5 text-[#475569]" />
              </button>
              <span className="text-[11px] font-mono text-[#0f172a] font-semibold">{zoomLevel}%</span>
              <button onClick={() => setZoomLevel((z) => Math.min(200, z + 15))} className="p-1 hover:bg-[#e2e8f0] rounded">
                <ZoomIn className="h-3.5 w-3.5 text-[#475569]" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Document Editable Canvas Area (Pure Office Clean White Theme) */}
      <div
        onClick={() => {
          setShowColorDropdown(false);
          setShowHighlightDropdown(false);
        }}
        className="flex-1 overflow-auto p-4 sm:p-8 flex justify-center bg-[#e2e8f0]"
      >
        <div
          style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: 'top center',
          }}
          className="w-full max-w-4xl min-h-[850px] bg-[#ffffff] text-[#0f172a] border border-[#cbd5e1] rounded-lg p-8 sm:p-14 shadow-2xl relative transition-all"
        >
          {/* Document Header Seal */}
          <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-4 mb-6 text-xs text-[#64748b]">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span className="font-semibold uppercase tracking-wider text-[#334155]">MRPL SOVEREIGN ON-PREMISE SYSTEM</span>
            </div>
            <div className="flex items-center space-x-1 text-[11px] font-mono text-blue-600 font-medium">
              <span>AIR-GAP COMPLIANCE SEAL</span>
            </div>
          </div>

          {/* Editable HTML Content */}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            className="outline-none text-[14px] leading-relaxed font-sans max-w-none focus:outline-none min-h-[600px] text-[#0f172a]"
          />
        </div>
      </div>

      {/* 4. Bottom Statistics Footer (Light Theme) */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#ffffff] border-t border-[#cbd5e1] text-xs text-[#64748b]">
        <div className="flex items-center space-x-3 font-mono">
          <span>Words: <strong className="text-[#0f172a]">{wordCount}</strong></span>
          <span>&bull;</span>
          <span>Characters: <strong className="text-[#0f172a]">{charCount}</strong></span>
          <span>&bull;</span>
          <span>Page 1 of 1</span>
          <span>&bull;</span>
          <span className="text-emerald-600 font-sans font-semibold">Word Document Mode</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              if (editorRef.current) {
                navigator.clipboard.writeText(editorRef.current.innerText || '');
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }
            }}
            className="flex items-center space-x-1 px-3 py-1 rounded bg-[#f8fafc] hover:bg-[#f1f5f9] text-[#1e293b] border border-[#cbd5e1] font-medium"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
            <span>{copied ? 'Copied' : 'Copy All'}</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1 px-3 py-1 rounded bg-[#f8fafc] hover:bg-[#f1f5f9] text-[#1e293b] border border-[#cbd5e1] font-medium"
          >
            <Printer className="h-3 w-3" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}
