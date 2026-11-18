import { useEffect, useRef, useState } from 'react';
import api, { errorMessage } from '../api/client';
import { GOALS, GOAL_DIRECTION, reconcileGoal } from '../utils/health';
import './BodyGoal.css';

const CATEGORY = { underweight: 'Below healthy range', healthy: 'Healthy range', overweight: 'Above healthy range', obese: 'Well above healthy range' };

const MARGIN = 3;

// Same rule as the server (which has the final say): the target may sit up to 3 kg outside the healthy range
function targetProblem(goal, weightKg, target, allowed) {
  const t = Number(target);
  if (target === '' || !Number.isFinite(t) || !allowed) return '';
  const dir = GOAL_DIRECTION[goal];
  const low = dir === 'gain' ? 30 : dir === 'hold' ? Math.min(allowed.minKg, weightKg - MARGIN) : allowed.minKg;
  const high = dir === 'lose' ? 250 : dir === 'hold' ? Math.max(allowed.maxKg, weightKg + MARGIN) : allowed.maxKg;
  if (t < low) return `Cannot set this. A target below ${low} kg is too low for your height and could harm your health.`;
  if (t > high) return `Cannot set this. A target above ${high} kg is too far from the healthy range for your height.`;
  if (dir === 'lose' && t > weightKg) return 'For weight loss, the target must be lower than your current weight.';
  if (dir === 'gain' && t < weightKg) return 'For weight gain, the target must be higher than your current weight.';
  if (dir === 'hold' && Math.abs(t - weightKg) > MARGIN) return 'Cannot set this. For this goal your target should stay within 3 kg of your current weight.';
  return '';
}

// Shown once "About you" is filled in. Works out the suggestion on the server, fills in a goal and a target
// weight for the customer (until they change them), and lets them pick their own within safe limits.
export function GoalAndTarget({ plan, f, set, ready, prefill = true, children }) {
  const [s, setS] = useState(null);
  const [goalNote, setGoalNote] = useState('');
  const touched = useRef(Boolean(f.targetWeightKg)); // an existing profile keeps its saved goal and target
  const h = Number(f.heightCm);
  const w = Number(f.weightKg);

  useEffect(() => {
    if (!ready || !(h >= 120 && h <= 230 && w >= 30 && w <= 250)) { setS(null); return undefined; }
    const timer = setTimeout(() => {
      api.post('/body/suggest', { plan, heightCm: h, weightKg: w })
        .then(({ data }) => {
          setS(data);
          if (prefill && !touched.current) set({ goal: data.suggestedGoal, targetWeightKg: String(data.targetWeightKg) });
        })
        .catch(() => setS(null));
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, h, w, ready]);

  if (!ready) return <div className="card"><p className="muted">Fill in "About you" above and we will suggest a goal and a target weight.</p></div>;

  const problem = targetProblem(f.goal, w, f.targetWeightKg, s?.allowedTargetRange);
  return (
    <>
      {s && (
        <div className="card stack bg-suggest">
          <strong>Our suggestion for you</strong>
          <div className="bg-grid">
            <div><b>{s.bmi}</b><span>BMI</span></div>
            <div><b>{s.healthyRange.minKg} to {s.healthyRange.maxKg} kg</b><span>healthy range</span></div>
            <div><b>{s.targetWeightKg} kg</b><span>suggested target</span></div>
          </div>
          <p>{s.message}</p>
          {s.weeks > 0 && <p className="muted">At a safe pace this takes about {s.weeks} weeks.</p>}
          <button type="button" className="btn btn-light" onClick={() => { touched.current = false; set({ goal: s.suggestedGoal, targetWeightKg: String(s.targetWeightKg) }); }}>
            Use this suggestion
          </button>
          <p className="muted">General guidance using Indian BMI limits. It is not medical advice.</p>
        </div>
      )}

      <div className="card stack">
        <h4>Your goal</h4>
        <label>Goal
          <select value={f.goal} onChange={(e) => { touched.current = true; set({ goal: e.target.value }); }} required>
            {GOALS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </label>
        <label>Target weight (kg)
          <input type="number" step="0.1" min="30" max="250" value={f.targetWeightKg} onChange={(e) => { touched.current = true; const r = reconcileGoal(f.goal, w, e.target.value); setGoalNote(r.note || ''); set(r.goal !== f.goal ? { targetWeightKg: e.target.value, goal: r.goal } : { targetWeightKg: e.target.value }); }} />
        </label>
        {goalNote && <p className="success-text">{goalNote}</p>}
        {s && <p className="muted">Healthy weight for your height is {s.healthyRange.minKg} to {s.healthyRange.maxKg} kg. You can set a target up to 3 kg below or above that ({s.allowedTargetRange.minKg} to {s.allowedTargetRange.maxKg} kg), but not further.</p>}
        {problem && <p className="error-text">{problem}</p>}
        {children}
      </div>
    </>
  );
}

// Current weight, target weight (with an Edit button) and the healthy range
export function BodySummary({ body, base, onChanged }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [notes, setNotes] = useState([]);
  const [busy, setBusy] = useState(false);
  if (!body) return null;

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      const { data } = await api.patch(`${base}/target-weight`, { targetWeightKg: value });
      setNotes(data.warnings || []);
      setEditing(false);
      onChanged(data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const change = body.changeKg;
  return (
    <div className="card stack">
      <strong>Your body goal</strong>
      <div className="bg-grid">
        <div><b>{body.currentWeightKg} kg</b><span>now</span></div>
        <div><b>{body.targetWeightKg} kg</b><span>target</span></div>
        <div><b>{change === 0 ? 'Stay' : `${change > 0 ? '+' : ''}${change} kg`}</b><span>{body.weeks ? `about ${body.weeks} weeks` : 'keep it steady'}</span></div>
      </div>
      <p className="muted">BMI {body.bmi} ({CATEGORY[body.category]}). Healthy weight for your height: {body.healthyRange.minKg} to {body.healthyRange.maxKg} kg. You can set a target from {body.allowedTargetRange.minKg} to {body.allowedTargetRange.maxKg} kg (3 kg either side of that range).</p>

      {editing ? (
        <div className="bg-edit">
          <input type="number" step="0.1" value={value} onChange={(e) => setValue(e.target.value)} disabled={busy} />
          <span className="muted">kg</span>
          <button type="button" className="btn btn-primary bg-btn" disabled={busy} onClick={save}>Save</button>
          <button type="button" className="btn btn-light bg-btn" disabled={busy} onClick={() => { setEditing(false); setError(''); }}>Cancel</button>
        </div>
      ) : (
        <button type="button" className="btn btn-light bg-btn" style={{ justifySelf: 'start' }} onClick={() => { setValue(String(body.targetWeightKg)); setEditing(true); setNotes([]); }}>
          Edit target weight
        </button>
      )}
      {error && <p className="error-text">{error}</p>}
      {notes.length > 0 && <ul className="warn-list">{notes.map((n) => <li key={n}>{n}</li>)}</ul>}
    </div>
  );
}
