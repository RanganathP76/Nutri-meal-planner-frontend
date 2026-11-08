import { useEffect, useRef, useState } from 'react';

const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
let scriptPromise = null;

function loadScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true;
      s.onload = resolve;
      s.onerror = () => { scriptPromise = null; reject(new Error('Could not load Google sign-in. Check your internet and try again.')); };
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
}

export default function GoogleButton({ onCredential, text = 'continue_with', disabled }) {
  const box = useRef(null);
  const latest = useRef(onCredential);
  latest.current = onCredential;
  const [error, setError] = useState('');

  useEffect(() => {
    if (!CLIENT_ID) { setError('Google sign-in is not set up yet.'); return undefined; }
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !box.current) return;
        window.google.accounts.id.initialize({ client_id: CLIENT_ID, callback: (r) => latest.current(r.credential) });
        window.google.accounts.id.renderButton(box.current, {
          theme: 'outline', size: 'large', shape: 'pill', text, width: Math.min(400, box.current.offsetWidth || 300)
        });
      })
      .catch((e) => setError(e.message));
    return () => { cancelled = true; };
  }, [text]);

  return (
    <div className="google-wrap">
      <div ref={box} style={{ display: 'flex', justifyContent: 'center', opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' }} />
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}