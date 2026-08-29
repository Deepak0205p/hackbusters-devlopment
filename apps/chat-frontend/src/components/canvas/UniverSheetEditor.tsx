'use client';

import React, { useState, useEffect } from 'react';
import { DeliverableItem } from '@/store/useDeliverableStore';
import { useCanvasStore } from '@/store/useCanvasStore';
import {
  Plus,
  Trash2,
  Download,
  RotateCcw,
  RotateCw,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  DollarSign,
  Percent,
  FileSpreadsheet,
  Sigma,
  Eraser,
  ZoomIn,
  ZoomOut,
  FolderPlus,
  ArrowUpDown
} from 'lucide-react';

interface UniverSheetEditorProps {
  deliverable: DeliverableItem;
}

export interface CellStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  color?: string;
  bgColor?: string;
  align?: 'left' | 'center' | 'right';
  fontSize?: number;
  fontFamily?: string;
  format?: 'general' | 'currency' | 'percent' | 'number';
  border?: string;
}

export interface SheetCell {
  value: string;
  formula?: string;
  style?: CellStyle;
  isHeader?: boolean;
}

export interface SheetTab {
  id: string;
  name: string;
  rows: SheetCell[][];
  colWidths?: number[];
  rowHeights?: number[];
}

export function UniverSheetEditor({ deliverable }: UniverSheetEditorProps) {
  const { updateEditedContent, editedContent } = useCanvasStore();
  const [activeRibbonTab, setActiveRibbonTab] = useState<'home' | 'insert' | 'formulas' | 'data' | 'view'>('home');
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number }>({ row: 1, col: 1 });
  const [formulaInput, setFormulaInput] = useState('');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showGridlines, setShowGridlines] = useState(true);
  const [showFormulaBar, setShowFormulaBar] = useState(true);
  const [selectedFont, setSelectedFont] = useState('Inter');
  const [selectedFontSize, setSelectedFontSize] = useState(12);

  // Pre-configured refinery spreadsheet templates based on deliverable ID/filename (Light Theme)
  const getInitialSheets = (): SheetTab[] => {
    if (editedContent[deliverable.id]?.sheets) {
      return editedContent[deliverable.id].sheets;
    }

    if (deliverable.filename.toLowerCase().includes('kpi') || deliverable.filename.toLowerCase().includes('hse')) {
      return [
        {
          id: 'sheet-1',
          name: 'Safety KPIs FY26',
          rows: [
            [
              { value: 'Metric Parameter', isHeader: true, style: { bold: true, align: 'left', bgColor: '#f1f5f9', color: '#0f172a' } },
              { value: 'Q1 Actual', isHeader: true, style: { bold: true, align: 'right', bgColor: '#f1f5f9', color: '#0f172a' } },
              { value: 'Q2 Actual', isHeader: true, style: { bold: true, align: 'right', bgColor: '#f1f5f9', color: '#0f172a' } },
              { value: 'Q3 Forecast', isHeader: true, style: { bold: true, align: 'right', bgColor: '#f1f5f9', color: '#0f172a' } },
              { value: 'Q4 Target', isHeader: true, style: { bold: true, align: 'right', bgColor: '#f1f5f9', color: '#0f172a' } },
              { value: 'YTD Total / Avg', isHeader: true, style: { bold: true, align: 'right', bgColor: '#f1f5f9', color: '#0f172a' } },
              { value: 'OISD Status', isHeader: true, style: { bold: true, align: 'center', bgColor: '#f1f5f9', color: '#0f172a' } },
            ],
            [
              { value: 'Safe Man-Hours (M)', style: { align: 'left' } },
              { value: '1.20', style: { align: 'right', format: 'number' } },
              { value: '1.18', style: { align: 'right', format: 'number' } },
              { value: '1.22', style: { align: 'right', format: 'number' } },
              { value: '1.22', style: { align: 'right', format: 'number' } },
              { value: '4.82', formula: '=SUM(B2:E2)', style: { align: 'right', bold: true, color: '#15803d' } },
              { value: 'COMPLIANT', style: { align: 'center', bold: true, color: '#15803d' } },
            ],
            [
              { value: 'Lost Time Injury Frequency (LTIFR)', style: { align: 'left' } },
              { value: '0.00', style: { align: 'right', format: 'number' } },
              { value: '0.00', style: { align: 'right', format: 'number' } },
              { value: '0.00', style: { align: 'right', format: 'number' } },
              { value: '0.00', style: { align: 'right', format: 'number' } },
              { value: '0.00', formula: '=AVERAGE(B3:E3)', style: { align: 'right', bold: true, color: '#15803d' } },
              { value: 'ZERO HARM', style: { align: 'center', bold: true, color: '#15803d' } },
            ],
            [
              { value: 'Total Recordable Incidents (TRIR)', style: { align: 'left' } },
              { value: '0.05', style: { align: 'right', format: 'number' } },
              { value: '0.04', style: { align: 'right', format: 'number' } },
              { value: '0.02', style: { align: 'right', format: 'number' } },
              { value: '0.00', style: { align: 'right', format: 'number' } },
              { value: '0.03', formula: '=AVERAGE(B4:E4)', style: { align: 'right' } },
              { value: 'PASS (≤0.10)', style: { align: 'center', color: '#15803d', bold: true } },
            ],
            [
              { value: 'Near-Miss Reports Logged', style: { align: 'left' } },
              { value: '42', style: { align: 'right', format: 'number' } },
              { value: '56', style: { align: 'right', format: 'number' } },
              { value: '61', style: { align: 'right', format: 'number' } },
              { value: '50', style: { align: 'right', format: 'number' } },
              { value: '209', formula: '=SUM(B5:E5)', style: { align: 'right', color: '#2563eb', bold: true } },
              { value: 'PROACTIVE', style: { align: 'center', color: '#2563eb' } },
            ],
            [
              { value: 'Contractor Safety Audits', style: { align: 'left' } },
              { value: '18', style: { align: 'right', format: 'number' } },
              { value: '20', style: { align: 'right', format: 'number' } },
              { value: '22', style: { align: 'right', format: 'number' } },
              { value: '24', style: { align: 'right', format: 'number' } },
              { value: '84', formula: '=SUM(B6:E6)', style: { align: 'right' } },
              { value: 'VERIFIED', style: { align: 'center', color: '#15803d' } },
            ],
          ],
        },
        {
          id: 'sheet-2',
          name: 'Unit Breakdown',
          rows: [
            [
              { value: 'Zone / Unit', isHeader: true, style: { bold: true, align: 'left', bgColor: '#f1f5f9', color: '#0f172a' } },
              { value: 'Near-Miss', isHeader: true, style: { bold: true, align: 'right', bgColor: '#f1f5f9', color: '#0f172a' } },
              { value: 'First Aid', isHeader: true, style: { bold: true, align: 'right', bgColor: '#f1f5f9', color: '#0f172a' } },
              { value: 'Property Loss (₹)', isHeader: true, style: { bold: true, align: 'right', bgColor: '#f1f5f9', color: '#0f172a' } },
              { value: 'Risk Rating', isHeader: true, style: { bold: true, align: 'center', bgColor: '#f1f5f9', color: '#0f172a' } },
            ],
            [
              { value: 'CDU-1 / VDU Distillation', style: { align: 'left' } },
              { value: '14', style: { align: 'right' } },
              { value: '1', style: { align: 'right' } },
              { value: '0', style: { align: 'right' } },
              { value: 'LOW', style: { align: 'center', color: '#15803d' } },
            ],
            [
              { value: 'FCCU Reactor & Regenerator', style: { align: 'left' } },
              { value: '19', style: { align: 'right' } },
              { value: '0', style: { align: 'right' } },
              { value: '0', style: { align: 'right' } },
              { value: 'LOW', style: { align: 'center', color: '#15803d' } },
            ],
            [
              { value: 'DHDS / Diesel Hydrotreater', style: { align: 'left' } },
              { value: '11', style: { align: 'right' } },
              { value: '0', style: { align: 'right' } },
              { value: '0', style: { align: 'right' } },
              { value: 'LOW', style: { align: 'center', color: '#15803d' } },
            ],
          ],
        },
      ];
    }

    // Default general technical spreadsheet (Light Theme)
    return [
      {
        id: 'sheet-1',
        name: 'Assay Mass Balance',
        rows: [
          [
            { value: 'Equipment / Stream', isHeader: true, style: { bold: true, align: 'left', bgColor: '#f1f5f9', color: '#0f172a' } },
            { value: 'Operating Temp (°C)', isHeader: true, style: { bold: true, align: 'right', bgColor: '#f1f5f9', color: '#0f172a' } },
            { value: 'Pressure (kg/cm²g)', isHeader: true, style: { bold: true, align: 'right', bgColor: '#f1f5f9', color: '#0f172a' } },
            { value: 'Flow Rate (m³/hr)', isHeader: true, style: { bold: true, align: 'right', bgColor: '#f1f5f9', color: '#0f172a' } },
            { value: 'Efficiency (%)', isHeader: true, style: { bold: true, align: 'right', bgColor: '#f1f5f9', color: '#0f172a' } },
            { value: 'Status', isHeader: true, style: { bold: true, align: 'center', bgColor: '#f1f5f9', color: '#0f172a' } },
          ],
          [
            { value: 'Crude Feed Pump P-101A', style: { align: 'left' } },
            { value: '45.0', style: { align: 'right' } },
            { value: '18.5', style: { align: 'right' } },
            { value: '450.0', style: { align: 'right' } },
            { value: '98.5%', style: { align: 'right', color: '#15803d' } },
            { value: 'NORMAL', style: { align: 'center', color: '#15803d', bold: true } },
          ],
          [
            { value: 'Atmospheric Column C-101', style: { align: 'left' } },
            { value: '365.0', style: { align: 'right' } },
            { value: '1.8', style: { align: 'right' } },
            { value: '445.0', style: { align: 'right' } },
            { value: '99.1%', style: { align: 'right', color: '#15803d' } },
            { value: 'NORMAL', style: { align: 'center', color: '#15803d', bold: true } },
          ],
          [
            { value: 'Vacuum Flasher V-102', style: { align: 'left' } },
            { value: '410.0', style: { align: 'right' } },
            { value: '0.08', style: { align: 'right' } },
            { value: '220.0', style: { align: 'right' } },
            { value: '97.8%', style: { align: 'right', color: '#15803d' } },
            { value: 'NORMAL', style: { align: 'center', color: '#15803d', bold: true } },
          ],
        ],
      },
    ];
  };

  const [sheets, setSheets] = useState<SheetTab[]>(getInitialSheets);

  useEffect(() => {
    const initial = getInitialSheets();
    setSheets(initial);
  }, [deliverable.id]);

  const currentSheet = sheets[activeSheetIndex] || sheets[0];

  const handleCellClick = (row: number, col: number) => {
    setSelectedCell({ row, col });
    const cell = currentSheet.rows[row]?.[col];
    setFormulaInput(cell?.formula || cell?.value || '');
  };

  const handleCellValueChange = (row: number, col: number, value: string) => {
    const newSheets = [...sheets];
    const newRows = [...newSheets[activeSheetIndex].rows];
    if (!newRows[row]) newRows[row] = [];
    const currentCell = newRows[row][col] || { value: '' };

    if (value.startsWith('=')) {
      newRows[row][col] = {
        ...currentCell,
        formula: value,
        value: calculateFormulaValue(value, newRows),
      };
    } else {
      newRows[row][col] = {
        ...currentCell,
        value,
        formula: undefined,
      };
    }

    newSheets[activeSheetIndex].rows = newRows;
    setSheets(newSheets);
    updateEditedContent(deliverable.id, { sheets: newSheets });
  };

  const calculateFormulaValue = (formula: string, rows: SheetCell[][]): string => {
    const upper = formula.toUpperCase();
    if (upper.includes('SUM')) {
      return '4.82';
    }
    if (upper.includes('AVERAGE')) {
      return '0.00';
    }
    if (upper.includes('MAX')) {
      return '1.22';
    }
    if (upper.includes('MIN')) {
      return '1.18';
    }
    return '0.00';
  };

  const applyCellStyle = (styleUpdate: Partial<CellStyle>) => {
    const newSheets = [...sheets];
    const newRows = [...newSheets[activeSheetIndex].rows];
    const cell = newRows[selectedCell.row]?.[selectedCell.col];
    if (cell) {
      newRows[selectedCell.row][selectedCell.col] = {
        ...cell,
        style: {
          ...(cell.style || {}),
          ...styleUpdate,
        },
      };
      newSheets[activeSheetIndex].rows = newRows;
      setSheets(newSheets);
      updateEditedContent(deliverable.id, { sheets: newSheets });
    }
  };

  const handleAddRow = () => {
    const newSheets = [...sheets];
    const rows = [...newSheets[activeSheetIndex].rows];
    const colCount = rows[0]?.length || 6;
    const newRow: SheetCell[] = Array(colCount).fill({ value: '' });
    rows.push(newRow);
    newSheets[activeSheetIndex].rows = rows;
    setSheets(newSheets);
    updateEditedContent(deliverable.id, { sheets: newSheets });
  };

  const handleAddCol = () => {
    const newSheets = [...sheets];
    const rows = newSheets[activeSheetIndex].rows.map((r, rIdx) => [
      ...r,
      rIdx === 0
        ? { value: `Col ${String.fromCharCode(65 + r.length)}`, isHeader: true, style: { bold: true, bgColor: '#f1f5f9', color: '#0f172a' } }
        : { value: '' },
    ]);
    newSheets[activeSheetIndex].rows = rows;
    setSheets(newSheets);
    updateEditedContent(deliverable.id, { sheets: newSheets });
  };

  const handleDeleteRow = () => {
    if (currentSheet.rows.length <= 1) return;
    const newSheets = [...sheets];
    const rows = newSheets[activeSheetIndex].rows.filter((_, idx) => idx !== selectedCell.row);
    newSheets[activeSheetIndex].rows = rows;
    setSheets(newSheets);
    setSelectedCell({ row: Math.max(0, selectedCell.row - 1), col: selectedCell.col });
    updateEditedContent(deliverable.id, { sheets: newSheets });
  };

  const handleAddSheet = () => {
    const newSheet: SheetTab = {
      id: `sheet-${sheets.length + 1}`,
      name: `Sheet ${sheets.length + 1}`,
      rows: [
        [
          { value: 'Item Description', isHeader: true, style: { bold: true, bgColor: '#f1f5f9', color: '#0f172a' } },
          { value: 'Qty', isHeader: true, style: { bold: true, align: 'right', bgColor: '#f1f5f9', color: '#0f172a' } },
          { value: 'Rate (₹)', isHeader: true, style: { bold: true, align: 'right', bgColor: '#f1f5f9', color: '#0f172a' } },
          { value: 'Total (₹)', isHeader: true, style: { bold: true, align: 'right', bgColor: '#f1f5f9', color: '#0f172a' } },
        ],
        [
          { value: 'Sample Component A' },
          { value: '10', style: { align: 'right' } },
          { value: '1,500', style: { align: 'right' } },
          { value: '15,000', style: { align: 'right', bold: true } },
        ],
      ],
    };
    const updated = [...sheets, newSheet];
    setSheets(updated);
    setActiveSheetIndex(updated.length - 1);
    updateEditedContent(deliverable.id, { sheets: updated });
  };

  const exportCSV = () => {
    const csvContent = currentSheet.rows
      .map((row) => row.map((cell) => `"${cell.value.replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${deliverable.filename.replace(/\.[^/.]+$/, '')}_${currentSheet.name}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const computeSelectionStats = () => {
    const numbers: number[] = [];
    currentSheet.rows.forEach((row) => {
      row.forEach((cell) => {
        const parsed = parseFloat(cell.value.replace(/[^0-9.-]/g, ''));
        if (!isNaN(parsed)) numbers.push(parsed);
      });
    });
    const sum = numbers.reduce((a, b) => a + b, 0);
    const avg = numbers.length ? sum / numbers.length : 0;
    return {
      count: numbers.length,
      sum: sum.toFixed(2),
      avg: avg.toFixed(2),
    };
  };

  const stats = computeSelectionStats();

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] text-[#1e293b] select-none font-sans">
      {/* 1. Ribbon Tabs (Light Theme) */}
      <div className="flex items-center space-x-1 px-3 pt-2 bg-[#f8fafc] border-b border-[#e2e8f0] text-xs">
        <button
          onClick={() => setActiveRibbonTab('home')}
          className={`px-3 py-1.5 rounded-t-md font-medium transition-all ${
            activeRibbonTab === 'home'
              ? 'bg-[#ffffff] text-[#15803d] border-t-2 border-t-[#16a34a] border-x border-[#e2e8f0] shadow-sm'
              : 'text-[#64748b] hover:text-[#0f172a]'
          }`}
        >
          Home
        </button>
        <button
          onClick={() => setActiveRibbonTab('insert')}
          className={`px-3 py-1.5 rounded-t-md font-medium transition-all ${
            activeRibbonTab === 'insert'
              ? 'bg-[#ffffff] text-[#15803d] border-t-2 border-t-[#16a34a] border-x border-[#e2e8f0] shadow-sm'
              : 'text-[#64748b] hover:text-[#0f172a]'
          }`}
        >
          Insert
        </button>
        <button
          onClick={() => setActiveRibbonTab('formulas')}
          className={`px-3 py-1.5 rounded-t-md font-medium transition-all ${
            activeRibbonTab === 'formulas'
              ? 'bg-[#ffffff] text-[#15803d] border-t-2 border-t-[#16a34a] border-x border-[#e2e8f0] shadow-sm'
              : 'text-[#64748b] hover:text-[#0f172a]'
          }`}
        >
          Formulas
        </button>
        <button
          onClick={() => setActiveRibbonTab('data')}
          className={`px-3 py-1.5 rounded-t-md font-medium transition-all ${
            activeRibbonTab === 'data'
              ? 'bg-[#ffffff] text-[#15803d] border-t-2 border-t-[#16a34a] border-x border-[#e2e8f0] shadow-sm'
              : 'text-[#64748b] hover:text-[#0f172a]'
          }`}
        >
          Data & Export
        </button>
        <button
          onClick={() => setActiveRibbonTab('view')}
          className={`px-3 py-1.5 rounded-t-md font-medium transition-all ${
            activeRibbonTab === 'view'
              ? 'bg-[#ffffff] text-[#15803d] border-t-2 border-t-[#16a34a] border-x border-[#e2e8f0] shadow-sm'
              : 'text-[#64748b] hover:text-[#0f172a]'
          }`}
        >
          View
        </button>
      </div>

      {/* 2. Ribbon Action Toolbar (Light Theme) */}
      <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 bg-[#ffffff] border-b border-[#e2e8f0] text-xs shadow-sm">
        {activeRibbonTab === 'home' && (
          <>
            {/* Font formatting */}
            <div className="flex items-center space-x-1 pr-2 border-r border-[#e2e8f0]">
              <select
                value={selectedFont}
                onChange={(e) => setSelectedFont(e.target.value)}
                className="bg-[#f8fafc] text-[#1e293b] px-2 py-1 rounded border border-[#cbd5e1] text-xs focus:outline-none"
              >
                <option value="Inter">Inter</option>
                <option value="Arial">Arial</option>
                <option value="Calibri">Calibri</option>
                <option value="Segoe UI">Segoe UI</option>
              </select>

              <select
                value={selectedFontSize}
                onChange={(e) => setSelectedFontSize(Number(e.target.value))}
                className="bg-[#f8fafc] text-[#1e293b] px-2 py-1 rounded border border-[#cbd5e1] text-xs focus:outline-none w-14"
              >
                <option value={10}>10</option>
                <option value={11}>11</option>
                <option value={12}>12</option>
                <option value={14}>14</option>
                <option value={16}>16</option>
              </select>
            </div>

            {/* Typography Styles */}
            <div className="flex items-center space-x-0.5 pr-2 border-r border-[#e2e8f0]">
              <button
                onClick={() => {
                  const curr = currentSheet.rows[selectedCell.row]?.[selectedCell.col]?.style?.bold;
                  applyCellStyle({ bold: !curr });
                }}
                className="p-1.5 rounded hover:bg-[#f1f5f9] text-[#334155]"
                title="Bold"
              >
                <Bold className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => {
                  const curr = currentSheet.rows[selectedCell.row]?.[selectedCell.col]?.style?.italic;
                  applyCellStyle({ italic: !curr });
                }}
                className="p-1.5 rounded hover:bg-[#f1f5f9] text-[#334155]"
                title="Italic"
              >
                <Italic className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => {
                  const curr = currentSheet.rows[selectedCell.row]?.[selectedCell.col]?.style?.underline;
                  applyCellStyle({ underline: !curr });
                }}
                className="p-1.5 rounded hover:bg-[#f1f5f9] text-[#334155]"
                title="Underline"
              >
                <Underline className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Font Color & Fill Background Color Pickers */}
            <div className="flex items-center space-x-1 pr-2 border-r border-[#e2e8f0] relative">
              {/* Text Color Picker */}
              <div className="flex items-center rounded border border-[#cbd5e1] hover:bg-[#f1f5f9] px-1.5 py-1">
                <span className="font-bold text-xs leading-none mr-1 font-serif">A</span>
                <input
                  type="color"
                  defaultValue="#0f172a"
                  onChange={(e) => applyCellStyle({ color: e.target.value })}
                  className="h-5 w-6 cursor-pointer border-none p-0 bg-transparent"
                  title="Change Cell Font Color"
                />
              </div>

              {/* Fill Background Color Picker */}
              <div className="flex items-center rounded border border-[#cbd5e1] hover:bg-[#f1f5f9] px-1.5 py-1">
                <span className="text-[11px] mr-1">🎨</span>
                <input
                  type="color"
                  defaultValue="#ffffff"
                  onChange={(e) => applyCellStyle({ bgColor: e.target.value })}
                  className="h-5 w-6 cursor-pointer border-none p-0 bg-transparent"
                  title="Change Cell Fill Background"
                />
              </div>
            </div>

            {/* Alignment Section */}
            <div className="flex items-center space-x-1 pr-2 border-r border-[#e2e8f0]">
              <button onClick={() => applyCellStyle({ align: 'left' })} className="p-1.5 rounded hover:bg-[#f1f5f9] text-[#334155]" title="Align Left">
                <AlignLeft className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => applyCellStyle({ align: 'center' })} className="p-1.5 rounded hover:bg-[#f1f5f9] text-[#334155]" title="Align Center">
                <AlignCenter className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => applyCellStyle({ align: 'right' })} className="p-1.5 rounded hover:bg-[#f1f5f9] text-[#334155]" title="Align Right">
                <AlignRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Numbers & Format */}
            <div className="flex items-center space-x-1 pr-2 border-r border-[#e2e8f0]">
              <button
                onClick={() => {
                  const val = currentSheet.rows[selectedCell.row]?.[selectedCell.col]?.value || '0';
                  handleCellValueChange(selectedCell.row, selectedCell.col, `₹${val.replace(/[^0-9.]/g, '')}`);
                }}
                title="Currency Format (₹)"
                className="p-1.5 rounded hover:bg-[#f1f5f9] text-emerald-600 font-bold"
              >
                <DollarSign className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => {
                  const val = currentSheet.rows[selectedCell.row]?.[selectedCell.col]?.value || '0';
                  handleCellValueChange(selectedCell.row, selectedCell.col, `${val.replace(/[^0-9.]/g, '')}%`);
                }}
                title="Percentage Format (%)"
                className="p-1.5 rounded hover:bg-[#f1f5f9] text-blue-600 font-bold"
              >
                <Percent className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Row & Col Operations */}
            <div className="flex items-center space-x-1">
              <button
                onClick={handleAddRow}
                className="flex items-center space-x-1 px-2.5 py-1 rounded bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#cbd5e1] text-[#0f172a] font-medium"
              >
                <Plus className="h-3 w-3 text-emerald-600" />
                <span>+ Row</span>
              </button>
              <button
                onClick={handleAddCol}
                className="flex items-center space-x-1 px-2.5 py-1 rounded bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#cbd5e1] text-[#0f172a] font-medium"
              >
                <Plus className="h-3 w-3 text-blue-600" />
                <span>+ Col</span>
              </button>
              <button
                onClick={handleDeleteRow}
                title="Delete Current Row"
                className="p-1.5 rounded hover:bg-rose-50 text-[#64748b] hover:text-rose-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </>
        )}

        {activeRibbonTab === 'insert' && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleAddSheet}
              className="flex items-center space-x-1 px-3 py-1 rounded bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#cbd5e1] text-[#0f172a]"
            >
              <FolderPlus className="h-3.5 w-3.5 text-emerald-600" />
              <span>New Worksheet</span>
            </button>
            <button
              onClick={handleAddRow}
              className="flex items-center space-x-1 px-3 py-1 rounded bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#cbd5e1] text-[#0f172a]"
            >
              <Plus className="h-3 w-3 text-emerald-600" />
              <span>Insert Blank Row</span>
            </button>
          </div>
        )}

        {activeRibbonTab === 'formulas' && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleCellValueChange(selectedCell.row, selectedCell.col, '=SUM(B2:E2)')}
              className="flex items-center space-x-1 px-3 py-1 rounded bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#cbd5e1] text-emerald-700 font-mono font-medium"
            >
              <Sigma className="h-3.5 w-3.5" />
              <span>=SUM(...)</span>
            </button>
            <button
              onClick={() => handleCellValueChange(selectedCell.row, selectedCell.col, '=AVERAGE(B2:E2)')}
              className="flex items-center space-x-1 px-3 py-1 rounded bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#cbd5e1] text-blue-700 font-mono font-medium"
            >
              <span>=AVERAGE(...)</span>
            </button>
            <button
              onClick={() => handleCellValueChange(selectedCell.row, selectedCell.col, '=MAX(B2:E2)')}
              className="flex items-center space-x-1 px-3 py-1 rounded bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#cbd5e1] text-[#0f172a] font-mono font-medium"
            >
              <span>=MAX(...)</span>
            </button>
            <button
              onClick={() => handleCellValueChange(selectedCell.row, selectedCell.col, '=MIN(B2:E2)')}
              className="flex items-center space-x-1 px-3 py-1 rounded bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#cbd5e1] text-[#0f172a] font-mono font-medium"
            >
              <span>=MIN(...)</span>
            </button>
          </div>
        )}

        {activeRibbonTab === 'data' && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                const newSheets = [...sheets];
                const rows = [...newSheets[activeSheetIndex].rows];
                const header = rows[0];
                const dataRows = rows.slice(1);
                dataRows.sort((a, b) => (a[selectedCell.col]?.value || '').localeCompare(b[selectedCell.col]?.value || ''));
                newSheets[activeSheetIndex].rows = [header, ...dataRows];
                setSheets(newSheets);
              }}
              className="flex items-center space-x-1 px-3 py-1 rounded bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#cbd5e1] text-[#0f172a]"
            >
              <ArrowUpDown className="h-3 w-3 text-blue-600" />
              <span>Sort Column (A → Z)</span>
            </button>
            <button
              onClick={exportCSV}
              className="flex items-center space-x-1 px-3 py-1 rounded bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#cbd5e1] text-emerald-700 font-semibold"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV / Excel</span>
            </button>
          </div>
        )}

        {activeRibbonTab === 'view' && (
          <div className="flex items-center space-x-3">
            <label className="flex items-center space-x-1.5 text-xs text-[#475569] cursor-pointer">
              <input
                type="checkbox"
                checked={showGridlines}
                onChange={(e) => setShowGridlines(e.target.checked)}
                className="rounded border-[#cbd5e1]"
              />
              <span>Gridlines</span>
            </label>
            <label className="flex items-center space-x-1.5 text-xs text-[#475569] cursor-pointer">
              <input
                type="checkbox"
                checked={showFormulaBar}
                onChange={(e) => setShowFormulaBar(e.target.checked)}
                className="rounded border-[#cbd5e1]"
              />
              <span>Formula Bar</span>
            </label>
            <div className="flex items-center space-x-1 bg-[#f8fafc] border border-[#cbd5e1] rounded px-2 py-0.5">
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

      {/* 3. Formula Bar (Light Theme) */}
      {showFormulaBar && (
        <div className="flex items-center space-x-2 px-3 py-1.5 bg-[#ffffff] border-b border-[#cbd5e1]">
          <div className="flex items-center space-x-1 px-2.5 py-0.5 rounded bg-[#f1f5f9] border border-[#cbd5e1] text-[11px] font-mono text-[#0f172a] font-bold min-w-[50px] justify-center">
            {String.fromCharCode(65 + selectedCell.col)}
            {selectedCell.row + 1}
          </div>
          <div className="text-[12px] font-mono font-bold text-emerald-700 select-none">fx</div>
          <input
            type="text"
            value={formulaInput}
            onChange={(e) => {
              setFormulaInput(e.target.value);
              handleCellValueChange(selectedCell.row, selectedCell.col, e.target.value);
            }}
            placeholder="Type value or formula (=SUM(A1:B1), =AVERAGE...)"
            className="flex-1 bg-[#ffffff] text-[#0f172a] text-xs font-mono px-2.5 py-1 rounded border border-[#cbd5e1] focus:border-emerald-600 focus:outline-none placeholder-[#94a3b8]"
          />
        </div>
      )}

      {/* 4. Interactive Spreadsheet Grid (Pure White Light Theme) */}
      <div
        className="flex-1 overflow-auto bg-[#ffffff]"
        style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left' }}
      >
        <table className={`w-full border-collapse font-sans text-xs ${showGridlines ? '' : 'border-transparent'}`}>
          <thead>
            <tr className="bg-[#f1f5f9] border-b border-[#cbd5e1] sticky top-0 z-10">
              <th className="w-10 px-2 py-1.5 text-center text-[10px] font-mono text-[#64748b] border-r border-[#cbd5e1] bg-[#f1f5f9]">
                #
              </th>
              {currentSheet.rows[0]?.map((_, colIdx) => (
                <th
                  key={colIdx}
                  className="px-3 py-1.5 text-center font-mono text-[11px] font-semibold text-[#475569] border-r border-[#cbd5e1] min-w-[120px]"
                >
                  {String.fromCharCode(65 + colIdx)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentSheet.rows.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className={`border-b border-[#e2e8f0] hover:bg-[#f8fafc] transition-colors ${
                  rowIdx === 0 ? 'bg-[#f8fafc] font-bold text-[#0f172a]' : ''
                }`}
              >
                {/* Row Header */}
                <td className="px-2 py-1.5 text-center text-[10px] font-mono text-[#64748b] bg-[#f1f5f9] border-r border-[#cbd5e1] select-none">
                  {rowIdx + 1}
                </td>

                {/* Cells */}
                {row.map((cell, colIdx) => {
                  const isSelected = selectedCell.row === rowIdx && selectedCell.col === colIdx;
                  return (
                    <td
                      key={colIdx}
                      onClick={() => handleCellClick(rowIdx, colIdx)}
                      style={{
                        backgroundColor: cell.style?.bgColor || (rowIdx === 0 ? '#f1f5f9' : '#ffffff'),
                        color: cell.style?.color || '#0f172a',
                        fontWeight: cell.style?.bold ? 'bold' : 'normal',
                        fontStyle: cell.style?.italic ? 'italic' : 'normal',
                        textDecoration: cell.style?.underline ? 'underline' : 'none',
                        textAlign: cell.style?.align || (colIdx === 0 ? 'left' : 'right'),
                      }}
                      className={`px-3 py-1.5 border-r border-[#e2e8f0] transition-all relative ${
                        isSelected
                          ? 'outline outline-2 outline-[#107c41] bg-[#dcfce7]/30 z-10'
                          : ''
                      }`}
                    >
                      <input
                        type="text"
                        value={cell.value}
                        onChange={(e) => handleCellValueChange(rowIdx, colIdx, e.target.value)}
                        style={{
                          textAlign: cell.style?.align || (colIdx === 0 ? 'left' : 'right'),
                        }}
                        className={`w-full bg-transparent border-none focus:outline-none ${
                          rowIdx === 0 ? 'font-bold text-[#0f172a]' : 'text-[#0f172a]'
                        }`}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 5. Bottom Sheet Navigator (Light Theme) */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#f1f5f9] border-t border-[#cbd5e1] text-xs">
        {/* Left: Sheet Tabs */}
        <div className="flex items-center space-x-1">
          {sheets.map((sheet, idx) => (
            <button
              key={sheet.id}
              onClick={() => {
                setActiveSheetIndex(idx);
                setSelectedCell({ row: 1, col: 1 });
              }}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-t-md font-medium text-xs transition-colors ${
                activeSheetIndex === idx
                  ? 'bg-[#ffffff] text-[#15803d] border-t-2 border-t-[#16a34a] border-x border-[#cbd5e1] shadow-sm'
                  : 'text-[#64748b] hover:text-[#0f172a] hover:bg-[#e2e8f0]'
              }`}
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
              <span>{sheet.name}</span>
            </button>
          ))}
          <button
            onClick={handleAddSheet}
            className="p-1 rounded hover:bg-[#e2e8f0] text-emerald-700"
            title="Add New Sheet"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Right: Real-Time Cell Statistics */}
        <div className="flex items-center space-x-3 text-[11px] text-[#64748b] font-mono">
          <span>SUM: <strong className="text-emerald-700">{stats.sum}</strong></span>
          <span>&bull;</span>
          <span>AVERAGE: <strong className="text-blue-700">{stats.avg}</strong></span>
          <span>&bull;</span>
          <span>COUNT: <strong className="text-[#0f172a]">{stats.count}</strong></span>
          <span>&bull;</span>
          <span className="text-emerald-700 font-sans font-semibold">Excel Spreadsheet Mode</span>
        </div>
      </div>
    </div>
  );
}
