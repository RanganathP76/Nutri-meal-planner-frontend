import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PLAN_NAMES } from '../utils/plans';
import './Account.css';

export default function Account() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const plan = user.activePlan;

  const rows = [
    ['Name', user.fullName],
    ['Google account', user.email],
    ['Referral code', user.referralCode],
    ['This device', user.lastLoginDevice || 'Unknown'],
    ['Member since', new Date(user.createdAt).toLocaleDateString('en-IN')]
  ];

  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

  return (
    <div className="stack">
      <h3 className="page-title">My account</h3>

      <div className="card stack">
        {rows.map(([label, value]) => (
          <div key={label} className="acc-row"><span className="muted">{label}</span><strong>{value}</strong></div>
        ))}
      </div>

      <div className="card stack">
        <h4>Subscription</h4>
        {plan?.isActive ? (
          <>
            <div className="acc-row"><span className="muted">Plan</span><strong>{PLAN_NAMES[plan.planType]}</strong></div>
            <div className="acc-row"><span className="muted">Valid till</span><strong>{new Date(plan.expiresAt).toLocaleDateString('en-IN')}</strong></div>
          </>
        ) : (
          <p className="muted">You have no active subscription.</p>
        )}
        <Link to="/plans" className="btn btn-light">{plan?.isActive ? 'View plans' : 'Choose a plan'}</Link>
        {plan?.isActive && plan.planType === 'gym' && <Link to="/gym/setup" className="btn btn-light">Gym profile and daily targets</Link>}
        {plan?.isActive && plan.planType === 'individual' && <Link to="/individual/setup" className="btn btn-light">My profile and daily targets</Link>}
      </div>

      <p className="muted"><Link to="/help">Help</Link> &middot; <Link to="/terms">Terms</Link> &middot; <Link to="/privacy">Privacy Policy</Link></p>
      <button className="btn btn-danger" onClick={handleLogout}>Log out</button>
    </div>
  );
}