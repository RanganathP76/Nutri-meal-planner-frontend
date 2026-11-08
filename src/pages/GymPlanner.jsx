import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api, { errorMessage } from '../api/client';
import { todayKey, addDays } from '../utils/date';
import MealCard from '../components/MealCard';
import NutritionSummary from '../components/NutritionSummary';
import './MealPlanner.css';

const ZERO = { calories: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0 };
const CONDITION_NAMES = { diabetes: 'diabetes', hypertension_bp: 'blood pressure', thyroid: 'thyroid', high_cholesterol: 'high cholesterol' };

export default function GymPlanner() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const today = todayKey();
  const maxDate = addDays(today, 5);
  const wanted = params.get('date');

  const [date, setDate] = useState(wanted && wanted >= today && wanted <= maxDate ? wanted : today);
  const [meta, setMeta] = useState(null);
  const [stepId, setStepId] = useState('');
  const [dietType, setDietType] = useState('vegetarian');
  const [cuisine, setCuisine] = useState('All');
  const [cuisines, setCuisines] = useState(['All']);
  const [picks, setPicks] = useState({});
  const [hadSaved, setHadSaved] = useState(false);
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const picksParam = Object.entries(picks).filter(([, m]) => m).map(([k, m]) => `${k}:${m._id}`).join(',');

  useEffect(() => {
    api.get('/gym/profile')
      .then(({ data }) => {
        if (!data.profile) return navigate('/gym/setup', { replace: true });
        setMeta(data);
        setStepId(data.steps[0].id);
        setDietType(data.profile.dietType);
        return undefined;
      })
      .catch((err) => setError(errorMessage(err)));
    api.get('/meals/categories').then(({ data }) => setCuisines(['All', ...data.cuisines])).catch(() => {});
  }, [navigate]);

  useEffect(() => {
    let cancelled = false;
    setPicks({});
    setHadSaved(false);
    api.get(`/gym/day/${date}`)
      .then(({ data }) => {
        if (cancelled || !data.plan) return;
        const loaded = {};
        data.plan.items.forEach((i) => { loaded[i.stepId] = { _id: i.mealId, name: i.mealName }; });
        setPicks(loaded);
        setHadSaved(true);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [date]);

  useEffect(() => {
    if (!stepId) return undefined;
    let cancelled = false;
    setLoading(true);
    setError('');
    api.get('/gym/recommendations', { params: { stepId, dietType, cuisine, date, picks: picksParam } })
      .then(({ data }) => { if (!cancelled) setInfo(data); })
      .catch((err) => { if (!cancelled) { setInfo(null); setError(errorMessage(err)); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [stepId, dietType, cuisine, date, picksParam]);

  const choose = (meal) => setPicks((p) => ({ ...p, [stepId]: p[stepId]?._id === meal._id ? null : meal }));

  const save = async () => {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const body = Object.fromEntries(Object.entries(picks).filter(([, m]) => m).map(([k, m]) => [k, m._id]));
      await api.put(`/gym/day/${date}`, { picks: body });
      setHadSaved(Object.keys(body).length > 0);
      setMessage(Object.keys(body).length ? `✓ Plan saved for ${date}` : `Plan cleared for ${date}`);
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (!meta) {
    return error
      ? <div className="card stack"><p className="error-text">{error}</p><Link to="/plans" className="btn btn-primary">See plans</Link></div>
      : <p className="center-note">Loading...</p>;
  }

  const step = meta.steps.find((x) => x.id === stepId);
  const meals = info?.meals || [];
  const anyPicked = Object.values(picks).some(Boolean);
  const conditions = (meta.profile.healthConditions || []).map((c) => CONDITION_NAMES[c]);

  return (
    <div className="stack">
      <div className="card">
        <label className="muted">Planning for</label>
        <input type="date" value={date} min={today} max={maxDate} onChange={(e) => e.target.value && setDate(e.target.value)} />
      </div>

      <NutritionSummary targets={info?.daily.targets || meta.targets} eaten={info?.daily.eaten || ZERO} />
      <div className="card water">💧 Drink about <strong>{meta.targets.waterLitres} litres</strong> of water today</div>

      <div className="chip-row scroll">
        {meta.steps.map((st) => (
          <button key={st.id} className={`chip ${stepId === st.id ? 'on' : ''}`} onClick={() => setStepId(st.id)}>
            {picks[st.id] ? '✓ ' : ''}{st.label}
          </button>
        ))}
      </div>

      {step?.hint && <p className="muted">{step.hint}</p>}
      {info && <p className="muted">Best for this meal: about {info.idealForStep.calories} kcal and {info.idealForStep.protein} g protein.</p>}

      <div className="filter-row">
        <div className="chip-row">
          {[['Veg', 'vegetarian'], ['Non-Veg', 'non-vegetarian']].map(([label, val]) => (
            <button key={val} className={`chip small ${dietType === val ? 'on-green' : ''}`} onClick={() => setDietType(val)}>{label}</button>
          ))}
        </div>
        <select value={cuisine} onChange={(e) => setCuisine(e.target.value)}>
          {cuisines.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      {error && <p className="error-text">{error}</p>}

      {loading && meals.length === 0 ? <p className="center-note">Finding the best meals for you...</p>
        : meals.length === 0 && !error ? <p className="center-note">No safe meals found for this choice yet.</p>
        : (
          <div className="stack" style={{ opacity: loading ? 0.6 : 1 }}>
            {meals.map((m) => <MealCard key={m._id} meal={m} selected={picks[stepId]?._id === m._id} onSelect={choose} />)}
          </div>
        )}

      <p className="muted">
        {conditions.length > 0 && `You told us about ${conditions.join(', ')}. We rank meals that suit this higher. `}
        These are general suggestions, not medical advice. Please check your diet with a doctor or dietitian. Allergy information may be incomplete, so check ingredients yourself.
      </p>

      {message && <p className="success-text center">{message}</p>}
      <button className="btn btn-success" onClick={save} disabled={saving || (!anyPicked && !hadSaved)}>
        {saving ? 'Saving...' : anyPicked ? `Save plan for ${date}` : "Clear this day's plan"}
      </button>
    </div>
  );
}