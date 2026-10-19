import axios from 'axios';

const defaultApiUrl =
  import.meta.env.MODE === 'production'
    ? 'https://intellmeet-ai-powered-enterprise-meeting-h6bn.onrender.com/api'
    : 'http://localhost:5001/api';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || defaultApiUrl,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('intellmeet-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
