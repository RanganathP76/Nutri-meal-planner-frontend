import { NUTRIENT_GROUP_TITLES } from '../utils/health';

// Daily vitamin, mineral and other limits worked out for this person (age, gender and the calorie target)
export default function MicroTargets({ micro }) {
  if (!micro) return null;
  const cell = (v, unit) => (v == null ? <span className="na">-</span> : `${v} ${unit}`);
  return (
    <details className="card micro-targets">
      <summary><strong>Your daily vitamin and mineral needs</strong></summary>
      <p className="muted">Worked out from your age, gender and calorie target. "At least" is what to aim for each day. "No more than" is a daily limit. A dash means no standard is set. General guidance only, not medical advice.</p>
      {Object.entries(micro).map(([group, list]) => (
        <div key={group} className="nut-group">
          <strong>{NUTRIENT_GROUP_TITLES[group]}</strong>
          <table className="nut-table">
            <thead><tr><th align="left">Nutrient</th><th>At least</th><th>No more than</th></tr></thead>
            <tbody>
              {Object.entries(list).map(([key, v]) => (
                <tr key={key}>
                  <td>{v.label}{v.note && <small className="muted"> ({v.note})</small>}</td>
                  <td>{cell(v.min, v.unit)}</td>
                  <td>{cell(v.max, v.unit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </details>
  );
}
