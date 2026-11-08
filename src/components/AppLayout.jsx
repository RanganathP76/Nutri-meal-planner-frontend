import { NavLink, Outlet } from 'react-router-dom';
import './AppLayout.css';

const TABS = [
  { to: '/', label: 'Home', icon: '🏠', end: true },
  { to: '/planner', label: 'Planner', icon: '🍽️' },
  { to: '/calendar', label: 'Calendar', icon: '📅' },
  { to: '/wallet', label: 'Wallet', icon: '💰' },
  { to: '/account', label: 'Account', icon: '👤' }
];

export default function AppLayout() {
  return (
    <div className="shell">
      <header className="shell-header">Nutrition Planner</header>
      <main className="shell-main"><Outlet /></main>
      <nav className="bottom-nav">
        {TABS.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => (isActive ? 'active' : '')}>
            <span className="nav-icon">{t.icon}</span>
            <span>{t.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}