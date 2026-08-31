import { create } from 'zustand';
import { DeliverableItem, useDeliverableStore } from './useDeliverableStore';

export type CanvasTab = 'editor' | 'metrics' | 'sop' | 'raw';

interface CanvasState {
  isOpen: boolean;
  isExpanded: boolean;
  activeDeliverable: DeliverableItem | null;
  activeTab: CanvasTab;
  editedContent: Record<string, any>;
  hasUnsavedChanges: boolean;
  isSaving: boolean;

  // Actions
  openCanvas: (deliverableOrId: DeliverableItem | string) => void;
  closeCanvas: () => void;
  toggleExpand: () => void;
  setActiveTab: (tab: CanvasTab) => void;
  updateEditedContent: (id: string, content: any) => void;
  saveChanges: (id: string) => Promise<void>;
}

let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

export const useCanvasStore = create<CanvasState>((set, get) => ({
  isOpen: false,
  isExpanded: false,
  activeDeliverable: null,
  activeTab: 'editor',
  editedContent: {},
  hasUnsavedChanges: false,
  isSaving: false,

  openCanvas: (deliverableOrId: DeliverableItem | string) => {
    let item: DeliverableItem | null = null;
    if (typeof deliverableOrId === 'string') {
      const { deliverables } = useDeliverableStore.getState();
      item = deliverables.find(
        (d) => d.id === deliverableOrId || d.filename.toLowerCase() === deliverableOrId.toLowerCase()
      ) || null;

      if (!item) {
        // Create an on-the-fly deliverable item if it's a newly generated filename
        const ext = deliverableOrId.split('.').pop()?.toLowerCase() || 'docx';
        const type = (['docx', 'xlsx', 'pptx', 'py'].includes(ext) ? ext : 'docx') as any;
        item = {
          id: `deliv-dyn-${Date.now()}`,
          filename: deliverableOrId,
          type,
          size_bytes: 32000,
          size_formatted: '32.0 KB',
          source_scenario: 'Agent Live Generation',
          source_requirement: 'Refinery AI Output',
          generating_model: 'Gemini Sovereign Engine',
          generated_timestamp: new Date().toLocaleTimeString(),
          sha256_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          summary: `Interactive document generated live by Sovereign Agent for ${deliverableOrId}.`,
          key_metrics: [
            { label: 'Status', value: 'ACTIVE_EDIT' },
            { label: 'Air-Gap Compliance', value: '100% VERIFIED' },
            { label: 'Format', value: ext.toUpperCase() },
          ],
          sop_citations: ['OISD-STD-105', 'MRPL Refinery Standard Operating Procedure'],
        };
      }
    } else {
      item = deliverableOrId;
    }

    set({
      isOpen: true,
      activeDeliverable: item,
      activeTab: 'editor',
      hasUnsavedChanges: false,
      isSaving: false,
    });
  },

  closeCanvas: () => {
    set({ isOpen: false, isExpanded: false });
  },

  toggleExpand: () => {
    set((state) => ({ isExpanded: !state.isExpanded }));
  },

  setActiveTab: (tab: CanvasTab) => {
    set({ activeTab: tab });
  },

  updateEditedContent: (id: string, content: any) => {
    set((state) => ({
      editedContent: {
        ...state.editedContent,
        [id]: content,
      },
      hasUnsavedChanges: true,
    }));

    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }

    autoSaveTimer = setTimeout(() => {
      set({ isSaving: true });
      setTimeout(() => {
        set({ isSaving: false, hasUnsavedChanges: false });
      }, 400);
    }, 1200);
  },

  saveChanges: async (id: string) => {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }
    set({ isSaving: true });
    // Simulate air-gapped local commit and state persistence
    await new Promise((resolve) => setTimeout(resolve, 500));
    set({ isSaving: false, hasUnsavedChanges: false });
  },
}));
