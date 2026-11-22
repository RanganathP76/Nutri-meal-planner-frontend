import { NavLink, Outlet } from 'react-router-dom';
import { House, UtensilsCrossed, CalendarDays, Wallet, User, Leaf } from 'lucide-react';
import './AppLayout.css';

const TABS = [
  { to: '/', label: 'Home', Icon: House, end: true },
  { to: '/planner', label: 'Planner', Icon: UtensilsCrossed },
  { to: '/calendar', label: 'Calendar', Icon: CalendarDays },
  { to: '/wallet', label: 'Wallet', Icon: Wallet },
  { to: '/account', label: 'Account', Icon: User }
];

// One navigation list, drawn twice: a bottom bar on phones and a side rail on wide screens.
export default function AppLayout() {
  const links = TABS.map(({ to, label, Icon, end }) => (
    <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'active' : '')}>
      <Icon size={22} strokeWidth={2} aria-hidden="true" />
      <span>{label}</span>
    </NavLink>
  ));
  return (
    <div className="shell">
      <aside className="rail" aria-label="Main">
        <div className="rail-brand"><span className="brand-mark" aria-hidden="true"><Leaf size={18} /></span><span>Nutrition Planner</span></div>
        <nav>{links}</nav>
      </aside>
      <div className="shell-col">
        <header className="shell-header">
          <span className="brand-mark" aria-hidden="true"><Leaf size={18} /></span>
          <span>Nutrition Planner</span>
        </header>
        <main className="shell-main"><Outlet /></main>
      </div>
      <nav className="bottom-nav" aria-label="Main">{links}</nav>
    </div>
  );
}
