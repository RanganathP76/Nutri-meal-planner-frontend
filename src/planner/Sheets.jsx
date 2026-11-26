import { useEffect, useState } from 'react';
import { Droplets } from 'lucide-react';
import api, { errorMessage } from '../api/client';
import { ALLERGENS } from '../utils/allergens';
import { Button, Chip, Photo, Progress, Quality, Ring, Segmented, Sheet } from '../ui/Kit';
import { balanceOf } from '../utils/balance';
import { targetLabel } from './adapters';

const ROWS = [['calories', 'Calories', 'kcal', ''], ['protein', 'Protein', 'g', 'lilac'], ['carbohydrates', 'Carbs', 'g', 'accent'], ['fat', 'Fat', 'g', 'sky'], ['fiber', 'Fibre', 'g', '']];

// What the day looks like so far. Display only; the numbers come from the server.
export function BalanceSheet({ open, onClose, targets, eaten, waterLitres, children }) {
  if (!targets || !eaten) return <Sheet open={open} onClose={onClose} title="Today's balance"><p className="ui-muted">Pick a meal and your balance will show here.</p></Sheet>;
  const pct = targets.calories ? (eaten.calories / targets.calories) * 100 : 0;
  const total = balanceOf(eaten.calories, targets.calories);
  const left = (k) => Math.max(0, Math.round(targets[k] - eaten[k]));
  return (
    <Sheet open={open} onClose={onClose} title="Today's balance">
      <div className="bal-top">
        <Ring value={Math.min(100, pct)} size={108} stroke={11} label={total.tone === 'none' ? '–' : total.label} sub="today" labelSize={total.label.length > 6 ? 14 : 18} />
        <div>
          <p className="ui-muted">Chosen so far</p>
          <h3>{Math.round(eaten.calories)} <small>of {Math.round(targets.calories)} kcal</small></h3>
          <Quality b={total} />
        </div>
      </div>
      <p className="ui-muted">Nobody eats exactly 100% every day. Good and Great both mean you are on track.</p>
      <div className="stack">
        {ROWS.slice(1).map(([k, label, unit, tone]) => {
          const b = balanceOf(eaten[k], targets[k]);
          return (
            <div key={k}>
              <div className="bal-row"><span>{label} <Quality b={b} /></span><span className="ui-muted">{Math.round(eaten[k])} / {Math.round(targets[k])} {unit}</span></div>
              <Progress value={b.percent} tone={tone} />
            </div>
          );
        })}
      </div>
      <p className="ui-muted">Still to eat: about {left('protein')} g protein, {left('fiber')} g fibre.</p>
      {waterLitres ? <div className="water-note"><Droplets size={18} aria-hidden="true" /> Drink about <strong>{waterLitres} litres</strong> of water today</div> : null}
      {children}
      <p className="ui-muted">Targets and totals are estimates to guide you, not medical advice.</p>
    </Sheet>
  );
}

// 1 to 3 complete days. "Use this day" fills every step; any meal can still be changed afterwards.
export function FullDaySheet({ open, onClose, url, params, appliedIds, onApply, onAddon, addedIds, reloadKey }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [at, setAt] = useState(0);
  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    setLoading(true); setError('');
    api.get(url, { params })
      .then(({ data: d }) => { if (!cancelled) { setData(d); setAt(0); } })
      .catch((err) => { if (!cancelled) { setData(null); setError(errorMessage(err)); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  // params is tracked through paramsKey
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, url, paramsKey, reloadKey]);

  const days = data?.days || [];
  const day = days[at];
  const t = data?.targets;
  const inPlan = day && day.items.every((i) => appliedIds.includes(i.mealId));

  return (
    <Sheet open={open} onClose={onClose} title="Ready-made day"
      footer={day ? <Button block disabled={inPlan} onClick={() => { onApply(day.items.map((i) => ({ stepId: i.stepId, meal: i.meal }))); onClose(); }}>{inPlan ? '✓ This day is in your plan' : 'Use this day'}</Button> : null}>
      {loading && <p className="ui-muted">Planning your day…</p>}
      {error && <p className="error-text">{error}</p>}
      {!loading && !error && !day && <p className="ui-muted">No ready-made day for this choice yet.</p>}
      {day && (
        <>
          {days.length > 1 && <Segmented value={at} onChange={setAt} label="Day options" options={days.map((d, i) => [i, d.label])} />}
          <div className="stack">
            {day.items.map((i) => (
              <div key={i.stepId} className="fd-item">
                <Photo src={i.meal.imageUrl} alt={i.meal.name} className="fd-photo" iconSize={22} />
                <span><small>{i.label}</small><strong>{i.meal.name}</strong><em>{Math.round(i.meal.nutritionPerServing.calories)} kcal</em></span>
              </div>
            ))}
          </div>
          {day.addon && (
            <div className="addon-box">
              <div className="fd-item"><Photo src={day.addon.imageUrl} alt={day.addon.name} className="fd-photo" iconSize={22} /><span><small>Add-on for this day</small><strong>{day.addon.name}</strong></span></div>
              <p className="ui-muted">{day.addon.addon.reason}</p>
              {day.addon.portionText && <p className="ui-muted">{day.addon.portionText}</p>}
              {onAddon && (addedIds.includes(day.addon._id)
                ? <Chip>✓ Added to your plan</Chip>
                : <Button variant="soft" small onClick={() => onAddon(day.addon)}>Add this to my day</Button>)}
            </div>
          )}
          <p className="ui-muted">
            Whole day: {day.totals.calories} kcal ({day.percentOfTarget.calories}% of your {t?.calories} kcal), protein {day.totals.protein} g ({day.percentOfTarget.protein}%), fibre {day.totals.fiber} g ({day.percentOfTarget.fiber}%). Estimates, not medical advice.
          </p>
        </>
      )}
    </Sheet>
  );
}

// "Complete your day" for Gym and Individual: what the day still misses, and single foods that fill it.
export function CompleteDaySheet({ open, onClose, plan, date, dietType, picksParam, steps, addons, setAddons }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [choosing, setChoosing] = useState(null);
  const [target, setTarget] = useState('');

  useEffect(() => {
    if (!open || !picksParam) { setData(null); return undefined; }
    let cancelled = false;
    api.get(`/${plan}/addons`, { params: { date, dietType, picks: picksParam } })
      .then(({ data: d }) => { if (!cancelled) { setData(d); setError(''); } })
      .catch((err) => { if (!cancelled) { setData(null); setError(errorMessage(err)); } });
    return () => { cancelled = true; };
  }, [open, plan, date, dietType, picksParam]);

  const startPlacing = (m) => { setChoosing(m); setTarget(m.addon.bestTarget); };
  const confirm = () => {
    setAddons((a) => [...a.filter((x) => x.mealId !== choosing._id), { mealId: choosing._id, name: choosing.name, imageUrl: choosing.imageUrl, target, targetLabel: targetLabel(steps, target) }]);
    setChoosing(null);
  };
  const chosen = new Set(addons.map((a) => a.mealId));

  return (
    <Sheet open={open} onClose={onClose} title="Complete your day">
      {!picksParam && <p className="ui-muted">Choose your meals first, then we will tell you if anything is missing.</p>}
      {error && <p className="error-text">{error}</p>}
      {data && !data.needed && <p className="ui-muted">{data.reason === 'day_is_covered' ? 'Your chosen meals already cover your day well. Nothing extra needed.' : 'Choose your meals first, then we will tell you if anything is missing.'}</p>}
      {data?.needed && (
        <>
          <p>
            Your meals so far leave the day short on:{' '}
            <strong>{[...data.gaps.main.map((g) => `${g.label} (about ${g.missing} ${g.unit} left)`), ...data.gaps.micro.slice(0, 3).map((g) => `${g.label} (${g.percentCovered}% covered)`)].join(', ')}</strong>.
            Add one of these single foods to fill the gap. Amounts are estimates.
          </p>
          {data.addons.map((m) => (
            <div key={m._id} className={`addon-card${chosen.has(m._id) ? ' chosen' : ''}`}>
              <div className="addon-card-top">
                <Photo src={m.imageUrl} alt={m.name} className="fd-photo" iconSize={22} />
                <span><strong>{m.name}</strong><Chip>{m.addon.score}% fit</Chip></span>
              </div>
              {m.portionText && <p className="ui-muted">Your portion: {m.portionText}</p>}
              <p className="ui-muted">{m.nutritionPerServing.calories} kcal · {m.nutritionPerServing.protein} g protein · {m.nutritionPerServing.carbohydrates} g carbs · {m.nutritionPerServing.fat} g fat · {m.nutritionPerServing.fiber} g fibre</p>
              <p>{m.addon.reason}</p>
              {m.addon.overLimit.map((t) => <p key={t} className="error-text">{t}</p>)}
              {m.madeInLast3Days && <p className="ui-muted">You had this in the last 3 days.</p>}
              {choosing?._id === m._id ? (
                <div className="stack">
                  <strong>Where will you add this?</strong>
                  {data.addTo.map((t) => {
                    const off = t.id !== 'extra' && !t.hasMeal;
                    return (
                      <label key={t.id} className="radio-row" style={{ opacity: off ? 0.45 : 1 }}>
                        <input type="radio" name={`t-${m._id}`} value={t.id} checked={target === t.id} disabled={off} onChange={() => setTarget(t.id)} />
                        <span>{t.label}{t.mealName ? ` (with ${t.mealName})` : off ? ' (no meal chosen yet)' : ''}</span>
                        {t.id === m.addon.bestTarget && <Chip>best fit</Chip>}
                      </label>
                    );
                  })}
                  <div className="two-btn"><Button variant="ghost" onClick={() => setChoosing(null)}>Cancel</Button><Button onClick={confirm}>Add here</Button></div>
                </div>
              ) : (
                <Button variant={chosen.has(m._id) ? 'soft' : 'primary'} small onClick={() => startPlacing(m)}>{chosen.has(m._id) ? '✓ Added (change place)' : 'Add this'}</Button>
              )}
            </div>
          ))}
        </>
      )}
    </Sheet>
  );
}

// Basic plan: allergies to avoid. The server hides meals that contain them, or that nobody has checked yet.
export function AllergySheet({ open, onClose, onSaved }) {
  const [picked, setPicked] = useState([]);
  const [other, setOther] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    api.get('/meals/allergies').then((r) => { setPicked(r.data.allergies || []); setOther(r.data.otherAllergies || ''); }).catch(() => {});
  }, [open]);

  const toggle = (k) => setPicked((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));
  const save = async () => {
    setSaving(true); setError('');
    try { await api.put('/meals/allergies', { allergies: picked, otherAllergies: other }); onSaved(); onClose(); } catch (err) { setError(errorMessage(err)); } finally { setSaving(false); }
  };
  return (
    <Sheet open={open} onClose={onClose} title="Food allergies" footer={<Button block onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save allergies'}</Button>}>
      <p className="ui-muted">Tick anything you are allergic to. We hide meals that contain it, and meals whose ingredients we have not checked yet. This is a filter, not a guarantee. Always check the food yourself.</p>
      <div className="chips-wrap">
        {ALLERGENS.map(([k, label]) => (
          <button key={k} type="button" className="pill" aria-pressed={picked.includes(k)} onClick={() => toggle(k)}>{picked.includes(k) ? '✓ ' : ''}{label}</button>
        ))}
      </div>
      <input type="text" maxLength={200} placeholder="Anything else, e.g. kiwi, coconut" value={other} onChange={(e) => setOther(e.target.value)} aria-label="Other allergies" />
      {error && <p className="error-text">{error}</p>}
    </Sheet>
  );
}
