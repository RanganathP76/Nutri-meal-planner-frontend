import { Link, Navigate } from 'react-router-dom';
import { Leaf, Target, Scale, FlaskConical, HeartPulse, ShieldCheck, Wallet, UserRound, SlidersHorizontal, UtensilsCrossed } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LegalLinks from '../components/LegalLinks';
import './Landing.css';

const STEPS = [
  { Icon: UserRound, title: 'Tell us about you', text: 'Age, height, weight, activity, goal and food preference. Gym and Individual plans also ask about allergies and health.' },
  { Icon: SlidersHorizontal, title: 'We work out your targets', text: 'Calories, protein, fat, carbohydrate and fibre are calculated with standard formulas and checked against safe limits.' },
  { Icon: UtensilsCrossed, title: 'Pick meals, get exact portions', text: 'Ranked Indian meals for every slot, in plain words like "2 chapati, 250 g palya". Fill any gap with add-ons.' }
];

const FEATURES = [
  { Icon: Target, title: 'Personal targets', text: 'Built from your body and goal, with check-ins at 15, 30 and 45 days.' },
  { Icon: Scale, title: 'Portions that scale', text: 'Meals grow or shrink with your needs and are rounded to quantities you can measure.' },
  { Icon: FlaskConical, title: 'All 38 nutrients', text: '13 vitamins, 14 minerals and 11 more. A missing value shows as not available, never zero.' },
  { Icon: HeartPulse, title: 'Health-aware ranking', text: 'Seven conditions on a five-point scale. Unsuitable meals are hidden.' },
  { Icon: ShieldCheck, title: 'Allergy filter', text: 'Ten allergen groups, matched in English, Hindi and South Indian names.' },
  { Icon: Wallet, title: 'Referral wallet', text: 'A reward once for each friend who buys a plan. Withdraw to UPI above the minimum.' }
];

const PLANS = [
  { name: 'Basic', text: 'Simple daily meals with portions by age group and a fixed adult target.' },
  { name: 'Gym', text: 'Targets built around your workouts, body fat and goal, plus extras to complete your day.', hot: true },
  { name: 'Individual', text: 'A personal plan for everyday life with health conditions and allergies included.' }
];

export default function Landing() {
  const { user, loading } = useAuth();
  if (!loading && user) return <Navigate to="/" replace />;

  return (
    <div className="land">
      <header className="land-nav">
        <span className="land-brand"><span className="brand-mark" aria-hidden="true"><Leaf size={18} /></span>Nutrition Planner</span>
        <Link to="/login" className="land-login">Log in</Link>
      </header>

      <section className="land-hero">
        <span className="land-pill"><ShieldCheck size={15} aria-hidden="true" /> Built on Indian food values and ICMR-NIN 2020</span>
        <h1>Eat right for your body, every single day.</h1>
        <p>Daily Indian meals with exact portions, worked out from your age, weight, goal and workouts. See calories, protein and all 38 nutrients before you eat.</p>
        <Link to="/register" className="btn btn-accent">Get started with Google</Link>
        <Link to="/login" className="btn btn-ghost">I already have an account</Link>
        <p className="land-fine">One Google tap. No password. All numbers are estimates, not medical advice.</p>
      </section>

      <section className="land-stats" aria-label="At a glance">
        <div><strong>38</strong><span>nutrients per meal</span></div>
        <div><strong>3</strong><span>plans</span></div>
        <div><strong>10</strong><span>allergen groups</span></div>
        <div><strong>ICMR-NIN</strong><span>2020 references</span></div>
      </section>

      <section className="land-section">
        <p className="land-eyebrow">How it works</p>
        <h2>From sign-in to a full day plate in three steps.</h2>
        <div className="land-grid">
          {STEPS.map(({ Icon, title, text }, i) => (
            <div key={title} className="land-card">
              <span className="land-step"><Icon size={20} aria-hidden="true" /></span>
              <h3>{i + 1}. {title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="land-section">
        <p className="land-eyebrow">Features</p>
        <h2>Everything a smart nutrition plan needs.</h2>
        <div className="land-grid">
          {FEATURES.map(({ Icon, title, text }) => (
            <div key={title} className="land-card land-feature">
              <span className="land-icon"><Icon size={22} aria-hidden="true" /></span>
              <div><h3>{title}</h3><p>{text}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section className="land-section">
        <p className="land-eyebrow">Plans</p>
        <h2>Choose the plan that fits how you live.</h2>
        <div className="land-grid">
          {PLANS.map((p) => (
            <div key={p.name} className={`land-card${p.hot ? ' land-hot' : ''}`}>
              <h3>{p.name}</h3>
              <p>{p.text}</p>
            </div>
          ))}
        </div>
        <p className="land-fine">Prices and offers are shown after you sign in. Upgrade by paying the difference. Switching to a lower plan is free. Purchases are final.</p>
      </section>

      <section className="land-honest">
        <h2>Honest by design</h2>
        <ul>
          <li>Every number is labelled as an estimate, not medical advice.</li>
          <li>No plan for pregnancy or breastfeeding. Safe weight limits always apply.</li>
          <li>Gym and Individual plans are for adults aged 18 to 75.</li>
          <li>Sign in with Google only. We never ask for a password.</li>
        </ul>
      </section>

      <section className="land-cta">
        <h2>Start planning your day in under a minute.</h2>
        <Link to="/register" className="btn btn-accent">Get started with Google</Link>
      </section>

      <footer className="land-foot">
        <LegalLinks />
        <p className="land-fine">Nutrition Planner. Estimates only, not medical advice.</p>
      </footer>
    </div>
  );
}
