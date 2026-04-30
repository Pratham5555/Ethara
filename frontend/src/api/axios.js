import axios from 'axios';

const FALLBACK = 'https://backend-iota-inky-38.vercel.app/api';
const rawUrl = (import.meta.env.VITE_API_URL || '')
  .replace(/^﻿/, '')       // strip BOM
  .replace(/^["']|["']$/g, ''); // strip accidental quotes
const baseURL = (rawUrl.startsWith('http') ? rawUrl : null) || FALLBACK;

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
