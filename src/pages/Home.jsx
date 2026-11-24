import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight, Droplets, Plus, Sparkles, Wallet as WalletIcon } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { addDays, todayKey } from '../utils/date';
import { PLAN_NAMES } from '../utils/plans';
import { BASIC_STEPS, stepIcon } from '../planner/adapters';
import { Card, Chip, Photo, Progress, Ring, Skeleton } from '../ui/Kit';
import './Home.css';

const NO_TOTALS = { calories: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0 };
const MACROS = [['protein', 'Protein', 'lilac'], ['carbohydrates', 'Carbs', 'accent'], ['fat', 'Fat', 'sky'], ['fiber', 'Fibre', '']];
const daysLeft = (iso) => Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000));
const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };
const wk = (key) => new Date(`${key}T00:00:00Z`).toLocaleDateString('en-IN', { weekday: 'narrow', timeZone: 'UTC' });

export default function Home() {
  const { user } = useAuth();
  const plan = user.activePlan;
  const planType = plan?.isActive ? plan.planType : 'basic';
  const custom = planType === 'gym' || planType === 'individual';
  const base = `/${planType}`;
  const today = todayKey();
  const [day, setDay] = useState(null);
  const [balance, setBalance] = useState(null);
  const [profile, setProfile] = useState(null);
  const [planSteps, setPlanSteps] = useState([]);
  const [targets, setTargets] = useState(null);
  const [saved, setSaved] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    Promise.allSettled([
      api.get(custom ? `${base}/day/${today}` : `/planner/day/${today}`),
      api.get('/wallet/my-wallet'),
      api.get(custom ? `${base}/profile` : '/meals/targets'),
      api.get(custom ? `${base}/calendar-window` : '/planner/calendar-window')
    ]).then(([d, w, t, c]) => {
      if (d.status === 'fulfilled') setDay(d.value.data);
      else if (d.reason?.response?.data?.code === 'SUBSCRIPTION_REQUIRED') setLocked(true);
      if (w.status === 'fulfilled') setBalance(w.value.data.balance);
      if (t.status === 'fulfilled') { setTargets(t.value.data.targets); setProfile(t.value.data.profile || null); setPlanSteps(t.value.data.steps || []); }
      if (c.status === 'fulfilled') setSaved(new Set(c.value.data.plans.filter((p) => p.items?.length).map((p) => p.dateKey)));
      setLoading(false);
    });
  // runs once per mount; the plan type does not change while this screen is open
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const items = (day?.plan?.items || []).filter((i) => !i.addon);
  const eaten = day?.plan?.totals || NO_TOTALS;
  const kcalPct = targets?.calories ? (eaten.calories / targets.calories) * 100 : 0;
  const left = Math.max(0, Math.round((targets?.calories || 0) - eaten.calories));
  const steps = custom ? planSteps : BASIC_STEPS;
  const byStep = (id) => items.find((i) => (i.stepId || i.slot) === id);
  const first = (user.fullName || 'there').split(' ')[0];
  const needsSetup = custom && !loading && !profile;
  const week = Array.from({ length: 6 }, (_, i) => addDays(today, i));

  return (
    <div className="home">
      <header className="home-top">
        <p className="ui-eyebrow">{greeting()}</p>
        <h1 className="home-hello">Hello, <em>{first}</em></h1>
      </header>

      {locked ? (
        <Card hero className="home-hero">
          <p className="ui-eyebrow" style={{ color: 'var(--accent)' }}>Free to browse</p>
          <h2>Look through our meals</h2>
          <p className="ui-muted">A plan unlocks portions, nutrients and daily picks that fit you.</p>
          <div className="home-cta"><Link to="/planner" className="ui-btn accent">Browse meals</Link><Link to="/plans" className="ui-btn ghost">See plans</Link></div>
        </Card>
      ) : (
        <Card hero className="home-hero">
          {loading ? <Skeleton height={150} /> : needsSetup ? (
            <>
              <p className="ui-eyebrow" style={{ color: 'var(--accent)' }}>One quick step</p>
              <h2>Set up your profile</h2>
              <p className="ui-muted">Tell us a few things about you so your targets and portions fit your body.</p>
              <Link to={`${base}/setup`} className="ui-btn accent">Start <ArrowRight size={18} aria-hidden="true" /></Link>
            </>
          ) : (
            <>
              <div className="home-ring-row">
                <Ring value={kcalPct} size={128} stroke={13} label={targets ? left : '–'} sub="kcal left" color="var(--accent)" track="rgba(255,255,255,.16)" />
                <div className="home-ring-text">
                  <p className="ui-muted">Planned for today</p>
                  <h2>{Math.round(eaten.calories)}{targets ? <small> / {Math.round(targets.calories)} kcal</small> : <small> kcal</small>}</h2>
                  {targets?.waterLitres ? <span className="home-water"><Droplets size={15} aria-hidden="true" /> {targets.waterLitres} L water</span> : null}
                </div>
              </div>
              {targets && (
                <div className="home-macros">
                  {MACROS.map(([k, label, tone]) => (
                    <div key={k}>
                      <span>{label}<b>{Math.round(eaten[k] || 0)}<i>/{Math.round(targets[k] || 0)}g</i></b></span>
                      <Progress value={targets[k] ? ((eaten[k] || 0) / targets[k]) * 100 : 0} tone={`${tone} hero`} />
                    </div>
                  ))}
                </div>
              )}
              <Link to="/planner" className="ui-btn accent block">{items.length ? "Change today's plan" : 'Plan my day'} <ArrowRight size={18} aria-hidden="true" /></Link>
            </>
          )}
        </Card>
      )}

      {!locked && !needsSetup && (
        <section aria-label="Today's meals">
          <div className="home-sec"><h2>Today's plate</h2><Link to="/planner">Open planner <ChevronRight size={16} aria-hidden="true" /></Link></div>
          {loading ? <Skeleton height={120} /> : steps.length === 0 ? (
            <Card cream className="home-empty"><p>Nothing planned yet.</p><Link to="/planner" className="ui-btn primary small"><Plus size={16} aria-hidden="true" /> Add your first meal</Link></Card>
          ) : (
            <div className="home-meals">
              {steps.map((s) => {
                const it = byStep(s.id);
                const Icon = stepIcon(s.id);
                return (
                  <Link key={s.id} to={`/planner?step=${s.id}`} className={`home-meal${it ? ' full' : ''}`}>
                    {it ? <Photo src={day?.images?.[it.mealId] || null} alt="" className="home-meal-photo" iconSize={20} /> : <span className="home-meal-photo empty"><Icon size={22} aria-hidden="true" /></span>}
                    <span><small>{s.label}</small><b>{it ? it.mealName : 'Not planned'}</b>{it?.nutrition && <em>{Math.round(it.nutrition.calories)} kcal</em>}</span>
                    {!it && <Plus size={18} aria-hidden="true" />}
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      )}

      {!locked && (
        <section aria-label="This week">
          <div className="home-sec"><h2>This week</h2><Link to="/calendar">Calendar <ChevronRight size={16} aria-hidden="true" /></Link></div>
          <div className="home-week">
            {week.map((d) => (
              <Link key={d} to={`/planner?date=${d}`} className={d === today ? 'today' : ''} aria-label={`${d}${saved.has(d) ? ', plan saved' : ', no plan yet'}`}>
                <small>{wk(d)}</small><b>{Number(d.slice(8))}</b><i className={saved.has(d) ? 'on' : ''} />
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="home-pair">
        {plan?.isActive ? (
          <Card as={Link} to="/plans" className="home-mini">
            <Chip tone="dark">{planType === 'basic' ? 'Basic' : planType === 'gym' ? 'Gym' : 'Individual'}</Chip>
            <strong>{PLAN_NAMES[plan.planType] || plan.planType}</strong>
            <span className="ui-muted">{daysLeft(plan.expiresAt)} days left</span>
          </Card>
        ) : (
          <Card as={Link} to="/plans" className="home-mini accent">
            <Sparkles size={20} aria-hidden="true" />
            <strong>Start with a plan</strong>
            <span className="ui-muted">Unlock daily picks</span>
          </Card>
        )}
        <Card as={Link} to="/wallet" className="home-mini">
          <WalletIcon size={20} aria-hidden="true" />
          <strong>₹{balance ?? 0}</strong>
          <span className="ui-muted">Referral earnings</span>
        </Card>
      </div>

      {!custom && plan?.isActive && (
        <Card cream as={Link} to="/plans" className="home-upsell">
          <strong>Training or have a health goal?</strong>
          <span className="ui-muted">Gym and Individual plans build targets around you.</span>
        </Card>
      )}
      <p className="ui-muted home-note">Numbers are estimates to guide you, not medical advice.</p>
    </div>
  );
}
