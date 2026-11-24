import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle2, UtensilsCrossed, X } from 'lucide-react';
import './ui.css';

export function Button({ variant = 'primary', block, small, className = '', ...rest }) {
  return <button type="button" {...rest} className={`ui-btn ${variant}${block ? ' block' : ''}${small ? ' small' : ''} ${className}`} />;
}

export function IconButton({ label, badge, className = '', children, ...rest }) {
  return (
    <button type="button" aria-label={label} title={label} {...rest} className={`ui-icon-btn ${className}`}>
      {children}
      {badge ? <span className="dot">{badge}</span> : null}
    </button>
  );
}

export function Card({ hero, flat, cream, className = '', as: Tag = 'div', ...rest }) {
  return <Tag {...rest} className={`ui-card${hero ? ' hero' : ''}${flat ? ' flat' : ''}${cream ? ' cream' : ''} ${className}`} />;
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
export function Ring({ value = 0, size = 120, stroke = 12, label, sub, color = 'var(--primary)', track = 'var(--primary-soft)', labelSize }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  return (
    <div className="ui-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle className="val" cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${(c * pct) / 100} ${c}`} />
      </svg>
      {(label != null || sub) && <div className="ui-ring-label">{label != null && <strong style={labelSize ? { fontSize: labelSize } : undefined}>{label}</strong>}{sub && <span>{sub}</span>}</div>}
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

// A scrolling row of pill choices. options: [[key, label], ...]
export function ChoiceChips({ value, onChange, options, label }) {
  return (
    <div className="ui-chips" role="group" aria-label={label}>
      {options.map(([key, text]) => (
        <button key={key} type="button" aria-pressed={value === key} onClick={() => onChange(key)}>{text}</button>
      ))}
    </div>
  );
}

export function Field({ label, hint, children }) {
  return <label className="ui-field">{label}{children}{hint && <small>{hint}</small>}</label>;
}

export function Row({ icon, children, value, onClick, ...rest }) {
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

export const Skeleton = ({ height = 96, width, round }) => <div className="ui-skel" style={{ height, width, borderRadius: round ? 999 : undefined }} aria-hidden="true" />;

// A whole-screen placeholder shown while a page loads. variant: list | form | profile
export function PageSkeleton({ variant = 'list', label = 'Loading' }) {
  return (
    <div className="stack" role="status" aria-busy="true" aria-label={label}>
      {variant === 'profile' && <div className="ui-skel-row"><Skeleton height={60} width={60} round /><div className="ui-skel-col"><Skeleton height={20} /><Skeleton height={14} width="60%" /></div></div>}
      {variant === 'form' && <><Skeleton height={10} width="100%" round /><Skeleton height={26} width="55%" /></>}
      {[0, 1, 2].map((i) => (
        <div key={i} className="ui-skel-card">
          <Skeleton height={18} width="40%" />
          <Skeleton height={14} />
          <Skeleton height={variant === 'form' ? 50 : 14} width={variant === 'form' ? '100%' : '75%'} />
        </div>
      ))}
    </div>
  );
}

// Friendly error with a way to try again
export function ErrorState({ title = 'Something went wrong', text, onRetry }) {
  return (
    <div className="ui-empty" role="alert">
      <span className="ico bad"><AlertTriangle size={26} /></span>
      <h4>{title}</h4>
      {text && <p className="ui-muted">{text}</p>}
      {onRetry && <Button variant="soft" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

// Shows "Step 2 of 5" with a bar. steps: ['About you', 'Goal', ...]. current is a 0-based index.
export function Stepper({ steps, current, onJump }) {
  return (
    <div className="ui-stepper" aria-label="Progress">
      <div className="ui-stepper-top"><strong>{steps[current]}</strong><span className="ui-muted">Step {current + 1} of {steps.length}</span></div>
      <div className="ui-stepper-bar">
        {steps.map((name, i) => (
          <button key={name} type="button" aria-label={`${name}${i < current ? ' (done)' : ''}`} aria-current={i === current ? 'step' : undefined}
            className={i < current ? 'done' : i === current ? 'now' : ''} disabled={!onJump || i > current} onClick={() => onJump?.(i)} />
        ))}
      </div>
    </div>
  );
}

// Several choices at once, shown as tappable pills. options: [[key, label], ...]
export function CheckPills({ value, onChange, options, label }) {
  return (
    <div className="ui-pills" role="group" aria-label={label}>
      {options.map(([key, text]) => {
        const on = value.includes(key);
        return <button key={key} type="button" aria-pressed={on} onClick={() => onChange(key)}>{on ? <CheckCircle2 size={16} aria-hidden="true" /> : null}{text}</button>;
      })}
    </div>
  );
}

const tone = (s = '') => { let h = 0; for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) % 4; return h; };

// A photo that falls back to a soft tile when the picture is missing or cannot load
export function Photo({ src, alt = '', className = '', style, iconSize = 28 }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [src]);
  const show = src && !failed;
  return (
    <span className={`ui-photo t${tone(alt || src || '')} ${className}`} style={style} role={alt ? 'img' : undefined} aria-label={alt || undefined}>
      {show ? <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} /> : <span className="fallback" aria-hidden="true"><UtensilsCrossed size={iconSize} /></span>}
    </span>
  );
}

// Bottom sheet. Closes on Escape and on a tap outside. It is drawn on top of everything.
export function Sheet({ open, onClose, title, children, footer }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const before = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = before; };
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="ui-sheet-back" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ui-sheet" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}>
        <span className="grab" aria-hidden="true" />
        <div className="ui-sheet-head">
          <h3>{title}</h3>
          <IconButton label="Close" onClick={onClose}><X size={20} /></IconButton>
        </div>
        <div className="ui-sheet-body">{children}</div>
        {footer && <div className="ui-sheet-foot">{footer}</div>}
      </div>
    </div>,
    document.body
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
      {toast && <div className={`ui-toast ${toast.tone}`} role="status">{toast.tone === 'bad' ? null : <CheckCircle2 size={18} aria-hidden="true" />}{toast.text}</div>}
      <Sheet open={Boolean(ask)} onClose={() => answer(false)} title={ask?.title || 'Are you sure?'}
        footer={(
          <>
            <Button variant={ask?.danger ? 'danger' : 'primary'} block onClick={() => answer(true)}>{ask?.okLabel || 'Yes, continue'}</Button>
            <Button variant="ghost" block onClick={() => answer(false)}>Cancel</Button>
          </>
        )}>
        {ask?.text && <p className="ui-muted" style={{ fontSize: 15 }}>{ask.text}</p>}
      </Sheet>
    </FeedbackContext.Provider>
  );
}

export const useFeedback = () => {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error('useFeedback must be used within FeedbackProvider');
  return ctx;
};
