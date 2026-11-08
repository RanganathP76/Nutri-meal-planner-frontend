import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../api/client';
import './GymOnboarding.css';

const ALLERGIES = ['dairy', 'gluten', 'nuts', 'egg', 'fish', 'soy', 'sesame', 'shellfish'];
const CONDITIONS = [['diabetes', 'Diabetes'], ['hypertension_bp', 'Blood pressure'], ['thyroid', 'Thyroid'], ['high_cholesterol', 'High cholesterol']];
const BLANK = {
  gender: '', age: '', heightCm: '', weightKg: '', bodyFatPercent: '', activityLevel: 'moderate', goal: 'maintain',
  workoutSchedule: 'morning', morningTime: '06:30', eveningTime: '18:00', intensity: 'moderate', dietType: 'vegetarian',
  healthConditions: [], allergies: [], otherAllergies: '', avoidFoods: '', acceptedNotice: false
};
const split = (t) => t.split(',').map((x) => x.trim()).filter(Boolean);
const s = (v) => (v == null ? '' : String(v));

const fromProfile = (p) => ({
  ...BLANK, gender: p.gender, age: s(p.age), heightCm: s(p.heightCm), weightKg: s(p.weightKg), bodyFatPercent: s(p.bodyFatPercent),
  activityLevel: p.activityLevel, goal: p.goal, workoutSchedule: p.workoutSchedule,
  morningTime: p.morningTime || BLANK.morningTime, eveningTime: p.eveningTime || BLANK.eveningTime,
  intensity: p.intensity, dietType: p.dietType, healthConditions: p.healthConditions || [],
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

export default function GymOnboarding() {
  const [f, setF] = useState(BLANK);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (patch) => setF((o) => ({ ...o, ...patch }));

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
      const { data } = await api.put('/gym/profile', {
        ...f, allergies: [...f.allergies, ...split(f.otherAllergies)], avoidFoods: split(f.avoidFoods)
      });
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
        <div className="card stack targets">
          <strong>Your daily targets</strong>
          <div className="t-grid">
            <div><b>{t.calories}</b><span>kcal</span></div>
            <div><b>{t.protein} g</b><span>protein</span></div>
            <div><b>{t.carbohydrates} g</b><span>carbs</span></div>
            <div><b>{t.fat} g</b><span>fat</span></div>
            <div><b>{t.fiber} g</b><span>fibre</span></div>
            <div><b>{t.waterLitres} L</b><span>water</span></div>
          </div>
          <p className="muted">Worked out from your details using {t.method}. Your body uses about {t.bmr} kcal at rest, and about {t.maintenanceCalories} kcal a day to stay the same weight. General reference limits: sodium under {t.reference.sodiumMaxMg} mg, calcium {t.reference.calciumMg} mg, iron {t.reference.ironMg} mg, potassium {t.reference.potassiumMg} mg.</p>
          <Link to="/planner" className="btn btn-primary">Start planning my meals</Link>
        </div>
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

        <div className="card stack">
          <h4>Your goal and workouts</h4>
          <label>Goal{sel('goal', [['fat_loss', 'Fat loss / weight loss'], ['muscle_gain', 'Muscle building / weight gain'], ['maintain', 'Maintain weight / stay fit']])}</label>
          <label>When do you work out?{sel('workoutSchedule', [['morning', 'Morning'], ['evening', 'Evening'], ['both', 'Morning and evening']])}</label>
          {f.workoutSchedule !== 'evening' && <label>Morning workout time<input type="time" value={f.morningTime} onChange={(e) => set({ morningTime: e.target.value })} /></label>}
          {f.workoutSchedule !== 'morning' && <label>Evening workout time<input type="time" value={f.eveningTime} onChange={(e) => set({ eveningTime: e.target.value })} /></label>}
          <label>Workout intensity{sel('intensity', [['low', 'Light'], ['moderate', 'Moderate'], ['high', 'Hard']])}</label>
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