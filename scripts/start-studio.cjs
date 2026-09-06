const { spawn } = require('child_process');
const path = require('path');
const { startRemoteHub, getLocalIpAddress } = require('../server/remote-hub.cjs');

console.log('🚀 Khởi động StreamCue Studio Pro...');

// 1. Start iPhone Remote Hub Server
const hub = startRemoteHub(49200);
const lanIp = getLocalIpAddress();

console.log(`\n======================================================`);
console.log(`📱 MÃ KẾT NỐI IPHONE: http://${lanIp}:49200/remote`);
console.log(`💻 DESKTOP APP LINK:  http://localhost:5173`);
console.log(`======================================================\n`);

// 2. Start Vite Dev Server
const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const vite = spawn(npxCmd, ['vite', '--host', '0.0.0.0'], {
  cwd: path.join(__dirname, '..'),
  stdio: 'inherit',
  shell: true
});

vite.on('close', (code) => {
  console.log(`Vite server exited with code ${code}`);
  process.exit(code || 0);
});

process.on('SIGINT', () => {
  vite.kill();
  process.exit(0);
});
