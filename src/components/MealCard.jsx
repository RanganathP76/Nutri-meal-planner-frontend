import './MealCard.css';

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
        <div className="meal-stats">
          <span><strong>{n.calories}</strong> kcal</span>
          <span><strong>{n.protein}g</strong> protein</span>
          <span><strong>{n.carbohydrates}g</strong> carbs</span>
        </div>
        {rec && (
          <details className="meal-more">
            <summary>What this adds to your day</summary>
            <p>
              Covers {rec.percentOfDaily.calories}% of your daily calories and {rec.percentOfDaily.protein}% of your protein.
              Left for the day after this meal: {rec.remainingAfter.calories} kcal, {rec.remainingAfter.protein} g protein.
            </p>
          </details>
        )}
        <button className={`btn ${selected ? 'btn-success' : 'btn-primary'}`} onClick={() => onSelect(meal)}>
          {selected ? '✓ Picked (tap to remove)' : 'Select'}
        </button>
      </div>
    </div>
  );
}