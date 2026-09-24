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
  },
});

export const getLatestSensorData = async () => {
  const response = await api.get('/sensor-data/latest', {
    // Them timestamp de tranh mot so proxy/client tra ve ban cache cu.
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
  formData.append('file', {
    uri: image.uri,
    name: image.fileName || `plant-${Date.now()}.jpg`,
    type: image.mimeType || 'image/jpeg',
  });

  const response = await api.post('/image/classify', formData, {
    timeout: 30000,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};
