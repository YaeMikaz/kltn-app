#!/usr/bin/env node
/**
 * Script tự động mở tunnel và cập nhật thẳng vào mobile-app/.env
 * Chạy lệnh: node start-tunnel.js [localtunnel|cloudflare]
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ENV_PATH = path.join(__dirname, 'mobile-app', '.env');
const SUBDOMAIN = 'kltn-yaemikaz'; // Tên subdomain cố định nếu dùng localtunnel

const mode = process.argv[2] || 'localtunnel';

function updateEnv(url) {
  const envContent = `EXPO_PUBLIC_API_URL=${url}\n`;
  fs.writeFileSync(ENV_PATH, envContent);
  console.log('\n========================================');
  console.log(`✅ Đã tự động ghi URL vào ${ENV_PATH}:`);
  console.log(`👉 ${url}`);
  console.log('========================================\n');
}

if (mode === 'localtunnel') {
  console.log(`🚀 Đang khởi động Localtunnel với subdomain cố định: ${SUBDOMAIN}...`);
  const lt = spawn('npx', ['localtunnel', '--port', '8000', '--subdomain', SUBDOMAIN]);

  lt.stdout.on('data', (data) => {
    const text = data.toString();
    const match = text.match(/https:\/\/[^\s]+/);
    if (match) {
      updateEnv(match[0]);
    }
    process.stdout.write(data);
  });

  lt.stderr.on('data', (data) => process.stderr.write(data));
} else {
  console.log('🚀 Đang khởi động Cloudflare Tunnel...');
  const cf = spawn('npx', ['cloudflared', 'tunnel', '--url', 'http://localhost:8000']);

  cf.stderr.on('data', (data) => {
    const text = data.toString();
    const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
    if (match) {
      updateEnv(match[0]);
    }
    process.stderr.write(data);
  });

  cf.stdout.on('data', (data) => process.stdout.write(data));
}
