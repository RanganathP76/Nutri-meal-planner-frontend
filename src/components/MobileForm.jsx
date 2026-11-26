import { useState } from 'react';
import { Smartphone } from 'lucide-react';
import api, { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Button } from '../ui/Kit';

// Same rule as the server: 10 digits starting 6 to 9. The server has the final say.
const digitsOf = (v) => String(v || '').replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '').replace(/^0(?=\d{10}$)/, '');
export const mobileProblem = (v) => (/^[6-9]\d{9}$/.test(digitsOf(v)) ? '' : 'Enter a 10-digit mobile number that starts with 6, 7, 8 or 9.');

export default function MobileForm({ initial = '', submitLabel = 'Save number', onSaved, autoFocus }) {
  const { refreshUser } = useAuth();
  const [value, setValue] = useState(initial);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const problem = mobileProblem(value);
    if (problem) { setError(problem); return; }
    setBusy(true); setError('');
    try {
      await api.put('/users/mobile', { mobile: digitsOf(value) });
      await refreshUser();
      onSaved?.();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="stack" onSubmit={submit} noValidate>
      <label className="ui-field">
        <span>Mobile number</span>
        <span className="mob-input">
          <span className="mob-prefix"><Smartphone size={16} aria-hidden="true" /> +91</span>
          <input type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={14} placeholder="98765 43210" value={value} autoFocus={autoFocus}
            onChange={(e) => { setValue(e.target.value); setError(''); }} aria-invalid={Boolean(error)} />
        </span>
      </label>
      {error && <p className="error-text" role="alert">{error}</p>}
      <Button block disabled={busy} onClick={submit}>{busy ? 'Saving...' : submitLabel}</Button>
    </form>
  );
}
