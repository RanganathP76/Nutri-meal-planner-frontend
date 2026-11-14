import axios from 'axios';

export const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const KEY = 'nutri_token';

// The login is kept on this device until the customer logs in somewhere else (the server then ends this one).
// localStorage survives closing the browser. Every access is wrapped because some browsers block it.
const read = (store) => { try { return store.getItem(KEY); } catch { return null; } };
export const tokenStore = {
  get: () => read(localStorage) || read(sessionStorage),
  set: (t) => { try { localStorage.setItem(KEY, t); } catch { try { sessionStorage.setItem(KEY, t); } catch { /* ignore */ } } },
  clear: () => { for (const s of [localStorage, sessionStorage]) { try { s.removeItem(KEY); } catch { /* ignore */ } } }
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