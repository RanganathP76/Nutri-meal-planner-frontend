import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, Lightbulb, Plus, Sparkles, Target, UtensilsCrossed, Wallet as WalletIcon } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { addDays, todayKey } from '../utils/date';
import { PLAN_NAMES } from '../utils/plans';
import { balanceOf, weakest } from '../utils/balance';
import { BASIC_STEPS, stepIcon } from '../planner/adapters';
import { Button, Card, Chip, Photo, PhotoStack, Progress, Quality, Ring, Skeleton } from '../ui/Kit';
import './Home.css';

const NO_TOTALS = { calories: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0 };
const BARS = [['protein', 'Protein'], ['carbohydrates', 'Carbs'], ['fat', 'Fat'], ['fiber', 'Fibre']];
const daysLeft = (iso) => Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000));
const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };
const wk = (key) => new Date(`${key}T00:00:00Z`).toLocaleDateString('en-IN', { weekday: 'narrow', timeZone: 'UTC' });

const SUMMARY = {
  none: ['Nothing planned yet', 'Pick your first meal and we will show how balanced your day is.'],
  low: ['A light day so far', 'There is room for more food. Add a meal or an add-on.'],
  fair: ['Getting there', 'Your day is partly covered. One or two more picks will balance it.'],
  good: ['A good day', 'Well covered. You do not need to hit every number exactly.'],
  great: ['A great day', 'Your plan fits your targets closely.'],
  high: ['A little over', 'Your plan has more than your targets. Swap a meal for a lighter one if you like.']
};

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

  const all = day?.plan?.items || [];
  const items = all.filter((i) => !i.addon);
  const addonsOf = (stepId) => all.filter((i) => i.addon && (i.addedTo || i.slot) === stepId).map((i) => ({ name: i.mealName, imageUrl: day?.images?.[i.mealId] || null }));
  const eaten = day?.plan?.totals || NO_TOTALS;
  const steps = custom ? planSteps : BASIC_STEPS;
  const byStep = (id) => items.find((i) => (i.stepId || i.slot) === id);
  const next = steps.find((s) => !byStep(s.id));
  const first = (user.fullName || 'there').split(' ')[0];
  const needsSetup = custom && !loading && !profile;
  const week = Array.from({ length: 6 }, (_, i) => addDays(today, i));

  const overall = balanceOf(eaten.calories, targets?.calories);
  const [title, line] = SUMMARY[overall.tone];
  const low = items.length ? weakest(eaten, targets, BARS.map(([k]) => k)) : null;
  const lowLabel = low ? BARS.find(([k]) => k === low.key)?.[1] : '';
  const lowB = low ? balanceOf(eaten[low.key], targets[low.key]) : null;

  return (
    <div className="home">
      <header className="hm-top">
        <span className="hm-avatar" aria-hidden="true">{user.picture ? <img src={user.picture} alt="" referrerPolicy="no-referrer" /> : first.charAt(0).toUpperCase()}</span>
        <span className="hm-hello"><small>{greeting()}</small><b>{first}</b></span>
        <Link to="/wallet" className="hm-wallet" aria-label="Referral earnings"><WalletIcon size={15} aria-hidden="true" />₹{balance ?? 0}</Link>
      </header>

      {locked ? (
        <Card hero className="hm-hero">
          <Chip tone="accent">Free to browse</Chip>
          <h2>Look through our meals</h2>
          <p className="ui-muted">A plan unlocks portions, nutrients and daily picks that fit you.</p>
          <div className="two-btn"><Link to="/planner" className="ui-btn accent">Browse meals</Link><Link to="/plans" className="ui-btn ghost">See plans</Link></div>
        </Card>
      ) : (
        <Card hero className="hm-hero">
          {loading ? <Skeleton height={170} /> : needsSetup ? (
            <>
              <Chip tone="accent">One quick step</Chip>
              <h2>Set up your profile</h2>
              <p className="ui-muted">A few questions so your targets and portions fit your body.</p>
              <Link to={`${base}/setup`} className="ui-btn accent">Start <ArrowRight size={18} aria-hidden="true" /></Link>
            </>
          ) : (
            <>
              <div className="hm-main">
                <span className="hm-ring"><Ring value={Math.min(100, overall.percent)} size={104} stroke={11} label={overall.tone === 'none' ? '–' : overall.label} sub="today" labelSize={overall.label.length > 6 ? 15 : 19} /></span>
                <div className="hm-score">
                  <h2>{title}</h2>
                  <p>{line}</p>
                  {overall.percent > 0 && <Quality b={overall} />}
                </div>
              </div>
              {targets && (
                <div className="hm-bars">
                  {BARS.map(([k, label]) => {
                    const b = balanceOf(eaten[k], targets[k]);
                    return (
                      <div key={k} className={`hm-bar ${b.tone === 'low' || b.tone === 'fair' ? 'low' : b.tone === 'high' ? 'high' : ''}`}>
                        <header><span>{label}</span><Quality b={b} /></header>
                        <Progress value={b.percent} />
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="hm-cta"><Link to="/planner" className="ui-btn accent block">{items.length ? "Change today's plan" : 'Plan my day'} <ArrowRight size={18} aria-hidden="true" /></Link></div>
              <p className="hm-small">No one eats exactly 100% every day. Good and Great both mean you are on track.</p>
            </>
          )}
        </Card>
      )}

      {!locked && !needsSetup && !loading && (
        next ? (
          <Card as={Link} to={`/planner?step=${next.id}`} className="hm-next">
            <span className="hm-next-photo empty">{(() => { const I = stepIcon(next.id); return <I size={24} aria-hidden="true" />; })()}</span>
            <span><small>Next up</small><b>{next.label}</b><em>Not planned yet</em></span>
            <span className="hm-go"><Plus size={20} aria-hidden="true" /></span>
          </Card>
        ) : items.length > 0 && (
          <Card cream className="hm-planchip"><span><b>All meals planned</b><small>Tap a meal below to change it.</small></span><Chip>Done</Chip></Card>
        )
      )}

      {!locked && !needsSetup && steps.length > 0 && (
        <section aria-label="Today's meals">
          <div className="hm-sec"><h2>Today's plate</h2><Link to="/planner">Open planner</Link></div>
          {loading ? <Skeleton height={120} /> : (
            <div className="hm-tiles">
              {steps.map((s) => {
                const it = byStep(s.id);
                const Icon = stepIcon(s.id);
                const adds = it ? addonsOf(s.id) : [];
                return (
                  <Link key={s.id} to={`/planner?step=${s.id}`} className={`hm-tile${it ? '' : ' todo'}`}>
                    {it ? <Photo src={day?.images?.[it.mealId] || null} alt="" className="ph" iconSize={20} /> : <span className="ph empty"><Icon size={22} aria-hidden="true" /></span>}
                    {adds.length > 0 && <PhotoStack items={adds} size={24} max={2} />}
                    <small>{s.label}</small>
                    <b>{it ? it.mealName : 'Add a meal'}</b>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      )}

      {!locked && !needsSetup && !loading && (
        <Card cream className="hm-insight">
          <span className="ico"><Lightbulb size={18} aria-hidden="true" /></span>
          <p>
            {low && lowB.tone !== 'great' && lowB.tone !== 'good'
              ? <><b>{lowLabel}</b> is the one to watch today ({lowB.label.toLowerCase()}). Pick the next meal with more {lowLabel.toLowerCase()}.</>
              : items.length
                ? 'Your picks cover the main nutrients well. Add a small add-on if you want to top up vitamins and minerals.'
                : 'Tip: start with lunch. It is the biggest meal, so it sets up the rest of your day.'}
          </p>
        </Card>
      )}

      {!locked && (
        <section aria-label="This week">
          <div className="hm-sec"><h2>This week</h2><Link to="/calendar">Calendar</Link></div>
          <div className="hm-week">
            {week.map((d) => (
              <Link key={d} to={`/planner?date=${d}`} className={d === today ? 'today' : ''} aria-label={`${d}${saved.has(d) ? ', plan saved' : ', no plan yet'}`}>
                <small>{wk(d)}</small><b>{Number(d.slice(8))}</b><i className={saved.has(d) ? 'on' : ''} />
              </Link>
            ))}
          </div>
        </section>
      )}

      <nav className="hm-quick" aria-label="Quick actions">
        <Link to="/planner"><span className="qi"><UtensilsCrossed size={17} aria-hidden="true" /></span>Plan</Link>
        <Link to={custom ? `${base}/setup` : '/plans'}><span className="qi"><Target size={17} aria-hidden="true" /></span>{custom ? 'Targets' : 'Plans'}</Link>
        <Link to="/calendar"><span className="qi"><CalendarDays size={17} aria-hidden="true" /></span>History</Link>
        <Link to="/wallet"><span className="qi"><Sparkles size={17} aria-hidden="true" /></span>Refer</Link>
      </nav>

      {plan?.isActive ? (
        <Card as={Link} to="/plans" className="hm-planchip">
          <span><b>{PLAN_NAMES[plan.planType] || plan.planType}</b><small>{daysLeft(plan.expiresAt)} days left</small></span>
          <Chip tone="dark">{planType === 'basic' ? 'Basic' : planType === 'gym' ? 'Gym' : 'Individual'}</Chip>
        </Card>
      ) : (
        <Card as={Link} to="/plans" className="hm-planchip"><span><b>Start with a plan</b><small>Unlock daily picks</small></span><Button small variant="primary" tabIndex={-1}>See plans</Button></Card>
      )}
      <p className="hm-note">Numbers are estimates to guide you, not medical advice.</p>
    </div>
  );
}
