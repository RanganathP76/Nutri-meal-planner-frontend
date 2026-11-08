import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { todayKey } from '../utils/date';
import { PLAN_NAMES } from '../utils/plans';
import NutritionSummary from '../components/NutritionSummary';
import './Home.css';

const SLOTS = [['breakfast', '🌅'], ['lunch', '☀️'], ['dinner', '🌙']];
const NO_TOTALS = { calories: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0 };

export default function Home() {
  const { user } = useAuth();
  const planType = user.activePlan?.isActive ? user.activePlan.planType : 'basic';
  const custom = planType === 'gym' || planType === 'individual';
  const base = `/${planType}`;
  const [todayPlan, setTodayPlan] = useState(null);
  const [balance, setBalance] = useState(null);
  const [targets, setTargets] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);

  

  useEffect(() => {
    const today = todayKey();
          Promise.allSettled([api.get(custom ? `${base}/day/${today}` : `/planner/day/${today}`), api.get('/wallet/my-wallet'), api.get(custom ? `${base}/profile` : '/meals/targets')])
      .then(([day, wal, tar]) => {
                if (day.status === 'fulfilled') setTodayPlan(day.value.data.plan);
        else if (day.reason?.response?.data?.code === 'SUBSCRIPTION_REQUIRED') setLocked(true);
        if (day.status === 'fulfilled') setTodayPlan(day.value.data.plan);
        if (wal.status === 'fulfilled') setBalance(wal.value.data.balance);
        if (tar.status === 'fulfilled') setTargets(tar.value.data.targets);
        setLoading(false);
      });
  }, []);

  const plan = user.activePlan;
  const mealName = (slot) => todayPlan?.items.find((i) => i.slot === slot)?.mealName;

  return (
    <div className="stack">
      <div>
        <h2>Hello, {user.fullName.split(' ')[0]} 👋</h2>
        <p className="muted">What shall we cook today?</p>
      </div>

      <div className="card plan-card">
        <span className="muted">Your plan</span>
        {plan?.isActive ? (
          <>
            <strong>{PLAN_NAMES[plan.planType] || plan.planType}</strong>
            <span className="muted">Valid till {new Date(plan.expiresAt).toLocaleDateString('en-IN')}</span>
          </>
        ) : (
          <>
            <strong>No active subscription</strong>
            <Link to="/plans" className="link">See plans →</Link>
          </>
        )}
      </div>

            {locked ? (
        <div className="card stack">
          <h3 className="page-title">Plan your meals</h3>
          <p className="muted">Look through our meals for free. A plan gives you nutrition details and daily recommendations.</p>
          <Link to="/planner" className="btn btn-light">Browse meals</Link>
          <Link to="/plans" className="btn btn-primary">See plans</Link>
        </div>
      ) : (
        <div className="card stack">
          <h3 className="page-title">Today's meals</h3>
          {loading ? <p className="center-note">Loading...</p> : (
            <>
                            {custom ? (
                todayPlan?.items.length
                  ? todayPlan.items.map((i) => (
                      <div key={i.stepId || i.slot} className="today-row"><span><strong>{i.label}</strong></span><span>{i.mealName}</span></div>
                    ))
                  : <p className="muted">Nothing planned yet</p>
              ) : (
                SLOTS.map(([slot, icon]) => (
                  <div key={slot} className="today-row">
                    <span>{icon} <strong style={{ textTransform: 'capitalize' }}>{slot}</strong></span>
                    <span className={mealName(slot) ? '' : 'muted'}>{mealName(slot) || 'Not planned'}</span>
                  </div>
                ))
              )}
              {custom && !targets && <Link to={`${base}/setup`} className="btn btn-light">Set up your profile</Link>}
              <NutritionSummary targets={targets} eaten={todayPlan?.totals || NO_TOTALS} />
            </>
          )}
          <Link to="/planner" className="btn btn-primary">{todayPlan ? "Change today's plan" : 'Start new meal plan'}</Link>
        </div>
      )}

      <div className="quick-row">
        {SLOTS.map(([slot, icon]) => (
          <Link key={slot} to={`/planner?slot=${slot}`} className="quick">
            <span>{icon}</span>
            <span style={{ textTransform: 'capitalize' }}>{slot}</span>
          </Link>
        ))}
      </div>

      <Link to="/wallet" className="card earn">
        <span className="muted">Referral earnings</span>
        <strong>₹{balance ?? 0}</strong>
      </Link>
    </div>
  );
}