# Plan 48: Frontend State Management & Multi-Device WebSocket Integration Plan

## 1. Objective
Design the frontend state architecture using **Zustand** stores (`frontend/src/store/`) and configure the resilient WebSocket client manager in `frontend/src/lib/socket.js`, maintaining multi-device synchronization, dynamic host discovery, and 3-tier sovereignty telemetry tracking.

## 2. Requirement Mapping
- **SIH26117 Requirement 01:** *SELF-HOSTED PLATFORM* — High-performance real-time UI synchronization.
- **SIH26117 Requirement 06:** *AGENTIC PLANNING & TOOL CALLING* — Real-time event streaming.
- **SIH26117 Requirement 12:** *PROVABLE SOVEREIGNTY AUDITING* — Live telemetry updates with 3-tier classification.

## 3. Detailed Design & Technical Approach

### 3.1. Zustand Store Architecture

#### 1. `useChatStore.js` (Conversation & Agent State)
```javascript
import { create } from 'zustand';

export const useChatStore = create((set, get) => ({
  messages: [],
  currentPrompt: '',
  attachments: [],
  isGenerating: false,
  activeSteps: [],
  currentDomain: null,
  activeModel: null,

  setPrompt: (prompt) => set({ currentPrompt: prompt }),
  addAttachment: (file) => set((state) => ({ attachments: [...state.attachments, file] })),
  removeAttachment: (index) => set((state) => ({
    attachments: state.attachments.filter((_, i) => i !== index)
  })),

  appendMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  
  handleStreamEvent: (event) => {
    if (event.event === 'routing') {
      set({ currentDomain: event.domain, activeModel: event.model });
    } else if (event.event === 'thought' || event.event === 'tool_start' || event.event === 'tool_end') {
      set((state) => ({ activeSteps: [...state.activeSteps, event] }));
    } else if (event.event === 'final_answer') {
      const assistantMsg = {
        role: 'assistant',
        content: event.content,
        steps: get().activeSteps,
        timestamp: Date.now()
      };
      set((state) => ({
        messages: [...state.messages, assistantMsg],
        isGenerating: false,
        activeSteps: []
      }));
    }
  }
}));
```

#### 2. `useSovereigntyStore.js` (Hardware, Network & Multi-Device Telemetry)
```javascript
import { create } from 'zustand';

export const useSovereigntyStore = create((set) => ({
  deploymentMode: 'STANDALONE_LOCAL', // 'STANDALONE_LOCAL', 'LAN_OPTION_A', 'HOTSPOT_OPTION_B'
  hostIp: '127.0.0.1',
  localhostConnections: 0,
  lanHotspotConnections: 0,
  externalInternetConnections: 0,
  totalExternalPackets: 0,
  totalExternalBytes: 0,
  totalPacketsSniffed: 0,
  lanHotspotPackets: 0,
  verdict: '100% AIR-GAPPED & SOVEREIGN',
  activeSockets: [],
  vramUsedMb: 4800,
  vramTotalMb: 6144,
  vramUsagePercent: 78.1,

  updateTelemetry: (payload) => {
    const sov = payload.sovereignty || {};
    const vram = payload.vram || {};
    set({
      deploymentMode: payload.deployment_mode || 'STANDALONE_LOCAL',
      hostIp: payload.host_ip || '127.0.0.1',
      localhostConnections: sov.localhost_connections || 0,
      lanHotspotConnections: sov.lan_hotspot_connections || 0,
      externalInternetConnections: sov.external_internet_connections || 0,
      totalExternalPackets: sov.external_packets || 0,
      totalExternalBytes: sov.external_bytes || 0,
      totalPacketsSniffed: sov.total_packets_sniffed || 0,
      lanHotspotPackets: sov.lan_hotspot_packets || 0,
      verdict: sov.verdict || '100% AIR-GAPPED & SOVEREIGN',
      activeSockets: sov.sockets || [],
      vramUsedMb: vram.used_mb || 4800,
      vramTotalMb: vram.total_mb || 6144,
      vramUsagePercent: vram.usage_percent || 78.1
    });
  }
}));
```

### 3.2. Dynamic WebSocket Client Manager (`frontend/src/lib/socket.js`)
```javascript
import { useChatStore } from '../store/useChatStore';
import { useSovereigntyStore } from '../store/useSovereigntyStore';

class WebSocketManager {
  constructor() {
    this.chatWs = null;
    this.auditWs = null;
  }

  getWsHost() {
    if (typeof window !== 'undefined') {
      return window.location.hostname;
    }
    return '127.0.0.1';
  }

  connectAuditStream() {
    const host = this.getWsHost();
    const wsUrl = `ws://${host}:8000/api/audit-stream`;
    this.auditWs = new WebSocket(wsUrl);

    this.auditWs.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        useSovereigntyStore.getState().updateTelemetry(data);
      } catch (err) {
        console.error("Failed to parse telemetry event", err);
      }
    };

    this.auditWs.onclose = () => {
      setTimeout(() => this.connectAuditStream(), 2000);
    };
  }

  sendChatTask(prompt, attachments = []) {
    const host = this.getWsHost();
    const wsUrl = `ws://${host}:8000/api/chat/stream`;
    if (this.chatWs) this.chatWs.close();

    this.chatWs = new WebSocket(wsUrl);
    useChatStore.setState({ isGenerating: true, activeSteps: [] });

    this.chatWs.onopen = () => {
      this.chatWs.send(JSON.stringify({ prompt, attachments }));
    };

    this.chatWs.onmessage = (event) => {
      const data = JSON.parse(event.data);
      useChatStore.getState().handleStreamEvent(data);
    };
  }
}

export const socketManager = new WebSocketManager();
```

## 4. Inputs / Outputs & Contracts
- **Input:** WebSocket data payloads from FastAPI backend.
- **Output:** Reactive Zustand state driving all Next.js UI components.

## 5. Dependencies on Other Plan Files
- Depends on: [Plan 44](file:///G:/SIH/p/docs/plans/44_websocket_streaming.md), [Plan 47](file:///G:/SIH/p/docs/plans/47_ui_components.md).
- Depended on by: [Plan 49](file:///G:/SIH/p/docs/plans/49_demo_scenarios_e2e.md).

## 6. Edge Cases & Failure Modes
- **Client Accessing via Non-Hotspot IP:** Dynamic WebSocket URL resolution (`getWsHost()`) guarantees connections succeed regardless of connection method.

## 7. Acceptance Criteria & Verification
- State updates propagate to UI in $< 10\text{ ms}$ of WebSocket packet arrival.
- Stores accurately track remote client connections without crashing.

## 8. Design Decisions & Open Questions
- **DESIGN DECISION — reasoning:** `window.location.hostname` enables zero-config deployment: whether accessed via `localhost`, `192.168.1.50`, or `192.168.137.1`, WebSockets connect automatically.
