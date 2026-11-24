import { addDays } from '../utils/date';

const wk = (key) => new Date(`${key}T00:00:00Z`).toLocaleDateString('en-IN', { weekday: 'short', timeZone: 'UTC' });
const dn = (key) => Number(key.slice(8));

// Today and the next 5 days. A dot marks a day that already has a saved plan.
export default function DateRibbon({ today, value, onChange, saved }) {
  const days = Array.from({ length: 6 }, (_, i) => addDays(today, i));
  return (
    <div className="ribbon" role="group" aria-label="Choose a day">
      {days.map((d) => (
        <button key={d} type="button" aria-pressed={value === d} onClick={() => onChange(d)} aria-label={`${d === today ? 'Today, ' : ''}${wk(d)} ${dn(d)}${saved.has(d) ? ', plan saved' : ''}`}>
          <small>{d === today ? 'Today' : wk(d)}</small>
          <b>{dn(d)}</b>
          <i className={saved.has(d) ? 'on' : ''} />
        </button>
      ))}
    </div>
  );
}
