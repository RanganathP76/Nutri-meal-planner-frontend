import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api, { errorMessage } from '../api/client';
import { todayKey, addDays } from '../utils/date';
import MealCard from '../components/MealCard';
import NutritionSummary from '../components/NutritionSummary';
import './MealPlanner.css';
import { Link } from 'react-router-dom';
import MealBrowse from '../components/MealBrowse';

const SLOTS = ['breakfast', 'lunch', 'dinner'];

const EMPTY = { breakfast: null, lunch: null, dinner: null };

export default function MealPlanner() {
  const [params] = useSearchParams();
  const today = todayKey();
  const maxDate = addDays(today, 5);
  const wantedDate = params.get('date');
  const [needsPlan, setNeedsPlan] = useState(false);

  const [date, setDate] = useState(wantedDate && wantedDate >= today && wantedDate <= maxDate ? wantedDate : today);
  const [slot, setSlot] = useState(SLOTS.includes(params.get('slot')) ? params.get('slot') : 'breakfast');
  const [dietType, setDietType] = useState('vegetarian');
  const [cuisine, setCuisine] = useState('All');
  const [selected, setSelected] = useState(EMPTY);
  const [info, setInfo] = useState(null); // server response: daily totals + ranked meals
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [hadSaved, setHadSaved] = useState(false);
  const [cuisines, setCuisines] = useState(['All']);

  const breakfastId = selected.breakfast?._id;
  const lunchId = selected.lunch?._id;
  const dinnerId = selected.dinner?._id;

  // Load the list of cuisines for the filter dropdown
    useEffect(() => {
    api.get('/meals/categories')
      .then(({ data }) => setCuisines(['All', ...data.cuisines]))
      .catch(() => setCuisines(['All', 'South Indian', 'North Indian', 'Other']));
  }, []);

  // Load the plan already saved for this date (if any)
    useEffect(() => {
    let cancelled = false;
    setSelected(EMPTY);
    setHadSaved(false);
    api.get(`/planner/day/${date}`)
      .then(({ data }) => {
        if (cancelled || !data.plan) return;
        const loaded = { ...EMPTY };
        data.plan.items.forEach((i) => { loaded[i.slot] = { _id: i.mealId, name: i.mealName }; });
        setSelected(loaded);
        setHadSaved(true);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [date]);

  // Ask the server for ranked suggestions. It does all nutrition math.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    const query = { mealType: slot, dietType, cuisine, date };
    if (breakfastId) query.breakfastId = breakfastId;
    if (lunchId) query.lunchId = lunchId;
    if (dinnerId) query.dinnerId = dinnerId;

    api.get('/meals/recommendations', { params: query })
            .then(({ data }) => { if (!cancelled) { setInfo(data); setNeedsPlan(false); } })
      .catch((err) => {
        if (cancelled) return;
        setInfo(null);
        if (err.response?.data?.code === 'SUBSCRIPTION_REQUIRED') setNeedsPlan(true);
        else setError(errorMessage(err));
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [slot, dietType, cuisine, date, breakfastId, lunchId, dinnerId]);

  const choose = (meal) =>
    setSelected((s) => ({ ...s, [slot]: s[slot]?._id === meal._id ? null : meal }));

    const save = async () => {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await api.put(`/planner/day/${date}`, {
        breakfastMealId: breakfastId,
        lunchMealId: lunchId,
        dinnerMealId: dinnerId
      });
      const keeping = Object.values(selected).some(Boolean);
      setHadSaved(keeping);
      setMessage(keeping ? `✓ Plan saved for ${date}` : `Plan cleared for ${date}`);
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const meals = info?.meals || [];
  const anySelected = Object.values(selected).some(Boolean);

  return (
    <div className="stack">
      <div className="card">
        <label className="muted">Planning for</label>
        <input type="date" value={date} min={today} max={maxDate}
          onChange={(e) => e.target.value && setDate(e.target.value)} />
      </div>

      <NutritionSummary targets={info?.daily.targets} eaten={info?.daily.eaten} />

      <div className="chip-row">
        {SLOTS.map((s) => (
          <button key={s} className={`chip ${slot === s ? 'on' : ''}`} onClick={() => setSlot(s)}>
            {selected[s] ? '✓ ' : ''}{s}
          </button>
        ))}
      </div>

      {info && (
        <p className="muted">
          Best for your {slot}: about {info.idealForSlot.calories} kcal and {info.idealForSlot.protein} g protein.
        </p>
      )}

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

      {needsPlan && (
        <>
          <div className="card stack">
            <strong>🔒 Get recommendations with a plan</strong>
            <p className="muted">You can look at all our meals below. A plan unlocks nutrition details, personal recommendations and saving your daily plan.</p>
            <Link to="/plans" className="btn btn-primary">See plans</Link>
          </div>
          <MealBrowse key={`${slot}-${dietType}-${cuisine}`} slot={slot} dietType={dietType} cuisine={cuisine} />
        </>
      )}

      {error && <p className="error-text">{error}</p>}

      {loading && meals.length === 0 ? (
        <p className="center-note">Finding the best meals for you...</p>
      ) : meals.length === 0 && !error ? (
        <p className="center-note">No meals found for this choice yet.</p>
      ) : (
        <div className="stack" style={{ opacity: loading ? 0.6 : 1 }}>
          {meals.map((meal) => (
            <MealCard key={meal._id} meal={meal} selected={selected[slot]?._id === meal._id} onSelect={choose} />
          ))}
        </div>
      )}

      {message && <p className="success-text center">{message}</p>}
            {!needsPlan && (
              <button className="btn btn-success" onClick={save} disabled={saving || (!anySelected && !hadSaved)}>
                {saving ? 'Saving...' : anySelected ? `Save plan for ${date}` : "Clear this day's plan"}
              </button>
            )}
    </div>
  );
}