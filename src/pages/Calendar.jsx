import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { addDays, formatDay } from '../utils/date';
import './Calendar.css';

const ICON = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', pre_workout: '⚡', post_workout: '💪', midday_snack: '🍎', snack: '🍎', before_bed: '😴' };
const title = (s) => s.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

export default function Calendar() {
  const { user } = useAuth();
  const planType = user.activePlan?.isActive ? user.activePlan.planType : 'basic';
  const base = planType === 'gym' ? '/gym' : planType === 'individual' ? '/individual' : '/planner';
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [locked, setLocked] = useState(false);

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
      <div className="card stack">
        <strong>🔒 Your meal calendar needs a plan</strong>
        <p className="muted">Subscribe to plan your meals and see your saved days here.</p>
        <Link to="/plans" className="btn btn-primary">See plans</Link>
      </div>
    );
  }
  if (error) return <p className="error-text">{error}</p>;
  if (!data) return <p className="center-note">Loading calendar...</p>;

  const { historyStart, today, futureLimit } = data.window;
  const byDate = Object.fromEntries(data.plans.map((p) => [p.dateKey, p]));
  const days = [];
  for (let d = historyStart; d <= futureLimit; d = addDays(d, 1)) days.push(d);

  return (
    <div className="stack">
      <div>
        <h3 className="page-title">Meal calendar</h3>
        <p className="muted">Last 10 days and the next 5 days. Older plans are removed automatically.</p>
      </div>

      {days.map((day) => {
        const plan = byDate[day];
        const editable = day >= today;
        return (
          <div key={day} className={`card day ${day === today ? 'today' : ''} ${!plan && !editable ? 'faded' : ''}`}>
            <div className="day-head">
              <strong>{formatDay(day)}</strong>
              {day === today && <span className="tag tag-green">Today</span>}
              {editable && <Link className="plan-link" to={`/planner?date=${day}`}>{plan ? 'Edit' : 'Plan'}</Link>}
            </div>

            {plan ? (
              <div className="day-meals">
                {plan.items.map((i) => (
                  <div key={i.stepId || i.slot}>{ICON[i.slot]} <strong>{i.label || title(i.slot)}:</strong> {i.mealName}</div>
                ))}
                <div className="muted">{Math.round(plan.totals.calories)} kcal · {Math.round(plan.totals.protein)} g protein</div>
                <details className="day-details">
                  <summary>Nutrition details</summary>
                  {plan.items.map((i) => (
                    <div key={`d-${i.stepId || i.slot}`} className="detail-row">
                      <span>{i.label || title(i.slot)}</span>
                      <span>{Math.round(i.nutrition.calories)} kcal · {Math.round(i.nutrition.protein)}p · {Math.round(i.nutrition.carbohydrates)}c · {Math.round(i.nutrition.fat)}f</span>
                    </div>
                  ))}
                  <div className="detail-row total">
                    <span>Day total</span>
                    <span>{Math.round(plan.totals.calories)} kcal · {Math.round(plan.totals.protein)}p · {Math.round(plan.totals.carbohydrates)}c · {Math.round(plan.totals.fat)}f · {Math.round(plan.totals.fiber)} fibre</span>
                  </div>
                </details>
              </div>
            ) : (
              <span className="muted">No plan</span>
            )}
          </div>
        );
      })}
    </div>
  );
}