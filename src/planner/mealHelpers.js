const KEYS = ['calories', 'protein', 'carbohydrates', 'fat', 'fiber'];
const r1 = (x) => Math.round(x * 10) / 10;

// A meal plus its add-on, added together (the server works out the same numbers when the day is saved)
export function combineNutrition(n, a) {
  return Object.fromEntries(KEYS.map((k) => [k, r1((Number(n?.[k]) || 0) + (Number(a?.[k]) || 0))]));
}

// A vitamin or mineral is known only when both foods have it; otherwise it stays NA
export function combineDetailed(d, e) {
  if (!d || !e) return d;
  const out = {};
  for (const [group, values] of Object.entries(d)) {
    out[group] = Object.fromEntries(Object.entries(values || {}).map(([k, v]) => {
      const w = e?.[group]?.[k];
      return [k, v == null || w == null ? null : r1(Number(v) + Number(w))];
    }));
  }
  return out;
}
