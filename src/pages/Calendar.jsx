import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Plus, Pencil } from 'lucide-react';
import api, { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { addDays, todayKey } from '../utils/date';
import { stepIcon } from '../planner/adapters';
import { Button, Card, Chip, Empty, Segmented, Skeleton } from '../ui/Kit';
import './Calendar.css';

const title = (s) => s.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
const parts = (key) => {
  const d = new Date(`${key}T00:00:00Z`);
  return { wk: d.toLocaleDateString('en-IN', { weekday: 'short', timeZone: 'UTC' }), day: d.getUTCDate(), mon: d.toLocaleDateString('en-IN', { month: 'short', timeZone: 'UTC' }) };
};

function DayCard({ day, plan, today }) {
  const p = parts(day);
  const editable = day >= today;
  return (
    <article className={`cal-day${day === today ? ' today' : ''}`}>
      <div className="cal-date"><small>{p.wk}</small><b>{p.day}</b><small>{p.mon}</small></div>
      <div className="cal-main">
        <div className="cal-top">
          <span>{day === today ? <Chip tone="dark">Today</Chip> : plan ? <Chip>Planned</Chip> : <span className="ui-muted">No plan</span>}</span>
          {editable && <Link className="cal-edit" to={`/planner?date=${day}`}>{plan ? <><Pencil size={14} aria-hidden="true" /> Edit</> : <><Plus size={14} aria-hidden="true" /> Plan</>}</Link>}
        </div>
        {plan && (
          <>
            <ul className="cal-items">
              {plan.items.map((i) => {
                const Icon = stepIcon(i.stepId || i.slot);
                return <li key={`${i.stepId || i.slot}-${i.mealId}`}><Icon size={16} aria-hidden="true" /><span><small>{i.label || title(i.slot)}</small>{i.mealName}</span></li>;
              })}
            </ul>
            <p className="ui-muted">{Math.round(plan.totals.calories)} kcal · {Math.round(plan.totals.protein)} g protein</p>
            <details className="fold">
              <summary>Nutrition details</summary>
              <div className="fold-body">
                {plan.items.map((i) => (
                  <div key={`d-${i.stepId || i.slot}-${i.mealId}`} className="cal-row"><span>{i.label || title(i.slot)}</span><span>{Math.round(i.nutrition.calories)} kcal · {Math.round(i.nutrition.protein)}p · {Math.round(i.nutrition.carbohydrates)}c · {Math.round(i.nutrition.fat)}f</span></div>
                ))}
                <div className="cal-row total"><span>Day total</span><span>{Math.round(plan.totals.calories)} kcal · {Math.round(plan.totals.protein)}p · {Math.round(plan.totals.carbohydrates)}c · {Math.round(plan.totals.fat)}f · {Math.round(plan.totals.fiber)} fibre</span></div>
              </div>
            </details>
          </>
        )}
      </div>
    </article>
  );
}

export default function Calendar() {
  const { user } = useAuth();
  const planType = user.activePlan?.isActive ? user.activePlan.planType : 'basic';
  const base = planType === 'gym' ? '/gym' : planType === 'individual' ? '/individual' : '/planner';
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [locked, setLocked] = useState(false);
  const [tab, setTab] = useState('upcoming');

  useEffect(() => {
    api.get(`${base}/calendar-window`)
      .then((res) => setData(res.data))
      .catch((err) => {
        if (err.response?.data?.code === 'SUBSCRIPTION_REQUIRED') setLocked(true);
        else setError(errorMessage(err));
      });
  }, [base]);

  if (locked) {
    return (
      <Card className="cal-lock">
        <Lock size={22} aria-hidden="true" />
        <h3>Your meal calendar needs a plan</h3>
        <p className="ui-muted">Subscribe to plan your meals and see your saved days here.</p>
        <Link to="/plans" className="ui-btn primary block">See plans</Link>
      </Card>
    );
  }
  if (error) return <p className="error-text">{error}</p>;
  if (!data) return <div className="stack"><Skeleton height={48} /><Skeleton height={140} /><Skeleton height={140} /></div>;

  const { historyStart, futureLimit } = data.window;
  const today = todayKey();
  const byDate = Object.fromEntries(data.plans.map((p) => [p.dateKey, p]));
  const range = [];
  for (let d = historyStart; d <= futureLimit; d = addDays(d, 1)) range.push(d);
  const upcoming = range.filter((d) => d >= today);
  const history = range.filter((d) => d < today).reverse();
  const shown = tab === 'upcoming' ? upcoming : history;
  const savedCount = range.filter((d) => byDate[d]).length;

  return (
    <div className="cal">
      <header className="cal-head">
        <p className="ui-eyebrow">Your meal calendar</p>
        <h1 className="ui-title">Days you <em>planned</em></h1>
        <p className="ui-muted">{savedCount} saved {savedCount === 1 ? 'day' : 'days'}. We keep the last 10 days and the next 5. Older plans are removed automatically.</p>
      </header>
      <Segmented value={tab} onChange={setTab} label="Calendar view" options={[['upcoming', `Upcoming (${upcoming.length})`], ['history', `History (${history.length})`]]} />
      {shown.length === 0 ? <Empty title="Nothing here yet" text="Days will show up as you plan them." action={<Link to="/planner" className="ui-btn primary small">Plan a day</Link>} /> : (
        <div className="cal-list">{shown.map((d) => <DayCard key={d} day={d} plan={byDate[d]} today={today} />)}</div>
      )}
      <Button variant="soft" block onClick={() => setTab(tab === 'upcoming' ? 'history' : 'upcoming')}>{tab === 'upcoming' ? 'See past days' : 'See upcoming days'}</Button>
    </div>
  );
}
