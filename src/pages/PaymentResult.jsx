import { Link, useLocation, useParams } from 'react-router-dom';
import { PartyPopper, TriangleAlert, Hourglass, SearchCheck } from 'lucide-react';
import { Card } from '../ui/Kit';
import './PaymentResult.css';

const COPY = {
  success: { Icon: PartyPopper, tone: 'good', title: 'Payment successful', text: 'Your plan is active. Start planning your meals.', to: '/planner', cta: 'Plan my meals' },
  failure: {
    Icon: TriangleAlert, tone: 'bad', title: 'Payment did not go through',
    text: 'If any money was deducted, it is usually returned by your bank within 5 to 7 working days.',
    to: '/plans', cta: 'Try again'
  },
  pending: {
    Icon: Hourglass, tone: 'warn', title: 'Confirming your payment',
    text: 'We are confirming your payment. Your plan will activate within a few minutes. Check your Account page.',
    to: '/account', cta: 'Go to account'
  },
  review: {
    Icon: SearchCheck, tone: 'warn', title: 'We received your payment',
    text: 'Your plan changed while you were paying, so we need to check it. Our team will fix it. Please contact support if you do not hear from us.',
    to: '/account', cta: 'Go to account'
  }
};

export default function PaymentResult() {
  const { result } = useParams();
  const { state } = useLocation();
  const c = COPY[result] || COPY.pending;
  const { Icon } = c;

  return (
    <Card className="result">
      <span className={`result-icon ${c.tone}`}><Icon size={32} aria-hidden="true" /></span>
      <h1 className="ui-title">{c.title}</h1>
      {result === 'failure' && state?.reason && <p className="error-text">{state.reason}</p>}
      <p className="ui-muted">{c.text}</p>
      <Link to={c.to} className="ui-btn primary block">{c.cta}</Link>
    </Card>
  );
}
