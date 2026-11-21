import { useEffect, useState } from 'react';
import api, { errorMessage } from '../api/client';
import { ALLERGENS } from '../utils/allergens';

// Basic plan: the allergies the customer wants to avoid. Meals that contain them (or that nobody has checked yet) are hidden.
// onChange() runs after saving so the planner asks the server for a fresh list.
export default function BasicAllergies({ onChange }) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState([]);
  const [other, setOther] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/meals/allergies').then((r) => { setPicked(r.data.allergies || []); setOther(r.data.otherAllergies || ''); }).catch(() => {});
  }, []);

  const toggle = (k) => setPicked((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));
  const save = async () => {
    setSaving(true); setError(''); setMsg('');
    try {
      await api.put('/meals/allergies', { allergies: picked, otherAllergies: other });
      setMsg('Saved. Meals are updated.');
      onChange?.();
    } catch (err) { setError(errorMessage(err)); } finally { setSaving(false); }
  };
  const count = picked.length + (other.trim() ? 1 : 0);
  return (
    <div className="card stack allergy-box">
      <div className="picker-head">
        <strong>Food allergies {count ? `(${count})` : ''}</strong>
        <button type="button" className="btn btn-light btn-sm" onClick={() => setOpen(!open)}>{open ? 'Hide' : count ? 'Change' : 'Set'}</button>
      </div>
      {open && (
        <>
          <p className="muted">Tick anything you are allergic to. We hide meals that contain it, and meals whose ingredients we have not checked yet. This is a filter, not a guarantee. Always check the food yourself.</p>
          <div className="chip-row">
            {ALLERGENS.map(([k, label]) => (
              <button key={k} type="button" className={`chip small ${picked.includes(k) ? 'on' : ''}`} onClick={() => toggle(k)}>{picked.includes(k) ? '✓ ' : ''}{label}</button>
            ))}
          </div>
          <input type="text" maxLength={200} placeholder="Anything else, e.g. kiwi, coconut" value={other} onChange={(e) => setOther(e.target.value)} />
          {error && <p className="error-text">{error}</p>}
          {msg && <p className="success-text">{msg}</p>}
          <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save allergies'}</button>
        </>
      )}
    </div>
  );
}
