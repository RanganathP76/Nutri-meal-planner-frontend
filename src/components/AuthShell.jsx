import { Link } from 'react-router-dom';
import { ChevronLeft, Leaf } from 'lucide-react';
import { Photo } from '../ui/Kit';
import './AuthShell.css';

// Placeholder photograph. Replace with your own before launch.
const SIDE = 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1000&q=80';

// Shared frame for Login and Register: a calm form beside a photo on wide screens, form only on phones.
export default function AuthShell({ eyebrow, title, sub, children }) {
  return (
    <div className="ashell">
      <aside className="ashell-side">
        <span className="ashell-brand"><span className="brand-mark" aria-hidden="true"><Leaf size={18} /></span><span>Fit<em>Ratio</em></span></span>
        <div>
          <p className="ui-eyebrow">A little more balance</p>
          <h2>Make space for <em>better habits.</em></h2>
          <p>Meals, portions and nutrients, worked out for you.</p>
        </div>
        <Photo src={SIDE} alt="" className="ashell-photo" iconSize={56} />
      </aside>
      <main className="ashell-main">
        <Link to="/welcome" className="ashell-back"><ChevronLeft size={16} aria-hidden="true" /> Back to home</Link>
        <div className="ashell-form">
          <span className="ashell-mark" aria-hidden="true"><Leaf size={24} /></span>
          <p className="ui-eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          {sub && <p className="ashell-sub">{sub}</p>}
          {children}
        </div>
      </main>
    </div>
  );
}
