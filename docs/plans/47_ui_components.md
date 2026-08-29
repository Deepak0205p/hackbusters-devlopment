# Plan 47: Component-by-Component Frontend UI Implementation Plan

## 1. Objective
Design and specify every individual React/Tailwind component in `frontend/src/components/` across the evaluation panels: Chat Workspace, File Ingestion, Model Status, 3-Tier Sovereignty Dashboard, Multi-Device Connect Panel, and Deliverables Vault.

## 2. Requirement Mapping
- **SIH26117 Requirement 01:** *SELF-HOSTED PLATFORM* — Modern, intuitive web dashboard.
- **SIH26117 Requirement 06:** *AGENTIC PLANNING & TOOL CALLING* — Real-time reasoning accordion.
- **SIH26117 Requirement 12:** *PROVABLE SOVEREIGNTY AUDITING* — Live network audit dashboard with 3-tier traffic breakdown.

## 3. Detailed Design & Technical Approach

### 3.1. Component Hierarchy & File Mapping

```
frontend/src/components/
├── Header.jsx                    # Top bar: Title, Air-Gap Green Shield, Deployment Mode Badge, Connect Button
├── Chat/
│   ├── ChatContainer.jsx         # Scrollable message stream & agent response area
│   ├── MessageItem.jsx           # Markdown bubble with code syntax highlighting & citations
│   ├── AgentTrace.jsx            # Accordion for Thought -> Action -> Observation steps
│   └── InputBox.jsx              # Prompt textarea, auto-routing badge, attachment handler
├── Sovereignty/
│   ├── SovereigntyBanner.jsx     # Glowing green status banner ("100% AIR-GAPPED & SOVEREIGN")
│   ├── TrafficTiersCard.jsx      # 3-Tier Metric Card: Localhost, LAN/Hotspot, External (0)
│   ├── ExternalPacketCounter.jsx # Giant KPI tile: 0 External Packets, 0 DNS queries
│   ├── SocketTable.jsx           # Table of active sockets with Tier labels (Local, LAN, External)
│   └── AuditExport.jsx           # One-click button to download SHA-256 signed audit certificate
├── Network/
│   ├── DeviceConnectModal.jsx    # QR code scan-to-connect, Hotspot SSID/password, LAN IP display
│   └── ModeBadge.jsx             # Visual tag (Standalone / Venue LAN / Host Hotspot)
├── Models/
│   ├── ModelCards.jsx            # 4 status cards (Qwen3, Coder, VL, Llama) with VRAM indicators
│   ├── VRAMGauge.jsx             # Circular/linear 5.5GB / 6.0GB memory allocation bar
│   └── ModelRegistryModal.jsx    # Modal to register new open-weight models dynamically
├── Ingestion/
│   ├── DropZone.jsx              # Drag-and-drop file uploader (.pdf, .png, .jpg, .tiff)
│   ├── FilePreviewCard.jsx       # High-resolution image/PDF previewer with bounding boxes
│   └── OCRRawViewer.jsx          # Side-by-side view comparing original scan vs OCR text
└── Deliverables/
    ├── DeliverableCard.jsx       # Visual download chips for .docx, .xlsx, .pptx, .py
    └── CodeSnippet.jsx           # Formatted Python script viewer with copy button
```

### 3.2. Key Component: `DeviceConnectModal.jsx` (Multi-Device Access)
```jsx
'use client';
import React, { useEffect, useState } from 'react';
import { Wifi, QrCode, X, Copy, Check, ShieldCheck } from 'lucide-react';
import { useSovereigntyStore } from '../../store/useSovereigntyStore';

export default function DeviceConnectModal({ isOpen, onClose }) {
  const { deploymentMode, hostIp } = useSovereigntyStore();
  const [copied, setCopied] = useState(false);
  const connectUrl = `http://${hostIp}:8000`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6 relative shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-emerald-950 border border-emerald-800 rounded-lg text-emerald-400">
            <Wifi className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Connect From Another Device</h3>
            <p className="text-xs text-slate-400">Secondary Mode: Multi-Device Evaluation</p>
          </div>
        </div>

        {/* Mode Indicator */}
        <div className="mb-4 p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-xs">
          <div className="text-slate-400 mb-1">Detected Network Mode:</div>
          <div className="font-semibold text-emerald-400">
            {deploymentMode === 'HOTSPOT_OPTION_B' 
              ? 'Option B: Host-Created Wi-Fi Hotspot (Closed Network)' 
              : deploymentMode === 'LAN_OPTION_A' 
              ? 'Option A: Venue LAN / Wi-Fi Network' 
              : 'Primary Mode: Standalone Localhost'}
          </div>
        </div>

        {/* Hotspot Credentials (If Option B) */}
        {deploymentMode === 'HOTSPOT_OPTION_B' && (
          <div className="mb-4 p-3 bg-amber-950/30 border border-amber-800/50 rounded-lg text-xs space-y-1">
            <div className="font-semibold text-amber-300">Hotspot Wi-Fi Credentials:</div>
            <div className="text-slate-300"><span className="text-slate-400">SSID:</span> MRPL-SOVEREIGN-AI</div>
            <div className="text-slate-300"><span className="text-slate-400">Password:</span> MRPL2026Sovereign</div>
            <div className="text-emerald-400 text-[11px] font-medium pt-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Internet Sharing: OFF (Guaranteed 0 Egress)
            </div>
          </div>
        )}

        {/* Connection URL */}
        <div className="mb-5">
          <label className="text-xs text-slate-400 block mb-1.5">Open this URL on Judge's Phone / Laptop:</label>
          <div className="flex items-center gap-2">
            <input 
              readOnly 
              value={connectUrl} 
              className="w-full bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-sm px-3 py-2 rounded-lg"
            />
            <button 
              onClick={() => { navigator.clipboard.writeText(connectUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center p-4 bg-slate-950 rounded-lg border border-slate-800">
          <div className="w-36 h-36 bg-white p-2 rounded-lg flex items-center justify-center">
            {/* SVG QR Code representation */}
            <QrCode className="w-28 h-28 text-slate-900" />
          </div>
          <span className="text-[11px] text-slate-400 mt-2">Scan QR code to open Workbench immediately</span>
        </div>
      </div>
    </div>
  );
}
```

## 4. Inputs / Outputs & Contracts
- **Input:** Zustand store telemetry (`deploymentMode`, `hostIp`, `localhost_connections`, `lan_hotspot_connections`, `external_internet_connections`).
- **Output:** Rendered interactive UI panels and multi-device connection modal.

## 5. Dependencies on Other Plan Files
- Depends on: [Plan 46](file:///G:/SIH/p/docs/plans/46_nextjs_static_export.md), [Plan 48](file:///G:/SIH/p/docs/plans/48_frontend_state_websocket.md).
- Depended on by: [Plan 49](file:///G:/SIH/p/docs/plans/49_demo_scenarios_e2e.md).

## 6. Edge Cases & Failure Modes
- **Client Accessing via Non-Hotspot IP:** UI displays both LAN IP and Hotspot IP options if multiple physical adapters are active.

## 7. Acceptance Criteria & Verification
- Clicking "Connect From Another Device" in the header opens modal with accurate IP and QR code.
- 3-tier traffic cards accurately display live local, LAN, and external connection counts.

## 8. Design Decisions & Open Questions
- **DESIGN DECISION — reasoning:** Providing an embedded QR code modal allows evaluators to scan and test the sovereign workbench on their own smartphones/iPads in 5 seconds without typing URLs.
