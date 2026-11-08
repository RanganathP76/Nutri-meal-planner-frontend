import axios from 'axios';

export const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const KEY = 'admin_token';

export const tokenStore = {
  get: () => sessionStorage.getItem(KEY),
  set: (t) => sessionStorage.setItem(KEY, t),
  clear: () => sessionStorage.removeItem(KEY)
};

let onUnauthorized = null;
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

const api = axios.create({ baseURL: API_BASE, timeout: 15000 });

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 401 while logged in = session ended (expired, deactivated, password changed, logged out elsewhere)
api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401 && tokenStore.get() && onUnauthorized) {
      onUnauthorized(error.response.data?.error || 'Your session has ended. Please log in again.');
    }
    return Promise.reject(error);
  }
);

export const errorMessage = (err) =>
  err.response?.data?.error || (err.code === 'ERR_NETWORK' ? 'Cannot reach the server' : err.message) || 'Something went wrong';

export const isNoAccess = (err) => err.response?.status === 403 && err.response?.data?.code === 'NO_ACCESS';

export default api;