import axios, { type InternalAxiosRequestConfig } from 'axios';

interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  metadata?: { startTime: number };
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config: ExtendedAxiosRequestConfig) => {
    const startTime = Date.now();
    config.metadata = { startTime };
    console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, {
      params: config.params,
      timeout: config.timeout
    });
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    const config = response.config as ExtendedAxiosRequestConfig;
    const duration = Date.now() - (config.metadata?.startTime || 0);
    console.log(`✅ ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url} (${duration}ms)`, {
      dataLength: JSON.stringify(response.data).length,
      status: response.status
    });
    return response;
  },
  (error) => {
    const duration = Date.now() - (error.config?.metadata?.startTime || 0);
    const status = error.response?.status || 'Network Error';
    const method = error.config?.method?.toUpperCase() || 'REQUEST';
    const url = error.config?.url || 'unknown';
    
    console.error(`❌ ${status} ${method} ${url} (${duration}ms)`, {
      error: error.response?.data || error.message,
      status: error.response?.status,
      statusText: error.response?.statusText
    });
    
    return Promise.reject(error);
  }
);