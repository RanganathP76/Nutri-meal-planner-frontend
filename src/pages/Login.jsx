import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../api/client';
import GoogleButton from '../components/GoogleButton';
import LegalLinks from '../components/LegalLinks';
import AuthShell from '../components/AuthShell';

export default function Login() {
  const { user, googleSignIn, notice } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const onCredential = async (credential) => {
    setBusy(true);
    setError('');
    try {
      await googleSignIn(credential, { mode: 'login' });
      navigate('/', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell eyebrow="Welcome back" title="Log in to FitRatio" sub="Use the Google account you registered with.">
      {notice && <p className="error-text">{notice}</p>}
      <GoogleButton onCredential={onCredential} text="signin_with" disabled={busy} />
      {busy && <p className="ui-muted" style={{ textAlign: 'center' }}>Signing you in…</p>}
      {error && <p className="error-text" style={{ textAlign: 'center' }}>{error}</p>}
      <p className="ui-muted legal">Using a new phone or computer? Log in with the same Google account. Only one device can be logged in at a time, so your other device will be logged out.</p>
      <LegalLinks />
      <p className="switch">New here? <Link to="/register">Create an account</Link></p>
    </AuthShell>
  );
}