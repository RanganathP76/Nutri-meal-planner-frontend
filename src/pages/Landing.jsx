import { Link, Navigate } from 'react-router-dom';
import { ArrowRight, Check, FlaskConical, HeartPulse, Leaf, Scale, ShieldCheck, SlidersHorizontal, Sparkles, Target, UserRound, UtensilsCrossed, Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LegalLinks from '../components/LegalLinks';
import { Photo } from '../ui/Kit';
import './Landing.css';

// Placeholder photography. Replace these with your own food photos before launch.
const IMG = {
  hero: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80',
  bowl: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1100&q=80',
  thali: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1100&q=80'
};

const STEPS = [
  { Icon: UserRound, title: 'Tell us about you', text: 'Age, height, weight, activity, goal and food preference. Gym and Individual plans also ask about allergies and health.' },
  { Icon: SlidersHorizontal, title: 'We work out your targets', text: 'Calories, protein, fat, carbohydrate and fibre come from standard formulas, checked against safe limits.' },
  { Icon: UtensilsCrossed, title: 'Pick meals, get exact portions', text: 'Ranked Indian meals for every slot, in plain words like "2 chapati, 250 g palya". Fill any gap with add-ons.' }
];

const FEATURES = [
  { Icon: Target, title: 'Personal targets', text: 'Built from your body and goal, with check-ins at 15, 30 and 45 days.' },
  { Icon: Scale, title: 'Portions that scale', text: 'Meals grow or shrink with your needs, rounded to quantities you can measure.' },
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
        <span className="land-brand"><span className="brand-mark" aria-hidden="true"><Leaf size={18} /></span><span>Fit<em>Ratio</em></span></span>
        <Link to="/login" className="land-login">Log in</Link>
      </header>

      <section className="land-hero">
        <div className="land-copy">
          <p className="ui-eyebrow"><Sparkles size={14} aria-hidden="true" /> Your everyday nutrition companion</p>
          <h1>Eat well.<br /><em>Feel your best.</em><br />Every single day.</h1>
          <p className="land-sub">Daily Indian meals with exact portions, worked out from your age, weight, goal and workouts. See calories, protein and all 38 nutrients before you eat.</p>
          <div className="land-actions">
            <Link to="/register" className="ui-btn primary">Get started with Google <ArrowRight size={18} aria-hidden="true" /></Link>
            <Link to="/login" className="ui-btn ghost">I have an account</Link>
          </div>
          <p className="land-fine">One Google tap. No password. All numbers are estimates, not medical advice.</p>
        </div>
        <div className="land-visual">
          <Photo src={IMG.hero} alt="A colourful, balanced meal" className="land-photo" iconSize={64} />
          <div className="land-float a"><span className="ico"><ShieldCheck size={18} aria-hidden="true" /></span><span><small>Built on</small><b>ICMR-NIN 2020</b></span></div>
          <div className="land-float b"><span className="ico"><FlaskConical size={18} aria-hidden="true" /></span><span><small>Every meal shows</small><b>38 nutrients</b></span></div>
        </div>
      </section>

      <section className="land-stats" aria-label="At a glance">
        <div><strong>38</strong><span>nutrients per meal</span></div>
        <div><strong>3</strong><span>plans</span></div>
        <div><strong>10</strong><span>allergen groups</span></div>
        <div><strong>2020</strong><span>ICMR-NIN references</span></div>
      </section>

      <section className="land-section">
        <p className="ui-eyebrow">How it works</p>
        <h2>From sign-in to a full plate in <em>three steps.</em></h2>
        <div className="land-grid three">
          {STEPS.map(({ Icon, title, text }, i) => (
            <div key={title} className="land-card">
              <span className="land-icon"><Icon size={20} aria-hidden="true" /></span>
              <h3>{i + 1}. {title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="land-band">
        <Photo src={IMG.bowl} alt="A wholesome lunch bowl" className="land-band-photo" iconSize={56} />
        <div className="land-band-copy">
          <p className="ui-eyebrow">More than a meal list</p>
          <h2>Your whole day,<br /><em>thoughtfully planned.</em></h2>
          <ul>
            <li><Check size={18} aria-hidden="true" /> Ranked meals for every part of your day</li>
            <li><Check size={18} aria-hidden="true" /> Clear calories, macros and micronutrients</li>
            <li><Check size={18} aria-hidden="true" /> Add-ons that fill the gaps in your day</li>
            <li><Check size={18} aria-hidden="true" /> A calendar to plan ahead with confidence</li>
          </ul>
        </div>
      </section>

      <section className="land-section">
        <p className="ui-eyebrow">Features</p>
        <h2>Everything a smart plan <em>needs.</em></h2>
        <div className="land-grid">
          {FEATURES.map(({ Icon, title, text }) => (
            <div key={title} className="land-card feat">
              <span className="land-icon"><Icon size={20} aria-hidden="true" /></span>
              <div><h3>{title}</h3><p>{text}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section className="land-section">
        <p className="ui-eyebrow">Plans</p>
        <h2>Choose the plan that fits <em>how you live.</em></h2>
        <div className="land-grid three">
          {PLANS.map((p) => (
            <div key={p.name} className={`land-card${p.hot ? ' hot' : ''}`}>
              <h3>{p.name}</h3>
              <p>{p.text}</p>
            </div>
          ))}
        </div>
        <p className="land-fine">Prices and offers are shown after you sign in. Upgrade by paying the difference. Switching to a lower plan is free. Purchases are final.</p>
      </section>

      <section className="land-honest">
        <Photo src={IMG.thali} alt="" className="land-honest-photo" iconSize={40} />
        <div>
          <h2>Honest by design</h2>
          <ul>
            <li>Every number is labelled as an estimate, not medical advice.</li>
            <li>No plan for pregnancy or breastfeeding. Safe weight limits always apply.</li>
            <li>Gym and Individual plans are for adults aged 18 to 75.</li>
            <li>Sign in with Google only. We never ask for a password.</li>
          </ul>
        </div>
      </section>

      <section className="land-cta">
        <h2>Start planning your day in under a minute.</h2>
        <Link to="/register" className="ui-btn accent">Get started with Google <ArrowRight size={18} aria-hidden="true" /></Link>
      </section>

      <footer className="land-foot">
        <LegalLinks />
        <p className="land-fine">FitRatio. Estimates only, not medical advice.</p>
      </footer>
    </div>
  );
}
