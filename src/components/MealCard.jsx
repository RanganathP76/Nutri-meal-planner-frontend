import './MealCard.css';
import './BodyGoal.css';
import { DISEASE_LABEL, NUTRIENT_GROUPS, NUTRIENT_GROUP_TITLES } from '../utils/health';

export default function MealCard({ meal, selected, onSelect }) {
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
          <p className="portion-note">Portion adjusted for your weight: {meal.portion.percentChange > 0 ? '+' : ''}{meal.portion.percentChange}% compared with a {meal.portion.referenceWeightKg} kg person.</p>
        )}
        {rec?.healthFlags?.length > 0 && (
          <ul className="warn-list">
            {rec.healthFlags.filter((f) => f.kind !== 'not_applied').map((f) => (
              <li key={f.disease} style={{ color: f.kind === 'suitable' ? '#15803d' : undefined }}>
                {DISEASE_LABEL[f.disease]}: {f.label}
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
        {meal.portion && meal.ingredients?.length > 0 && (
          <details className="meal-more">
            <summary>What you eat (for your weight)</summary>
            <ul className="ing-list">
              {meal.ingredients.map((i) => (
                <li key={i.name}>{i.quantity} {i.unit} {i.name} <span className="ref">({i.referenceQuantity} for a {meal.portion.referenceWeightKg} kg person)</span></li>
              ))}
            </ul>
          </details>
        )}
        {rec && (
          <details className="meal-more">
            <summary>What this adds to your day</summary>
            <p>
              Covers {rec.percentOfDaily.calories}% of your daily calories and {rec.percentOfDaily.protein}% of your protein.
              Left for the day after this meal: {rec.remainingAfter.calories} kcal, {rec.remainingAfter.protein} g protein.
            </p>
          </details>
        )}
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