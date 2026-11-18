import { useState } from 'react';
import api, { errorMessage } from '../api/client';

// Asks the customer for their weight again every 30 days (a reminder from day 15), so the plan stays right.
//  base      '/gym' or '/individual'
//  checkin   { state: ok | soon | due | overdue, daysSince, nextDueInDays } from the profile response
//  weightKg  the weight we have now
//  onDone    called with the new profile response after saving
export default function CheckinCard({ base, checkin, weightKg, onDone, always = false }) {
  const [open, setOpen] = useState(false);
  const [w, setW] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  if (!checkin) return null;
  if (!result && checkin.state === 'ok' && !always) return null;

  const title = checkin.state === 'overdue' ? 'Your weight check-in is overdue'
    : checkin.state === 'due' ? 'Time to update your weight'
    : checkin.state === 'soon' ? 'You can update your weight now'
    : 'Weight check-in';
  const text = checkin.state === 'ok'
    ? `Your next check-in is in ${checkin.nextDueInDays} days.`
    : `Your plan is made for ${weightKg} kg, which you told us ${checkin.daysSince} days ago. Please weigh yourself (morning, before food) and enter it so your targets and portions match your body now.`;

  const save = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const { data } = await api.post(`${base}/checkin`, { weightKg: w });
      setResult(data.progress);
      setOpen(false); setW('');
      onDone?.(data);
    } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  };

  return (
    <div className={`card stack ${checkin.state === 'overdue' ? 'warn' : ''}`}>
      <strong>{title}</strong>
      {result ? <p className={result.onTrack ? 'success-text' : 'muted'}>{result.note}</p> : <p className="muted">{text}</p>}
      {!open && <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>Update my weight</button>}
      {open && (
        <form className="stack" onSubmit={save}>
          <label>Weight today (kg)<input type="number" step="0.1" min="30" max="250" required value={w} onChange={(e) => setW(e.target.value)} /></label>
          {error && <p className="error-text">{error}</p>}
          <div className="picker-bar">
            <button type="button" className="btn btn-light" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn btn-success" disabled={busy}>{busy ? 'Saving...' : 'Save weight'}</button>
          </div>
        </form>
      )}
    </div>
  );
}
