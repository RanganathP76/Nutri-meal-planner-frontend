import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sunrise, Sun, Moon, ChevronRight, Wallet as WalletIcon, Sparkles } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { todayKey } from '../utils/date';
import { PLAN_NAMES } from '../utils/plans';
import { Card, Chip, Progress, Ring, Row, Skeleton, Segmented } from '../ui/Kit';
import './Home.css';

const SLOTS = [['breakfast', Sunrise], ['lunch', Sun], ['dinner', Moon]];
const NO_TOTALS = { calories: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0 };
const MACROS = [['protein', 'Protein', 'g'], ['carbohydrates', 'Carbs', 'g'], ['fat', 'Fat', 'g'], ['fiber', 'Fibre', 'g']];

const daysLeft = (iso) => Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000));
const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };

export default function Home() {
  const { user } = useAuth();
  const plan = user.activePlan;
  const planType = plan?.isActive ? plan.planType : 'basic';
  const custom = planType === 'gym' || planType === 'individual';
  const base = `/${planType}`;
  const [todayPlan, setTodayPlan] = useState(null);
  const [balance, setBalance] = useState(null);
  const [targets, setTargets] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [view, setView] = useState('meals');

  useEffect(() => {
    const today = todayKey();
    Promise.allSettled([
      api.get(custom ? `${base}/day/${today}` : `/planner/day/${today}`),
      api.get('/wallet/my-wallet'),
      api.get(custom ? `${base}/profile` : '/meals/targets')
    ]).then(([day, wal, tar]) => {
      if (day.status === 'fulfilled') setTodayPlan(day.value.data.plan);
      else if (day.reason?.response?.data?.code === 'SUBSCRIPTION_REQUIRED') setLocked(true);
      if (wal.status === 'fulfilled') setBalance(wal.value.data.balance);
      if (tar.status === 'fulfilled') setTargets(tar.value.data.targets);
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const eaten = todayPlan?.totals || NO_TOTALS;
  const kcalPct = targets?.calories ? (eaten.calories / targets.calories) * 100 : 0;
  const left = (key) => Math.max(0, Math.round((targets?.[key] || 0) - (eaten[key] || 0)));
  const mealName = (slot) => todayPlan?.items.find((i) => i.slot === slot)?.mealName;
  const first = user.fullName.split(' ')[0];

  return (
    <div className="stack home">
      <div className="home-top">
        <div>
          <p className="ui-muted">{greeting()}</p>
          <h1 className="home-hello">{first}</h1>
        </div>
        {plan?.isActive && <Chip tone="dark">{planType === 'basic' ? 'Basic' : planType === 'gym' ? 'Gym' : 'Individual'}</Chip>}
      </div>

      {plan?.isActive ? (
        <Card hero>
          <div className="home-plan">
            <div>
              <p className="ui-muted">Your plan</p>
              <h2>{PLAN_NAMES[plan.planType] || plan.planType}</h2>
              <p className="ui-muted">{daysLeft(plan.expiresAt)} days left, until {new Date(plan.expiresAt).toLocaleDateString('en-IN')}</p>
            </div>
            <Link to="/plans" className="home-manage">Manage <ChevronRight size={16} aria-hidden="true" /></Link>
          </div>
        </Card>
      ) : (
        <Card hero>
          <h2>Start with a plan</h2>
          <p className="ui-muted">Browse meals for free. A plan adds nutrition details and daily recommendations.</p>
          <Link to="/plans" className="ui-btn accent block">See plans</Link>
        </Card>
      )}

      {locked ? (
        <Card>
          <h3>Plan your meals</h3>
          <p className="ui-muted">Look through our meals for free. A plan unlocks portions, nutrients and daily picks.</p>
          <Link to="/planner" className="ui-btn soft block">Browse meals</Link>
        </Card>
      ) : (
        <Card>
          <div className="home-card-head">
            <h3>Today</h3>
            <Segmented value={view} onChange={setView} label="Today view" options={[['meals', 'Meals'], ['nutrition', 'Nutrition']]} />
          </div>

          {loading ? <Skeleton height={140} /> : view === 'meals' ? (
            <>
              <ul className="ui-list">
                {custom ? (
                  todayPlan?.items.length
                    ? todayPlan.items.map((i) => <li key={i.stepId || i.slot}><Row value={i.mealName}>{i.label}</Row></li>)
                    : <li><p className="ui-muted" style={{ padding: '12px 0' }}>Nothing planned yet.</p></li>
                ) : (
                  SLOTS.map(([slot, Icon]) => (
                    <li key={slot}>
                      <Row icon={<Icon size={18} className="home-slot-icon" aria-hidden="true" />} value={mealName(slot) || 'Not planned'}>
                        <span style={{ textTransform: 'capitalize' }}>{slot}</span>
                      </Row>
                    </li>
                  ))
                )}
              </ul>
              {custom && !targets && <Link to={`${base}/setup`} className="ui-btn soft block">Set up your profile</Link>}
            </>
          ) : targets ? (
            <div className="home-nutri">
              <Ring value={kcalPct} size={132} label={left('calories')} sub="kcal left" />
              <div className="home-macros">
                {MACROS.map(([key, label, unit]) => (
                  <div key={key}>
                    <div className="home-macro-row"><span>{label}</span><span className="ui-muted">{Math.round(eaten[key] || 0)} / {Math.round(targets[key] || 0)} {unit}</span></div>
                    <Progress value={targets[key] ? ((eaten[key] || 0) / targets[key]) * 100 : 0} />
                  </div>
                ))}
              </div>
            </div>
          ) : <p className="ui-muted">Your targets will show here once your profile is set up.</p>}

          <Link to="/planner" className="ui-btn primary block">{todayPlan?.items?.length ? "Change today's plan" : 'Plan my day'}</Link>
          <p className="ui-muted home-note">Numbers are estimates, not medical advice.</p>
        </Card>
      )}

      <div className="home-quick">
        {SLOTS.map(([slot, Icon]) => (
          <Link key={slot} to={`/planner?slot=${slot}`} className="home-tile">
            <span className="home-tile-icon"><Icon size={22} aria-hidden="true" /></span>
            <span style={{ textTransform: 'capitalize' }}>{slot}</span>
          </Link>
        ))}
      </div>

      <Card as={Link} to="/wallet" className="home-earn">
        <span className="home-tile-icon"><WalletIcon size={20} aria-hidden="true" /></span>
        <div><p className="ui-muted">Referral earnings</p><strong>₹{balance ?? 0}</strong></div>
        <ChevronRight size={18} aria-hidden="true" />
      </Card>

      {!custom && (
        <Card flat as={Link} to="/plans" className="home-upsell">
          <span className="home-tile-icon"><Sparkles size={20} aria-hidden="true" /></span>
          <div><strong>Training or have a health goal?</strong><p className="ui-muted">Gym and Individual plans build targets around you.</p></div>
        </Card>
      )}
    </div>
  );
}
