import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Leaf, Check } from 'lucide-react';
import api, { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { getPendingRef, setPendingRef, clearPendingRef } from '../utils/referral';
import GoogleButton from '../components/GoogleButton';
import { Button, Sheet } from '../ui/Kit';
import './Auth.css';

const checkCode = async (code) => (await api.get('/users/referral-check', { params: { code } })).data.valid;

export default function Register() {
  const { user, googleSignIn } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [applied, setApplied] = useState('');           // valid code that came from a link
  const [typed, setTyped] = useState('');               // code typed by hand
  const [refState, setRefState] = useState('checking'); // checking | applied | input
  const [linkInvalid, setLinkInvalid] = useState(false);
  const [pending, setPending] = useState(null);         // Google sign-in waiting for the popup answer
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [agreed, setAgreed] = useState(false);          // one box covers terms, privacy and the health/estimates notice

  // A code from the link (or saved earlier) is checked first. If it is real, no input box is shown.
  useEffect(() => {
    const fromLink = (params.get('ref') || getPendingRef() || '').trim().toUpperCase();
    if (!fromLink) { setRefState('input'); return undefined; }
    let cancelled = false;
    checkCode(fromLink)
      .then((valid) => {
        if (cancelled) return;
        if (valid) { setApplied(fromLink); setPendingRef(fromLink); setRefState('applied'); }
        else { clearPendingRef(); setLinkInvalid(true); setRefState('input'); }
      })
      .catch(() => { if (!cancelled) { setApplied(fromLink); setRefState('applied'); } }); // the server checks again
    return () => { cancelled = true; };
  }, [params]);

  if (user) return <Navigate to="/" replace />;

  const finish = async (credential, extra) => {
    setBusy(true);
    setError('');
    try {
      await googleSignIn(credential, { mode: 'register', ...extra });
      clearPendingRef();
      navigate('/', { replace: true });
    } catch (err) {
      if (err.response?.data?.code === 'INVALID_REFERRAL') { setApplied(''); setRefState('input'); setPending(credential); }
      else setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const onCredential = async (credential) => {
    const code = refState === 'applied' ? applied : typed.trim().toUpperCase();
    // Check a hand-typed code BEFORE creating the account
    if (refState === 'input' && code) {
      setBusy(true);
      try {
        if (!(await checkCode(code))) { setBusy(false); setPending(credential); return; }
      } catch (err) {
        setBusy(false);
        setError(errorMessage(err));
        return;
      }
      setBusy(false);
    }
    await finish(credential, { referralCodeUsed: code });
  };

  const continueWithout = () => {
    const credential = pending;
    setPending(null);
    setTyped('');
    clearPendingRef();
    finish(credential, { skipReferral: true });
  };

  return (
    <div className="auth">
      <span className="auth-mark" aria-hidden="true"><Leaf size={26} /></span>
      <h1>Create your account</h1>
      <p className="sub">Meal plans that keep your nutrition balanced. One Google tap, no password.</p>

      {refState === 'applied' && <div className="ref-applied"><Check size={18} aria-hidden="true" /> Referral code applied: <strong>{applied}</strong></div>}
      {refState === 'input' && (
        <div className="stack">
          {linkInvalid && <p className="muted">The code in your link was not valid. You can enter another one if you have it.</p>}
          <input placeholder="Referral code (optional, enter before continuing)" value={typed} autoCapitalize="characters"
            onChange={(e) => setTyped(e.target.value)} />
        </div>
      )}

      <label className="tick consent">
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
        <span>
          I agree to the <Link to="/terms" target="_blank">Terms of Service</Link>, <Link to="/privacy" target="_blank">Privacy Policy</Link> and{' '}
          <Link to="/disclaimer" target="_blank">Health Disclaimer</Link>, and I understand that nutrition values are estimates and not medical advice.
        </span>
      </label>
      {!agreed && <p className="muted">Tick the box above to continue.</p>}
      <GoogleButton onCredential={onCredential} text="signup_with" disabled={!agreed || busy || refState === 'checking'} />
      {busy && <p className="muted" style={{ textAlign: 'center' }}>Please wait...</p>}
      {error && <p className="error-text" style={{ textAlign: 'center' }}>{error}</p>}
      <p className="muted legal">We only use your Google name and email to create your account.</p>
      <p className="switch">Already registered? <Link to="/login">Log in</Link></p>

      <Sheet open={Boolean(pending)} onClose={() => setPending(null)} title="Referral code was invalid">
        <p className="ui-muted" style={{ fontSize: 15 }}>We could not find that referral code. Do you want to continue creating your account without it?</p>
        <Button block onClick={continueWithout}>Continue without it</Button>
        <Button variant="ghost" block onClick={() => setPending(null)}>Cancel</Button>
      </Sheet>
    </div>
  );
}