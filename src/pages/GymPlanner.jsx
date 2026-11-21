import DaySuggestions from '../components/DaySuggestions';
import { useEffect, useState } from 'react';
import { APP_SEED } from '../utils/seed';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api, { errorMessage } from '../api/client';
import { todayKey, addDays } from '../utils/date';
import CheckinCard from '../components/CheckinCard';
import MealPicker, { PickedSummary } from '../components/MealPicker';
import AddonPicker from '../components/AddonPicker';
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
  const [addons, setAddons] = useState([]); // single foods added after the meals: { mealId, name, target, targetLabel }
  const [hadSaved, setHadSaved] = useState(false);
  const [info, setInfo] = useState(null);
  const [bump, setBump] = useState(0); // goes up after a weight check-in so the meals are fetched again
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
    setAddons([]);
    setHadSaved(false);
    api.get(`/gym/day/${date}`)
      .then(({ data }) => {
        if (cancelled || !data.plan) return;
        const loaded = {};
        const extras = [];
        data.plan.items.forEach((i) => {
          if (i.addon) extras.push({ mealId: i.mealId, name: i.mealName, target: i.addedTo, targetLabel: i.label });
          else loaded[i.stepId] = { _id: i.mealId, name: i.mealName };
        });
        setPicks(loaded);
        setAddons(extras);
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
    api.get('/gym/recommendations', { params: { stepId, dietType, cuisine, date, picks: picksParam, seed: APP_SEED } })
      .then(({ data }) => { if (!cancelled) setInfo(data); })
      .catch((err) => { if (!cancelled) { setInfo(null); setError(errorMessage(err)); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [stepId, dietType, cuisine, date, picksParam, bump]);

  // Pick (or un-pick) a meal; after a pick, move on to the next step that is still empty
  const choose = (meal, addon) => {
    const removing = picks[stepId]?._id === meal._id;
    const next = { ...picks, [stepId]: removing ? null : meal };
    setPicks(next);
    if (removing) setAddons((a) => a.map((x) => (x.target === stepId ? { ...x, target: 'extra', targetLabel: 'Extra snack' } : x)));
    // "Select meal with this add-on": the add-on goes into this step
    if (!removing && addon?.meal) setAddons((a) => [...a.filter((x) => x.mealId !== addon.meal._id), { mealId: addon.meal._id, name: addon.meal.name, target: stepId, targetLabel: `Added to ${meta.steps.find((x) => x.id === stepId)?.label || 'this meal'}` }]);
    if (!removing) {
      const ids = meta.steps.map((x) => x.id);
      const i = ids.indexOf(stepId);
      const after = [...ids.slice(i + 1), ...ids.slice(0, i)].find((id) => !next[id]);
      if (after) { setStepId(after); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    }
  };

  const save = async () => {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const body = Object.fromEntries(Object.entries(picks).filter(([, m]) => m).map(([k, m]) => [k, m._id]));
      await api.put(`/gym/day/${date}`, { picks: body, addons: addons.map((a) => ({ mealId: a.mealId, target: a.target })) });
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

      <CheckinCard base="/gym" checkin={meta.checkin} weightKg={meta.profile.weightKg} onDone={(data) => { setMeta((m) => ({ ...m, ...data })); setBump((n) => n + 1); }} />

      <DaySuggestions onAddon={(a) => setAddons((list) => [...list.filter((x) => x.mealId !== a._id), { mealId: a._id, name: a.name, target: a.addon.bestTarget, targetLabel: a.addon.bestTarget === 'extra' ? 'Extra snack' : `Added to ${meta.steps.find((x) => x.id === a.addon.bestTarget)?.label || 'a meal'}` }])} addedIds={addons.map((x) => x.mealId)} url="/gym/full-day" params={{ dietType, cuisine, date, seed: APP_SEED }} appliedIds={Object.values(picks).filter(Boolean).map((m) => m._id)} reloadKey={bump} onApply={(items) => { setPicks(Object.fromEntries(items.map((i) => [i.stepId, i.meal]))); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />

      <PickedSummary items={meta.steps.map((x) => ({ key: x.id, label: x.label, name: picks[x.id]?.name })).concat(addons.map((a) => ({ key: `add-${a.mealId}`, label: `+ ${a.targetLabel}`, name: a.name })))} />

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
          <MealPicker canAddon notice={info?.lightOnlyMessage || ""} meals={meals} total={info?.total || 0} fetchMore={(extra) => api.get('/gym/recommendations', { params: { ...{ stepId, dietType, cuisine, date, picks: picksParam, seed: APP_SEED }, ...extra } }).then((r) => r.data)} loading={loading} selectedId={picks[stepId]?._id} onSelect={choose} resetKey={`${stepId}|${dietType}|${cuisine}|${date}`} />
        )}

      <AddonPicker plan="gym" date={date} dietType={dietType} picksParam={picksParam} addons={addons} setAddons={setAddons} />

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