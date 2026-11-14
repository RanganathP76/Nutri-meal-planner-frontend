import { useState } from 'react';
import api, { errorMessage } from '../api/client';
import './TargetsEditor.css';
import './BodyGoal.css';

const ROWS = [['calories', 'Calories', 'kcal'], ['protein', 'Protein', 'g'], ['carbohydrates', 'Carbohydrates', 'g'], ['fat', 'Fat', 'g'], ['fiber', 'Fibre', 'g']];

// The server calculates and validates everything. This only shows and sends edits.
export default function TargetsEditor({ details, eaten, onChanged, base = '/individual' }) {
  const [draft, setDraft] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [warnings, setWarnings] = useState([]);

  const send = async (fn) => {
    setBusy(true);
    setError('');
    try {
      const { data } = await fn();
      setWarnings(data.warnings || []);
      setDraft({});
      onChanged(data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const save = (k) => send(() => api.patch(`${base}/targets`, { [k]: draft[k] }));
  const reset = (k) => send(() => api.patch(`${base}/targets`, { [k]: null }));
  const resetAll = () => send(() => api.post(`${base}/targets/reset`));
  const anyCustom = ROWS.some(([k]) => details[k].custom);

  return (
    <div className="card stack">
      <div className="te-head">
        <strong>My daily targets</strong>
        {anyCustom && <button type="button" className="btn btn-light te-all" disabled={busy} onClick={resetAll}>Reset all to recommended</button>}
      </div>
      <p className="muted">Calculated from your height, weight and goal. You can change any number.</p>

      <div className="te-table">
        {ROWS.map(([k, label, unit]) => {
          const d = details[k];
          const shown = draft[k] ?? d.value;
          const edited = draft[k] !== undefined && Number(draft[k]) !== d.value;
          const remaining = eaten ? Math.max(0, Math.round(d.value - eaten[k])) : null;
          return (
            <div key={k} className="te-row">
              <div className="te-top">
                <strong>{label}</strong>
                <span className={`tag ${d.custom ? 'tag-amber' : 'tag-green'}`}>{d.custom ? 'Custom Target' : 'Recommended'}</span>
              </div>
              <div className="te-edit">
                <input type="number" inputMode="numeric" value={shown} disabled={busy}
                  onChange={(e) => setDraft({ ...draft, [k]: e.target.value })} />
                <span className="muted">{unit}</span>
                {edited && <button type="button" className="btn btn-primary te-btn" disabled={busy} onClick={() => save(k)}>Save</button>}
                {d.custom && !edited && <button type="button" className="btn btn-light te-btn" disabled={busy} onClick={() => reset(k)}>Reset</button>}
              </div>
              <div className="te-meta muted">
                {d.custom && <span>Recommended: {d.recommended} {unit}</span>}
                {eaten && <span>Consumed: {Math.round(eaten[k])} · Remaining: {remaining}</span>}
              </div>
            </div>
          );
        })}
      </div>
      {error && <p className="error-text"><strong>Cannot save this.</strong> {error}</p>}
      {warnings.length > 0 && <ul className="warn-list">{warnings.map((w) => <li key={w}>{w}</li>)}</ul>}
      <p className="muted">There are safe limits on these numbers to protect your health. Numbers outside them cannot be saved.</p>
    </div>
  );
}