import { create } from 'zustand';

export interface TraceStep {
  id: string;
  step_number: number;
  type: 'thought' | 'action' | 'observation' | 'correction';
  content: string;
  tool_name?: string;
  tool_input?: string;
  tool_output?: string;
  duration_ms?: number;
  ram_mb?: number;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
  model_id?: string;
  routed_by?: 'stage1_regex' | 'stage2_semantic' | 'manual';
  confidence?: number;
  trace_steps?: TraceStep[];
  deliverable_ids?: string[];
}

export interface ConversationSession {
  id: string;
  title: string;
  timestamp: string;
  messages: ChatMessage[];
}

interface ChatState {
  sessions: ConversationSession[];
  activeSessionId: string;
  messages: ChatMessage[];
  isStreaming: boolean;
  activeScenario: 'furnace' | 'pump' | 'pid' | 'general';
  currentInput: string;
  activeTraceSteps: TraceStep[];
  currentRouting: {
    domain: string;
    model_id: string;
    routed_by: string;
    confidence: number;
  } | null;
  
  // Actions
  createNewChat: () => void;
  selectSession: (id: string) => void;
  deleteSession: (id: string) => void;
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  setCurrentInput: (input: string | ((prev: string) => string)) => void;
  setActiveScenario: (scenario: 'furnace' | 'pump' | 'pid' | 'general') => void;
  setStreaming: (isStreaming: boolean) => void;
  handleStreamEvent: (event: any) => void;
  clearTrace: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: [],
  activeSessionId: 'session-default',
  messages: [],
  isStreaming: false,
  activeScenario: 'pump',
  currentInput: '',
  activeTraceSteps: [],
  currentRouting: null,

  createNewChat: () => {
    const newId = `session-${Date.now()}`;
    const newSess: ConversationSession = {
      id: newId,
      title: 'New Chat',
      timestamp: 'Today',
      messages: []
    };
    set((state) => ({
      sessions: [newSess, ...state.sessions.filter(s => s.messages.length > 0)],
      activeSessionId: newId,
      messages: [],
      activeTraceSteps: [],
      currentInput: '',
      isStreaming: false
    }));
  },
  selectSession: (id) => {
    const sess = get().sessions.find((s) => s.id === id);
    set({
      activeSessionId: id,
      messages: sess ? sess.messages : [],
      activeTraceSteps: [],
      isStreaming: false
    });
  },
  deleteSession: (id) => {
    set((state) => {
      const newSessions = state.sessions.filter((s) => s.id !== id);
      const isActive = state.activeSessionId === id;
      return {
        sessions: newSessions,
        activeSessionId: isActive ? (newSessions[0]?.id || 'session-default') : state.activeSessionId,
        messages: isActive ? (newSessions[0]?.messages || []) : state.messages,
      };
    });
  },

  setMessages: (messages) => set({ messages }),
  addMessage: (message) => {
    set((state) => {
      const newMsgs = [...state.messages, message];
      const sessionExists = state.sessions.some(s => s.id === state.activeSessionId);
      
      let updatedSessions: ConversationSession[];
      if (sessionExists) {
        updatedSessions = state.sessions.map((s) => {
          if (s.id === state.activeSessionId) {
            const autoTitle = s.messages.length === 0 && message.role === 'user'
              ? message.content.slice(0, 28) + (message.content.length > 28 ? '...' : '')
              : s.title;
            return { ...s, title: autoTitle, messages: newMsgs };
          }
          return s;
        });
      } else {
        const autoTitle = message.role === 'user'
          ? message.content.slice(0, 28) + (message.content.length > 28 ? '...' : '')
          : 'Conversation';
        const newSess: ConversationSession = {
          id: state.activeSessionId,
          title: autoTitle,
          timestamp: 'Today',
          messages: newMsgs
        };
        updatedSessions = [newSess, ...state.sessions];
      }
      return { messages: newMsgs, sessions: updatedSessions };
    });
  },
  setCurrentInput: (inputOrUpdater) =>
    set((state) => ({
      currentInput:
        typeof inputOrUpdater === 'function'
          ? (inputOrUpdater as (prev: string) => string)(state.currentInput || '')
          : typeof inputOrUpdater === 'string'
          ? inputOrUpdater
          : '',
    })),
  setActiveScenario: (activeScenario) => set({ activeScenario }),
  setStreaming: (isStreaming) => set({ isStreaming }),
  clearTrace: () => set({ activeTraceSteps: [], currentRouting: null }),

  handleStreamEvent: (event: any) => {
    if (event.event === 'routing') {
      set({
        currentRouting: {
          domain: event.domain,
          model_id: event.model_id,
          routed_by: event.routed_by,
          confidence: event.confidence
        }
      });
    } else if (event.event === 'step') {
      const step: TraceStep = {
        id: `step-${Date.now()}-${Math.random()}`,
        step_number: event.step_number || (get().activeTraceSteps.length + 1),
        type: event.step_type || 'thought',
        content: event.content || '',
        tool_name: event.tool_name,
        tool_input: event.tool_input,
        tool_output: event.tool_output,
        duration_ms: event.duration_ms,
        ram_mb: event.ram_mb,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      set((state) => ({ activeTraceSteps: [...state.activeTraceSteps, step] }));
    } else if (event.event === 'final_answer') {
      const routing = get().currentRouting;
      const deliverableIds = event.deliverable_ids || [];
      const agentMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        role: 'agent',
        content: event.content || '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model_id: event.display_model || event.model_id || routing?.model_id || 'Reasoning Engine',
        routed_by: (event.routed_by || routing?.routed_by || 'stage1_regex') as any,
        confidence: event.confidence || routing?.confidence || 98,
        trace_steps: get().activeTraceSteps,
        deliverable_ids: deliverableIds,
      };

      // Automatically register new deliverables in useDeliverableStore and open Canvas Workspace
      try {
        const { useDeliverableStore } = require('./useDeliverableStore');
        const addDeliv = useDeliverableStore.getState().addDeliverableFromAgent;
        const currentScenario = get().activeScenario;
        const currentModel = agentMsg.model_id || 'Reasoning Engine';
        deliverableIds.forEach((fname: string) => {
          addDeliv(fname, `Scenario: ${currentScenario.toUpperCase()}`, currentModel);
        });

        // Automatically open interactive Canvas side panel if deliverable produced (like Gemini Canvas)
        if (deliverableIds.length > 0) {
          const { useCanvasStore } = require('./useCanvasStore');
          useCanvasStore.getState().openCanvas(deliverableIds[0]);
        }
      } catch {
        // Safe require fallback
      }

      set((state) => {
        const newMsgs = [...state.messages, agentMsg];
        const updatedSessions = state.sessions.map((s) => {
          if (s.id === state.activeSessionId) {
            return { ...s, messages: newMsgs };
          }
          return s;
        });
        return {
          messages: newMsgs,
          sessions: updatedSessions,
          isStreaming: false,
          activeTraceSteps: [],
          currentRouting: null
        };
      });
    }
  }
}));
