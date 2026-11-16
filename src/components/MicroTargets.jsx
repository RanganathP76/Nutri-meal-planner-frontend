import { NUTRIENT_GROUP_TITLES } from '../utils/health';

// Daily vitamin, mineral and other numbers worked out for this person from the ICMR-NIN 2020 tables
// (age, sex) and the calorie target (which holds height, weight, activity and goal).
export default function MicroTargets({ micro }) {
  if (!micro) return null;
  const cell = (v, unit) => (v == null ? <span className="na">-</span> : `${v} ${unit}`);
  const first = Object.values(micro).flatMap((g) => Object.values(g))[0];
  return (
    <details className="card micro-targets">
      <summary><strong>Your daily vitamin and mineral needs</strong></summary>
      <p className="muted">
        Based on ICMR-NIN 2020 (Nutrient Requirements for Indians){first?.band ? ` for: ${first.band}` : ''}, and your calorie target.
        "Aim for" is the RDA, or the AI where there is not enough evidence for an RDA. "Stay under" is a public-health limit,
        or a stricter one for your health condition. "Upper limit" is the highest safe daily intake; where it says
        "supplements only", it is about tablets and fortified food, not normal meals. A dash means no standard is set.
        General guidance only, not medical advice.
      </p>
      {Object.entries(micro).map(([group, list]) => (
        <div key={group} className="nut-group">
          <strong>{NUTRIENT_GROUP_TITLES[group]}</strong>
          <table className="nut-table">
            <thead><tr><th align="left">Nutrient</th><th>Aim for</th><th>Stay under</th><th>Upper limit</th></tr></thead>
            <tbody>
              {Object.entries(list).map(([key, v]) => (
                <tr key={key}>
                  <td>{v.label}{v.note && <small className="muted"> ({v.note})</small>}</td>
                  <td>{cell(v.min, v.unit)}{v.min != null && v.minKind && <small className="muted"> {v.minKind}</small>}</td>
                  <td>{cell(v.max, v.unit)}</td>
                  <td>{cell(v.ul, v.unit)}{v.ul != null && v.ulScope === 'supplement' && <small className="muted"> supplements only</small>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </details>
  );
}
