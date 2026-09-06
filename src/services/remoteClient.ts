import type { MobileCommand, RemoteHubInfo } from '../types';

type CommandHandler = (cmd: MobileCommand) => void;
type MobileCountHandler = (count: number) => void;

class RemoteClient {
  private ws: WebSocket | null = null;
  private commandHandlers: Set<CommandHandler> = new Set();
  private countHandlers: Set<MobileCountHandler> = new Set();
  private hubPort = 49200;
  private isConnecting = false;
  private reconnectTimer: number | null = null;

  public info: RemoteHubInfo = {
    ip: '127.0.0.1',
    port: 49200,
    mobileUrl: 'http://127.0.0.1:49200/remote',
    mobileCount: 0,
    connected: false
  };

  constructor() {
    this.fetchInfo();
    this.connect();
  }

  public async fetchInfo(): Promise<RemoteHubInfo> {
    try {
      const res = await fetch(`http://localhost:${this.hubPort}/api/info`);
      if (res.ok) {
        const data = await res.json();
        this.info = {
          ...this.info,
          ip: data.ip,
          port: data.port,
          mobileUrl: data.mobileUrl,
          mobileCount: data.mobileCount
        };
      }
    } catch {
      // Hub might not be running yet if in web-only mode without node server
    }
    return this.info;
  }

  public connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) return;
    this.isConnecting = true;

    try {
      this.ws = new WebSocket(`ws://localhost:${this.hubPort}?type=desktop`);

      this.ws.onopen = () => {
        this.isConnecting = false;
        this.info.connected = true;
        console.log('[RemoteClient] Connected to Desktop Hub WS');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'MOBILE_COMMAND') {
            const cmd: MobileCommand = {
              command: data.command,
              payload: data.payload
            };
            for (const handler of this.commandHandlers) {
              handler(cmd);
            }
          } else if (data.type === 'MOBILE_COUNT') {
            this.info.mobileCount = data.payload.count;
            for (const handler of this.countHandlers) {
              handler(this.info.mobileCount);
            }
          }
        } catch (e) {
          console.error('[RemoteClient] Error parsing message:', e);
        }
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        this.info.connected = false;
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.isConnecting = false;
      };
    } catch {
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer !== null) return;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.fetchInfo();
      this.connect();
    }, 3000);
  }

  public syncState(state: Record<string, unknown>) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'SYNC_STATE',
        payload: state
      }));
    }
  }

  public onCommand(handler: CommandHandler): () => void {
    this.commandHandlers.add(handler);
    return () => this.commandHandlers.delete(handler);
  }

  public onMobileCountChange(handler: MobileCountHandler): () => void {
    this.countHandlers.add(handler);
    return () => this.countHandlers.delete(handler);
  }
}

export const remoteClient = new RemoteClient();
