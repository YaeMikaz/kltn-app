// Cấu hình URL backend động:
// 1. Ưu tiên biến môi trường EXPO_PUBLIC_API_URL (khi dùng Tunnel như Cloudflare/ngrok/localtunnel)
// 2. Fallback sang IP LAN hoặc localhost khi dev cục bộ
import Constants from 'expo-constants';

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/+$/, '');
  }

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:8000`;
  }

  return 'http://localhost:8000';
};

export const BASE_URL = getBaseUrl();
