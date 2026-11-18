import { useEffect, useState } from 'react';
import api, { errorMessage } from '../api/client';
import './MealPicker.css';

// "Complete your day": after the meals are chosen, shows what the day is still missing and single foods that fill it.
// The customer picks one, then says where it goes (into a meal or as a separate snack).
export default function AddonPicker({ plan, date, dietType, picksParam, addons, setAddons }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [choosing, setChoosing] = useState(null); // the add-on being placed
  const [target, setTarget] = useState('');

  useEffect(() => {
    if (!picksParam) { setData(null); return undefined; }
    let cancelled = false;
    const t = setTimeout(() => {
      api.get(`/${plan}/addons`, { params: { date, dietType, picks: picksParam } })
        .then(({ data: d }) => { if (!cancelled) { setData(d); setError(''); } })
        .catch((err) => { if (!cancelled) { setData(null); setError(errorMessage(err)); } });
    }, 350);
    return () => { cancelled = true; clearTimeout(t); };
  }, [plan, date, dietType, picksParam]);

  if (!picksParam) return null;
  if (error) return <p className="muted">{error}</p>;
  if (!data) return null;

  const labelFor = (id) => data.addTo.find((t) => t.id === id)?.label || 'Extra snack';
  const startPlacing = (m) => { setChoosing(m); setTarget(m.addon.bestTarget); };
  const confirm = () => {
    setAddons((a) => [...a.filter((x) => x.mealId !== choosing._id), { mealId: choosing._id, name: choosing.name, target, targetLabel: target === 'extra' ? 'Extra snack' : `Added to ${labelFor(target)}` }]);
    setChoosing(null);
  };
  const remove = (mealId) => setAddons((a) => a.filter((x) => x.mealId !== mealId));
  const chosen = new Set(addons.map((a) => a.mealId));
  const gaps = data.gaps;

  return (
    <section className="card stack addon">
      <h3 style={{ margin: 0 }}>Complete your day</h3>

      {addons.length > 0 && (
        <div className="picked">
          {addons.map((a) => (
            <div key={a.mealId} className="picked-row">
              <span>✓ {a.name} <span className="muted">· {a.targetLabel}</span></span>
              <button type="button" className="btn btn-light btn-sm" onClick={() => remove(a.mealId)}>Remove</button>
            </div>
          ))}
        </div>
      )}

      {!data.needed ? (
        <p className="muted">{data.reason === 'day_is_covered' ? 'Your chosen meals already cover your day well. Nothing extra needed.' : 'Choose your meals first, then we will tell you if anything is missing.'}</p>
      ) : (
        <>
          <p>
            Your meals so far leave the day short on:{' '}
            <strong>{[...gaps.main.map((g) => `${g.label} (about ${g.missing} ${g.unit} left)`), ...gaps.micro.slice(0, 3).map((g) => `${g.label} (${g.percentCovered}% covered)`)].join(', ')}</strong>.
            Add one of these single foods to fill the gap. Amounts are estimates.
          </p>
          {data.addons.map((m) => (
            <div key={m._id} className={`addon-card ${chosen.has(m._id) ? 'chosen' : ''}`}>
              <div className="meal-top"><h4>{m.name}</h4><span className="match">{m.addon.score}% fit</span></div>
              {m.portionText && <div className="plate"><strong>Your portion</strong>{m.portionText}</div>}
              <p className="muted">{m.nutritionPerServing.calories} kcal · {m.nutritionPerServing.protein} g protein · {m.nutritionPerServing.carbohydrates} g carbs · {m.nutritionPerServing.fat} g fat · {m.nutritionPerServing.fiber} g fibre</p>
              <p className="reason">{m.addon.reason}</p>
              {m.addon.overLimit.map((t) => <p key={t} className="error-text">{t}</p>)}
              {m.madeInLast3Days && <p className="muted">You had this in the last 3 days.</p>}
              {choosing?._id === m._id ? (
                <div className="stack">
                  <strong>Where will you add this?</strong>
                  {data.addTo.map((t) => (
                    <label key={t.id} className="radio-row" style={{ opacity: t.id !== 'extra' && !t.hasMeal ? 0.45 : 1 }}>
                      <input type="radio" name={`t-${m._id}`} value={t.id} checked={target === t.id} disabled={t.id !== 'extra' && !t.hasMeal} onChange={() => setTarget(t.id)} />
                      {' '}{t.label}{t.mealName ? ` (with ${t.mealName})` : t.id !== 'extra' ? ' (no meal chosen yet)' : ''}
                      {t.id === m.addon.bestTarget && <span className="tag tag-green" style={{ marginLeft: 6 }}>best fit</span>}
                    </label>
                  ))}
                  <div className="picker-bar" style={{ position: 'static' }}>
                    <button type="button" className="btn btn-light" onClick={() => setChoosing(null)}>Cancel</button>
                    <button type="button" className="btn btn-primary" onClick={confirm}>Add here</button>
                  </div>
                </div>
              ) : (
                <button type="button" className={`btn ${chosen.has(m._id) ? 'btn-success' : 'btn-primary'}`} onClick={() => startPlacing(m)}>
                  {chosen.has(m._id) ? '✓ Added (change place)' : 'Add this'}
                </button>
              )}
            </div>
          ))}
        </>
      )}
    </section>
  );
}
