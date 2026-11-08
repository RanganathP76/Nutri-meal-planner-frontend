// DISPLAY ONLY. The real recommendation math moves to the backend in Phase 4.
export const DEMO_TARGETS = { calories: 1850, protein: 60 };

export function sumNutrition(meals) {
  const total = { calories: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0 };
  meals.filter(Boolean).forEach((meal) => {
    const n = meal.nutritionPerServing || {};
    Object.keys(total).forEach((key) => { total[key] += Number(n[key]) || 0; });
  });
  return total;
}