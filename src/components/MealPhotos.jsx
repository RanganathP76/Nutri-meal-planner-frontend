import './MealCard.css';

// One meal: its photo. A meal with an add-on: two photos with a "+" between them, so it reads as one combined meal.
// (The card writes both names joined by "+" right below.)
export default function MealPhotos({ meal, addon }) {
  const extra = addon?.meal || null;
  if (!extra) return <img className="single-photo" src={meal.imageUrl} alt={meal.name} loading="lazy" />;
  return (
    <div className="combo-photos" role="img" aria-label={`${meal.name} with ${extra.name}`}>
      <img src={meal.imageUrl} alt="" loading="lazy" />
      <span className="combo-plus" aria-hidden="true">+</span>
      <img src={extra.imageUrl} alt="" loading="lazy" />
    </div>
  );
}
