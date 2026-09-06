export interface ScriptCue {
  id: string;
  order: number;
  text: string;
  startSecond: number;
  endSecond: number;
  durationSeconds: number;
  sectionTitle?: string;
}

export interface ScriptProject {
  id: string;
  title: string;
  rawText: string;
  cues: ScriptCue[];
  totalSeconds: number;
  targetPlatform: 'tiktok_30s' | 'shorts_60s' | 'standard_3m' | 'custom';
  wpm: number;
  updatedAt: number;
}

export type PrompterMode = 'timeline' | 'teleprompter';

export interface ObsConnectionConfig {
  host: string;
  port: number;
  password?: string;
  autoConnect: boolean;
}

export interface ObsState {
  connected: boolean;
  recording: boolean;
  streaming: boolean;
  recordTimecode: string;
  streamTimecode: string;
  error: string | null;
  config: ObsConnectionConfig;
}

export interface RemoteHubInfo {
  ip: string;
  port: number;
  mobileUrl: string;
  qrCode?: string;
  mobileCount: number;
  connected: boolean;
}

export interface MobileCommand {
  command: 
    | 'toggle_play'
    | 'next_cue'
    | 'prev_cue'
    | 'reset'
    | 'toggle_obs_record'
    | 'speed_up'
    | 'speed_down'
    | 'countdown_321';
  payload?: Record<string, unknown>;
}

declare global {
  interface Window {
    electronAPI?: {
      getRemoteInfo: () => Promise<{ ip: string; port: number; mobileUrl: string; qrCode: string }>;
      toggleFloatingHud: () => Promise<boolean>;
      setAlwaysOnTop: (flag: boolean) => Promise<boolean>;
      minimizeWindow: () => Promise<void>;
      maximizeWindow: () => Promise<void>;
      closeWindow: () => Promise<void>;
      onFloatingHudClosed: (callback: () => void) => () => void;
    };
  }
}
