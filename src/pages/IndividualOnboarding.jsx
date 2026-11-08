import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../api/client';
import TargetsEditor from '../components/TargetsEditor';
import './GymOnboarding.css';

const ALLERGIES = ['dairy', 'gluten', 'nuts', 'egg', 'fish', 'soy', 'sesame', 'shellfish'];
const CONDITIONS = [['diabetes', 'Diabetes'], ['hypertension_bp', 'Blood pressure'], ['thyroid', 'Thyroid'], ['high_cholesterol', 'High cholesterol']];
const BLANK = {
  gender: '', age: '', heightCm: '', weightKg: '', activityLevel: 'light', goal: 'stay_fit', dietType: 'vegetarian',
  healthConditions: [], allergies: [], otherAllergies: '', avoidFoods: '', acceptedNotice: false
};
const split = (t) => t.split(',').map((x) => x.trim()).filter(Boolean);
const s = (v) => (v == null ? '' : String(v));

const fromProfile = (p) => ({
  ...BLANK, gender: p.gender, age: s(p.age), heightCm: s(p.heightCm), weightKg: s(p.weightKg),
  activityLevel: p.activityLevel, goal: p.goal, dietType: p.dietType, healthConditions: p.healthConditions || [],
  allergies: (p.allergies || []).filter((a) => ALLERGIES.includes(a)),
  otherAllergies: (p.allergies || []).filter((a) => !ALLERGIES.includes(a)).join(', '),
  avoidFoods: (p.avoidFoods || []).join(', '), acceptedNotice: false
});

function Toggles({ options, value, onChange }) {
  const flip = (k) => onChange(value.includes(k) ? value.filter((x) => x !== k) : [...value, k]);
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
      const { data } = await api.put('/individual/profile', {
        ...f, allergies: [...f.allergies, ...split(f.otherAllergies)], avoidFoods: split(f.avoidFoods)
      });
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
          <TargetsEditor details={result.details} onChanged={(data) => setResult((r) => ({ ...r, ...data }))} />
          <p className="muted">Worked out using {result.method}. Your body uses about {result.bmr} kcal at rest and about {result.maintenanceCalories} kcal a day to stay the same weight.</p>
          <Link to="/planner" className="btn btn-primary">Start planning my meals</Link>
        </>
      )}

      <form className="stack" onSubmit={submit}>
        <div className="card stack">
          <h4>About you</h4>
          <label>Gender{sel('gender', [['male', 'Male'], ['female', 'Female'], ['other', 'Other']])}</label>
          <label>Age (18 to 75)<input type="number" min="18" max="75" required value={f.age} onChange={(e) => set({ age: e.target.value })} /></label>
          <label>Height (cm)<input type="number" min="120" max="230" required value={f.heightCm} onChange={(e) => set({ heightCm: e.target.value })} /></label>
          <label>Weight (kg)<input type="number" step="0.1" min="30" max="250" required value={f.weightKg} onChange={(e) => set({ weightKg: e.target.value })} /></label>
          <label>How active are you in a normal day?
            {sel('activityLevel', [['sedentary', 'Mostly sitting'], ['light', 'Light (some walking)'], ['moderate', 'Moderate (on your feet, some exercise)'], ['intense', 'Very active (physical job or daily hard exercise)']])}
          </label>
        </div>

        <div className="card stack">
          <h4>Your goal</h4>
          <label>Goal{sel('goal', [['weight_loss', 'Lose weight'], ['weight_gain', 'Gain weight'], ['maintain', 'Maintain my weight'], ['stay_fit', 'Stay fit and healthy']])}</label>
        </div>

        <div className="card stack">
          <h4>Food and health</h4>
          <label>Food preference{sel('dietType', [['vegetarian', 'Vegetarian'], ['non-vegetarian', 'Non-vegetarian']])}</label>
          <span className="lbl">Allergies (we hide these meals)</span>
          <Toggles options={ALLERGIES.map((a) => [a, a])} value={f.allergies} onChange={(allergies) => set({ allergies })} />
          <label>Other allergies (comma separated)<input value={f.otherAllergies} onChange={(e) => set({ otherAllergies: e.target.value })} placeholder="e.g. mustard" /></label>
          <label>Foods you want to avoid (comma separated)<input value={f.avoidFoods} onChange={(e) => set({ avoidFoods: e.target.value })} placeholder="e.g. mushroom, brinjal" /></label>
          <span className="lbl">Health conditions (optional)</span>
          <Toggles options={CONDITIONS} value={f.healthConditions} onChange={(healthConditions) => set({ healthConditions })} />
        </div>

        <div className="card stack">
          <label className="tick notice">
            <input type="checkbox" checked={f.acceptedNotice} onChange={(e) => set({ acceptedNotice: e.target.checked })} />
            I understand these are general nutrition suggestions, not medical advice. I will check my diet with a doctor or dietitian if I have a health condition.
          </label>
          <p className="muted">Allergy information on meals is entered by our team and can be incomplete. Always check ingredients yourself.</p>
        </div>

        {error && <p className="error-text">{error}</p>}
        <button className="btn btn-success" disabled={busy}>{busy ? 'Saving...' : result ? 'Update my profile' : 'Calculate my targets'}</button>
      </form>
    </div>
  );
}