import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../api/client';
import { GoalAndTarget, BodySummary } from '../components/BodyGoal';
import TargetsEditor from '../components/TargetsEditor';
import MicroTargets from '../components/MicroTargets';
import { DISEASES, toggleCondition } from '../utils/health';
import './GymOnboarding.css';

const BLANK = {
  gender: '', age: '', heightCm: '', weightKg: '', targetWeightKg: '', bodyFatPercent: '', activityLevel: 'moderate', goal: 'maintain',
  workoutSchedule: 'morning', morningTime: '06:30', eveningTime: '18:00', intensity: 'moderate', dietType: 'vegetarian',
  healthConditions: [], acceptedNotice: false
};
const s = (v) => (v == null ? '' : String(v));

const fromProfile = (p) => ({
  ...BLANK, gender: p.gender, age: s(p.age), heightCm: s(p.heightCm), weightKg: s(p.weightKg), targetWeightKg: s(p.targetWeightKg), bodyFatPercent: s(p.bodyFatPercent),
  activityLevel: p.activityLevel, goal: p.goal, workoutSchedule: p.workoutSchedule,
  morningTime: p.morningTime || BLANK.morningTime, eveningTime: p.eveningTime || BLANK.eveningTime,
  intensity: p.intensity, dietType: p.dietType, healthConditions: p.healthConditions || [],
  acceptedNotice: false
});

function Toggles({ options, value, onChange }) {
  const flip = (k) => onChange(toggleCondition(value, k));
  return (
    <div className="toggles">
      {options.map(([k, label]) => (
        <label key={k} className="tick"><input type="checkbox" checked={value.includes(k)} onChange={() => flip(k)} /> {label}</label>
      ))}
    </div>
  );
}

export default function GymOnboarding() {
  const [f, setF] = useState(BLANK);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (patch) => setF((o) => ({ ...o, ...patch }));
  const aboutDone = Boolean(f.gender && f.age && f.heightCm && f.weightKg && f.activityLevel);

  useEffect(() => {
    api.get('/gym/profile')
      .then(({ data }) => { if (data.profile) { setF(fromProfile(data.profile)); setResult(data); } })
      .catch((err) => setError(err.response?.data?.code === 'GYM_PLAN_REQUIRED' ? 'The Gym plan is needed for this page.' : errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { data } = await api.put('/gym/profile', f);
      setResult(data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p className="center-note">Loading...</p>;
  const t = result?.targets;
  const sel = (key, opts) => (
    <select value={f[key]} onChange={(e) => set({ [key]: e.target.value })} required>
      <option value="">Choose...</option>
      {opts.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
    </select>
  );

  return (
    <div className="stack gym-form">
      <h3 className="page-title">Your gym profile</h3>

      {t && (
        <>
          <BodySummary body={result.body} base="/gym" onChanged={(data) => setResult((r) => ({ ...r, ...data }))} />
          <TargetsEditor details={result.details} base="/gym" onChanged={(data) => setResult((r) => ({ ...r, ...data }))} />
          <MicroTargets micro={result.micro} />
          <div className="card stack targets">
            <div className="t-grid"><div><b>{t.waterLitres} L</b><span>water a day</span></div></div>
            <p className="muted">Worked out from your details using {t.method}. Your body uses about {t.bmr} kcal at rest, and about {t.maintenanceCalories} kcal a day to stay the same weight. Your vitamin and mineral needs (ICMR-NIN 2020) are in the table below.</p>
            <Link to="/planner" className="btn btn-primary">Start planning my meals</Link>
          </div>
        </>
      )}

      <form className="stack" onSubmit={submit}>
        <div className="card stack">
          <h4>About you</h4>
          <label>Gender{sel('gender', [['male', 'Male'], ['female', 'Female'], ['other', 'Other']])}</label>
          <label>Age (18 to 75)<input type="number" min="18" max="75" required value={f.age} onChange={(e) => set({ age: e.target.value })} /></label>
          <label>Height (cm)<input type="number" min="120" max="230" required value={f.heightCm} onChange={(e) => set({ heightCm: e.target.value })} /></label>
          <label>Weight (kg)<input type="number" step="0.1" min="30" max="250" required value={f.weightKg} onChange={(e) => set({ weightKg: e.target.value })} /></label>
          <label>Body fat % (optional, if you know it)<input type="number" step="0.1" min="3" max="60" value={f.bodyFatPercent} onChange={(e) => set({ bodyFatPercent: e.target.value })} /></label>
          <label>Daily activity outside the gym
            {sel('activityLevel', [['sedentary', 'Mostly sitting'], ['light', 'Light (some walking)'], ['moderate', 'Moderate (on your feet)'], ['intense', 'Very active (physical job)']])}
          </label>
        </div>

        <GoalAndTarget plan="gym" f={f} set={set} ready={aboutDone} prefill={!result} />

        <div className="card stack">
          <h4>Your workouts</h4>
          <label>When do you work out?{sel('workoutSchedule', [['morning', 'Morning'], ['evening', 'Evening'], ['both', 'Morning and evening']])}</label>
          {f.workoutSchedule !== 'evening' && <label>Morning workout time<input type="time" value={f.morningTime} onChange={(e) => set({ morningTime: e.target.value })} /></label>}
          {f.workoutSchedule !== 'morning' && <label>Evening workout time<input type="time" value={f.eveningTime} onChange={(e) => set({ eveningTime: e.target.value })} /></label>}
          <label>Workout intensity{sel('intensity', [['low', 'Light'], ['moderate', 'Moderate'], ['high', 'Hard']])}</label>
        </div>

        <div className="card stack">
          <h4>Food and health</h4>
          <label>Food preference{sel('dietType', [['vegetarian', 'Vegetarian'], ['non-vegetarian', 'Non-vegetarian']])}</label>
          <span className="lbl">Health conditions (optional)</span>
          <p className="muted">Choose only one for blood pressure (high or low) and one for thyroid (under or over active).</p>
          <Toggles options={DISEASES} value={f.healthConditions} onChange={(healthConditions) => set({ healthConditions })} />
          <p className="muted">We hide meals that are marked as not suitable for your conditions, rank the most supportive ones first, and tell you when a meal has not been rated for your condition.</p>
        </div>

        <div className="card stack">
          <label className="tick notice">
            <input type="checkbox" checked={f.acceptedNotice} onChange={(e) => set({ acceptedNotice: e.target.checked })} />
            I understand these are general nutrition suggestions, not medical advice. I will check my diet with a doctor or dietitian if I have a health condition.
          </label>
          <p className="muted">Meal ratings for health conditions are entered by our team. If a meal says it is not defined for your condition, check it once before you eat it.</p>
        </div>

        {error && <p className="error-text">{error}</p>}
        <button className="btn btn-success" disabled={busy}>{busy ? 'Saving...' : result ? 'Update my profile' : 'Calculate my targets'}</button>
      </form>
    </div>
  );
}