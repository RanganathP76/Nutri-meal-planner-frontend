import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, LogOut, FileText, ShieldCheck, HeartPulse, RotateCcw, LifeBuoy, SlidersHorizontal, CreditCard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PLAN_NAMES } from '../utils/plans';
import { Card, Chip, Button, useFeedback } from '../ui/Kit';
import './Account.css';

const LEGAL = [
  ['/terms', 'Terms of use', FileText],
  ['/privacy', 'Privacy policy', ShieldCheck],
  ['/disclaimer', 'Health and estimates', HeartPulse],
  ['/refund-policy', 'Refund policy', RotateCcw],
  ['/help', 'Help and contact', LifeBuoy]
];

const initials = (name = '') => name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || 'U';

export default function Account() {
  const { user, logout } = useAuth();
  const { confirm } = useFeedback();
  const navigate = useNavigate();
  const plan = user.activePlan;

  const handleLogout = async () => {
    const ok = await confirm({ title: 'Log out?', text: 'You can log back in any time with the same Google account.', okLabel: 'Log out', danger: true });
    if (ok) { logout(); navigate('/welcome', { replace: true }); }
  };

  return (
    <div className="stack">
      <Card className="acc-hero">
        <span className="acc-avatar" aria-hidden="true">{initials(user.fullName)}</span>
        <div className="acc-who">
          <h1 className="ui-title">{user.fullName}</h1>
          <p className="ui-muted">{user.email}</p>
        </div>
      </Card>

      <Card>
        <div className="acc-head"><h3>Subscription</h3>{plan?.isActive ? <Chip>Active</Chip> : <Chip tone="warn">No plan</Chip>}</div>
        {plan?.isActive ? (
          <ul className="ui-list">
            <li className="ui-row"><span>Plan</span><strong>{PLAN_NAMES[plan.planType]}</strong></li>
            <li className="ui-row"><span>Valid till</span><strong>{new Date(plan.expiresAt).toLocaleDateString('en-IN')}</strong></li>
          </ul>
        ) : <p className="ui-muted">You have no active subscription.</p>}
        <Link to="/plans" className="ui-btn soft block"><CreditCard size={18} aria-hidden="true" /> {plan?.isActive ? 'View plans' : 'Choose a plan'}</Link>
        {plan?.isActive && plan.planType === 'gym' && <Link to="/gym/setup" className="ui-btn ghost block"><SlidersHorizontal size={18} aria-hidden="true" /> Gym profile and daily targets</Link>}
        {plan?.isActive && plan.planType === 'individual' && <Link to="/individual/setup" className="ui-btn ghost block"><SlidersHorizontal size={18} aria-hidden="true" /> My profile and daily targets</Link>}
      </Card>

      <Card>
        <h3>Your details</h3>
        <ul className="ui-list">
          <li className="ui-row"><span>Referral code</span><strong>{user.referralCode}</strong></li>
          <li className="ui-row"><span>This device</span><strong>{user.lastLoginDevice || 'Unknown'}</strong></li>
          <li className="ui-row"><span>Member since</span><strong>{new Date(user.createdAt).toLocaleDateString('en-IN')}</strong></li>
        </ul>
        <p className="ui-muted">Only one device can be logged in at a time.</p>
      </Card>

      <Card>
        <h3>About and policies</h3>
        <ul className="ui-list">
          {LEGAL.map(([to, label, Icon]) => (
            <li key={to}><Link to={to} className="ui-row tap"><span><Icon size={18} className="acc-ico" aria-hidden="true" />{label}</span><ChevronRight size={18} aria-hidden="true" /></Link></li>
          ))}
        </ul>
      </Card>

      <Button variant="danger" block onClick={handleLogout}><LogOut size={18} aria-hidden="true" /> Log out</Button>
    </div>
  );
}
