# Google Gemini Web Interface Reference Specification
## Interaction Architecture & Visual Anatomy (2025/2026 Reference)

---

## 1. Executive Summary & Design Philosophy
The gemini.google.com interface represents a modern, distraction-free conversational canvas built around three fundamental ergonomic principles:
1. **Contextual Minimalism:** Primary focus remains on high-legibility conversational flow (768px to 840px maximum reading column).
2. **Elevated Floating Input Pill:** The prompt box is an elevated, rounded container docked above the viewport bottom with integrated multimodal and submission controls.
3. **Collapsible Technical Disclosure:** Deep reasoning chains, tool traces, and thought processes are housed in subtle, expandable accordion elements labeled 'Show thought process' rather than cluttering the primary response stream.

---

## 2. High-Level Spatial Anatomy

`
+-------------------------------------------------------------------------------------------------------+
|  [≡]  [Gemini / Model Badge]                             [Help / Settings]  [(?) User Profile Avatar] |
+-----------------------+-------------------------------------------------------------------------------+
|  SIDEBAR (Collapsible)|                                 MAIN CHAT CANVAS                              |
|                       |                                                                               |
|  [+ New Chat]         |   [Empty State Hero]:                                                         |
|                       |     'Hello, Operations Engineer'                                              |
|  Recent:              |     'How can I assist with refinery operations today?'                        |
|  • Furnace F-101 SOP  |                                                                               |
|  • Pump P-101A Calc   |   [Quick Starter Action Pills]:                                               |
|  • P&ID Sensor Review |   [Calculate Pump KW]  [Audit Furnace SOP]  [Review ISA 5.1 Tags]             |
|  • CDU Crude Assay    |                                                                               |
|                       |   -------------------------------------------------------------------------   |
|  Previous 7 Days:     |   [User Message]                                                              |
|  • Boiler B-202 Log   |     Write a Python calculation for centrifugal pump hydraulic power...        |
|  • Steam Flow Rate    |                                                                               |
|                       |   [Gemini Response (Sparkle ✦)]                                               |
|                       |     > [v Show thought process (3 steps)]                                      |
|  Bottom:              |     Based on MRPL SOP-MRPL-PUMP-04, the hydraulic calculation is...           |
|  • Settings           |     `python                                                                 |
|  • System Status      |     p_hyd_kw = (density * g * flow_m3_s * head_m) / 1000.0                    |
|                       |     `                                                                       |
|                       |     [📋 Copy]  [👍]  [👎]  [🔄 Regenerate]  [📄 Deliverable: P101A.xlsx]        |
|                       |                                                                               |
|                       |   +-----------------------------------------------------------------------+   |
|                       |   | [+] Attach PDF/P&ID   | Ask MRPL Sovereign AI...           |  [(↑) Send] |   |
|                       |   +-----------------------------------------------------------------------+   |
+-----------------------+-------------------------------------------------------------------------------+
`

---

## 3. Detailed Component Breakdown

### 3.1. Collapsible Sidebar (Left Navigation)
- **Hamburger Menu (≡):** Top-left trigger that toggles the sidebar between expanded (260px) and fully collapsed (0px or minimal icon rail).
- **'New Chat' Button:** High-priority pill button with a + icon positioned at the top of the sidebar. Resets active conversation state.
- **Categorized History Groups:**
  - Today
  - Previous 7 Days
  - Older
- **Item Hover Actions:** Subtle 3-dots menu on hover for renaming or deleting historical conversations.
- **Bottom Utility Pin:** Settings trigger, Air-gap status indicator, and help dialog trigger.

### 3.2. Main Chat Conversation Canvas
- **Width:** Responsive centered column (100% on mobile, constrained to 800px on desktop displays).
- **Background:** Uniform dark slate (#0d0d0d / #131314) with subtle zero-border separation.
- **User Message Presentation:**
  - Right-aligned or clean indented right block.
  - Background: Subtle charcoal (#1e1e1e) with soft rounded corners (rounded-2xl).
  - Hover Action: Pencil edit icon to fork or edit prompt.
- **Gemini Response Presentation:**
  - Left-aligned starting with a distinct 4-pointed sparkle icon (✦) in blue/gradient styling.
  - Typography: Clean sans-serif with comfortable line height (1.6x).
  - Code Blocks: Syntax-highlighted dark container with a top header displaying language name (e.g. python, json) and a one-click **Copy Code** button.
  - Action Toolbar (Bottom of each response):
    - 📋 Copy Response
    - 👍 Good response / 👎 Bad response
    - 🔄 Regenerate
    - 📄 Download Artifact (Word/Excel badge)

### 3.3. Extended Thinking / Reasoning Accordion
- **Placement:** Placed at the very top of Gemini response, before the markdown text.
- **Visual Style:** Minimalist collapsible block with a rotating chevron and a pulsing thought indicator.
- **Collapsed Header:** 'Show thought process' or 'Reasoning (4 steps)'.
- **Expanded Body:** Step-by-step breakdown of ReAct reasoning frames, ChromaDB SOP lookups, and Docker sandbox execution logs formatted in high-contrast monospace text.

### 3.4. Elevated Floating Prompt Input Dock
- **Shape & Elevation:** Pill-shaped rounded rectangle (rounded-3xl) with subtle 1px border (#2a2a2a) and backdrop blur over the conversational background.
- **Left Multimodal Action:** Single + or Paperclip icon button. Clicking opens file picker supporting PDF inspection reports, process logs, and PNG/JPG P&ID diagrams.
- **Textarea:** Auto-expanding single-to-multiline input without scrollbar clutter until exceeding 6 lines.
- **Right Action Trigger:**
  - **Idle / Typing:** Circular **Send** button with upward arrow (↑). Disabled when input is empty.
  - **Streaming / Thinking:** Circular **Stop** button with solid square (■) to immediately abort active WebSocket token generation.
- **Footer Disclaimer:** Tiny centered caption below dock: 'MRPL Sovereign AI can make mistakes. Verify critical refinery SOP parameters.'

---

## 4. UI Design Tokens (Geist Dark Theme Adaptation)

| Token | Hex Value | Application |
| :--- | :--- | :--- |
| **Canvas Background** | #0a0a0a | Main application backdrop |
| **Sidebar Background**| #111111 | Collapsible navigation rail |
| **Input Dock Surface** | #141414 | Floating prompt pill |
| **Border Subtle** | #222222 | Card, sidebar, and dock perimeter |
| **Border Active** | #444444 | Focus ring and hover states |
| **Primary Text** | #ededed | Message bodies, headings |
| **Secondary Text** | #888888 | Timestamps, metadata, labels |
| **Brand Accent** | #0070f3 | Sparkle avatar, send CTA, active badges |
| **Success State** | #00e599 | Complete reasoning, verified air-gap |
| **Warning State** | #f5a623 | High temperature alert, tool executing |
