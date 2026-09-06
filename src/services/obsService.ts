import OBSWebSocket from 'obs-websocket-js';
import type { ObsConnectionConfig, ObsState } from '../types';

type ObsListener = (state: ObsState) => void;

class ObsService {
  private obs: OBSWebSocket | null = null;
  private listeners: Set<ObsListener> = new Set();
  private timecodeInterval: number | null = null;

  public state: ObsState = {
    connected: false,
    recording: false,
    streaming: false,
    recordTimecode: '00:00:00',
    streamTimecode: '00:00:00',
    error: null,
    config: {
      host: '127.0.0.1',
      port: 4455,
      password: '',
      autoConnect: true,
    },
  };

  constructor() {
    this.obs = new OBSWebSocket();
    this.setupListeners();
    this.loadSavedConfig();
  }

  private loadSavedConfig() {
    try {
      const saved = localStorage.getItem('streamcue_obs_config');
      if (saved) {
        this.state.config = { ...this.state.config, ...JSON.parse(saved) };
      }
    } catch {
      // ignore
    }
  }

  public saveConfig(config: Partial<ObsConnectionConfig>) {
    this.state.config = { ...this.state.config, ...config };
    try {
      localStorage.setItem('streamcue_obs_config', JSON.stringify(this.state.config));
    } catch {
      // ignore
    }
    this.emit();
  }

  public subscribe(listener: ObsListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private emit() {
    for (const l of this.listeners) {
      l({ ...this.state });
    }
  }

  private setupListeners() {
    if (!this.obs) return;

    this.obs.on('RecordStateChanged', (data) => {
      this.state.recording = data.outputActive;
      if (!data.outputActive) {
        this.state.recordTimecode = '00:00:00';
        this.stopTimecodePolling();
      } else {
        this.startTimecodePolling();
      }
      this.emit();
    });

    this.obs.on('StreamStateChanged', (data) => {
      this.state.streaming = data.outputActive;
      if (!data.outputActive) {
        this.state.streamTimecode = '00:00:00';
      }
      this.emit();
    });

    this.obs.on('ConnectionClosed', () => {
      this.state.connected = false;
      this.state.recording = false;
      this.state.streaming = false;
      this.stopTimecodePolling();
      this.emit();
    });
  }

  public async connect(config?: Partial<ObsConnectionConfig>): Promise<boolean> {
    if (config) {
      this.saveConfig(config);
    }
    const { host, port, password } = this.state.config;
    const url = `ws://${host}:${port}`;

    if (!this.obs) {
      this.obs = new OBSWebSocket();
      this.setupListeners();
    }

    try {
      this.state.error = null;
      await this.obs.connect(url, password || undefined);
      this.state.connected = true;

      // Check current record and stream status
      try {
        const recordStatus = await this.obs.call('GetRecordStatus');
        this.state.recording = recordStatus.outputActive;
        this.state.recordTimecode = recordStatus.outputTimecode || '00:00:00';
        if (recordStatus.outputActive) {
          this.startTimecodePolling();
        }
      } catch {
        // Not recording
      }

      try {
        const streamStatus = await this.obs.call('GetStreamStatus');
        this.state.streaming = streamStatus.outputActive;
        this.state.streamTimecode = streamStatus.outputTimecode || '00:00:00';
      } catch {
        // Not streaming
      }

      this.emit();
      return true;
    } catch (err: unknown) {
      this.state.connected = false;
      this.state.error = err instanceof Error ? err.message : 'Không thể kết nối OBS Studio';
      this.emit();
      return false;
    }
  }

  public async disconnect() {
    if (this.obs && this.state.connected) {
      try {
        await this.obs.disconnect();
      } catch {
        // ignore
      }
    }
    this.state.connected = false;
    this.stopTimecodePolling();
    this.emit();
  }

  public async toggleRecord(): Promise<boolean> {
    if (!this.obs || !this.state.connected) {
      throw new Error('OBS chưa được kết nối');
    }
    try {
      const res = await this.obs.call('ToggleRecord');
      this.state.recording = res.outputActive;
      if (res.outputActive) {
        this.startTimecodePolling();
      } else {
        this.stopTimecodePolling();
      }
      this.emit();
      return res.outputActive;
    } catch (err) {
      console.error('Error toggling OBS record:', err);
      throw err;
    }
  }

  public async startRecord(): Promise<void> {
    if (!this.obs || !this.state.connected) throw new Error('OBS chưa được kết nối');
    await this.obs.call('StartRecord');
    this.state.recording = true;
    this.startTimecodePolling();
    this.emit();
  }

  public async stopRecord(): Promise<void> {
    if (!this.obs || !this.state.connected) throw new Error('OBS chưa được kết nối');
    await this.obs.call('StopRecord');
    this.state.recording = false;
    this.stopTimecodePolling();
    this.emit();
  }

  public async toggleStream(): Promise<boolean> {
    if (!this.obs || !this.state.connected) throw new Error('OBS chưa được kết nối');
    const res = await this.obs.call('ToggleStream');
    this.state.streaming = res.outputActive;
    this.emit();
    return res.outputActive;
  }

  private startTimecodePolling() {
    this.stopTimecodePolling();
    this.timecodeInterval = window.setInterval(async () => {
      if (!this.obs || !this.state.connected || !this.state.recording) return;
      try {
        const res = await this.obs.call('GetRecordStatus');
        this.state.recordTimecode = res.outputTimecode || '00:00:00';
        this.emit();
      } catch {
        // ignore
      }
    }, 500);
  }

  private stopTimecodePolling() {
    if (this.timecodeInterval !== null) {
      clearInterval(this.timecodeInterval);
      this.timecodeInterval = null;
    }
  }
}

export const obsService = new ObsService();
