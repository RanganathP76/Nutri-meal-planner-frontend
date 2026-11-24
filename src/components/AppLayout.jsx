import { NavLink, Outlet } from 'react-router-dom';
import { House, UtensilsCrossed, CalendarDays, Wallet, User, Leaf } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './AppLayout.css';

const TABS = [
  { to: '/', label: 'Today', Icon: House, end: true },
  { to: '/planner', label: 'Plan', Icon: UtensilsCrossed },
  { to: '/calendar', label: 'Calendar', Icon: CalendarDays },
  { to: '/wallet', label: 'Wallet', Icon: Wallet },
  { to: '/account', label: 'You', Icon: User }
];

// One list of links, drawn twice: a floating bar on phones and a sidebar on wide screens.
export default function AppLayout() {
  const auth = useAuth();
  const user = auth?.user;
  const name = user?.fullName || user?.email || 'You';
  const links = TABS.map(({ to, label, Icon, end }) => (
    <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
      <Icon size={21} strokeWidth={2.2} aria-hidden="true" />
      <span>{label}</span>
    </NavLink>
  ));
  return (
    <div className="shell">
      <aside className="rail" aria-label="Main">
        <div className="rail-brand"><span className="brand-mark" aria-hidden="true"><Leaf size={18} /></span><span>Fit<em>Ratio</em></span></div>
        <p className="rail-label">Your space</p>
        <nav>{links}</nav>
        <div className="rail-tip">
          <strong>Small plates, steady days.</strong>
          <span>Numbers are estimates to guide you, not medical advice.</span>
        </div>
        <NavLink to="/account" className="rail-user">
          <span className="avatar" aria-hidden="true">{String(name).trim().charAt(0).toUpperCase()}</span>
          <span className="who">{name}</span>
        </NavLink>
      </aside>
      <main className="shell-main"><Outlet /></main>
      <nav className="bottom-nav" aria-label="Main">{links}</nav>
    </div>
  );
}
