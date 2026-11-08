import { Link, useLocation, useParams } from 'react-router-dom';
import './PaymentResult.css';

const COPY = {
  success: { icon: '🎉', title: 'Payment successful', text: 'Your plan is active. Start planning your meals.', to: '/planner', cta: 'Plan my meals' },
  failure: {
    icon: '⚠️', title: 'Payment did not go through',
    text: 'If any money was deducted, it is usually returned by your bank within 5 to 7 working days.',
    to: '/plans', cta: 'Try again'
  },
  pending: {
    icon: '⏳', title: 'Confirming your payment',
    text: 'We are confirming your payment. Your plan will activate within a few minutes. Check your Account page.',
    to: '/account', cta: 'Go to account'
  },
  review: {
    icon: '🔎', title: 'We received your payment',
    text: 'Your plan changed while you were paying, so we need to check it. Our team will fix it. Please contact support if you do not hear from us.',
    to: '/account', cta: 'Go to account'
  }

};

export default function PaymentResult() {
  const { result } = useParams();
  const { state } = useLocation();
  const c = COPY[result] || COPY.pending;

  return (
    <div className="result card stack">
      <div className="result-icon">{c.icon}</div>
      <h3>{c.title}</h3>
      {result === 'failure' && state?.reason && <p className="error-text">{state.reason}</p>}
      <p className="muted">{c.text}</p>
      <Link to={c.to} className="btn btn-primary">{c.cta}</Link>
    </div>
  );
}