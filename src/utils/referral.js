const KEY = 'pending_ref';
const clean = (v) => String(v || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);

export const getPendingRef = () => { try { return localStorage.getItem(KEY) || ''; } catch { return ''; } };
export const clearPendingRef = () => { try { localStorage.removeItem(KEY); } catch { /* ignore */ } };
export const setPendingRef = (v) => {
  try {
    const code = clean(v);
    if (code) localStorage.setItem(KEY, code); else localStorage.removeItem(KEY);
  } catch { /* ignore */ }
};

// Run once when the app opens, so the code survives going to Login and back
export function captureReferral() {
  const ref = new URLSearchParams(window.location.search).get('ref');
  if (ref) setPendingRef(ref);
}