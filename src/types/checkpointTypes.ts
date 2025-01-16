export interface SystemInfo {
  totalMemory: number;
  freeMemory: number;
  uptime: number;
}

export interface CheckpointData {
  timestamp: string;
  systemInfo: SystemInfo;
  modelState: any;
  version: string;
}