const http = require('http');
const os = require('os');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const DEFAULT_PORT = 49200;

function getLatestVideo() {
  const possibleDirs = [
    'E:\\OBSVID',
    'E:/OBSVID',
    path.join(os.homedir(), 'Videos')
  ];

  let latestFile = null;
  let latestTime = 0;

  for (const dir of possibleDirs) {
    if (fs.existsSync(dir)) {
      try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const ext = path.extname(file).toLowerCase();
          if (['.mp4', '.mkv', '.mov', '.webm'].includes(ext)) {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            if (stat.mtimeMs > latestTime) {
              latestTime = stat.mtimeMs;
              latestFile = {
                exists: true,
                filename: file,
                filePath: fullPath,
                sizeBytes: stat.size,
                sizeFormatted: (stat.size / (1024 * 1024)).toFixed(2) + ' MB',
                modifiedTime: new Date(stat.mtimeMs).toLocaleString('vi-VN'),
                dir
              };
            }
          }
        }
      } catch (e) {
        // ignore
      }
    }
  }
  return latestFile;
}

function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const devName in interfaces) {
    const iface = interfaces[devName];
    if (!iface) continue;
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i];
      if (alias.family === 'IPv4' && !alias.internal && alias.address !== '127.0.0.1') {
        return alias.address;
      }
    }
  }
  return '127.0.0.1';
}

function startRemoteHub(port = DEFAULT_PORT) {
  let desktopClient = null;
  const mobileClients = new Set();
  
  // Shared state synchronized across Desktop and Mobile devices
  let currentState = {
    isPlaying: false,
    currentTime: 0,
    currentCueIndex: 0,
    totalCues: 0,
    activeCue: null,
    nextCue: null,
    wpm: 130,
    scrollSpeed: 2,
    mode: 'timeline', // 'timeline' | 'teleprompter'
    isObsConnected: false,
    isObsRecording: false,
    isObsStreaming: false,
    obsRecordTimecode: '00:00:00',
    countdown: null,
    cues: [],
    scriptTitle: 'Kịch bản quay',
    fullText: ''
  };

  const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

    if (url.pathname === '/api/info') {
      const ip = getLocalIpAddress();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        ip,
        port,
        mobileUrl: `http://${ip}:${port}/remote`,
        mobileCount: mobileClients.size,
        hasDesktop: !!desktopClient
      }));
      return;
    }

    if (url.pathname === '/api/state') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(currentState));
      return;
    }

    // Video Review API: Get latest recorded video info
    if (url.pathname === '/api/video/info') {
      const latest = getLatestVideo();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(latest || { exists: false }));
      return;
    }

    // Video Review API: Stream latest video with HTTP 206 Range support
    if (url.pathname === '/api/video/stream') {
      const latest = getLatestVideo();
      if (!latest || !fs.existsSync(latest.filePath)) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('No video found');
        return;
      }

      const filePath = latest.filePath;
      const stat = fs.statSync(filePath);
      const fileSize = stat.size;
      const range = req.headers.range;

      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(filePath, { start, end });
        const head = {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': 'video/mp4',
        };
        res.writeHead(206, head);
        file.pipe(res);
      } else {
        const head = {
          'Content-Length': fileSize,
          'Content-Type': 'video/mp4',
        };
        res.writeHead(200, head);
        fs.createReadStream(filePath).pipe(res);
      }
      return;
    }

    // Video Review API: Delete bad take
    if (url.pathname === '/api/video/delete' && req.method === 'POST') {
      const latest = getLatestVideo();
      if (latest && fs.existsSync(latest.filePath)) {
        try {
          fs.unlinkSync(latest.filePath);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: 'Đã xóa video' }));
          return;
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err.message }));
          return;
        }
      }
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Không tìm thấy video để xóa' }));
      return;
    }

    // Video Review API: Open folder in Windows Explorer
    if (url.pathname === '/api/video/open-folder') {
      const { exec } = require('child_process');
      const targetDir = fs.existsSync('E:\\OBSVID') ? 'E:\\OBSVID' : path.join(os.homedir(), 'Videos');
      exec(`explorer.exe "${targetDir}"`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, folder: targetDir }));
      return;
    }

    // Serve Mobile Remote Web App for iPhone
    if (url.pathname === '/remote' || url.pathname === '/' || url.pathname === '/mobile') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(getMobileHtml(port));
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  });

  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const clientType = url.searchParams.get('type') || 'mobile';

    if (clientType === 'desktop') {
      desktopClient = ws;
      console.log('[RemoteHub] Desktop App connected');
      // Send current state and mobile count to desktop
      ws.send(JSON.stringify({
        type: 'HUB_INIT',
        payload: {
          mobileCount: mobileClients.size,
          state: currentState
        }
      }));

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          if (data.type === 'SYNC_STATE') {
            currentState = { ...currentState, ...data.payload };
            // Broadcast state update to all mobile clients
            const broadcastMsg = JSON.stringify({
              type: 'STATE_UPDATE',
              payload: currentState
            });
            for (const mobile of mobileClients) {
              if (mobile.readyState === WebSocket.OPEN) {
                mobile.send(broadcastMsg);
              }
            }
          }
        } catch (e) {
          console.error('[RemoteHub] Error processing desktop message:', e);
        }
      });

      ws.on('close', () => {
        console.log('[RemoteHub] Desktop App disconnected');
        if (desktopClient === ws) desktopClient = null;
      });

    } else {
      // Mobile client (iPhone / iPad / Android)
      mobileClients.add(ws);
      console.log(`[RemoteHub] Mobile Client connected! Total: ${mobileClients.size}`);
      
      // Notify desktop about new mobile connection
      if (desktopClient && desktopClient.readyState === WebSocket.OPEN) {
        desktopClient.send(JSON.stringify({
          type: 'MOBILE_COUNT',
          payload: { count: mobileClients.size }
        }));
      }

      // Send initial state to newly connected phone
      ws.send(JSON.stringify({
        type: 'STATE_UPDATE',
        payload: currentState
      }));

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          console.log('[RemoteHub] Received command from iPhone:', data.command, data.payload);

          // Relay command from phone to desktop app
          if (desktopClient && desktopClient.readyState === WebSocket.OPEN) {
            desktopClient.send(JSON.stringify({
              type: 'MOBILE_COMMAND',
              command: data.command,
              payload: data.payload
            }));
          }
        } catch (e) {
          console.error('[RemoteHub] Error processing mobile command:', e);
        }
      });

      ws.on('close', () => {
        mobileClients.delete(ws);
        console.log(`[RemoteHub] Mobile Client disconnected. Remaining: ${mobileClients.size}`);
        if (desktopClient && desktopClient.readyState === WebSocket.OPEN) {
          desktopClient.send(JSON.stringify({
            type: 'MOBILE_COUNT',
            payload: { count: mobileClients.size }
          }));
        }
      });
    }
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`[StreamCue Remote Hub] Port ${port} is already running in background. Connecting to active hub.`);
    } else {
      console.error('[StreamCue Remote Hub] Server error:', err);
    }
  });

  server.listen(port, '0.0.0.0', () => {
    const ip = getLocalIpAddress();
    console.log(`====================================================`);
    console.log(`[StreamCue Remote Hub] Server running on port ${port}`);
    console.log(`[StreamCue Remote Hub] Desktop link: http://localhost:${port}`);
    console.log(`[StreamCue Remote Hub] iPhone Mobile URL: http://${ip}:${port}/remote`);
    console.log(`====================================================`);
  });

  return {
    server,
    wss,
    getLocalIpAddress,
    getPort: () => port,
    getMobileUrl: () => `http://${getLocalIpAddress()}:${port}/remote`
  };
}

function getMobileHtml(port) {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="theme-color" content="#090d16" />
  <title>StreamCue Remote (iPhone)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
      -webkit-user-select: none;
    }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #090d16;
      color: #f8fafc;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      overflow-x: hidden;
      padding-top: env(safe-area-inset-top, 20px);
      padding-bottom: env(safe-area-inset-bottom, 20px);
    }
    .status-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 20px;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .badge-connected {
      background: rgba(16, 185, 129, 0.15);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .badge-disconnected {
      background: rgba(239, 68, 68, 0.15);
      color: #ef4444;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }
    .badge-obs-rec {
      background: rgba(239, 68, 68, 0.25);
      color: #ff4d4f;
      border: 1px solid #ef4444;
      animation: pulse-red 1.5s infinite;
    }
    @keyframes pulse-red {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.85; transform: scale(0.98); }
    }
    .tab-switcher {
      display: flex;
      padding: 6px;
      background: #0f172a;
      margin: 12px 16px;
      border-radius: 14px;
      border: 1px solid rgba(255, 255, 255, 0.06);
    }
    .tab-btn {
      flex: 1;
      padding: 10px 0;
      font-size: 14px;
      font-weight: 700;
      border: none;
      background: transparent;
      color: #94a3b8;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .tab-btn.active {
      background: #3b82f6;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.35);
    }
    .content-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 0 16px;
      overflow-y: auto;
    }
    .view-container {
      display: none;
      flex: 1;
      flex-direction: column;
    }
    .view-container.active {
      display: flex;
    }

    /* CONTROLLER VIEW */
    .cue-card {
      background: linear-gradient(145deg, #131b2e 0%, #0d1525 100%);
      border: 1px solid rgba(59, 130, 246, 0.3);
      border-radius: 20px;
      padding: 18px;
      margin-bottom: 16px;
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.4);
      position: relative;
      overflow: hidden;
    }
    .cue-card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .cue-index {
      font-size: 12px;
      font-weight: 800;
      color: #60a5fa;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .cue-timer {
      font-size: 16px;
      font-weight: 800;
      color: #f59e0b;
      font-variant-numeric: tabular-nums;
    }
    .cue-text {
      font-size: 18px;
      line-height: 1.45;
      font-weight: 700;
      color: #ffffff;
      min-height: 52px;
    }
    .next-preview {
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      font-size: 13px;
      color: #64748b;
      line-height: 1.35;
    }
    .next-label {
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 700;
      color: #94a3b8;
    }

    /* OBS GIANT RECORD BUTTON */
    .btn-obs-record {
      width: 100%;
      height: 72px;
      background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
      border: none;
      border-radius: 20px;
      color: white;
      font-size: 19px;
      font-weight: 900;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      box-shadow: 0 8px 24px rgba(239, 68, 68, 0.45);
      cursor: pointer;
      margin-bottom: 16px;
      transition: transform 0.1s;
    }
    .btn-obs-record.recording {
      background: linear-gradient(135deg, #475569 0%, #1e293b 100%);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      border: 2px solid #ef4444;
    }
    .btn-obs-record:active {
      transform: scale(0.96);
    }
    .rec-dot {
      width: 16px;
      height: 16px;
      background: white;
      border-radius: 50%;
    }
    .recording .rec-dot {
      background: #ef4444;
      border-radius: 4px;
      animation: pulse-red 1s infinite;
    }

    /* CONTROLS GRID */
    .controls-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 16px;
    }
    .action-btn {
      background: #1e293b;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 18px;
      color: #f1f5f9;
      font-size: 16px;
      font-weight: 800;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      cursor: pointer;
      transition: all 0.1s;
    }
    .action-btn:active {
      transform: scale(0.95);
      background: #334155;
    }
    .action-btn.play-btn {
      grid-column: span 2;
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: white;
      box-shadow: 0 6px 18px rgba(37, 99, 235, 0.35);
      padding: 22px;
      font-size: 19px;
    }
    .action-btn.play-btn.playing {
      background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
      box-shadow: 0 6px 18px rgba(217, 119, 6, 0.35);
    }

    .speed-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #131b2e;
      border-radius: 16px;
      padding: 12px 18px;
      border: 1px solid rgba(255, 255, 255, 0.06);
      margin-bottom: 16px;
    }
    .speed-btn {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      background: #1e293b;
      color: white;
      font-size: 20px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
    .speed-display {
      font-size: 15px;
      font-weight: 700;
      color: #94a3b8;
    }
    .speed-val {
      color: #38bdf8;
      font-size: 18px;
      font-weight: 900;
    }

    /* POCKET PROMPTER VIEW */
    .prompter-screen {
      flex: 1;
      background: #000000;
      border-radius: 20px;
      border: 1px solid #1e293b;
      padding: 24px 18px;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
      margin-bottom: 12px;
    }
    .prompter-mirror {
      transform: scaleX(-1);
    }
    .prompter-text-scroll {
      flex: 1;
      overflow-y: auto;
      font-size: 26px;
      line-height: 1.6;
      font-weight: 700;
      color: #ffffff;
      padding: 60px 0;
      scroll-behavior: smooth;
    }
    .prompter-cue-active {
      color: #38bdf8;
      background: rgba(56, 189, 248, 0.12);
      border-radius: 12px;
      padding: 8px 12px;
      box-shadow: 0 0 20px rgba(56, 189, 248, 0.2);
    }
    .prompter-cue-item {
      margin-bottom: 24px;
      transition: all 0.3s;
    }
    .prompter-guide-line {
      position: absolute;
      top: 45%;
      left: 0;
      right: 0;
      height: 2px;
      background: rgba(56, 189, 248, 0.4);
      pointer-events: none;
      box-shadow: 0 0 10px #38bdf8;
    }
    .mirror-toggle-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: #1e293b;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 10px;
      font-size: 13px;
      font-weight: 700;
      color: #cbd5e1;
      cursor: pointer;
      margin-bottom: 12px;
    }
  </style>
</head>
<body>
  <!-- Status Header -->
  <div class="status-bar">
    <div id="connStatus" class="badge badge-disconnected">● ĐANG KẾT NỐI...</div>
    <div id="obsStatus" class="badge" style="background:#1e293b; color:#94a3b8">OBS: CHỜ</div>
  </div>

  <!-- Navigation Tabs -->
  <div class="tab-switcher">
    <button id="tabController" class="tab-btn active" onclick="switchTab('controller')">🕹️ Tay Cầm Remote</button>
    <button id="tabPrompter" class="tab-btn" onclick="switchTab('prompter')">📜 Màn Hình Nhắc Chữ</button>
  </div>

  <div class="content-area">
    <!-- VIEW 1: CONTROLLER -->
    <div id="viewController" class="view-container active">
      <!-- Current Cue Display -->
      <div class="cue-card">
        <div class="cue-card-top">
          <span id="cueIndex" class="cue-index">CÂU 1 / 1</span>
          <span id="cueTimer" class="cue-timer">00:00</span>
        </div>
        <div id="cueText" class="cue-text">Đang đồng bộ kịch bản từ máy tính...</div>
        <div class="next-preview">
          <div class="next-label">Câu tiếp theo:</div>
          <div id="nextText">...</div>
        </div>
      </div>

      <!-- OBS Instant Record Button -->
      <button id="btnObsRecord" class="btn-obs-record" onclick="sendCmd('toggle_obs_record')">
        <div class="rec-dot"></div>
        <span id="obsRecLabel">BẮT ĐẦU QUAY OBS</span>
      </button>

      <!-- Main Controls Grid -->
      <div class="controls-grid">
        <button id="btnPlay" class="action-btn play-btn" onclick="sendCmd('toggle_play')">
          <span id="playIcon">▶</span>
          <span id="playLabel">CHẠY KỊCH BẢN</span>
        </button>

        <button class="action-btn" onclick="sendCmd('prev_cue')">
          <span style="font-size:24px">⏮️</span>
          <span>CÂU TRƯỚC</span>
        </button>

        <button class="action-btn" onclick="sendCmd('next_cue')">
          <span style="font-size:24px">⏭️</span>
          <span>CÂU TIẾP</span>
        </button>

        <button class="action-btn" onclick="sendCmd('reset')">
          <span style="font-size:24px">🔄</span>
          <span>VỀ ĐẦU (00:00)</span>
        </button>

        <button class="action-btn" onclick="sendCmd('countdown_321')">
          <span style="font-size:24px">⏱️</span>
          <span>ĐẾM 3..2..1</span>
        </button>
      </div>

      <!-- Speed Control -->
      <div class="speed-row">
        <button class="speed-btn" onclick="sendCmd('speed_down')">-</button>
        <div class="speed-display">Tốc độ: <span id="speedVal" class="speed-val">130 WPM</span></div>
        <button class="speed-btn" onclick="sendCmd('speed_up')">+</button>
      </div>
    </div>

    <!-- VIEW 2: POCKET PROMPTER -->
    <div id="viewPrompter" class="view-container">
      <button class="mirror-toggle-btn" onclick="toggleMirror()">
        🔄 Lật Gương (Kẹp kính Teleprompter)
      </button>
      <div id="prompterScreen" class="prompter-screen">
        <div class="prompter-guide-line"></div>
        <div id="prompterScroll" class="prompter-text-scroll">
          <!-- Populated by script cues -->
        </div>
      </div>
    </div>
  </div>

  <script>
    let ws = null;
    let isMirrored = false;
    let state = {
      isPlaying: false,
      currentCueIndex: 0,
      cues: [],
      isObsRecording: false,
      wpm: 130
    };

    function haptic() {
      if (navigator.vibrate) {
        navigator.vibrate(40);
      }
    }

    function switchTab(tab) {
      haptic();
      document.getElementById('tabController').classList.toggle('active', tab === 'controller');
      document.getElementById('tabPrompter').classList.toggle('active', tab === 'prompter');
      document.getElementById('viewController').classList.toggle('active', tab === 'controller');
      document.getElementById('viewPrompter').classList.toggle('active', tab === 'prompter');
      if (tab === 'prompter') {
        renderPrompterCues();
      }
    }

    function toggleMirror() {
      haptic();
      isMirrored = !isMirrored;
      document.getElementById('prompterScreen').classList.toggle('prompter-mirror', isMirrored);
    }

    function sendCmd(command, payload = {}) {
      haptic();
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ command, payload }));
      }
    }

    function connectWebSocket() {
      const loc = window.location;
      const wsUri = (loc.protocol === 'https:' ? 'wss://' : 'ws://') + loc.hostname + ':${port}?type=mobile';
      
      ws = new WebSocket(wsUri);

      ws.onopen = () => {
        const badge = document.getElementById('connStatus');
        badge.className = 'badge badge-connected';
        badge.textContent = '● ĐÃ KẾT NỐI MAC/PC';
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'STATE_UPDATE') {
            state = { ...state, ...msg.payload };
            updateUI();
          }
        } catch (e) {
          console.error(e);
        }
      };

      ws.onclose = () => {
        const badge = document.getElementById('connStatus');
        badge.className = 'badge badge-disconnected';
        badge.textContent = '● MẤT KẾT NỐI';
        setTimeout(connectWebSocket, 2000);
      };
    }

    function formatTime(secs) {
      const m = Math.floor(secs / 60);
      const s = Math.floor(secs % 60);
      return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    }

    function updateUI() {
      // OBS state
      const obsBadge = document.getElementById('obsStatus');
      const obsRecBtn = document.getElementById('btnObsRecord');
      const obsRecLabel = document.getElementById('obsRecLabel');

      if (state.isObsRecording) {
        obsBadge.className = 'badge badge-obs-rec';
        obsBadge.textContent = 'REC: ' + (state.obsRecordTimecode || 'LIVE');
        obsRecBtn.className = 'btn-obs-record recording';
        obsRecLabel.textContent = 'DỪNG QUAY OBS (REC ' + (state.obsRecordTimecode || '') + ')';
      } else {
        obsBadge.className = 'badge';
        obsBadge.style.background = state.isObsConnected ? 'rgba(59,130,246,0.2)' : '#1e293b';
        obsBadge.style.color = state.isObsConnected ? '#60a5fa' : '#94a3b8';
        obsBadge.textContent = state.isObsConnected ? 'OBS: SẴN SÀNG' : 'OBS: CHƯA BẬT';
        obsRecBtn.className = 'btn-obs-record';
        obsRecLabel.textContent = 'BẮT ĐẦU QUAY OBS';
      }

      // Play state
      const playBtn = document.getElementById('btnPlay');
      const playIcon = document.getElementById('playIcon');
      const playLabel = document.getElementById('playLabel');

      if (state.isPlaying) {
        playBtn.className = 'action-btn play-btn playing';
        playIcon.textContent = '⏸️';
        playLabel.textContent = 'TẠM DỪNG';
      } else {
        playBtn.className = 'action-btn play-btn';
        playIcon.textContent = '▶';
        playLabel.textContent = 'CHẠY KỊCH BẢN';
      }

      // Cues
      const cues = state.cues || [];
      const idx = state.currentCueIndex || 0;
      document.getElementById('cueIndex').textContent = 'CÂU ' + (cues.length ? (idx + 1) : 0) + ' / ' + cues.length;
      document.getElementById('cueTimer').textContent = formatTime(state.currentTime || 0);

      if (cues.length > 0 && cues[idx]) {
        document.getElementById('cueText').textContent = cues[idx].text;
      } else if (state.fullText) {
        document.getElementById('cueText').textContent = state.fullText;
      }

      if (cues.length > idx + 1) {
        document.getElementById('nextText').textContent = cues[idx + 1].text;
      } else {
        document.getElementById('nextText').textContent = '— Hết kịch bản —';
      }

      // Speed
      document.getElementById('speedVal').textContent = (state.wpm || 130) + ' WPM';

      // Update prompter scroll
      renderPrompterCues();
    }

    function renderPrompterCues() {
      const scrollEl = document.getElementById('prompterScroll');
      if (!scrollEl) return;
      const cues = state.cues || [];
      const activeIdx = state.currentCueIndex || 0;

      let html = '';
      cues.forEach((cue, i) => {
        const isActive = (i === activeIdx);
        html += '<div id="cue-item-' + i + '" class="prompter-cue-item ' + (isActive ? 'prompter-cue-active' : '') + '">'
              + '<div style="font-size:12px; opacity:0.6; margin-bottom:4px">[' + formatTime(cue.startSecond || 0) + ' - ' + formatTime(cue.endSecond || 0) + ']</div>'
              + cue.text
              + '</div>';
      });

      scrollEl.innerHTML = html;

      const activeEl = document.getElementById('cue-item-' + activeIdx);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    connectWebSocket();
  </script>
</body>
</html>
`;
}

module.exports = {
  startRemoteHub,
  getLocalIpAddress
};

// If run directly via node
if (require.main === module) {
  startRemoteHub();
}
