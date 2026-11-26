// How well a day (or one nutrient) is covered, in plain words. Nobody eats exactly 100% of every number every day,
// so the app says "Great" or "Good" and keeps the percent small. These are estimates, not medical advice.
//  ratio: eaten divided by target (0.8 means 80%)
const BANDS = [
  [0, 'Not planned', 'none'],
  [0.5, 'Low', 'low'],
  [0.75, 'Fair', 'fair'],
  [0.9, 'Good', 'good'],
  [1.1, 'Great', 'great'],
  [1.25, 'A bit high', 'high'],
  [Infinity, 'High', 'high']
];

export function balanceOf(eaten, target) {
  const t = Number(target);
  const e = Number(eaten);
  if (!(t > 0) || !Number.isFinite(e) || e <= 0) return { label: 'Not planned', tone: 'none', percent: 0 };
  const ratio = e / t;
  // "Great" is the 90 to 110 percent band. Anything under 50 is Low.
  const band = ratio < 0.5 ? BANDS[1] : ratio < 0.75 ? BANDS[2] : ratio < 0.9 ? BANDS[3] : ratio <= 1.1 ? BANDS[4] : ratio <= 1.25 ? BANDS[5] : BANDS[6];
  return { label: band[1], tone: band[2], percent: Math.round(ratio * 100) };
}

// Good is also fine to stop at: 75 percent and up counts as a well-covered day
export const isCovered = (b) => b.tone === 'good' || b.tone === 'great';

// The nutrient that is furthest below its target (only counts nutrients with a target)
export function weakest(eaten, targets, keys) {
  let worst = null;
  for (const k of keys) {
    if (!(targets?.[k] > 0)) continue;
    const r = (eaten?.[k] || 0) / targets[k];
    if (!worst || r < worst.ratio) worst = { key: k, ratio: r };
  }
  return worst;
}
