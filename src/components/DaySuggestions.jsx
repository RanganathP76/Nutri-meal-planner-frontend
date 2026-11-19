import { useEffect, useState } from 'react';
import api, { errorMessage } from '../api/client';
import './MealPicker.css';

// 1 to 3 complete days, shown at the top of the planner. "Use this day" fills every step; the customer can still change any meal.
//  url       '/meals/full-day', '/gym/full-day' or '/individual/full-day'
//  params    diet, cuisine, date, seed (anything that changes the suggestions)
//  onApply   (items) => each { stepId, meal } to put in the plan
//  appliedIds  meal ids now in the plan (to show "In your plan")
export default function DaySuggestions({ url, params, onApply, appliedIds = [], reloadKey = 0, onAddon, addedIds = [] }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(true);
  const [at, setAt] = useState(0);
  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError('');
    api.get(url, { params })
      .then(({ data: d }) => { if (!cancelled) { setData(d); setAt(0); } })
      .catch((err) => { if (!cancelled) { setData(null); setError(errorMessage(err)); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, paramsKey, reloadKey]);

  if (error) return null; // the planner below still works on its own
  const days = data?.days || [];
  if (!loading && !days.length) return null;
  const day = days[at];
  const t = data?.targets;
  const inPlan = day && day.items.every((i) => appliedIds.includes(i.mealId));

  return (
    <div className="card stack day-suggest">
      <div className="picker-head">
        <strong>Ready-made day for you</strong>
        <button type="button" className="btn btn-light btn-sm" onClick={() => setOpen(!open)}>{open ? 'Hide' : 'Show'}</button>
      </div>
      {open && (loading || !day ? <p className="muted">Planning your day...</p> : (
        <>
          {days.length > 1 && (
            <div className="tabs">
              {days.map((d, i) => <button key={d.id} type="button" className={`btn btn-sm ${i === at ? 'btn-primary' : 'btn-light'}`} onClick={() => setAt(i)}>{d.label}</button>)}
            </div>
          )}
          {day.addon && (
            <div className="addon-box addon-top">
              <strong>+ Add-on for this day: {day.addon.name}</strong>
              <p className="muted">{day.addon.addon.reason}</p>
              {day.addon.portionText && <p className="muted">{day.addon.portionText}</p>}
              {onAddon && (addedIds.includes(day.addon._id)
                ? <span className="tag tag-green">✓ Added to your plan</span>
                : <button type="button" className="btn btn-light btn-sm" onClick={() => onAddon(day.addon)}>Add this to my day</button>)}
            </div>
          )}
          <div className="stack">
            {day.items.map((i) => (
              <div key={i.stepId} className="picked-row">
                <span className="muted">{i.label}</span>
                <span>{i.meal.name} <span className="muted">· {Math.round(i.meal.nutritionPerServing.calories)} kcal</span></span>
              </div>
            ))}
          </div>
          <p className="muted">
            Whole day: {day.totals.calories} kcal ({day.percentOfTarget.calories}% of your {t?.calories} kcal), protein {day.totals.protein} g ({day.percentOfTarget.protein}%),
            fibre {day.totals.fiber} g ({day.percentOfTarget.fiber}%). Match score {Math.round(day.score)} out of 100.
          </p>
          <button type="button" className="btn btn-success" onClick={() => onApply(day.items.map((i) => ({ stepId: i.stepId, meal: i.meal })))} disabled={inPlan}>
            {inPlan ? '✓ This day is in your plan' : 'Use this day'}
          </button>
          <p className="muted">Or choose each meal yourself below. You can change any meal after using a day.</p>
        </>
      ))}
    </div>
  );
}
