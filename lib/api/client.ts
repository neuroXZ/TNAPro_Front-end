import axios from 'axios';

// Use environment variable or fallback to production
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout for slow server responses
});

// Log every outgoing request — helps trace network issues during development
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Log common failure cases (backend down, wrong endpoint)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNREFUSED') {
      console.error('Connection refused - Backend server may not be running');
    } else if (error.response?.status === 404) {
      console.error('404 Not Found - API endpoint may not exist:', error.config?.url);
    }
    return Promise.reject(error);
  }
);

// Attach the stored auth token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Force a re-login when the session is no longer valid
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
