import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import './ui.css';

export function Button({ variant = 'primary', block, small, className = '', ...rest }) {
  return <button type="button" {...rest} className={`ui-btn ${variant}${block ? ' block' : ''}${small ? ' small' : ''} ${className}`} />;
}

export function Card({ hero, flat, className = '', as: Tag = 'div', ...rest }) {
  return <Tag {...rest} className={`ui-card${hero ? ' hero' : ''}${flat ? ' flat' : ''} ${className}`} />;
}

export function Header({ eyebrow, title, sub }) {
  return (
    <div className="ui-header">
      {eyebrow && <p className="ui-eyebrow">{eyebrow}</p>}
      <h1 className="ui-title">{title}</h1>
      {sub && <p className="ui-muted">{sub}</p>}
    </div>
  );
}

export function Chip({ tone = '', children }) {
  return <span className={`ui-chip ${tone}`}>{children}</span>;
}

export function Progress({ value = 0, tone = '' }) {
  const pct = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  return <div className={`ui-progress ${tone}`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}><i style={{ width: `${pct}%` }} /></div>;
}

// Circular progress. Display only.
export function Ring({ value = 0, size = 120, stroke = 12, label, sub, color = 'var(--primary)' }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  return (
    <div className="ui-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--primary-soft)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${(c * pct) / 100} ${c}`} />
      </svg>
      <div className="ui-ring-label"><strong>{label}</strong>{sub && <span>{sub}</span>}</div>
    </div>
  );
}

// Tabs that look like a segmented control. options: [[key, label], ...]
export function Segmented({ value, onChange, options, label }) {
  return (
    <div className="ui-seg" role="tablist" aria-label={label}>
      {options.map(([key, text]) => (
        <button key={key} type="button" role="tab" aria-selected={value === key} onClick={() => onChange(key)}>{text}</button>
      ))}
    </div>
  );
}

export function Field({ label, hint, children }) {
  return <label className="ui-field">{label}{children}{hint && <small>{hint}</small>}</label>;
}

export function Row({ icon, children, value, to, onClick, ...rest }) {
  const body = (<><span>{icon}{children}</span>{value != null && <strong>{value}</strong>}</>);
  if (onClick) return <button type="button" className="ui-row tap" onClick={onClick} {...rest}>{body}</button>;
  return <div className="ui-row" {...rest}>{body}</div>;
}

export function Empty({ icon, title, text, action }) {
  return (
    <div className="ui-empty">
      {icon && <span className="ico">{icon}</span>}
      <h4>{title}</h4>
      {text && <p className="ui-muted">{text}</p>}
      {action}
    </div>
  );
}

export const Skeleton = ({ height = 96 }) => <div className="ui-skel" style={{ height }} aria-hidden="true" />;

// Bottom sheet. Closes on Escape and on a tap outside.
export function Sheet({ open, onClose, title, children }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    ref.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="ui-sheet-back" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ui-sheet" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}>
        <span className="grab" aria-hidden="true" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <h3>{title}</h3>
          <button type="button" className="ui-btn soft small" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Toasts and confirm sheets replace alert() and window.confirm().
const FeedbackContext = createContext(null);

export function FeedbackProvider({ children }) {
  const [toast, setToast] = useState(null);
  const [ask, setAsk] = useState(null);
  const timer = useRef(null);

  const notify = useCallback((text, tone = '') => {
    setToast({ text, tone });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  // confirm({ title, text, okLabel, danger }) resolves true or false
  const confirm = useCallback((options) => new Promise((resolve) => setAsk({ ...options, resolve })), []);
  const answer = (v) => { ask?.resolve(v); setAsk(null); };

  return (
    <FeedbackContext.Provider value={{ notify, confirm }}>
      {children}
      {toast && <div className={`ui-toast ${toast.tone}`} role="status">{toast.text}</div>}
      <Sheet open={Boolean(ask)} onClose={() => answer(false)} title={ask?.title || 'Are you sure?'}>
        {ask?.text && <p className="ui-muted" style={{ fontSize: 15 }}>{ask.text}</p>}
        <div style={{ display: 'grid', gap: 10 }}>
          <Button variant={ask?.danger ? 'danger' : 'primary'} block onClick={() => answer(true)}>{ask?.okLabel || 'Yes, continue'}</Button>
          <Button variant="ghost" block onClick={() => answer(false)}>Cancel</Button>
        </div>
      </Sheet>
    </FeedbackContext.Provider>
  );
}

export const useFeedback = () => {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error('useFeedback must be used within FeedbackProvider');
  return ctx;
};
