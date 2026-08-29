# User Interface Design & Component Architecture
## Sovereign On-Premise Agentic AI Workbench (SIH26117)

This document is the authoritative UI/UX design blueprint for the Next.js 14 static web application (`frontend/`). It translates all 12 MRPL operational requirements and multi-device deployment modes into a high-density, industrial control-room interface powered by **Tailwind CSS**, **shadcn/ui (Radix UI)**, and **Framer Motion**.

---

## 1. Visual Atmosphere & Token System (Vercel Geist Design System Standard)

### 1.1. Binding Standard: Vercel Geist Design System
The visual standard is strictly derived from **Vercel's official Geist Design System** (`vercel.com/geist`):
- **Border-First Architecture:** Elevation is communicated via subtle 1px borders (`#262626` / `var(--ds-gray-400)`), NOT heavy drop shadows. Box-shadows are strictly reserved for overlay elements (modals, dropdown menus).
- **Color = State Only:** High-contrast dark neutral scale (`#000000` / `#0a0a0a` / `#111111`) with white/near-white ink as primary foreground. Semantic colors (`green`, `amber`, `red`) are used strictly when real operational state changes occur.
- **Self-Hosted Offline Typography:** `Geist Sans` for all UI interface labels, and `Geist Mono` strictly for technical telemetry (ports, IPs, hashes, memory MBs). Bundled locally via the `geist` package (`geist/font/sans` and `geist/font/mono`) with **zero external CDN calls**.
- **Consistent 4px Spacing Grid:** Spacing strictly adheres to 4px multiples: 4px (`p-1`), 8px (`p-2`), 12px (`p-3`), 16px (`p-4`), 24px (`p-6`), 32px (`p-8`), 48px (`p-12`).
- **Consistent 6px Radius Scale:** Cards, buttons, and input elements use a uniform `6px` radius (`rounded-md` in Tailwind).
- **Zero Marketing Fluff:** Elimination of all decorative slogans, marketing footers, and redundant chrome.

### 1.2. Geist Color Tokens & CSS Variables
```css
/* 1. Geist Neutral Surface Scale */
--ds-background-100:  #000000; /* Pitch black canvas */
--ds-background-200:  #0a0a0a; /* Elevated container surface */
--ds-gray-100:        #111111; /* Card background fill */
--ds-gray-200:        #171717; /* Card hover background */
--ds-gray-300:        #1f1f1f; /* Progress track & sub-surface */
--ds-gray-400:        #262626; /* Default static 1px border */
--ds-gray-500:        #333333; /* Focused / hover border */
--ds-gray-600:        #444444; /* Secondary divider */

/* 2. Geist Text & Foreground Scale */
--ds-gray-1000:       #ffffff; /* Primary crisp headings and active text */
--ds-gray-900:        #ededed; /* Primary body text and values */
--ds-gray-700:        #888888; /* Secondary labels and descriptions */
--ds-gray-600-text:   #666666; /* Muted timestamps and placeholder text */

/* 3. Single Interactive Focus Accent */
--ds-blue-700:        #0070f3; /* Vercel Electric Blue: Active tab border / primary CTA */
--ds-blue-subtle:     rgba(0, 112, 243, 0.1);

/* 4. Semantic Operational Status (State Only) */
--ds-green-700:       #00e599; /* Emerald: 0 External Packets / Air-gap Verified */
--ds-green-subtle:    rgba(0, 229, 153, 0.1);
--ds-amber-700:       #f5a623; /* Amber: Temperature warning / retry in progress */
--ds-red-700:         #e5484d; /* Red: Theoretical WAN breach / execution failure */
```

### 1.3. Typography Hierarchy (Geist Font Stack)
- **UI & Headings (`Geist Sans`):**
  - Page Title: `text-sm font-semibold text-[#ededed] tracking-tight`
  - Section / Card Header: `text-xs font-medium text-[#ededed]`
  - Field Label: `text-xs text-[#888888]`
  - Body Text: `text-xs text-[#ededed] leading-relaxed`
- **Technical Telemetry (`Geist Mono`):**
  - Port Numbers (`8000`), IP Addresses (`192.168.1.50`), Ollama Tags (`qwen3:4b-q4_k_m`), VRAM Values (`5500 MB / 6144 MB`), and Hash Strings (`e3b0c4...`).
  - *Strict Rule:* Never use monospace for labels, buttons, or conversational text.

---

## 2. Micro-Motion & Polish Specification (Emil Kowalski Craft)

### 2.1. Motion Rules & Timing
- **Tactile Button Press:** `:active` state triggers `transform: scale(0.97)` with `transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1)`.
- **Never Animate from Scale 0:** All entering dialogs, tooltips, and badges start from `scale(0.95)` with `opacity: 0`.
- **Spring Physics Defaults:** Configured with `stiffness: 100`, `damping: 20`, `mass: 1`.
- **Hardware Acceleration:** All Framer Motion animations strictly animate `transform: "translateX/Y()"` and `opacity` to run off the main GPU thread.
- **Asymmetric Timing:** Enter duration `200ms` (snappy feedback); exit duration `150ms`.

---

## 3. Detailed Screen Breakdown & Component Architecture

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ TOP HEADER: Workbench Title | Deployment Badge (Local/LAN/Hotspot) | Air-Gap Indicator │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ TABS: [Model Status & VRAM] [Chat / Agent] [Ingestion / OCR] [Sovereignty] [Files] [QR]│
├────────────────────────────────────────┬───────────────────────────────────────────────┤
│ MAIN WORKSPACE VIEWPORT                │ SIDEBAR / TELEMETRY DOCK                      │
│ (Active Tab Screen Content)            │ (Live VRAM Gauge, Active Model, Status Pills) │
└────────────────────────────────────────┴───────────────────────────────────────────────┘
```

### Screen 1: Model Status Panel & Live VRAM Monitor
- **Role:** Displays all 4 local Ollama models, live active status, memory footprints, and dynamic LRU paging telemetry.
- **Key Components:**
  - `VRAMSummaryCard`: Physical 6.0 GB ceiling bar, allocated 5.5 GB committed pool, OS overhead (0.5 GB), primary (2.8 GB), secondary (2.0 GB), KV cache (0.7 GB).
  - `ModelCardGrid`: 4 interactive cards (`Qwen 3 4B`, `Qwen 2.5 Coder 3B`, `Qwen2-VL 2B`, `Llama 3.2 3B`) with active badges, task domain tags, and manual load/swap buttons.
  - `SwapEventLog`: Timestamped history of model swaps with target latency indicators ($< 1.2\text{s}$).
- **shadcn Components:** `Card`, `Progress`, `Badge`, `Button`.
- **Framer Motion:** Smooth width transitions on VRAM allocation bars (`transition={{ type: "spring", stiffness: 80, damping: 15 }}`).

---

### Screen 2: Chat & ReAct Agent Workspace
- **Role:** Interactive multi-turn operator chat, automated model routing display, and live streaming ReAct execution trace.
- **Key Components:**
  - `ChatContainer`: Virtualized message stream rendering user prompts and agent responses.
  - `RouterTagBadge`: Displays Stage 1 regex / Stage 2 semantic routing decisions (`[ROUTED: Qwen 2.5 Coder 3B | Confidence: 96%]`).
  - `AgentTraceAccordion`: Collapsible step-by-step reasoning steps streaming live (`Thought:` $\rightarrow$ `Action: docker_sandbox` $\rightarrow$ `Observation:` $\rightarrow$ `Self-Correction Retry 1/10`).
  - `PromptInputDock`: Text input, model override dropdown, attachment dock, and submit button.
- **shadcn Components:** `Accordion`, `Badge`, `Button`, `Textarea`, `Tooltip`, `ScrollArea`.
- **Framer Motion:** Accordion expand/collapse with `layout` prop; message entrance with `initial={{ opacity: 0, transform: "scale(0.98) translateY(6px)" }}`.

---

### Screen 3: File Ingestion & OCR Hub
- **Role:** Upload and preview PDFs, scanned inspection reports, P&ID engineering drawings, and handwritten field logs.
- **Key Components:**
  - `DropZone`: Accessible drag-and-drop zone accepting `.pdf`, `.png`, `.jpg`, `.jpeg`.
  - `DocumentPreview`: Dual-pane viewer showing original document scan side-by-side with raw extracted text.
  - `PIDTagOverlay`: Interactive image viewer displaying bounding boxes over detected ISA 5.1 instrumentation tags (`FV-101`, `TIC-204`, `P-101A`).
  - `ConfidenceScoreBadge`: Visual extraction accuracy meter.
- **shadcn Components:** `Card`, `Tabs`, `Badge`, `Button`, `Dialog`.
- **Framer Motion:** Dropzone hover border pulse; smooth tab cross-fade between Raw OCR and Annotated Image.

---

### Screen 4: Sovereignty Audit Dashboard
- **Role:** Real-time verifiable proof of zero external network egress across Localhost, LAN, and Hotspot modes.
- **Key Components:**
  - `SovereigntyBanner`: Giant numeric counter showing **`0 EXTERNAL PACKETS`** in bright emerald green.
  - `ThreeTierTrafficCards`: 3 high-density metric cards:
    1. *Localhost (127.0.0.1)*: `100% On-Device | Active`
    2. *LAN / Hotspot (Private RFC 1918)*: `2 Connected Devices (Judge Laptop, Tablet)`
    3. *External Internet / WAN*: **`0 Packets (BLOCKED & AIR-GAPPED)`**
  - `SocketInspectorTable`: Live streaming table of active TCP/UDP sockets showing Process Name, PID, Local Address, Remote Address, and State.
  - `AuditLogExporter`: Download button for SHA-256 signed audit records (`sovereignty_audit.log`).
- **shadcn Components:** `Card`, `Table`, `Badge`, `Button`, `Tooltip`.
- **Framer Motion:** 1Hz heartbeat pulse indicator on air-gap shield icon; table row entrance transitions.

---

### Screen 5: Generated Deliverables & Code Sandbox Panel
- **Role:** Repository of generated enterprise artifacts (.docx, .xlsx, .pptx) and sandboxed Python code execution outputs.
- **Key Components:**
  - `DeliverableGrid`: Cards for generated Word approval memos, Excel calculation sheets, and PowerPoint decks with file size, timestamp, and download button.
  - `CodeSandboxViewer`: Syntax-highlighted Python script viewer with stdout, stderr, execution duration, and memory usage badges (`Memory: 42MB / 512MB limit`).
- **shadcn Components:** `Card`, `Badge`, `Button`, `ScrollArea`.
- **Framer Motion:** Card hover scale feedback; download button click pulse.

---

### Screen 6: Connect From Another Device (LAN / Hotspot Panel)
- **Role:** Enables judges and evaluators to connect their smartphones, tablets, or laptops over venue LAN or closed host hotspot.
- **Key Components:**
  - `QRCodeWidget`: High-contrast QR code encoding the local URL (`http://192.168.1.50:8000` or `http://192.168.137.1:8000`).
  - `ModeSelectorBadge`: Displays current active network mode (`LAN (Venue Wi-Fi)` or `Isolated Host Hotspot`).
  - `ConnectionStepGuide`: Clear 3-step connection instructions for judges (Connect to Wi-Fi $\rightarrow$ Scan QR Code $\rightarrow$ Interact via browser).
- **shadcn Components:** `Dialog`, `Card`, `Badge`, `Button`.
- **Framer Motion:** Modal backdrop blur fade and dialog scale-in.

---

## 4. shadcn/ui Component Mapping Table

| Screen / Feature | shadcn / Radix Component | Exact Purpose |
| :--- | :--- | :--- |
| **Global Navigation** | `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` | Seamless top-level switching between 6 workbench views |
| **Model Status Panel** | `Card`, `Progress`, `Badge`, `Button` | VRAM gauge bar, model cards, and load action triggers |
| **Chat Workspace** | `Accordion`, `AccordionItem`, `AccordionTrigger` | Collapsible multi-step ReAct thought/action traces |
| **Chat Input** | `Textarea`, `Button`, `Tooltip`, `TooltipContent` | Multi-line prompt entry, submit button, model selector |
| **Ingestion Hub** | `Card`, `Tabs`, `Dialog`, `Badge` | Upload dropzone, image preview modal, OCR text viewer |
| **Sovereignty Dashboard** | `Table`, `TableHeader`, `TableRow`, `TableCell` | Real-time open socket connection inspector |
| **Deliverables Panel** | `Card`, `Badge`, `Button`, `ScrollArea` | Deliverable download cards and sandboxed code inspector |
| **Multi-Device Connect** | `Dialog`, `DialogContent`, `DialogHeader` | QR Code modal for judge device pairing |

---

## 5. Framer Motion Animation Plan

| Component | Trigger / Event | Animation Behavior | Technical Rationale |
| :--- | :--- | :--- | :--- |
| **VRAM Gauge Bar** | Live WebSocket update | Smooth width spring animation (`stiffness: 100, damping: 20`) | Prevents abrupt visual jumps during model swap transitions |
| **Agent Thought Step** | New ReAct iteration arrives | Staggered fade & slide-in (`opacity: 0, translateY: 6px`) | Gives operator clear visual indication of agent reasoning progression |
| **Air-Gap Badge** | Continuous 1Hz daemon tick | Subtle opacity pulse (`opacity: [1, 0.7, 1]`) | Verifies that the network monitoring daemon is actively executing |
| **Interactive Buttons** | Mouse / Touch `:active` | `scale(0.97)` via custom cubic-bezier | Provides instant tactile feedback confirming the click was registered |
| **Modal Dialogs** | Open / Close | `scale: 0.95` $\rightarrow$ `1.0`, `opacity: 0` $\rightarrow$ `1.0` | Prevents jarring popup appearance (origin-aware centered scale) |
| **Tab Switching** | Tab change | Cross-fade with `AnimatePresence mode="wait"` | Eliminates layout shift between different screen densities |

---

## 6. Client-Only Zustand State Stores

Because Next.js runs in static export mode (`output: 'export'`), all state stores operate strictly in browser client memory with zero SSR hydration mismatch:

1. **`useModelStore`:** Tracks loaded models, active primary model, live VRAM MBs, and swap history.
2. **`useChatStore`:** Manages conversation messages, active agent thought trace steps, streaming status, and selected scenario.
3. **`useSovereigntyStore`:** Holds live 3-tier packet metrics (Localhost, LAN, External WAN = 0), open socket list, and audit daemon status.
4. **`useDeliverableStore`:** Stores metadata for generated Word memos, Excel sheets, PowerPoint decks, and sandbox scripts.
5. **`useNetworkStore`:** Tracks host IP, active deployment mode (Standalone, LAN, Hotspot), and connected client device count.

---

## 7. Accessibility (a11y) & Multi-Device Mobile Responsiveness

- **Mobile Viewport Compatibility:** All screens collapse to a single column on viewports $< 768\text{px}$ so judges can interact seamlessly on smartphones and tablets.
- **Minimum 44px Tap Targets:** All buttons, tab triggers, and file download links have minimum `44px \times 44px` touch bounding boxes.
- **WCAG High Contrast:** All text tokens maintain $> 4.5:1$ contrast ratio against dark slate surfaces (`#F8FAFC` on `#0F172A`).
- **Semantic ARIA Roles:** Modals use `role="dialog"`, tabs use `role="tablist"`, and live counters use `aria-live="polite"`.
