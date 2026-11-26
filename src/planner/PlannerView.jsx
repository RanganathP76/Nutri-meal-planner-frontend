import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Plus, ShieldAlert, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import api, { errorMessage } from '../api/client';
import { APP_SEED } from '../utils/seed';
import { addDays, todayKey } from '../utils/date';
import { Button, ChoiceChips, Card, IconButton, Photo, PhotoStack, Ring, Segmented, Skeleton, useFeedback } from '../ui/Kit';
import { balanceOf } from '../utils/balance';
import CheckinCard from '../components/CheckinCard';
import MealBrowse from '../components/MealBrowse';
import TargetsEditor from '../components/TargetsEditor';
import { BASIC_STEPS, makeAdapter, stepIcon, targetLabel } from './adapters';
import DateRibbon from './DateRibbon';
import MealStage from './MealStage';
import MealSheet from './MealSheet';
import { AllergySheet, BalanceSheet, CompleteDaySheet, FullDaySheet } from './Sheets';
import './planner.css';
import './planner2.css';

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
  const [sheet, setSheet] = useState(params.get('sheet') === 'day' ? 'day' : ''); // '', 'balance', 'day', 'complete', 'allergy'

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

  const addonsFor = (id) => addons.filter((a) => a.target === id);
  const asAddon = (a) => ({ meal: { ...(a.meal || {}), _id: a.mealId, name: a.meal?.name || a.name, imageUrl: a.meal?.imageUrl || a.imageUrl }, reason: a.reason });

  const nextEmpty = (next, from) => {
    const ids = steps.map((s) => s.id);
    const i = ids.indexOf(from);
    return [...ids.slice(i + 1), ...ids.slice(0, i)].find((id) => !next[id]);
  };

  // Put a meal (and its add-ons, if any) on the plate of the open step. The add-ons given here replace the step's old ones.
  const pick = (meal, addonList = []) => {
    const had = Boolean(picks[stepId]);
    const next = { ...picks, [stepId]: meal };
    setPicks(next);
    setAddons((list) => {
      const given = addonList.filter((a) => a?.meal);
      const keep = list.filter((a) => a.target !== stepId && !given.some((g) => g.meal._id === a.mealId));
      return [...keep, ...given.map((a) => ({ mealId: a.meal._id, name: a.meal.name, imageUrl: a.meal.imageUrl, target: stepId, targetLabel: targetLabel(steps, stepId), meal: a.meal, reason: a.reason }))];
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

  const quick = (meal) => (picks[stepId]?._id === meal._id ? unpick() : pick(meal, meal.addon?.meal ? [meal.addon] : kind === 'basic' ? [] : addonsFor(stepId).map(asAddon)));

  // "Add this to my day" from a ready-made day
  const addDayAddon = (food) => {
    const best = food.addon?.bestTarget;
    let target;
    if (kind === 'basic') {
      target = steps.some((s) => s.id === best) && picks[best] ? best : steps.map((s) => s.id).find((k) => picks[k] && !addonsFor(k).length);
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
  const bal = balanceOf(eaten.calories, targets?.calories);
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
          <h1 className="pv-title">Plan your <em>day</em></h1>
          <p className="pv-sub">{date === today ? 'Today' : 'Planning ahead'} · pick a meal for each slot</p>
        </div>
        <div className="pv-tools">
          {kind === 'basic' && <IconButton label="Food allergies" onClick={() => setSheet('allergy')}><ShieldAlert size={19} /></IconButton>}
          <IconButton label="Ready-made day" onClick={() => setSheet('day')}><Sparkles size={19} /></IconButton>
        </div>
      </header>

      <DateRibbon today={today} value={date} onChange={changeDate} saved={savedDates} />

      {kind !== 'basic' && <CheckinCard base={adapter.base} checkin={meta.checkin} weightKg={meta.profile.weightKg} onDone={(data) => { setMeta((m) => ({ ...m, ...data })); setBump((n) => n + 1); }} />}

      <section aria-label="Meals of the day">
        <div className="slots">
          {steps.map((s) => {
            const m = picks[s.id];
            const adds = addonsFor(s.id);
            const Icon = stepIcon(s.id);
            return (
              <button key={s.id} type="button" className={`slot${stepId === s.id ? ' on' : ''}${m ? ' full' : ''}`} aria-pressed={stepId === s.id} onClick={() => setStepId(s.id)}>
                {m ? <Photo src={m.imageUrl} alt="" className="slot-photo" iconSize={18} /> : <span className="slot-photo empty"><Icon size={18} aria-hidden="true" /></span>}
                <span className="slot-text"><small>{s.label}</small><b>{m ? m.name : 'Choose'}</b></span>
                {m && adds.length > 0 && <PhotoStack items={adds.map((a) => ({ name: a.name, imageUrl: a.imageUrl }))} size={20} max={2} />}
              </button>
            );
          })}
        </div>
        {extras.length > 0 && (
          <div className="slot-extras">
            {extras.map((a) => (
              <span key={a.mealId} className="extra-chip"><PhotoStack items={[{ name: a.name, imageUrl: a.imageUrl }]} size={22} />{a.name}<button type="button" aria-label={`Remove ${a.name}`} onClick={() => setAddons((l) => l.filter((x) => x.mealId !== a.mealId))}><X size={13} /></button></span>
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
          {ideal && <p>Best: about {ideal.calories} kcal, {ideal.protein} g protein</p>}
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
            <Ring value={Math.min(100, kcalPct)} size={46} stroke={5} label={plannedCount ? bal.label.split(' ')[0].slice(0, 5) : '–'} labelSize={11} />
            <span>
              <b>{plannedCount ? bal.label : 'Not planned'}{bal.percent > 0 && <small className="dock-pct"> {bal.percent}%</small>}</b>
              <small>{Math.round(eaten.calories)}{targets ? ` of ${Math.round(targets.calories)}` : ''} kcal · {plannedCount} of {steps.length} meals</small>
            </span>
            <SlidersHorizontal size={17} aria-hidden="true" />
          </button>
          <Button onClick={save} disabled={saving || !dirty}>{saving ? 'Saving…' : !dirty && hadSaved ? 'Saved ✓' : plannedCount ? 'Save day' : hadSaved ? 'Clear day' : 'Save day'}</Button>
        </div>
      )}

      <MealSheet
        key={openMeal?._id || 'none'}
        meal={openMeal}
        stepLabel={step?.label || ''}
        picked={Boolean(openMeal && picks[stepId]?._id === openMeal._id)}
        currentAddons={addonsFor(stepId).map(asAddon)}
        addonOptions={kind === 'basic' ? { slot: stepId, dietType } : null}
        maxAddons={kind === 'basic' ? 1 : 3}
        onMoreAddons={kind === 'basic' ? null : () => { setOpenMeal(null); setSheet('complete'); }}
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
