import './MealCard.css';
import './BodyGoal.css';
import './MealPicker.css';
import { useState } from 'react';
import api, { errorMessage } from '../api/client';
import { DISEASE_LABEL, NUTRIENT_GROUPS, NUTRIENT_GROUP_TITLES } from '../utils/health';

// Basic plan: the same meal for every age group (loaded when the customer opens it)
function AgePortions({ mealId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const load = (e) => {
    if (!e.target.open || data) return;
    api.get('/meals/age-portions', { params: { mealId } }).then((r) => setData(r.data)).catch((err) => setError(errorMessage(err)));
  };
  return (
    <details className="meal-more" onToggle={load}>
      <summary>Portion for every age group</summary>
      {error && <p className="error-text">{error}</p>}
      {!data && !error && <p className="muted">Loading...</p>}
      {data && (
        <>
          <table className="age-table"><thead><tr><th>Age group</th><th>On the plate</th><th>kcal</th></tr></thead><tbody>
            {data.bands.map((b) => (
              <tr key={b.id} className={b.isYours ? 'yours' : ''}>
                <td>{b.ageFrom}{b.ageTo ? `–${b.ageTo}` : '+'} yrs{b.isYours ? ' (you)' : ''}<br /><span className="muted">{b.weightKg} kg, {b.heightCm} cm</span></td>
                <td>{b.portionText}</td>
                <td>{Math.round(b.nutrition.calories)}</td>
              </tr>
            ))}
          </tbody></table>
          <p className="muted">{data.note}</p>
        </>
      )}
    </details>
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

export default function MealCard({ meal, selected, onSelect, ageTable = false }) {
  const n = meal.nutritionPerServing || {};
  const rec = meal.recommendation;
  return (
    <div className={`meal-card ${selected ? 'selected' : ''} ${meal.madeInLast3Days ? 'recent' : ''}`}>
      <img src={meal.imageUrl} alt={meal.name} loading="lazy" />
      <div className="meal-body">
        <div className="meal-top">
          <h4>{meal.name}</h4>
          {rec && <span className="match">{rec.score}% match</span>}
        </div>
        <div className="meal-tags">
          <span className="tag">{meal.cuisine}</span>
          <span className="tag tag-green">{meal.digestiveProfile?.digestiveLoad} to digest</span>
          {meal.madeInLast3Days && <span className="tag tag-amber">Made in the last 3 days</span>}
        </div>
        {rec && <p className="reason">{rec.reason}</p>}
        {meal.portion && meal.portion.percentChange !== 0 && (
          <p className="portion-note">Portion adjusted for your age, goal, height and weight: {meal.portion.percentChange > 0 ? '+' : ''}{meal.portion.percentChange}% compared with {meal.portion.referenceLabel || `a ${meal.portion.referenceWeightKg} kg person`}.</p>
        )}
        {rec?.healthFlags?.length > 0 && (
          <ul className="warn-list">
            {rec.healthFlags.filter((f) => f.kind !== 'not_applied' && f.kind !== 'conflict').map((f) => (
              <li key={f.disease} style={{ color: f.kind === 'suitable' ? '#15803d' : undefined }}>
                {DISEASE_LABEL[f.disease]}: {f.label}
              </li>
            ))}
            {rec.healthFlags.filter((f) => f.kind === 'conflict').map((f) => (
              <li key={`c-${f.disease}`} style={{ color: '#92400e' }}>
                {DISEASE_LABEL[f.disease]}: rated suitable, but its own numbers say otherwise ({f.conflict}). The rating was not used. Check this meal once.
              </li>
            ))}
            {rec.healthFlags.some((f) => f.kind === 'not_applied') && (
              <li style={{ color: '#92400e' }}>
                Not defined for {rec.healthFlags.filter((f) => f.kind === 'not_applied').map((f) => DISEASE_LABEL[f.disease]).join(', ')}.
                If you have this health condition, check this meal once before you eat it.
              </li>
            )}
          </ul>
        )}
        <div className="meal-stats">
          <span><strong>{n.calories}</strong> kcal</span>
          <span><strong>{n.protein}g</strong> protein</span>
          <span><strong>{n.carbohydrates}g</strong> carbs</span>
        </div>
        {meal.components?.length > 0 && (
          <div className="plate">
            <strong>{meal.portion ? 'Your portion' : 'One serving'}</strong>
            {meal.portionText || meal.components.map((c) => `${c.quantity} ${c.unit === 'piece' ? '' : c.unit + ' '}${c.name.toLowerCase()}`).join(', ')}
            {meal.portion && <details className="meal-more"><summary>Compare with the reference person</summary>
              <ul className="ing-list">
                {meal.components.map((c) => (
                  <li key={c.name}>{c.name}: {c.quantity} {c.unit} <span className="ref">({c.referenceQuantity} {c.unit} for {meal.portion.referenceLabel || `a ${meal.portion.referenceWeightKg} kg person`})</span></li>
                ))}
              </ul>
              <p className="muted">Amounts are estimates, adjusted for your age, goal, height and weight.</p>
            </details>}
          </div>
        )}
        {meal.mainIngredients?.length > 0 && <div className="mains">{meal.mainIngredients.map((m) => <span key={m}>{m}</span>)}</div>}
        {rec && (
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
        {meal.detailedNutrition && (
          <details className="meal-more">
            <summary>All nutrients{meal.portion ? ' (for your portion)' : ''}</summary>
            {Object.entries(NUTRIENT_GROUPS).map(([group, list]) => (
              <div key={group} className="nut-group">
                <strong>{NUTRIENT_GROUP_TITLES[group]}</strong>
                <table className="nut-table"><tbody>
                  {list.map((nu) => {
                    const v = meal.detailedNutrition?.[group]?.[nu.key];
                    return <tr key={nu.key}><td>{nu.label}</td><td className={v == null ? 'na' : ''}>{v == null ? 'NA' : `${v} ${nu.unit}`}</td></tr>;
                  })}
                </tbody></table>
              </div>
            ))}
            <p className="muted">NA means our team has not entered this value.</p>
          </details>
        )}
        <button className={`btn ${selected ? 'btn-success' : 'btn-primary'}`} onClick={() => onSelect(meal)}>
          {selected ? '✓ Picked (tap to remove)' : 'Select'}
        </button>
      </div>
    </div>
  );
}