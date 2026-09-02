import { create } from 'zustand';
import { DeploymentMode } from '@/types/sovereignty';

export type { DeploymentMode };

export interface ConnectedClient {
  ip: string;
  device_name: string;
  connected_at: string;
  last_seen: string;
}

interface NetworkState {
  deploymentMode: DeploymentMode;
  hostIp: string;
  port: number;
  qrUrl: string;
  connectedClients: ConnectedClient[];
  isHotspotActive: boolean;
  
  // Actions
  setDeploymentMode: (mode: DeploymentMode) => void;
  setHostIp: (ip: string) => void;
  setConnectedClients: (clients: ConnectedClient[]) => void;
}

// TODO: replace with live API GET /api/network-status
export const useNetworkStore = create<NetworkState>((set) => ({
  deploymentMode: 'STANDALONE_LOCAL',
  hostIp: '127.0.0.1',
  port: 8000,
  qrUrl: 'http://127.0.0.1:8000',
  connectedClients: [],
  isHotspotActive: false,

  setDeploymentMode: (deploymentMode) => set({ deploymentMode }),
  setHostIp: (hostIp) => set({ hostIp, qrUrl: `http://${hostIp}:8000` }),
  setConnectedClients: (connectedClients) => set({ connectedClients })
}));
