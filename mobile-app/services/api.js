import { Platform } from 'react-native';
import axios from 'axios';
import { BASE_URL } from '../constants/config';

// Tao axios instance dung chung cho toan bo app.
export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
    'Bypass-Tunnel-Reminder': 'true',
  },
});

export const getLatestSensorData = async () => {
  const response = await api.get('/sensor-data/latest', {
    params: { _ts: Date.now() },
  });
  return response.data;
};

export const getSensorHistory = async () => {
  const response = await api.get('/sensor-data/history', {
    params: { _ts: Date.now() },
  });
  return response.data;
};

export const askChatbot = async (question) => {
  const response = await api.post('/chat', { question });
  return response.data;
};

export const classifyImage = async (image) => {
  const formData = new FormData();

  if (Platform.OS === 'web') {
    // Trên Web: image.uri có thể là blob: hoặc data: URI -> cần fetch sang Blob thật sự
    const response = await fetch(image.uri);
    const blob = await response.blob();
    const filename = image.fileName || `plant-${Date.now()}.jpg`;
    formData.append('file', blob, filename);
  } else {
    // Trên Native (Android/iOS): dùng object uri của React Native
    formData.append('file', {
      uri: image.uri,
      name: image.fileName || `plant-${Date.now()}.jpg`,
      type: image.mimeType || 'image/jpeg',
    });
  }

  const response = await api.post('/image/classify', formData, {
    timeout: 30000,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};
