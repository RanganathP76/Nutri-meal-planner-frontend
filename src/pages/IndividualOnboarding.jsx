import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../api/client';
import TargetsEditor from '../components/TargetsEditor';
import MicroTargets from '../components/MicroTargets';
import CheckinCard from '../components/CheckinCard';
import SafetyQuestions from '../components/SafetyQuestions';
import { GoalAndTarget, BodySummary } from '../components/BodyGoal';
import { DISEASES, toggleCondition } from '../utils/health';
import './GymOnboarding.css';

const BLANK = {
  gender: '', age: '', dateOfBirth: '', pregnancyBreastfeeding: '', allergies: [], otherAllergies: '', heightCm: '', weightKg: '', targetWeightKg: '', activityLevel: 'light', goal: 'maintain', dietType: 'vegetarian',
  healthConditions: [], acceptedNotice: false
};
const s = (v) => (v == null ? '' : String(v));

const fromProfile = (p) => ({
  ...BLANK, gender: p.gender, age: s(p.age), dateOfBirth: p.dateOfBirth || '', pregnancyBreastfeeding: p.pregnancyBreastfeeding === 'no' ? 'no' : '', allergies: p.allergies || [], otherAllergies: p.otherAllergies || '', heightCm: s(p.heightCm), weightKg: s(p.weightKg), targetWeightKg: s(p.targetWeightKg),
  activityLevel: p.activityLevel, goal: p.goal, dietType: p.dietType, healthConditions: p.healthConditions || [],
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

export default function IndividualOnboarding() {
  const [f, setF] = useState(BLANK);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (patch) => setF((o) => ({ ...o, ...patch }));
  const aboutDone = Boolean(f.gender && f.dateOfBirth && f.heightCm && f.weightKg && f.activityLevel);

  useEffect(() => {
    api.get('/individual/profile')
      .then(({ data }) => { if (data.profile) { setF(fromProfile(data.profile)); setResult(data); } })
      .catch((err) => setError(err.response?.data?.code === 'INDIVIDUAL_PLAN_REQUIRED' ? 'The Individual plan is needed for this page.' : errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const { data } = await api.put('/individual/profile', f);
      setResult(data);
      if (data.customCleared) setMessage('Your details changed, so your targets were recalculated.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p className="center-note">Loading...</p>;
  if (!result && error && !f.age) return <div className="card stack"><p className="error-text">{error}</p><Link to="/plans" className="btn btn-primary">See plans</Link></div>;

  const sel = (key, opts) => (
    <select value={f[key]} onChange={(e) => set({ [key]: e.target.value })} required>
      <option value="">Choose...</option>
      {opts.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
    </select>
  );

  return (
    <div className="stack gym-form">
      <h3 className="page-title">Your profile</h3>

      {result && (
        <>
          {message && <p className="success-text">{message}</p>}
          {result.goalNote && <p className="card success-text">{result.goalNote}</p>}
          <CheckinCard always base="/individual" checkin={result.checkin} weightKg={result.profile.weightKg} onDone={(data) => { setResult((r) => ({ ...r, ...data })); setF((o) => ({ ...o, weightKg: String(data.profile.weightKg), goal: data.profile.goal })); }} />
          <BodySummary body={result.body} base="/individual" onChanged={(data) => setResult((r) => ({ ...r, ...data }))} />
          <TargetsEditor details={result.details} base="/individual" onChanged={(data) => setResult((r) => ({ ...r, ...data }))} />
          <MicroTargets micro={result.micro} />
          <p className="muted">Worked out using {result.method}. Your body uses about {result.bmr} kcal at rest and about {result.maintenanceCalories} kcal a day to stay the same weight.</p>
          <Link to="/planner" className="btn btn-primary">Start planning my meals</Link>
        </>
      )}

      <form className="stack" onSubmit={submit}>
        <div className="card stack">
          <h4>About you</h4>
          <label>Gender{sel('gender', [['male', 'Male'], ['female', 'Female'], ['other', 'Other']])}</label>
          <SafetyQuestions f={f} set={set} legacyAge={result?.profile && !result.profile.ageFromDob ? result.profile.age : null} />
          <label>Height (cm)<input type="number" min="120" max="230" required value={f.heightCm} onChange={(e) => set({ heightCm: e.target.value })} /></label>
          <label>Weight (kg)<input type="number" step="0.1" min="30" max="250" required value={f.weightKg} onChange={(e) => set({ weightKg: e.target.value })} /></label>
          <label>How active are you in a normal day?
            {sel('activityLevel', [['sedentary', 'Mostly sitting'], ['light', 'Light (some walking)'], ['moderate', 'Moderate (on your feet, some exercise)'], ['intense', 'Very active (physical job or daily hard exercise)']])}
          </label>
        </div>

        <GoalAndTarget plan="individual" f={f} set={set} ready={aboutDone} prefill={!result} />

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
            <span>I have read and agree to the <Link to="/terms" target="_blank">Terms</Link>, <Link to="/privacy" target="_blank">Privacy Policy</Link> and <Link to="/disclaimer" target="_blank">Health Disclaimer</Link>. I understand all numbers are estimates, not medical advice.</span>
          </label>
        </div>

        {error && <p className="error-text">{error}</p>}
        <button className="btn btn-success" disabled={busy}>{busy ? 'Saving...' : result ? 'Update my profile' : 'Calculate my targets'}</button>
      </form>
    </div>
  );
}