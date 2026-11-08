import './NutritionSummary.css';

const ROWS = [
  ['calories', 'Calories', 'kcal'],
  ['protein', 'Protein', 'g'],
  ['carbohydrates', 'Carbs', 'g'],
  ['fat', 'Fat', 'g'],
  ['fiber', 'Fibre', 'g']
];

// Display only. The numbers come from the server.
export default function NutritionSummary({ targets, eaten }) {
  if (!targets || !eaten) return null;
  const pct = Math.min((eaten.calories / targets.calories) * 100, 100);
  const left = (key) => Math.max(0, Math.round(targets[key] - eaten[key]));

  return (
    <div className="nutri">
      <div className="nutri-row">
        <span>Eaten: <strong>{Math.round(eaten.calories)} / {Math.round(targets.calories)} kcal</strong></span>
        <span>Protein: <strong>{Math.round(eaten.protein)} / {Math.round(targets.protein)} g</strong></span>
      </div>
      <div className="nutri-bar"><div style={{ width: `${pct}%` }} /></div>
      <div className="nutri-left">Still to eat today: <strong>{left('calories')} kcal</strong> · <strong>{left('protein')} g protein</strong></div>
      <details>
        <summary>More details</summary>
        <table className="nutri-table">
          <thead><tr><th></th><th>Target</th><th>Eaten</th><th>Left</th></tr></thead>
          <tbody>
            {ROWS.map(([key, label, unit]) => (
              <tr key={key}>
                <td>{label}</td>
                <td>{Math.round(targets[key])} {unit}</td>
                <td>{Math.round(eaten[key])}</td>
                <td>{left(key)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}