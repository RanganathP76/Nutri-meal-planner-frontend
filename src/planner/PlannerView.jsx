import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Plus, ShieldAlert, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import api, { errorMessage } from '../api/client';
import { APP_SEED } from '../utils/seed';
import { addDays, todayKey } from '../utils/date';
import { Button, ChoiceChips, Card, IconButton, Photo, Ring, Segmented, Skeleton, useFeedback } from '../ui/Kit';
import CheckinCard from '../components/CheckinCard';
import MealBrowse from '../components/MealBrowse';
import TargetsEditor from '../components/TargetsEditor';
import { BASIC_STEPS, makeAdapter, stepIcon, targetLabel } from './adapters';
import DateRibbon from './DateRibbon';
import MealStage from './MealStage';
import MealSheet from './MealSheet';
import { AllergySheet, BalanceSheet, CompleteDaySheet, FullDaySheet } from './Sheets';
import './planner.css';

const ZERO = { calories: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0 };
const CONDITION_NAMES = { diabetes: 'diabetes', hypertension_bp: 'blood pressure', thyroid: 'thyroid', high_cholesterol: 'high cholesterol' };
const title = (s) => s.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

// The Day Canvas. Plates (meals of the day) on top, a stage of ranked meals in the middle, the day's balance in a dock.
// The server does all nutrition maths; this screen only sends ids.
export default function PlannerView({ kind }) {
  const adapter = useMemo(() => makeAdapter(kind), [kind]);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { notify, confirm } = useFeedback();
  const today = todayKey();
  const wantedDate = params.get('date');

  const [date, setDate] = useState(wantedDate && wantedDate >= today && wantedDate <= addDays(today, 5) ? wantedDate : today);
  const [meta, setMeta] = useState(kind === 'basic' ? { steps: BASIC_STEPS } : null);
  const [stepId, setStepId] = useState('');
  const [dietType, setDietType] = useState('vegetarian');
  const [cuisine, setCuisine] = useState('All');
  const [cuisines, setCuisines] = useState(['All']);
  const [picks, setPicks] = useState({});
  const [addons, setAddons] = useState([]);
  const [savedKey, setSavedKey] = useState(null);
  const [hadSaved, setHadSaved] = useState(false);
  const [savedDates, setSavedDates] = useState(() => new Set());
  const [info, setInfo] = useState(null);
  const [bump, setBump] = useState(0); // goes up when targets or allergies change so meals are fetched again
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needsPlan, setNeedsPlan] = useState(false);
  const [saving, setSaving] = useState(false);
  const [openMeal, setOpenMeal] = useState(null);
  const [sheet, setSheet] = useState(''); // '', 'balance', 'day', 'complete', 'allergy'

  const steps = useMemo(() => meta?.steps || [], [meta?.steps]);
  const keyOf = useCallback((p, a) => JSON.stringify(adapter.saveBody(p, a)), [adapter]);

  // Plan profile (Gym and Individual). Without one, go and set it up.
  useEffect(() => {
    if (kind === 'basic') return;
    api.get(`${adapter.base}/profile`)
      .then(({ data }) => {
        if (!data.profile) { navigate(`${adapter.base}/setup`, { replace: true }); return; }
        setMeta(data);
        setDietType(data.profile.dietType);
      })
      .catch((err) => setError(errorMessage(err)));
  }, [kind, adapter, navigate]);

  // Which step is open: ?step= or ?slot= if valid, otherwise the first
  useEffect(() => {
    if (!steps.length || stepId) return;
    const want = params.get('step') || params.get('slot');
    setStepId(steps.some((s) => s.id === want) ? want : steps[0].id);
  }, [steps, stepId, params]);

  useEffect(() => {
    api.get('/meals/categories').then(({ data }) => setCuisines(['All', ...data.cuisines])).catch(() => {});
  }, []);

  // Days that already have a plan get a dot in the date ribbon
  useEffect(() => {
    api.get(adapter.calendarUrl)
      .then(({ data }) => setSavedDates(new Set(data.plans.filter((p) => p.items?.length).map((p) => p.dateKey))))
      .catch(() => {});
  }, [adapter]);

  // Load the plan already saved for this date (if any)
  useEffect(() => {
    let cancelled = false;
    setPicks({}); setAddons([]); setHadSaved(false); setSavedKey(null);
    api.get(adapter.dayUrl(date))
      .then(({ data }) => {
        if (cancelled) return;
        if (!data.plan) { setSavedKey(keyOf({}, [])); return; }
        const day = adapter.parseDay(data);
        setPicks(day.picks); setAddons(day.addons);
        setHadSaved(true);
        setSavedKey(keyOf(day.picks, day.addons));
      })
      .catch(() => { if (!cancelled) setSavedKey(keyOf({}, [])); });
    return () => { cancelled = true; };
  }, [adapter, date, keyOf]);

  // Ask the server for ranked suggestions
  const recsKey = JSON.stringify(adapter.recsParams({ stepId, dietType, cuisine, date, seed: APP_SEED, picks, addons }));
  useEffect(() => {
    if (!stepId) return undefined;
    let cancelled = false;
    setLoading(true); setError('');
    api.get(adapter.recsUrl, { params: JSON.parse(recsKey) })
      .then(({ data }) => { if (!cancelled) { setInfo(data); setNeedsPlan(false); } })
      .catch((err) => {
        if (cancelled) return;
        setInfo(null);
        if (err.response?.data?.code === 'SUBSCRIPTION_REQUIRED') setNeedsPlan(true);
        else setError(errorMessage(err));
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [adapter, recsKey, stepId, bump]);

  const fetchMore = useCallback((extra) => api.get(adapter.recsUrl, { params: { ...JSON.parse(recsKey), ...extra } }).then((r) => r.data), [adapter, recsKey]);

  const addonFor = (id) => addons.find((a) => a.target === id);
  const asAddon = (a) => (a ? { meal: a.meal || { _id: a.mealId, name: a.name, imageUrl: a.imageUrl }, reason: a.reason } : null);

  const nextEmpty = (next, from) => {
    const ids = steps.map((s) => s.id);
    const i = ids.indexOf(from);
    return [...ids.slice(i + 1), ...ids.slice(0, i)].find((id) => !next[id]);
  };

  // Put a meal (and its add-on, if any) on the plate of the open step
  const pick = (meal, addon) => {
    const had = Boolean(picks[stepId]);
    const next = { ...picks, [stepId]: meal };
    setPicks(next);
    setAddons((list) => {
      const keep = kind === 'basic' || addon?.meal ? list.filter((a) => a.target !== stepId) : list;
      if (!addon?.meal) return keep;
      return [...keep.filter((a) => a.mealId !== addon.meal._id), { mealId: addon.meal._id, name: addon.meal.name, imageUrl: addon.meal.imageUrl, target: stepId, targetLabel: targetLabel(steps, stepId), meal: addon.meal, reason: addon.reason }];
    });
    setOpenMeal(null);
    if (!had) {
      const after = nextEmpty(next, stepId);
      if (after) { setStepId(after); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    }
  };

  const unpick = (id = stepId) => {
    setPicks((p) => { const n = { ...p }; delete n[id]; return n; });
    setAddons((list) => (kind === 'basic' ? list.filter((a) => a.target !== id) : list.map((a) => (a.target === id ? { ...a, target: 'extra', targetLabel: 'Extra snack' } : a))));
    setOpenMeal(null);
  };

  const quick = (meal) => (picks[stepId]?._id === meal._id ? unpick() : pick(meal, meal.addon?.meal ? meal.addon : null));

  // "Add this to my day" from a ready-made day
  const addDayAddon = (food) => {
    const best = food.addon?.bestTarget;
    let target;
    if (kind === 'basic') {
      target = steps.some((s) => s.id === best) && picks[best] ? best : steps.map((s) => s.id).find((k) => picks[k] && !addonFor(k));
      if (!target) { notify('Pick a meal first, then add the extra food to it.', 'bad'); return; }
    } else target = best || 'extra';
    setAddons((list) => [...list.filter((a) => a.mealId !== food._id && (kind !== 'basic' || a.target !== target)), { mealId: food._id, name: food.name, imageUrl: food.imageUrl, target, targetLabel: targetLabel(steps, target), meal: food, reason: food.addon?.reason }]);
  };

  const applyDay = (items) => {
    setPicks(Object.fromEntries(items.map((i) => [i.stepId, i.meal])));
    if (kind === 'basic') setAddons([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const dirty = savedKey !== null && keyOf(picks, addons) !== savedKey;
  const plannedCount = steps.filter((s) => picks[s.id]).length;

  const save = async () => {
    setSaving(true); setError('');
    try {
      await api.put(adapter.dayUrl(date), adapter.saveBody(picks, addons));
      const keeping = plannedCount > 0;
      setHadSaved(keeping);
      setSavedKey(keyOf(picks, addons));
      setSavedDates((s) => { const n = new Set(s); if (keeping) n.add(date); else n.delete(date); return n; });
      notify(keeping ? 'Day saved' : 'Day cleared');
    } catch (err) {
      notify(errorMessage(err), 'bad');
    } finally {
      setSaving(false);
    }
  };

  const changeDate = async (d) => {
    if (d === date) return;
    if (dirty && !(await confirm({ title: 'Leave without saving?', text: 'You changed this day but did not save it. Switching days will drop those changes.', okLabel: 'Switch day', danger: true }))) return;
    setDate(d);
    setInfo(null);
  };

  if (!meta) {
    return error
      ? <Card><p className="error-text">{error}</p><Link to="/plans" className="ui-btn primary block">See plans</Link></Card>
      : <div className="stack"><Skeleton height={60} /><Skeleton height={140} /><Skeleton height={320} /></div>;
  }

  const step = steps.find((s) => s.id === stepId);
  const meals = info?.meals || [];
  const targets = info?.daily?.targets || meta.targets;
  const eaten = info?.daily?.eaten || ZERO;
  const kcalPct = targets?.calories ? (eaten.calories / targets.calories) * 100 : 0;
  const conditions = (meta.profile?.healthConditions || []).map((c) => CONDITION_NAMES[c]).filter(Boolean);
  const ideal = info?.idealForStep || info?.idealForSlot;
  const picksParam = Object.entries(picks).filter(([, m]) => m).map(([k, m]) => `${k}:${m._id}`).join(',');
  const appliedIds = Object.values(picks).filter(Boolean).map((m) => m._id);
  const extras = addons.filter((a) => a.target === 'extra');
  const dayParams = { dietType, cuisine, date, seed: APP_SEED };

  return (
    <div className="pv">
      <header className="pv-head">
        <div>
          <p className="ui-eyebrow">{date === today ? 'Today' : 'Planning ahead'}</p>
          <h1 className="pv-title">Build your <em>day</em></h1>
        </div>
        <div className="pv-tools">
          {kind === 'basic' && <IconButton label="Food allergies" onClick={() => setSheet('allergy')}><ShieldAlert size={20} /></IconButton>}
          <IconButton label="Ready-made day" onClick={() => setSheet('day')}><Sparkles size={20} /></IconButton>
        </div>
      </header>

      <DateRibbon today={today} value={date} onChange={changeDate} saved={savedDates} />

      {kind !== 'basic' && <CheckinCard base={adapter.base} checkin={meta.checkin} weightKg={meta.profile.weightKg} onDone={(data) => { setMeta((m) => ({ ...m, ...data })); setBump((n) => n + 1); }} />}

      <section className="plates" aria-label="Meals of the day">
        <div className="plates-row">
          {steps.map((s) => {
            const m = picks[s.id];
            const a = addonFor(s.id);
            const Icon = stepIcon(s.id);
            return (
              <button key={s.id} type="button" className={`plate${stepId === s.id ? ' on' : ''}${m ? ' full' : ''}`} aria-pressed={stepId === s.id} onClick={() => setStepId(s.id)}>
                {m ? <Photo src={m.imageUrl} alt="" className="plate-photo" iconSize={20} /> : <span className="plate-photo empty"><Icon size={22} aria-hidden="true" /></span>}
                <span className="plate-text">
                  <small>{s.label}</small>
                  <b>{m ? m.name : 'Choose'}</b>
                  {m && a && <em>+ {a.name}</em>}
                </span>
              </button>
            );
          })}
        </div>
        {extras.length > 0 && (
          <div className="extras">
            {extras.map((a) => (
              <span key={a.mealId} className="extra-chip">+ {a.name}<button type="button" aria-label={`Remove ${a.name}`} onClick={() => setAddons((l) => l.filter((x) => x.mealId !== a.mealId))}><X size={14} /></button></span>
            ))}
          </div>
        )}
      </section>

      <div className="pv-filters">
        <Segmented value={dietType} onChange={setDietType} label="Food type" options={[['vegetarian', 'Veg'], ['non-vegetarian', 'Non-veg']]} />
        <ChoiceChips value={cuisine} onChange={setCuisine} label="Cuisine" options={cuisines.map((c) => [c, c])} />
      </div>

      {step && (
        <div className="pv-step">
          <h2>{step.label || title(step.id)}</h2>
          {step.hint && <p className="ui-muted">{step.hint}</p>}
          {ideal && <p className="ui-muted">Best for this meal: about {ideal.calories} kcal and {ideal.protein} g protein.</p>}
        </div>
      )}

      {needsPlan && (
        <>
          <Card className="lock-card">
            <Lock size={22} aria-hidden="true" />
            <h3>Get recommendations with a plan</h3>
            <p className="ui-muted">You can look at all our meals below. A plan unlocks nutrition details, personal recommendations and saving your daily plan.</p>
            <Link to="/plans" className="ui-btn primary block">See plans</Link>
          </Card>
          <MealBrowse key={`${stepId}-${dietType}-${cuisine}`} slot={stepId} dietType={dietType} cuisine={cuisine} />
        </>
      )}

      {error && <p className="error-text">{error}</p>}

      {!needsPlan && (loading && meals.length === 0
        ? <div className="stack"><Skeleton height={300} /></div>
        : meals.length === 0 && !error
          ? <p className="center-note">{kind === 'basic' ? 'No meals found for this choice yet.' : 'No safe meals found for this choice yet.'}</p>
          : <MealStage notice={info?.lightOnlyMessage || ''} meals={meals} total={info?.total || 0} fetchMore={fetchMore} loading={loading} selectedId={picks[stepId]?._id} onOpen={setOpenMeal} onQuick={quick} resetKey={`${stepId}|${dietType}|${cuisine}|${date}|${bump}`} />)}

      {kind !== 'basic' && !needsPlan && (
        <Button variant="soft" block onClick={() => setSheet('complete')} disabled={!picksParam}>
          <Plus size={18} aria-hidden="true" /> Complete your day{addons.length ? ` (${addons.length} added)` : ''}
        </Button>
      )}

      <p className="ui-muted pv-note">
        {conditions.length > 0 && `You told us about ${conditions.join(', ')}. We rank meals that suit this higher. `}
        These are general suggestions, not medical advice. {kind !== 'basic' ? 'Please check your diet with a doctor or dietitian. ' : ''}Allergy information may be incomplete, so check ingredients yourself.
      </p>

      {!needsPlan && (
        <div className="dock" role="region" aria-label="Day summary">
          <button type="button" className="dock-sum" onClick={() => setSheet('balance')} aria-label="Open today's balance">
            <Ring value={kcalPct} size={52} stroke={6} label={`${Math.min(999, Math.round(kcalPct))}%`} labelSize={13} />
            <span>
              <b>{Math.round(eaten.calories)}{targets ? ` / ${Math.round(targets.calories)}` : ''} kcal</b>
              <small>{plannedCount} of {steps.length} meals planned</small>
            </span>
            <SlidersHorizontal size={18} aria-hidden="true" />
          </button>
          <Button onClick={save} disabled={saving || !dirty}>{saving ? 'Saving…' : !dirty && hadSaved ? 'Saved ✓' : plannedCount ? 'Save day' : hadSaved ? 'Clear day' : 'Save day'}</Button>
        </div>
      )}

      <MealSheet
        key={openMeal?._id || 'none'}
        meal={openMeal}
        stepLabel={step?.label || ''}
        picked={Boolean(openMeal && picks[stepId]?._id === openMeal._id)}
        currentAddon={asAddon(addonFor(stepId))}
        addonOptions={kind === 'basic' ? { slot: stepId, dietType } : null}
        onPick={pick}
        onRemove={() => unpick()}
        onClose={() => setOpenMeal(null)}
      />
      <BalanceSheet open={sheet === 'balance'} onClose={() => setSheet('')} targets={targets} eaten={eaten} waterLitres={meta.targets?.waterLitres}>
        {kind === 'individual' && meta.details && (
          <details className="fold"><summary>Edit my targets</summary><div className="fold-body">
            <TargetsEditor details={meta.details} eaten={eaten} onChanged={(data) => { setMeta((m) => ({ ...m, ...data })); setBump((n) => n + 1); }} />
          </div></details>
        )}
      </BalanceSheet>
      <FullDaySheet open={sheet === 'day'} onClose={() => setSheet('')} url={adapter.fullDayUrl} params={dayParams} appliedIds={appliedIds} onApply={applyDay} onAddon={addDayAddon} addedIds={addons.map((a) => a.mealId)} reloadKey={bump} />
      {kind !== 'basic' && <CompleteDaySheet open={sheet === 'complete'} onClose={() => setSheet('')} plan={kind} date={date} dietType={dietType} picksParam={picksParam} steps={steps} addons={addons} setAddons={setAddons} />}
      {kind === 'basic' && <AllergySheet open={sheet === 'allergy'} onClose={() => setSheet('')} onSaved={() => { setBump((n) => n + 1); notify('Allergies saved. Meals are updated.'); }} />}
    </div>
  );
}
