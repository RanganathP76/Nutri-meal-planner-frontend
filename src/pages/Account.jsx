import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Copy, CreditCard, FileText, HeartPulse, LifeBuoy, LogOut, RotateCcw, ShieldCheck, SlidersHorizontal, Smartphone, Wallet as WalletIcon, Gift } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PLAN_NAMES } from '../utils/plans';
import { Card, Chip, Button, Header, useFeedback } from '../ui/Kit';
import './Account.css';

const LEGAL = [
  ['/terms', 'Terms of use', FileText],
  ['/privacy', 'Privacy policy', ShieldCheck],
  ['/disclaimer', 'Health and estimates', HeartPulse],
  ['/refund-policy', 'Refund policy', RotateCcw],
  ['/help', 'Help and contact', LifeBuoy]
];

const initials = (name = '') => name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || 'U';
const date = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-');

// A tappable settings line: icon, label, small hint, arrow
function Line({ to, icon: Icon, label, hint }) {
  return (
    <Link to={to} className="acc-line">
      <span className="acc-ico"><Icon size={18} aria-hidden="true" /></span>
      <span className="acc-text"><strong>{label}</strong>{hint && <small>{hint}</small>}</span>
      <ChevronRight size={18} aria-hidden="true" />
    </Link>
  );
}

export default function Account() {
  const { user, logout } = useAuth();
  const { confirm, notify } = useFeedback();
  const navigate = useNavigate();
  const plan = user.activePlan;
  const active = Boolean(plan?.isActive);
  const setupPath = active && plan.planType === 'gym' ? '/gym/setup' : active && plan.planType === 'individual' ? '/individual/setup' : null;
  const daysLeft = active ? Math.max(0, Math.ceil((new Date(plan.expiresAt) - Date.now()) / 86400000)) : 0;

  const handleLogout = async () => {
    const ok = await confirm({ title: 'Log out?', text: 'You can log back in any time with the same Google account.', okLabel: 'Log out', danger: true });
    if (ok) { logout(); navigate('/welcome', { replace: true }); }
  };

  const copyCode = async () => {
    try { await navigator.clipboard.writeText(user.referralCode); notify('Referral code copied'); } catch { notify('Could not copy. Copy the code by hand.', 'bad'); }
  };

  return (
    <div className="stack acc">
      <Header eyebrow="Account" title="Settings" />

      <Card className="acc-hero">
        <span className="acc-avatar" aria-hidden="true">{initials(user.fullName)}</span>
        <div className="acc-who">
          <h2>{user.fullName}</h2>
          <p className="ui-muted">{user.email}</p>
          <p className="ui-muted">Member since {date(user.createdAt)}</p>
        </div>
      </Card>

      <Card hero={active} className="acc-plan">
        <div className="acc-head"><h3>{active ? PLAN_NAMES[plan.planType] : 'No active plan'}</h3>{active ? <Chip tone="accent">{daysLeft} days left</Chip> : <Chip tone="warn">Free</Chip>}</div>
        <p className="ui-muted">{active ? `Valid till ${date(plan.expiresAt)}` : 'Choose a plan to plan your meals and see your nutrition.'}</p>
        <Link to="/plans" className={`ui-btn ${active ? 'accent' : 'primary'} block`}><CreditCard size={18} aria-hidden="true" /> {active ? 'Change or renew plan' : 'Choose a plan'}</Link>
      </Card>

      <section className="acc-group" aria-label="My account">
        <h3>My account</h3>
        <Card className="acc-list">
          {setupPath && <Line to={setupPath} icon={SlidersHorizontal} label="Profile and daily targets" hint="Body, goal, allergies and health" />}
          <Line to="/wallet" icon={WalletIcon} label="Wallet" hint="Earnings and withdrawals" />
          <Line to="/wallet" icon={Gift} label="Refer and earn" hint="Invite friends with your link" />
        </Card>
      </section>

      <Card className="stack">
        <h3>Your referral code</h3>
        <button type="button" className="acc-code" onClick={copyCode} aria-label={`Copy referral code ${user.referralCode}`}>
          <strong>{user.referralCode}</strong><span><Copy size={16} aria-hidden="true" /> Copy</span>
        </button>
        <p className="ui-muted"><Smartphone size={14} aria-hidden="true" /> Logged in on {user.lastLoginDevice || 'this device'}. Only one device can be logged in at a time.</p>
      </Card>

      <section className="acc-group" aria-label="About and policies">
        <h3>About and policies</h3>
        <Card className="acc-list">
          {LEGAL.map(([to, label, Icon]) => <Line key={to} to={to} icon={Icon} label={label} />)}
        </Card>
      </section>

      <Button variant="danger" block onClick={handleLogout}><LogOut size={18} aria-hidden="true" /> Log out</Button>
    </div>
  );
}
