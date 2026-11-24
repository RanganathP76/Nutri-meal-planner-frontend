// One planner screen serves all three plans. The adapter hides the small differences between their routes.
// Picks are { [stepId]: meal }. Add-ons are [{ mealId, name, imageUrl, target, targetLabel, meal? }] where target is a step id or 'extra'.
import { Sunrise, Sun, Moon, Zap, Dumbbell, Apple, BedDouble, UtensilsCrossed } from 'lucide-react';

export const BASIC_STEPS = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' }
];

const ICONS = { breakfast: Sunrise, lunch: Sun, dinner: Moon, pre_workout: Zap, post_workout: Dumbbell, midday_snack: Apple, snack: Apple, before_bed: BedDouble };
export const stepIcon = (id) => ICONS[id] || UtensilsCrossed;

const targetLabel = (steps, target) => (target === 'extra' ? 'Extra snack' : `Added to ${steps.find((s) => s.id === target)?.label || 'a meal'}`);
export { targetLabel };

const photo = (data, id) => data.images?.[id] || null;

export function makeAdapter(kind) {
  if (kind === 'basic') {
    return {
      kind,
      calendarUrl: '/planner/calendar-window',
      fullDayUrl: '/meals/full-day',
      dayUrl: (d) => `/planner/day/${d}`,
      recsUrl: '/meals/recommendations',
      recsParams: ({ stepId, dietType, cuisine, date, seed, picks, addons }) => {
        const q = { mealType: stepId, dietType, cuisine, date, seed };
        BASIC_STEPS.forEach((s) => { if (picks[s.id]) q[`${s.id}Id`] = picks[s.id]._id; });
        addons.forEach((a) => { if (a.target !== 'extra' && picks[a.target]) q[`${a.target}AddonId`] = a.mealId; });
        return q;
      },
      parseDay: (data) => {
        const picks = {}; const addons = [];
        data.plan.items.forEach((i) => {
          if (i.addon) {
            const t = i.addedTo || i.slot;
            addons.push({ mealId: i.mealId, name: i.mealName, imageUrl: photo(data, i.mealId), target: t, targetLabel: targetLabel(BASIC_STEPS, t), meal: { _id: i.mealId, name: i.mealName, imageUrl: photo(data, i.mealId), nutritionPerServing: i.nutrition } });
          } else picks[i.slot] = { _id: i.mealId, name: i.mealName, imageUrl: photo(data, i.mealId), nutritionPerServing: i.nutrition };
        });
        return { picks, addons: addons.filter((a) => picks[a.target]) };
      },
      saveBody: (picks, addons) => ({
        breakfastMealId: picks.breakfast?._id, lunchMealId: picks.lunch?._id, dinnerMealId: picks.dinner?._id,
        addons: addons.filter((a) => picks[a.target]).map((a) => ({ mealId: a.mealId, target: a.target }))
      })
    };
  }
  const base = `/${kind}`;
  return {
    kind,
    base,
    calendarUrl: `${base}/calendar-window`,
    fullDayUrl: `${base}/full-day`,
    dayUrl: (d) => `${base}/day/${d}`,
    recsUrl: `${base}/recommendations`,
    recsParams: ({ stepId, dietType, cuisine, date, seed, picks }) => ({
      stepId, dietType, cuisine, date, seed,
      picks: Object.entries(picks).filter(([, m]) => m).map(([k, m]) => `${k}:${m._id}`).join(',')
    }),
    parseDay: (data) => {
      const picks = {}; const addons = [];
      data.plan.items.forEach((i) => {
        if (i.addon) addons.push({ mealId: i.mealId, name: i.mealName, imageUrl: photo(data, i.mealId), target: i.addedTo || 'extra', targetLabel: i.label || 'Extra snack', meal: { _id: i.mealId, name: i.mealName, imageUrl: photo(data, i.mealId), nutritionPerServing: i.nutrition } });
        else picks[i.stepId] = { _id: i.mealId, name: i.mealName, imageUrl: photo(data, i.mealId), nutritionPerServing: i.nutrition };
      });
      return { picks, addons };
    },
    saveBody: (picks, addons) => ({
      picks: Object.fromEntries(Object.entries(picks).filter(([, m]) => m).map(([k, m]) => [k, m._id])),
      addons: addons.map((a) => ({ mealId: a.mealId, target: a.target }))
    })
  };
}
