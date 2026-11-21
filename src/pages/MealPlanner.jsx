import DaySuggestions from '../components/DaySuggestions';
import { useEffect, useState } from 'react';
import { APP_SEED } from '../utils/seed';
import { useSearchParams } from 'react-router-dom';
import api, { errorMessage } from '../api/client';
import { todayKey, addDays } from '../utils/date';
import MealPicker, { PickedSummary } from '../components/MealPicker';
import NutritionSummary from '../components/NutritionSummary';
import './MealPlanner.css';
import { Link } from 'react-router-dom';
import MealBrowse from '../components/MealBrowse';
import BasicAllergies from '../components/BasicAllergies';

const SLOTS = ['breakfast', 'lunch', 'dinner'];

const EMPTY = { breakfast: null, lunch: null, dinner: null };
// One add-on (a small food or a combination) can go with each meal: { meal: {...}, reason? }

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
  const [addons, setAddons] = useState(EMPTY);
  const [allergyKey, setAllergyKey] = useState(0); // changes when the allergy choices are saved
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
  // add-ons count with their meal, so the other slots are planned around both
  const addonParams = Object.fromEntries(SLOTS.filter((k) => selected[k] && addons[k]?.meal?._id).map((k) => [`${k}AddonId`, addons[k].meal._id]));
  const addonKey = JSON.stringify(addonParams);

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
    setAddons(EMPTY);
    setHadSaved(false);
    api.get(`/planner/day/${date}`)
      .then(({ data }) => {
        if (cancelled || !data.plan) return;
        const loaded = { ...EMPTY };
        const extras = { ...EMPTY };
        const photo = (id) => data.images?.[id] || null;
        // Saved add-ons are items marked addon, with the meal they were added to
        data.plan.items.forEach((i) => {
          if (i.addon) extras[i.addedTo || i.slot] = { meal: { _id: i.mealId, name: i.mealName, imageUrl: photo(i.mealId), nutritionPerServing: i.nutrition } };
          else loaded[i.slot] = { _id: i.mealId, name: i.mealName, imageUrl: photo(i.mealId) };
        });
        SLOTS.forEach((k) => { if (!loaded[k]) extras[k] = null; });
        setSelected(loaded);
        setAddons(extras);
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
    const query = { mealType: slot, dietType, cuisine, date, seed: APP_SEED };
    if (breakfastId) query.breakfastId = breakfastId;
    if (lunchId) query.lunchId = lunchId;
    if (dinnerId) query.dinnerId = dinnerId;
    Object.assign(query, addonParams);

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
  }, [slot, dietType, cuisine, date, breakfastId, lunchId, dinnerId, allergyKey, addonKey]);

  // Pick (or un-pick) a meal, with the add-on shown on its card (or none). After a pick, move on to the next empty slot.
  const choose = (meal, addon = null) => {
    const removing = selected[slot]?._id === meal._id;
    const next = { ...selected, [slot]: removing ? null : meal };
    setSelected(next);
    setAddons({ ...addons, [slot]: removing ? null : addon?.meal ? addon : null });
    if (!removing) {
      const after = [...SLOTS.slice(SLOTS.indexOf(slot) + 1), ...SLOTS.slice(0, SLOTS.indexOf(slot))].find((s) => !next[s]);
      if (after) { setSlot(after); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    }
  };

  // The add-on of the meal already picked for this slot: take it away (null) or change it
  const changeAddon = (a) => setAddons({ ...addons, [slot]: a?.meal ? a : null });

  // "Add this to my day" from a ready-made day: it goes with the best meal of that day that has no add-on yet
  const addDayAddon = (food) => {
    const best = food.addon?.bestTarget;
    const target = SLOTS.includes(best) && selected[best] ? best : SLOTS.find((k) => selected[k] && !addons[k]);
    if (!target) { setError('Pick a meal first, then add the extra food to it.'); return; }
    setError('');
    setAddons({ ...addons, [target]: { meal: food, reason: food.addon?.reason } });
  };

    const save = async () => {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await api.put(`/planner/day/${date}`, {
        breakfastMealId: breakfastId,
        lunchMealId: lunchId,
        dinnerMealId: dinnerId,
        addons: SLOTS.filter((k) => selected[k] && addons[k]?.meal).map((k) => ({ mealId: addons[k].meal._id, target: k }))
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

      <BasicAllergies onChange={() => setAllergyKey((k) => k + 1)} />

      <DaySuggestions url="/meals/full-day" params={{ dietType, cuisine, date, seed: APP_SEED }} appliedIds={Object.values(selected).filter(Boolean).map((m) => m._id)} reloadKey={allergyKey} onAddon={addDayAddon} addedIds={SLOTS.map((k) => addons[k]?.meal?._id).filter(Boolean)} onApply={(items) => { setSelected({ ...EMPTY, ...Object.fromEntries(items.map((i) => [i.stepId, i.meal])) }); setAddons(EMPTY); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />

      <PickedSummary items={SLOTS.map((k) => ({ key: k, label: k[0].toUpperCase() + k.slice(1), name: selected[k]?.name, addonName: selected[k] ? addons[k]?.meal?.name : null }))} />

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
        <MealPicker ageTable notice={info?.lightOnlyMessage || ''} addonOptions={{ slot, dietType }} addonFor={(m) => (selected[slot]?._id === m._id ? addons[slot] : null)} onAddonChange={changeAddon} meals={meals} total={info?.total || 0} fetchMore={(extra) => api.get('/meals/recommendations', { params: { mealType: slot, dietType, cuisine, date, seed: APP_SEED, ...(breakfastId ? { breakfastId } : {}), ...(lunchId ? { lunchId } : {}), ...(dinnerId ? { dinnerId } : {}), ...addonParams, ...extra } }).then((r) => r.data)} loading={loading} selectedId={selected[slot]?._id} onSelect={choose} resetKey={`${slot}|${dietType}|${cuisine}|${date}|${allergyKey}`} />
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