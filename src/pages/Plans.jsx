import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import './Plans.css';

const validityText = (d) =>
  d % 365 === 0 ? `${d / 365} year${d / 365 > 1 ? 's' : ''}` : d % 30 === 0 ? `${d / 30} month${d / 30 > 1 ? 's' : ''}` : `${d} days`;
const rupees = (paise) => `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const STATUS = { paid: 'Paid', failed: 'Failed', refunded: 'Refunded', partially_refunded: 'Partly refunded' };

export default function Plans() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [busyPlan, setBusyPlan] = useState('');


  const load = () => {
    api.get('/payments/plans').then((res) => setPlans(res.data.plans)).catch((err) => setError(errorMessage(err)));
    api.get('/payments/mine').then((res) => setHistory(res.data.payments)).catch(() => {});
  };
  useEffect(load, []);

  const current = user.activePlan?.isActive ? user.activePlan : null;

  const buy = async (planType) => {
    setBusyPlan(planType);
    setError('');
    try {
      const { data } = await api.post('/payments/create-order', { planType });
      let failedReason = '';

      const checkout = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: 'INR',
        name: 'Nutrition Planner',
        description: data.planTitle,
        order_id: data.orderId,
        prefill: { email: user.email, name: user.fullName },
        theme: { color: '#2563eb' },
        modal: {
          // The customer closed the window after a failed attempt
          ondismiss: () => { if (failedReason) navigate('/payment/failure', { state: { reason: failedReason } }); }
        },
        handler: async (response) => {
          try {
            const res = await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            if (res.data.status === 'paid') {
              await refreshUser();
              navigate('/payment/success');
            } else if (res.data.status === 'review') {
              navigate('/payment/review');
            } else {
              navigate('/payment/pending');
            }
          } catch (err) {
            const code = err.response?.status;
            // Money may have been taken. If we could not confirm, say so honestly.
            if (!code || code >= 500) navigate('/payment/pending');
            else setError(errorMessage(err));
          }
        }
      });
      checkout.on('payment.failed', (r) => { failedReason = r.error?.description || 'The payment failed.'; });
      checkout.open();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyPlan('');
    }
  };

  const switchPlan = async (planType) => {
    if (!window.confirm('Switch to this plan for free? Your end date stays the same. There is no refund or credit for the price difference.')) return;
    setBusyPlan(planType);
    setError('');
    try {
      await api.post('/payments/switch-plan', { planType });
      await refreshUser();
      load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyPlan('');
    }
  };

  return (
    <div className="stack">
      <div>
        <h3 className="page-title">Choose your plan</h3>
        <p className="muted">One payment. Valid for the period shown.</p>
      </div>
      {error && <p className="error-text">{error}</p>}

            <p className="muted">Plans are non-refundable. Switching to a lower plan is free, and an upgrade costs only the difference.</p>

      {plans.map((plan) => {
        const isCurrent = current?.planType === plan.planType;
        const label = plan.action === 'upgrade' ? `Upgrade for ₹${plan.payRupees}`
          : plan.action === 'extend' ? `Extend for ₹${plan.payRupees}` : `Pay ₹${plan.payRupees}`;
        const endDate = current ? new Date(current.expiresAt).toLocaleDateString('en-IN') : '';
        return (
          <div key={plan.planType} className={`card plan ${isCurrent ? 'current' : ''}`}>
            <div className="plan-head">
              <h4>{plan.title}</h4>
              <strong>₹{plan.priceRupees}</strong>
            </div>
            <span className="muted">Valid for {validityText(plan.validityDays)}</span>
            <p className="muted">{plan.description}</p>
            <ul>{plan.features?.map((f) => <li key={f}>{f}</li>)}</ul>
            {isCurrent && <span className="tag tag-green">Active until {endDate}</span>}
            {plan.action === 'upgrade' && (
              <p className="muted">Pay only the difference (₹{plan.payRupees}). Your end date, {endDate}, stays the same.</p>
            )}
            {plan.action === 'switch' ? (
              <>
                <p className="muted">Switch for free. Your end date, {endDate}, stays the same.</p>
                <button className="btn btn-light" disabled={busyPlan === plan.planType} onClick={() => switchPlan(plan.planType)}>
                  {busyPlan === plan.planType ? 'Please wait...' : 'Switch to this plan (free)'}
                </button>
              </>
            ) : (
              <button className="btn btn-primary" disabled={busyPlan === plan.planType} onClick={() => buy(plan.planType)}>
                {busyPlan === plan.planType ? 'Please wait...' : label}
              </button>
            )}
          </div>
        );
      })}

      {history.length > 0 && (
        <>
          <h4>Payment history</h4>
          {history.map((p) => (
            <div key={p._id} className="card pay-row">
              <div className="pay-top">
                <strong>{p.kind === 'upgrade' ? `Upgrade to ${p.planSnapshot?.title}` : p.planSnapshot?.title}</strong>
                <strong>{rupees(p.amountPaise)}</strong>
              </div>
              <div className="pay-top muted">
                <span>{new Date(p.paidAt || p.createdAt).toLocaleDateString('en-IN')}</span>
                <span className={`tag ${p.status === 'paid' ? 'tag-green' : p.status === 'failed' ? '' : 'tag-amber'}`}>{STATUS[p.status]}</span>
              </div>
              {p.refundedPaise > 0 && <span className="muted">Refunded {rupees(p.refundedPaise)}</span>}
              {p.razorpayPaymentId && <span className="muted">Ref: {p.razorpayPaymentId}</span>}
            </div>
          ))}
        </>
      )}
    </div>
  );
}