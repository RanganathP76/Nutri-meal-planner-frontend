import './MealCard.css';
import './BodyGoal.css';
import './MealPicker.css';
import { useEffect, useState } from 'react';
import MealPhotos from './MealPhotos';
import api, { errorMessage } from '../api/client';
import { DISEASE_LABEL, RATING_LABEL, NUTRIENT_GROUPS, NUTRIENT_GROUP_TITLES } from '../utils/health';

// Basic plan: portions are NOT shown on the card. The customer taps "See portions by age" and gets two tables,
// one for boys and men and one for girls and women. Loaded only when opened.
function AgePortions({ mealId }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [sex, setSex] = useState('male');
  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && !data) api.get('/meals/age-portions', { params: { mealId } }).then((r) => setData(r.data)).catch((err) => setError(errorMessage(err)));
  };
  const rows = data ? data[sex] : [];
  return (
    <div className="age-portions">
      <button type="button" className="btn btn-light" onClick={toggle}>{open ? 'Hide portions' : 'See portions by age'}</button>
      {open && (
        <div className="stack" style={{ marginTop: 8 }}>
          {error && <p className="error-text">{error}</p>}
          {!data && !error && <p className="muted">Loading...</p>}
          {data && (
            <>
              <div className="chip-row">
                <button type="button" className={`chip small ${sex === 'male' ? 'on' : ''}`} onClick={() => setSex('male')}>Boys and men</button>
                <button type="button" className={`chip small ${sex === 'female' ? 'on' : ''}`} onClick={() => setSex('female')}>Girls and women</button>
              </div>
              <table className="age-table"><thead><tr><th>Age</th><th>What to serve</th><th>kcal</th></tr></thead><tbody>
                {rows.map((b) => (
                  <tr key={b.id}>
                    <td>{b.ageFrom}{b.ageTo ? `–${b.ageTo}` : '+'} years</td>
                    <td>{b.portionText}</td>
                    <td>{b.nutrition.calories}</td>
                  </tr>
                ))}
              </tbody></table>
              <p className="muted">{data.note}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// "Good for diabetes" / "Not good for diabetes" (Basic plan)
function HealthLabels({ labels }) {
  if (!labels?.length) return null;
  return (
    <div className="health-labels">
      {labels.map((l) => (
        <span key={l.disease} className={`tag ${l.verdict === 'good' ? 'tag-green' : 'tag-red'}`} title={[l.strength, l.reason].filter(Boolean).join(': ')}>
          {l.verdict === 'good' ? '✓' : '✕'} {l.text}
        </span>
      ))}
    </div>
  );
}

const KEYS = ['calories', 'protein', 'carbohydrates', 'fat', 'fiber'];
const r1 = (x) => Math.round(x * 10) / 10;

// Nutrition of a meal plus its add-on, added together (the server works out the same numbers when the plan is saved)
function combineNutrition(n = {}, a = {}) {
  return Object.fromEntries(KEYS.map((k) => [k, r1((Number(n[k]) || 0) + (Number(a[k]) || 0))]));
}
// A vitamin or mineral is known only when both foods have it; otherwise it stays NA
function combineDetailed(d, e) {
  if (!d) return d;
  if (!e) return d;
  const out = {};
  for (const [group, values] of Object.entries(d)) {
    out[group] = Object.fromEntries(Object.entries(values || {}).map(([k, v]) => {
      const w = e?.[group]?.[k];
      return [k, v == null || w == null ? null : r1(Number(v) + Number(w))];
    }));
  }
  return out;
}

// Choose, change or take away the add-on of a Basic meal.
function AddonOptions({ meal, options, current, onPick, onClose }) {
  const [list, setList] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let off = false;
    api.get('/meals/addon-options', { params: { slot: options.slot, mealId: meal._id, dietType: options.dietType } })
      .then((r) => { if (!off) setList(r.data.options); })
      .catch((err) => { if (!off) setError(errorMessage(err)); });
    return () => { off = true; };
  }, [meal._id, options.slot, options.dietType]);
  return (
    <div className="addon-options">
      <div className="picker-head"><strong>Choose an add-on</strong><button type="button" className="btn btn-light btn-sm" onClick={onClose}>Close</button></div>
      {error && <p className="error-text">{error}</p>}
      {!list && !error && <p className="muted">Loading...</p>}
      {list && list.length === 0 && <p className="muted">No add-on is available for this meal right now.</p>}
      {(list || []).map((o) => (
        <button key={o.meal._id} type="button" className={`addon-option ${current?.meal?._id === o.meal._id ? 'current' : ''}`}
          onClick={() => onPick({ meal: o.meal, combined: o.combined, fills: o.fills })}>
          <img src={o.meal.imageUrl} alt="" loading="lazy" />
          <span><strong>{o.meal.name}</strong><small>{Math.round(o.meal.nutritionPerServing.calories)} kcal, {o.meal.nutritionPerServing.protein} g protein. Together {Math.round(o.combined.calories)} kcal.</small></span>
          <span className={`fit-badge ${o.fits ? '' : 'fair'}`}>{o.fits ? (o.fills.length ? 'Fills a gap' : 'Fits') : 'A bit big'}</span>
        </button>
      ))}
    </div>
  );
}

// How the engine scored this meal (all numbers come from the server)
function ScoreDetails({ d }) {
  const label = { cal: 'Calories', protein: 'Protein', carb: 'Carbs', fat: 'Fat', fiber: 'Fibre', digest: 'Easy to digest' };
  return (
    <details className="meal-more">
      <summary>How this was scored</summary>
      <table className="engine-table"><tbody>
        {Object.keys(d.weights).map((k) => <tr key={k}><td>{label[k] || k}</td><td>{d.points[k]} of {d.weights[k]} points</td></tr>)}
        {d.goalPoints > 0 && <tr><td>Matches your goal</td><td>+{d.goalPoints}</td></tr>}
        {d.healthBonus > 0 && <tr><td>Suits your health conditions</td><td>+{d.healthBonus}</td></tr>}
        {d.healthPenalty > 0 && <tr><td>Not ideal for your health conditions</td><td>−{d.healthPenalty}</td></tr>}
        {d.varietyPenalty > 0 && <tr><td>Same main food as another meal today</td><td>−{d.varietyPenalty}</td></tr>}
        {d.microAdjust !== 0 && <tr><td>Vitamins, minerals and limits</td><td>{d.microAdjust > 0 ? '+' : '−'}{Math.abs(d.microAdjust)}</td></tr>}
      </tbody></table>
      <p className="muted">
        This meal slot needs about {d.idealForSlot.calories} kcal and {d.idealForSlot.protein} g protein
        {d.alreadyEaten ? ` (already chosen today: ${d.alreadyEaten.calories} kcal, ${d.alreadyEaten.protein} g protein)` : ''}.
        {d.lastEatenDaysAgo != null ? ` You ate this ${d.lastEatenDaysAgo} day${d.lastEatenDaysAgo === 1 ? '' : 's'} ago, so it is shown lower.` : ''} Scores are estimates, not medical advice.
      </p>
    </details>
  );
}

export default function MealCard({ meal, selected, onSelect, ageTable = false, canAddon = false, addonOptions = null, addonValue = null, onAddonChange = null }) {
  const rec = meal.recommendation;
  // The add-on shown with this meal. A selected Basic meal takes it from the planner (so it matches what will be saved);
  // otherwise it starts as the server's suggestion and the customer can take it away, change it or add one back.
  const controlled = typeof onAddonChange === 'function';
  const suggestion = meal.addon?.meal ? meal.addon : null;
  const [local, setLocal] = useState(suggestion);
  const [picking, setPicking] = useState(false);
  useEffect(() => { setLocal(suggestion); setPicking(false); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [suggestion?.meal?._id, meal._id]);
  const addon = controlled && selected ? addonValue : local;
  const setAddon = (a) => { setLocal(a); setPicking(false); if (controlled && selected) onAddonChange(a); };
  const canEdit = Boolean(addonOptions) && (!selected || controlled);
  const canRemove = !selected || controlled;

  const n = addon ? combineNutrition(meal.nutritionPerServing, addon.meal.nutritionPerServing) : (meal.nutritionPerServing || {});
  const detailed = addon ? combineDetailed(meal.detailedNutrition, addon.meal.detailedNutrition) : meal.detailedNutrition;
  const choose = () => onSelect(meal, canAddon || controlled ? addon : null);
  return (
    <div className={`meal-card ${selected ? 'selected' : ''} ${meal.madeInLast3Days ? 'recent' : ''}`}>
      <MealPhotos meal={meal} addon={addon} />
      <div className="meal-body">
        <div className="meal-top">
          <h4>{meal.name}{addon && <span className="combo-name-plus"> + </span>}{addon?.meal.name}</h4>
          {rec && <span className={`match ${rec.score < 70 ? 'fair' : ''}`} title={`Score ${rec.score} out of 100 (an estimate)`}>{rec.fit || `${rec.score}% match`}</span>}
        </div>
        <div className="meal-tags">
          <span className="tag">{meal.cuisine}</span>
          <span className="tag tag-green">{meal.digestiveProfile?.digestiveLoad} to digest</span>
          {meal.madeInLast3Days && <span className="tag tag-amber">Made in the last 3 days</span>}
        </div>
        {addon ? (
          <div className="addon-included">
            <span className="tag tag-green">✓ Add-on included</span>
            <span className="combo-together">Nutrients below are for both together.</span>
            <span className="addon-actions">
              {canEdit && <button type="button" className="icon-btn" title="Choose another add-on" aria-label="Choose another add-on" onClick={() => setPicking(!picking)}>✎</button>}
              {canRemove && <button type="button" className="icon-btn minus" title="Remove the add-on" aria-label="Remove the add-on" onClick={() => setAddon(null)}>−</button>}
            </span>
          </div>
        ) : (canEdit || suggestion) && (!selected || controlled) && (
          <div className="addon-add-row">
            <button type="button" className="icon-btn plus" title="Add an add-on" aria-label="Add an add-on" onClick={() => (canEdit ? setPicking(true) : setAddon(suggestion))}>+</button>
            <span>Add a small food to complete this meal</span>
          </div>
        )}
        {picking && canEdit && <AddonOptions meal={meal} options={addonOptions} current={addon} onPick={setAddon} onClose={() => setPicking(false)} />}
        {addon?.reason && <p className="reason">{addon.reason}</p>}
        <HealthLabels labels={meal.healthLabels} />
        {rec && !addon && <p className="reason">{rec.reason}</p>}
        {meal.portion && meal.portion.percentChange !== 0 && (
          <p className="portion-note">Portion adjusted for your age, goal, height and weight: {meal.portion.percentChange > 0 ? '+' : ''}{meal.portion.percentChange}% compared with {meal.portion.referenceLabel || `a ${meal.portion.referenceWeightKg} kg person`}.</p>
        )}
        {meal.dietitianNote && <p className="note-box">Dietitian note: {meal.dietitianNote}</p>}
        {rec?.healthFlags?.length > 0 && (
          <ul className="warn-list">
            {rec.healthFlags.filter((f) => f.kind === 'rated').map((f) => (
              <li key={f.disease} className={`rate-${f.rating}`}>
                {DISEASE_LABEL[f.disease]}: {f.label || RATING_LABEL[f.rating]}{f.reason ? `. ${f.reason}` : ''}
              </li>
            ))}
            {rec.healthFlags.filter((f) => f.kind === 'conflict').map((f) => (
              <li key={`c-${f.disease}`} style={{ color: '#92400e' }}>
                {DISEASE_LABEL[f.disease]}: rated suitable, but its own numbers say otherwise ({f.conflict}). The rating was not used. Check this meal once.
              </li>
            ))}
            {rec.healthFlags.some((f) => f.kind === 'not_reviewed') && (
              <li style={{ color: '#92400e' }}>
                Not yet reviewed for {rec.healthFlags.filter((f) => f.kind === 'not_reviewed').map((f) => DISEASE_LABEL[f.disease]).join(', ')}.
                It is shown lower in the list. If you have this health condition, check this meal with your doctor or dietitian first.
              </li>
            )}
          </ul>
        )}
        <div className="meal-stats">
          <span><strong>{n.calories}</strong> kcal</span>
          <span><strong>{n.protein}g</strong> protein</span>
          <span><strong>{n.carbohydrates}g</strong> carbs</span>
          {addon && <span><strong>{n.fiber}g</strong> fibre</span>}
        </div>
        {meal.components?.length > 0 && (
          <div className="plate">
            <strong>{meal.portion ? 'Your portion' : 'One serving'}</strong>
            {meal.portionText || meal.components.map((c) => `${c.quantityText ?? c.quantity} ${c.unit === 'piece' ? '' : c.unit + ' '}${c.name.toLowerCase()}`).join(', ')}
            {meal.portion && <details className="meal-more"><summary>Compare with the reference person</summary>
              <ul className="ing-list">
                {meal.components.map((c) => (
                  <li key={c.name}>{c.name}: {c.quantityText ?? c.quantity} {c.unit} <span className="ref">({c.referenceQuantity} {c.unit} for {meal.portion.referenceLabel || `a ${meal.portion.referenceWeightKg} kg person`})</span></li>
                ))}
              </ul>
              <p className="muted">Amounts are estimates, adjusted for your age, goal, height and weight.</p>
            </details>}
          </div>
        )}
        {addon?.meal.portionText && <p className="muted">Add-on: {addon.meal.portionText}</p>}
        {meal.mainIngredients?.length > 0 && <div className="mains">{meal.mainIngredients.map((m) => <span key={m}>{m}</span>)}</div>}
        {rec && !addon && (
          <details className="meal-more">
            <summary>What this adds to your day</summary>
            <p>
              Covers {rec.percentOfDaily.calories}% of your daily calories and {rec.percentOfDaily.protein}% of your protein.
              Left for the day after this meal: {rec.remainingAfter.calories} kcal, {rec.remainingAfter.protein} g protein.
            </p>
          </details>
        )}
        {ageTable && <AgePortions mealId={meal._id} />}
        {rec?.details && <ScoreDetails d={rec.details} />}
        {rec?.why?.length > 0 && (
          <details className="meal-more why">
            <summary>Know why this recommendation</summary>
            <ul className="why-list">
              {rec.why.map((w, i) => <li key={i} className={`why-${w.tone}`}>{w.text}</li>)}
            </ul>
          </details>
        )}
        {detailed && (
          <details className="meal-more">
            <summary>All nutrients{addon ? ' (meal and add-on together)' : meal.portion ? ' (for your portion)' : ''}</summary>
            {Object.entries(NUTRIENT_GROUPS).map(([group, list]) => (
              <div key={group} className="nut-group">
                <strong>{NUTRIENT_GROUP_TITLES[group]}</strong>
                <table className="nut-table"><tbody>
                  {list.map((nu) => {
                    const v = detailed?.[group]?.[nu.key];
                    return <tr key={nu.key}><td>{nu.label}</td><td className={v == null ? 'na' : ''}>{v == null ? 'NA' : `${v} ${nu.unit}`}</td></tr>;
                  })}
                </tbody></table>
              </div>
            ))}
            <p className="muted">NA means our team has not entered this value.</p>
          </details>
        )}
        <button className={`btn ${selected ? 'btn-success' : 'btn-primary'}`} onClick={choose}>
          {selected ? '✓ Picked (tap to remove)' : addon ? 'Select meal with add-on' : 'Select'}
        </button>
      </div>
    </div>
  );
}