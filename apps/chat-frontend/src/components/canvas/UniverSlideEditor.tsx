'use client';

import React, { useState, useEffect } from 'react';
import { DeliverableItem } from '@/store/useDeliverableStore';
import { useCanvasStore } from '@/store/useCanvasStore';
import {
  Presentation,
  Plus,
  Trash2,
  Play,
  Download,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Copy,
  Layout,
  Type,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ArrowUp,
  ArrowDown,
  Table,
  Square,
  Circle,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Printer,
  FileText,
  Clock,
  Layers,
  Palette,
  Eye,
  Sliders,
  X,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface SlideData {
  id: number;
  layout: 'title' | 'content' | 'two-column' | 'kpi-grid' | 'timeline' | 'quote' | 'table';
  title: string;
  subtitle: string;
  bullets: string[];
  kpis: { label: string; value: string }[];
  timeline: { step: string; title: string; desc: string }[];
  tableData?: { headers: string[]; rows: string[][] };
  quoteText?: string;
  quoteAuthor?: string;
  notes: string;
  bgColor?: string;
  accentColor?: string;
}

interface UniverSlideEditorProps {
  deliverable: DeliverableItem;
}

const SLIDE_BG_PRESETS = [
  { label: 'Pure White', value: '#ffffff' },
  { label: 'Soft Ivory', value: '#fdfbf7' },
  { label: 'Ice Blue', value: '#f0f9ff' },
  { label: 'Subtle Slate', value: '#f8fafc' },
  { label: 'Clean Mint', value: '#f0fdf4' },
];

export function UniverSlideEditor({ deliverable }: UniverSlideEditorProps) {
  const { updateEditedContent, editedContent } = useCanvasStore();
  const [activeRibbonTab, setActiveRibbonTab] = useState<'home' | 'insert' | 'design' | 'transitions' | 'slideshow'>('home');
  const [isPresenting, setIsPresenting] = useState(false);
  const [showNotesDrawer, setShowNotesDrawer] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '4:3'>('16:9');
  const [transitionEffect, setTransitionEffect] = useState<'fade' | 'slide' | 'zoom'>('fade');
  const [selectedFontColor, setSelectedFontColor] = useState('#0f172a');
  const [selectedAccentColor, setSelectedAccentColor] = useState('#ea580c');
  const [laserPointer, setLaserPointer] = useState<{ x: number; y: number } | null>(null);

  const getInitialSlides = (): SlideData[] => {
    if (editedContent[deliverable.id]?.slides) {
      return editedContent[deliverable.id].slides;
    }

    return [
      {
        id: 1,
        layout: 'title',
        title: 'Monthly Apex Safety & Refinery Operations Review',
        subtitle: 'MRPL Executive Engineering Briefing • Q2 FY26 Statutory Compliance',
        bullets: [
          'Zero Loss Time Incidents (LTI) maintained across all CDU/VDU process complexes.',
          '100% compliance with OISD-STD-105 Form B hot work & atmospheric gas safety norms.'
        ],
        kpis: [
          { label: 'Safe Man-Hours', value: '4.82 M' },
          { label: 'LTIFR Score', value: '0.00' },
          { label: 'Compliance', value: '100%' }
        ],
        timeline: [
          { step: '01', title: 'CDU Pre-Audit', desc: '4-gas testing verified' },
          { step: '02', title: 'LOTO Lockout', desc: 'Blind tags installed' },
          { step: '03', title: 'Hot Work', desc: 'Continuous firewatch' },
        ],
        notes: 'Introduce refinery leadership team and emphasize statutory OISD zero-harm targets.',
        bgColor: '#ffffff',
        accentColor: '#ea580c'
      },
      {
        id: 2,
        layout: 'content',
        title: 'Operational Highlights & Safe Man-Hours',
        subtitle: 'Key Achievements across Process Units & Contractor Zones',
        bullets: [
          '4.82 Million Safe Man-Hours achieved with zero recorded hydrocarbon loss of containment.',
          'Near-Miss reporting elevated by 38% through real-time mobile safety station logging.',
          'Contractor safety onboarding program certified with 100% attendance.'
        ],
        kpis: [
          { label: 'Near Miss Log', value: '209' },
          { label: 'Audits Passed', value: '84' },
          { label: 'Uptime Score', value: '99.9%' }
        ],
        timeline: [],
        notes: 'Walk through zone breakdown. Compliment the CDU-2 operations team on fast audit closure.',
        bgColor: '#ffffff',
        accentColor: '#2563eb'
      },
      {
        id: 3,
        layout: 'two-column',
        title: 'Refinery Yield & Energy Optimization Matrix',
        subtitle: 'CDU / VDU / FCCU Unit Performance Benchmarks',
        bullets: [
          'High Sulphur Crude blend ratio optimized from 68% to 74% yielding +$1.42/bbl margin uplift.',
          'FCCU Catalyst circulation rate maintained at 24.2 tons/min with zero slide-valve sticking.',
          'Specific Energy Consumption (MBN) reduced to 54.2 vs statutory ceiling of 58.0.'
        ],
        kpis: [
          { label: 'GRM Realization', value: '$12.45/bbl' },
          { label: 'Throughput', value: '310 KBPD' },
          { label: 'MBN Energy', value: '54.2' }
        ],
        timeline: [],
        notes: 'Highlight FCCU catalyst savings and steam generation efficiency.',
        bgColor: '#ffffff',
        accentColor: '#16a34a'
      },
      {
        id: 4,
        layout: 'timeline',
        title: 'Statutory SOP Verification & Milestone Timeline',
        subtitle: 'Multi-Stage HSE Governance Roadmap',
        bullets: [],
        kpis: [],
        timeline: [
          { step: 'Phase 1', title: 'Atmospheric Gas Matrix', desc: '%LEL=0.0%, O2=20.8%, H2S=0.0ppm verified' },
          { step: 'Phase 2', title: 'Mechanical Isolation', desc: 'Spectacle blinds BL-4402 locked in place' },
          { step: 'Phase 3', title: 'Permit Authorization', desc: 'Digital shift in-charge sign-off' },
          { step: 'Phase 4', title: 'Continuous Firewatch', desc: 'Dual 10kg DCP extinguishers active' },
        ],
        notes: 'Detail the 4-phase sequential workflow required for any category B hot work.',
        bgColor: '#ffffff',
        accentColor: '#7c3aed'
      },
      {
        id: 5,
        layout: 'table',
        title: 'Process Parameters & Tolerance Limits',
        subtitle: 'Standard Operating Matrix (OISD-STD-105)',
        bullets: [],
        kpis: [],
        timeline: [],
        tableData: {
          headers: ['Parameter / Stream', 'Design Limit', 'Measured Value', 'Safety Status'],
          rows: [
            ['Combustible Hydrocarbons', '0.0% LEL', '0.0%', 'PASS'],
            ['Oxygen Concentration (O₂)', '19.5% - 21.0%', '20.8%', 'SAFE'],
            ['Hydrogen Sulfide (H₂S)', '< 10.0 ppm', '0.0 ppm', 'PASS'],
            ['Carbon Monoxide (CO)', '< 25.0 ppm', '2.1 ppm', 'PASS'],
          ]
        },
        notes: 'All atmospheric telemetry measured using calibrated portable multi-gas detectors.',
        bgColor: '#ffffff',
        accentColor: '#ea580c'
      }
    ];
  };

  const [slides, setSlides] = useState<SlideData[]>(getInitialSlides);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  useEffect(() => {
    const initial = getInitialSlides();
    setSlides(initial);
  }, [deliverable.id]);

  const currentSlide = slides[activeSlideIndex] || slides[0];

  const handleUpdateSlide = (updatedFields: Partial<SlideData>) => {
    const updated = [...slides];
    updated[activeSlideIndex] = {
      ...updated[activeSlideIndex],
      ...updatedFields,
    };
    setSlides(updated);
    updateEditedContent(deliverable.id, { slides: updated });
  };

  const handleAddSlide = (layout: SlideData['layout'] = 'content') => {
    const newSlide: SlideData = {
      id: Date.now(),
      layout,
      title: 'New Presentation Slide',
      subtitle: 'Technical Briefing & Executive Summary',
      bullets: ['Key takeaway or operational observation 1.', 'Supporting metric or engineering standard 2.'],
      kpis: [{ label: 'Metric', value: '100%' }, { label: 'Target', value: 'Pass' }],
      timeline: [
        { step: 'Step 1', title: 'Initiation', desc: 'Initial briefing' },
        { step: 'Step 2', title: 'Execution', desc: 'Standard workflow' }
      ],
      notes: '',
      bgColor: '#ffffff',
      accentColor: selectedAccentColor
    };
    const updated = [...slides, newSlide];
    setSlides(updated);
    setActiveSlideIndex(updated.length - 1);
    updateEditedContent(deliverable.id, { slides: updated });
  };

  const handleDeleteSlide = () => {
    if (slides.length <= 1) return;
    const updated = slides.filter((_, idx) => idx !== activeSlideIndex);
    setSlides(updated);
    setActiveSlideIndex(Math.max(0, activeSlideIndex - 1));
    updateEditedContent(deliverable.id, { slides: updated });
  };

  const handleDuplicateSlide = () => {
    const clone: SlideData = {
      ...currentSlide,
      id: Date.now(),
      title: `${currentSlide.title} (Copy)`,
    };
    const updated = [...slides];
    updated.splice(activeSlideIndex + 1, 0, clone);
    setSlides(updated);
    setActiveSlideIndex(activeSlideIndex + 1);
    updateEditedContent(deliverable.id, { slides: updated });
  };

  const handleMoveSlide = (direction: 'up' | 'down') => {
    if (direction === 'up' && activeSlideIndex === 0) return;
    if (direction === 'down' && activeSlideIndex === slides.length - 1) return;

    const newIndex = direction === 'up' ? activeSlideIndex - 1 : activeSlideIndex + 1;
    const updated = [...slides];
    const item = updated.splice(activeSlideIndex, 1)[0];
    updated.splice(newIndex, 0, item);
    setSlides(updated);
    setActiveSlideIndex(newIndex);
    updateEditedContent(deliverable.id, { slides: updated });
  };

  // Keyboard navigation for presentation mode
  useEffect(() => {
    if (!isPresenting) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        setActiveSlideIndex((curr) => Math.min(slides.length - 1, curr + 1));
      } else if (e.key === 'ArrowLeft') {
        setActiveSlideIndex((curr) => Math.max(0, curr - 1));
      } else if (e.key === 'Escape') {
        setIsPresenting(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPresenting, slides.length]);

  return (
    <div className="flex flex-col h-full bg-[#f1f5f9] text-[#1e293b] select-none font-sans relative">
      {/* 1. Ribbon Tabs Header (Light Theme) */}
      <div className="flex items-center justify-between px-3 pt-2 bg-[#f8fafc] border-b border-[#e2e8f0] text-xs shrink-0">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setActiveRibbonTab('home')}
            className={`px-3.5 py-1.5 rounded-t-md font-medium transition-all ${
              activeRibbonTab === 'home'
                ? 'bg-[#ffffff] text-[#ea580c] border-t-2 border-t-[#ea580c] border-x border-[#e2e8f0] shadow-sm'
                : 'text-[#64748b] hover:text-[#0f172a]'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => setActiveRibbonTab('insert')}
            className={`px-3.5 py-1.5 rounded-t-md font-medium transition-all ${
              activeRibbonTab === 'insert'
                ? 'bg-[#ffffff] text-[#ea580c] border-t-2 border-t-[#ea580c] border-x border-[#e2e8f0] shadow-sm'
                : 'text-[#64748b] hover:text-[#0f172a]'
            }`}
          >
            Insert Elements
          </button>
          <button
            onClick={() => setActiveRibbonTab('design')}
            className={`px-3.5 py-1.5 rounded-t-md font-medium transition-all ${
              activeRibbonTab === 'design'
                ? 'bg-[#ffffff] text-[#ea580c] border-t-2 border-t-[#ea580c] border-x border-[#e2e8f0] shadow-sm'
                : 'text-[#64748b] hover:text-[#0f172a]'
            }`}
          >
            Design & Layout
          </button>
          <button
            onClick={() => setActiveRibbonTab('transitions')}
            className={`px-3.5 py-1.5 rounded-t-md font-medium transition-all ${
              activeRibbonTab === 'transitions'
                ? 'bg-[#ffffff] text-[#ea580c] border-t-2 border-t-[#ea580c] border-x border-[#e2e8f0] shadow-sm'
                : 'text-[#64748b] hover:text-[#0f172a]'
            }`}
          >
            Transitions
          </button>
          <button
            onClick={() => setActiveRibbonTab('slideshow')}
            className={`px-3.5 py-1.5 rounded-t-md font-medium transition-all ${
              activeRibbonTab === 'slideshow'
                ? 'bg-[#ffffff] text-[#ea580c] border-t-2 border-t-[#ea580c] border-x border-[#e2e8f0] shadow-sm'
                : 'text-[#64748b] hover:text-[#0f172a]'
            }`}
          >
            Slide Show
          </button>
        </div>

        {/* Right Header Actions: Present Fullscreen & Notes Toggle */}
        <div className="flex items-center space-x-2 mb-1">
          <button
            onClick={() => setShowNotesDrawer(!showNotesDrawer)}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
              showNotesDrawer ? 'bg-[#ffedd5] text-[#c2410c] border-[#fed7aa]' : 'bg-[#ffffff] text-[#475569] border-[#cbd5e1] hover:bg-[#f1f5f9]'
            }`}
            title="Toggle Speaker Notes"
          >
            <MessageSquare className="h-3 w-3" />
            <span className="hidden sm:inline">Notes</span>
          </button>

          <button
            onClick={() => setIsPresenting(true)}
            className="flex items-center space-x-1.5 px-3.5 py-1 rounded-md bg-[#ea580c] hover:bg-[#c2410c] text-white text-xs font-semibold shadow-sm transition-all hover:scale-[1.02]"
          >
            <Play className="h-3 w-3 fill-current" />
            <span>Present Fullscreen</span>
          </button>
        </div>
      </div>

      {/* 2. Ribbon Action Toolbar (Light Theme) */}
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-[#ffffff] border-b border-[#e2e8f0] text-xs shadow-sm shrink-0">
        {activeRibbonTab === 'home' && (
          <>
            {/* Slide Operations */}
            <div className="flex items-center space-x-1 pr-2 border-r border-[#e2e8f0]">
              <button
                onClick={() => handleAddSlide('content')}
                className="flex items-center space-x-1 px-2.5 py-1 rounded bg-[#fff7ed] hover:bg-[#ffedd5] border border-[#fed7aa] text-[#c2410c] font-semibold"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Slide</span>
              </button>
              <button
                onClick={handleDuplicateSlide}
                className="p-1.5 rounded hover:bg-[#f1f5f9] text-[#334155] border border-[#cbd5e1]"
                title="Duplicate Slide"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleDeleteSlide}
                className="p-1.5 rounded hover:bg-[#fee2e2] text-rose-600 border border-[#fecaca]"
                title="Delete Slide"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Slide Order Controls */}
            <div className="flex items-center space-x-1 pr-2 border-r border-[#e2e8f0]">
              <button
                onClick={() => handleMoveSlide('up')}
                disabled={activeSlideIndex === 0}
                className="p-1.5 rounded hover:bg-[#f1f5f9] text-[#334155] border border-[#cbd5e1] disabled:opacity-30"
                title="Move Slide Up"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => handleMoveSlide('down')}
                disabled={activeSlideIndex === slides.length - 1}
                className="p-1.5 rounded hover:bg-[#f1f5f9] text-[#334155] border border-[#cbd5e1] disabled:opacity-30"
                title="Move Slide Down"
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Layout Selector */}
            <div className="flex items-center space-x-1 pr-2 border-r border-[#e2e8f0]">
              <span className="text-[#64748b] font-medium">Layout:</span>
              <select
                value={currentSlide.layout}
                onChange={(e) => handleUpdateSlide({ layout: e.target.value as any })}
                className="bg-[#f8fafc] text-[#0f172a] px-2 py-1 rounded border border-[#cbd5e1] text-xs font-semibold focus:outline-none"
              >
                <option value="title">Title Slide</option>
                <option value="content">Content & Bullets</option>
                <option value="two-column">Two-Column Grid</option>
                <option value="kpi-grid">Executive KPI Matrix</option>
                <option value="timeline">Milestone Timeline</option>
                <option value="table">Table & Parameters</option>
              </select>
            </div>

            {/* Font Color & Accent Color Pickers */}
            <div className="flex items-center space-x-1.5">
              <div className="flex items-center rounded border border-[#cbd5e1] hover:bg-[#f1f5f9] px-2 py-1" title="Change Font Color">
                <span className="font-bold text-xs leading-none mr-1.5 font-serif">A</span>
                <input
                  type="color"
                  value={selectedFontColor}
                  onChange={(e) => {
                    setSelectedFontColor(e.target.value);
                    const el = document.activeElement as HTMLElement;
                    if (el && el.tagName === 'INPUT') el.style.color = e.target.value;
                  }}
                  className="h-4 w-5 cursor-pointer border-none p-0 bg-transparent"
                />
              </div>

              <div className="flex items-center rounded border border-[#cbd5e1] hover:bg-[#f1f5f9] px-2 py-1" title="Slide Accent Color">
                <span className="text-[10px] font-semibold mr-1.5 text-[#ea580c]">Accent</span>
                <input
                  type="color"
                  value={currentSlide.accentColor || '#ea580c'}
                  onChange={(e) => {
                    setSelectedAccentColor(e.target.value);
                    handleUpdateSlide({ accentColor: e.target.value });
                  }}
                  className="h-4 w-5 cursor-pointer border-none p-0 bg-transparent"
                />
              </div>
            </div>
          </>
        )}

        {activeRibbonTab === 'insert' && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                const bullets = [...currentSlide.bullets, 'New key takeaway / operational parameter'];
                handleUpdateSlide({ bullets });
              }}
              className="flex items-center space-x-1 px-3 py-1 rounded bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#cbd5e1] text-[#0f172a]"
            >
              <Plus className="h-3.5 w-3.5 text-blue-600" />
              <span>Add Bullet Point</span>
            </button>

            <button
              onClick={() => {
                const kpis = [...currentSlide.kpis, { label: 'New Metric', value: '100%' }];
                handleUpdateSlide({ kpis });
              }}
              className="flex items-center space-x-1 px-3 py-1 rounded bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#cbd5e1] text-[#0f172a]"
            >
              <Plus className="h-3.5 w-3.5 text-emerald-600" />
              <span>Add KPI Chip</span>
            </button>

            <button
              onClick={() => {
                const timeline = [
                  ...currentSlide.timeline,
                  { step: `Phase ${currentSlide.timeline.length + 1}`, title: 'New Milestone', desc: 'Milestone description' }
                ];
                handleUpdateSlide({ timeline });
              }}
              className="flex items-center space-x-1 px-3 py-1 rounded bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#cbd5e1] text-[#0f172a]"
            >
              <Plus className="h-3.5 w-3.5 text-purple-600" />
              <span>Add Timeline Step</span>
            </button>

            <button
              onClick={() => handleAddSlide('table')}
              className="flex items-center space-x-1 px-3 py-1 rounded bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#cbd5e1] text-[#0f172a]"
            >
              <Table className="h-3.5 w-3.5 text-orange-600" />
              <span>Insert Table Slide</span>
            </button>
          </div>
        )}

        {activeRibbonTab === 'design' && (
          <div className="flex items-center space-x-4">
            {/* Background Presets */}
            <div className="flex items-center space-x-1.5">
              <span className="text-[#64748b] font-medium">Slide Background:</span>
              <div className="flex items-center space-x-1">
                {SLIDE_BG_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => handleUpdateSlide({ bgColor: preset.value })}
                    className={`h-6 px-2 rounded-md border text-[11px] font-medium transition-all ${
                      currentSlide.bgColor === preset.value
                        ? 'border-[#ea580c] ring-1 ring-[#ea580c] font-bold text-[#ea580c]'
                        : 'border-[#cbd5e1] text-[#475569] hover:border-[#94a3b8]'
                    }`}
                    style={{ backgroundColor: preset.value }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio */}
            <div className="flex items-center space-x-1.5 pl-3 border-l border-[#e2e8f0]">
              <span className="text-[#64748b] font-medium">Aspect Ratio:</span>
              <button
                onClick={() => setAspectRatio('16:9')}
                className={`px-2.5 py-1 rounded text-xs font-semibold ${
                  aspectRatio === '16:9' ? 'bg-[#ea580c] text-white' : 'bg-[#f8fafc] border border-[#cbd5e1] text-[#475569]'
                }`}
              >
                16:9 Widescreen
              </button>
              <button
                onClick={() => setAspectRatio('4:3')}
                className={`px-2.5 py-1 rounded text-xs font-semibold ${
                  aspectRatio === '4:3' ? 'bg-[#ea580c] text-white' : 'bg-[#f8fafc] border border-[#cbd5e1] text-[#475569]'
                }`}
              >
                4:3 Standard
              </button>
            </div>
          </div>
        )}

        {activeRibbonTab === 'transitions' && (
          <div className="flex items-center space-x-3 text-xs">
            <span className="text-[#64748b] font-medium">Slide Animation:</span>
            {(['fade', 'slide', 'zoom'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTransitionEffect(t)}
                className={`px-3 py-1 rounded-md capitalize font-semibold transition-all ${
                  transitionEffect === t
                    ? 'bg-[#ea580c] text-white shadow-sm'
                    : 'bg-[#f8fafc] border border-[#cbd5e1] text-[#475569] hover:bg-[#f1f5f9]'
                }`}
              >
                {t} Effect
              </button>
            ))}
          </div>
        )}

        {activeRibbonTab === 'slideshow' && (
          <div className="flex items-center space-x-3 text-xs">
            <button
              onClick={() => {
                setActiveSlideIndex(0);
                setIsPresenting(true);
              }}
              className="flex items-center space-x-1.5 px-3.5 py-1 rounded bg-[#ea580c] hover:bg-[#c2410c] text-white font-semibold"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>From Beginning</span>
            </button>
            <button
              onClick={() => setIsPresenting(true)}
              className="flex items-center space-x-1.5 px-3 py-1 rounded bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#cbd5e1] text-[#0f172a] font-medium"
            >
              <Play className="h-3 w-3" />
              <span>From Current Slide ({activeSlideIndex + 1})</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. Main Workspace Area: Left Thumbnails + Right Slide Canvas */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Slide Thumbnails Navigator */}
        <div className="w-56 border-r border-[#cbd5e1] bg-[#f8fafc] flex flex-col overflow-y-auto p-3 space-y-3 shrink-0">
          <div className="flex items-center justify-between px-1 text-[11px] font-bold text-[#64748b] uppercase tracking-wider">
            <span>Slides ({slides.length})</span>
            <button
              onClick={() => handleAddSlide('content')}
              className="p-1 hover:bg-[#e2e8f0] rounded text-[#ea580c]"
              title="Add Slide"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {slides.map((s, idx) => {
            const isSelected = activeSlideIndex === idx;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSlideIndex(idx)}
                className={`w-full text-left p-2.5 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-[#ffffff] border-[#ea580c] shadow-lg ring-2 ring-[#ea580c]/20'
                    : 'bg-[#ffffff] border-[#e2e8f0] hover:border-[#cbd5e1] hover:shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-bold text-[#64748b] mb-1">
                  <span className="font-mono text-[#0f172a]">#{idx + 1}</span>
                  <span className="font-mono text-[9px] uppercase px-1.5 py-0.2 rounded bg-[#f1f5f9] text-[#64748b]">
                    {s.layout}
                  </span>
                </div>
                <div className="font-semibold text-xs text-[#0f172a] truncate">
                  {s.title || 'Untitled Slide'}
                </div>
                <div className="text-[10px] text-[#64748b] truncate mt-0.5">
                  {s.subtitle || 'No subtitle'}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right: Slide Presentation Canvas Workspace */}
        <div className="flex-1 overflow-auto p-6 sm:p-10 flex flex-col items-center justify-center bg-[#e2e8f0] relative">
          <motion.div
            key={currentSlide.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            style={{
              backgroundColor: currentSlide.bgColor || '#ffffff',
            }}
            className={`w-full max-w-4xl ${
              aspectRatio === '16:9' ? 'aspect-[16/9]' : 'aspect-[4/3]'
            } text-[#0f172a] rounded-2xl border border-[#cbd5e1] shadow-2xl p-8 sm:p-12 flex flex-col justify-between relative transition-all overflow-hidden`}
          >
            {/* Top Accent Strip */}
            <div
              className="absolute top-0 inset-x-0 h-2"
              style={{ backgroundColor: currentSlide.accentColor || '#ea580c' }}
            />

            {/* Slide Header Section */}
            <div>
              <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3 mb-6">
                <span
                  className="text-[11px] font-bold tracking-widest uppercase"
                  style={{ color: currentSlide.accentColor || '#ea580c' }}
                >
                  MRPL EXECUTIVE REFINERY BRIEFING
                </span>
                <span className="text-[11px] font-mono text-[#64748b]">
                  SLIDE {activeSlideIndex + 1} OF {slides.length}
                </span>
              </div>

              <input
                type="text"
                value={currentSlide.title}
                onChange={(e) => handleUpdateSlide({ title: e.target.value })}
                className="w-full text-xl sm:text-2xl font-bold bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-[#ea580c]/30 rounded px-1 text-[#0f172a]"
                placeholder="Slide Title"
              />

              <input
                type="text"
                value={currentSlide.subtitle}
                onChange={(e) => handleUpdateSlide({ subtitle: e.target.value })}
                className="w-full text-xs sm:text-sm text-[#64748b] mt-1 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-[#ea580c]/30 rounded px-1"
                placeholder="Subtitle & Context"
              />
            </div>

            {/* Slide Dynamic Content based on Layout */}
            <div className="my-auto flex-1 flex flex-col justify-center py-4">
              {/* 1. Content & Bullets Layout */}
              {currentSlide.layout === 'content' && (
                <div className="space-y-3">
                  {currentSlide.bullets.map((bullet, bIdx) => (
                    <div key={bIdx} className="flex items-start space-x-3">
                      <div
                        className="h-2 w-2 rounded-full mt-2 shrink-0"
                        style={{ backgroundColor: currentSlide.accentColor || '#ea580c' }}
                      />
                      <input
                        type="text"
                        value={bullet}
                        onChange={(e) => {
                          const updatedBullets = [...currentSlide.bullets];
                          updatedBullets[bIdx] = e.target.value;
                          handleUpdateSlide({ bullets: updatedBullets });
                        }}
                        className="flex-1 text-sm sm:text-base text-[#1e293b] bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-[#ea580c]/30 rounded px-1"
                      />
                      <button
                        onClick={() => {
                          const updatedBullets = currentSlide.bullets.filter((_, idx) => idx !== bIdx);
                          handleUpdateSlide({ bullets: updatedBullets });
                        }}
                        className="text-xs text-[#94a3b8] hover:text-rose-600 p-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* 2. Two-Column Layout */}
              {currentSlide.layout === 'two-column' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="p-4 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] space-y-2">
                    <h4 className="font-bold text-xs text-[#0f172a] uppercase">Key Operations</h4>
                    {currentSlide.bullets.slice(0, 2).map((b, idx) => (
                      <p key={idx} className="text-xs text-[#334155] leading-relaxed">&bull; {b}</p>
                    ))}
                  </div>
                  <div className="p-4 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] space-y-2">
                    <h4 className="font-bold text-xs text-[#0f172a] uppercase">Engineering Takeaways</h4>
                    {currentSlide.bullets.slice(2).map((b, idx) => (
                      <p key={idx} className="text-xs text-[#334155] leading-relaxed">&bull; {b}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Milestone Timeline Layout */}
              {currentSlide.layout === 'timeline' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {currentSlide.timeline.map((t, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] flex flex-col justify-between">
                      <div>
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider"
                          style={{ color: currentSlide.accentColor || '#ea580c' }}
                        >
                          {t.step}
                        </span>
                        <input
                          type="text"
                          value={t.title}
                          onChange={(e) => {
                            const newTl = [...currentSlide.timeline];
                            newTl[idx].title = e.target.value;
                            handleUpdateSlide({ timeline: newTl });
                          }}
                          className="font-bold text-xs text-[#0f172a] mt-1 w-full bg-transparent border-none focus:outline-none"
                        />
                      </div>
                      <input
                        type="text"
                        value={t.desc}
                        onChange={(e) => {
                          const newTl = [...currentSlide.timeline];
                          newTl[idx].desc = e.target.value;
                          handleUpdateSlide({ timeline: newTl });
                        }}
                        className="text-[11px] text-[#64748b] mt-2 w-full bg-transparent border-none focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* 4. Table Layout */}
              {currentSlide.layout === 'table' && currentSlide.tableData && (
                <div className="overflow-x-auto rounded-xl border border-[#cbd5e1]">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-[#f1f5f9] text-[#0f172a] font-bold border-b border-[#cbd5e1]">
                      <tr>
                        {currentSlide.tableData.headers.map((h, hIdx) => (
                          <th key={hIdx} className="p-2.5 border-r border-[#cbd5e1]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {currentSlide.tableData.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="border-b border-[#e2e8f0] hover:bg-[#f8fafc]">
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="p-2.5 border-r border-[#e2e8f0] text-[#334155]">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 5. KPI Grid Layout / Generic */}
              {(currentSlide.layout === 'kpi-grid' || currentSlide.layout === 'title') && currentSlide.kpis && (
                <div className="grid grid-cols-3 gap-4">
                  {currentSlide.kpis.map((kpi, kIdx) => (
                    <div key={kIdx} className="p-4 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] flex flex-col justify-between shadow-sm">
                      <input
                        type="text"
                        value={kpi.label}
                        onChange={(e) => {
                          const newKpis = [...currentSlide.kpis];
                          newKpis[kIdx].label = e.target.value;
                          handleUpdateSlide({ kpis: newKpis });
                        }}
                        className="text-[11px] text-[#64748b] uppercase font-semibold bg-transparent border-none focus:outline-none"
                      />
                      <input
                        type="text"
                        value={kpi.value}
                        onChange={(e) => {
                          const newKpis = [...currentSlide.kpis];
                          newKpis[kIdx].value = e.target.value;
                          handleUpdateSlide({ kpis: newKpis });
                        }}
                        className="text-xl sm:text-2xl font-bold font-mono text-[#0f172a] mt-1 bg-transparent border-none focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Slide Footer */}
            <div className="flex items-center justify-between border-t border-[#e2e8f0] pt-3 text-[11px] text-[#64748b]">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span className="font-semibold">MRPL AIR-GAPPED SYSTEM</span>
              </div>
              <div className="font-mono">
                CONFIDENTIAL REFINERY DECK
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* 4. Speaker Notes Collapsible Drawer */}
      {showNotesDrawer && (
        <div className="bg-[#ffffff] border-t border-[#cbd5e1] p-3 shrink-0 flex flex-col space-y-1.5 z-10">
          <div className="flex items-center justify-between text-xs text-[#64748b]">
            <span className="font-bold flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-[#ea580c]" />
              <span>Speaker Presenter Notes (Slide {activeSlideIndex + 1})</span>
            </span>
            <button onClick={() => setShowNotesDrawer(false)} className="text-xs hover:text-[#0f172a]">✕</button>
          </div>
          <textarea
            value={currentSlide.notes}
            onChange={(e) => handleUpdateSlide({ notes: e.target.value })}
            placeholder="Type private speaker notes and presentation talking points here..."
            className="w-full h-16 p-2 rounded-lg border border-[#cbd5e1] text-xs font-sans text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#ea580c] resize-none"
          />
        </div>
      )}

      {/* 5. Bottom Navigation & Status Footer */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#ffffff] border-t border-[#cbd5e1] text-xs text-[#64748b] shrink-0">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveSlideIndex((curr) => Math.max(0, curr - 1))}
            disabled={activeSlideIndex === 0}
            className="p-1 rounded hover:bg-[#f1f5f9] border border-[#cbd5e1] disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="font-medium text-[#0f172a]">Slide {activeSlideIndex + 1} of {slides.length}</span>
          <button
            onClick={() => setActiveSlideIndex((curr) => Math.min(slides.length - 1, curr + 1))}
            disabled={activeSlideIndex === slides.length - 1}
            className="p-1 rounded hover:bg-[#f1f5f9] border border-[#cbd5e1] disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#cbd5e1] text-[#0f172a]"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Deck</span>
          </button>
          <span className="font-semibold text-orange-700">PowerPoint Studio Mode</span>
        </div>
      </div>

      {/* 6. REAL FULLSCREEN PRESENTATION MODE (SlideShow) */}
      <AnimatePresence>
        {isPresenting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#000000] text-white flex flex-col justify-between p-6 sm:p-12 select-none"
            onMouseMove={(e) => setLaserPointer({ x: e.clientX, y: e.clientY })}
          >
            {/* Laser Pointer simulation */}
            {laserPointer && (
              <div
                className="pointer-events-none fixed h-3.5 w-3.5 rounded-full bg-red-500/80 shadow-[0_0_12px_#ef4444] z-50 -translate-x-1/2 -translate-y-1/2"
                style={{ left: laserPointer.x, top: laserPointer.y }}
              />
            )}

            {/* Top SlideShow Controls */}
            <div className="flex items-center justify-between text-xs text-white/70">
              <div className="flex items-center space-x-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono">LIVE SLIDESHOW &bull; {deliverable.filename}</span>
              </div>

              <div className="flex items-center space-x-4">
                <span>Slide {activeSlideIndex + 1} / {slides.length}</span>
                <button
                  onClick={() => setIsPresenting(false)}
                  className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium flex items-center space-x-1"
                >
                  <X className="h-4 w-4" />
                  <span>Exit (Esc)</span>
                </button>
              </div>
            </div>

            {/* Active Slide Screen */}
            <div className="my-auto flex justify-center items-center">
              <div
                style={{ backgroundColor: currentSlide.bgColor || '#ffffff' }}
                className="w-full max-w-5xl aspect-[16/9] text-[#0f172a] rounded-3xl p-10 sm:p-16 flex flex-col justify-between shadow-2xl relative"
              >
                <div className="absolute top-0 inset-x-0 h-3 rounded-t-3xl bg-[#ea580c]" />

                <div>
                  <div className="text-xs font-bold text-[#ea580c] uppercase tracking-widest mb-2">
                    MRPL EXECUTIVE BRIEFING
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0f172a] tracking-tight">
                    {currentSlide.title}
                  </h1>
                  <p className="text-base text-[#64748b] mt-2 font-medium">
                    {currentSlide.subtitle}
                  </p>
                </div>

                <div className="my-auto py-6 space-y-4">
                  {currentSlide.bullets.map((b, idx) => (
                    <div key={idx} className="flex items-start space-x-3 text-lg text-[#1e293b]">
                      <div className="h-2.5 w-2.5 rounded-full bg-[#ea580c] mt-2.5 shrink-0" />
                      <span>{b}</span>
                    </div>
                  ))}

                  {currentSlide.kpis && currentSlide.kpis.length > 0 && (
                    <div className="grid grid-cols-3 gap-6 pt-4">
                      {currentSlide.kpis.map((k, idx) => (
                        <div key={idx} className="p-4 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0]">
                          <div className="text-xs font-bold text-[#64748b] uppercase">{k.label}</div>
                          <div className="text-2xl font-mono font-extrabold text-[#0f172a] mt-1">{k.value}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-[#94a3b8] border-t border-[#e2e8f0] pt-4">
                  <span>MRPL Sovereign Engineering Briefing</span>
                  <span>Slide {activeSlideIndex + 1} of {slides.length}</span>
                </div>
              </div>
            </div>

            {/* Bottom SlideShow Click Bar */}
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={() => setActiveSlideIndex((curr) => Math.max(0, curr - 1))}
                disabled={activeSlideIndex === 0}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white disabled:opacity-30"
              >
                ◀ Previous Slide
              </button>
              <button
                onClick={() => setActiveSlideIndex((curr) => Math.min(slides.length - 1, curr + 1))}
                disabled={activeSlideIndex === slides.length - 1}
                className="px-5 py-2 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] text-white font-semibold shadow-lg shadow-orange-500/20"
              >
                Next Slide ▶
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
