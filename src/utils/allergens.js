// Same keys as the backend (config/allergens.js). The backend does the hiding; this is only the list to tick.
export const ALLERGENS = [
  ['peanuts', 'Peanuts'],
  ['tree_nuts', 'Tree nuts (almond, cashew, walnut, pistachio)'],
  ['dairy', 'Milk and dairy (curd, paneer, ghee)'],
  ['egg', 'Egg'],
  ['gluten', 'Wheat and gluten'],
  ['soy', 'Soy'],
  ['fish', 'Fish'],
  ['shellfish', 'Shellfish (prawn, crab)'],
  ['sesame', 'Sesame'],
  ['mustard', 'Mustard']
];

// Whole years on a day, from "YYYY-MM-DD" (same rule as the server). Shown while typing; the server decides.
export function ageFromDob(dob, today = new Date()) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob || '');
  if (!m) return null;
  let age = today.getFullYear() - Number(m[1]);
  const before = today.getMonth() + 1 < Number(m[2]) || (today.getMonth() + 1 === Number(m[2]) && today.getDate() < Number(m[3]));
  if (before) age -= 1;
  return age;
}

const pad = (n) => String(n).padStart(2, '0');
const key = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
// Latest date of birth allowed (18 today) and earliest (75)
export const dobLimits = (today = new Date()) => ({
  max: key(new Date(today.getFullYear() - 18, today.getMonth(), today.getDate())),
  min: key(new Date(today.getFullYear() - 76, today.getMonth(), today.getDate() + 1))
});
