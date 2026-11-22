import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Gift, Tag } from 'lucide-react';
import api, { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Button, Card, Chip, Skeleton, useFeedback } from '../ui/Kit';
import './Plans.css';

const validityText = (d) =>
  d % 365 === 0 ? `${d / 365} year${d / 365 > 1 ? 's' : ''}` : d % 30 === 0 ? `${d / 30} month${d / 30 > 1 ? 's' : ''}` : `${d} days`;
const rupees = (paise) => `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const STATUS = { paid: 'Paid', failed: 'Failed', refunded: 'Refunded', partially_refunded: 'Partly refunded' };

export default function Plans() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { confirm, notify } = useFeedback();
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [plans, setPlans] = useState([]);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [busyPlan, setBusyPlan] = useState('');
  const [offers, setOffers] = useState([]);   // offers for everyone
  const [coupons, setCoupons] = useState({}); // per plan: { code, result, error, busy }


  const load = () => {
    api.get('/payments/plans').then((res) => { setPlans(res.data.plans); setOffers(res.data.offers || []); }).catch((err) => setError(errorMessage(err))).finally(() => setLoadingPlans(false));
    api.get('/payments/mine').then((res) => setHistory(res.data.payments)).catch(() => {});
  };
  useEffect(load, []);

  const current = user.activePlan?.isActive ? user.activePlan : null;

  const setCoupon = (planType, patch) => setCoupons((c) => ({ ...c, [planType]: { ...(c[planType] || {}), ...patch } }));

  // The server checks the code and works out the real price. Nothing is saved yet.
  const applyCoupon = async (planType) => {
    const code = (coupons[planType]?.code || '').trim();
    if (!code) return;
    setCoupon(planType, { busy: true, error: '', result: null });
    try {
      const { data } = await api.post('/payments/apply-coupon', { planType, code });
      setCoupon(planType, { result: data, applied: code, busy: false });
    } catch (err) {
      setCoupon(planType, { error: errorMessage(err), busy: false });
    }
  };

  const buy = async (planType) => {
    setBusyPlan(planType);
    setError('');
    try {
      const { data } = await api.post('/payments/create-order', { planType, code: coupons[planType]?.result ? coupons[planType].applied : undefined });
      let failedReason = '';

      const checkout = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: 'INR',
        name: 'Nutrition Planner',
        description: data.planTitle,
        order_id: data.orderId,
        prefill: { email: user.email, name: user.fullName },
        theme: { color: '#1f7a4d' },
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
    const ok = await confirm({ title: 'Switch to this plan for free?', text: 'Your end date stays the same. There is no refund or credit for the price difference.', okLabel: 'Switch plan' });
    if (!ok) return;
    setBusyPlan(planType);
    setError('');
    try {
      await api.post('/payments/switch-plan', { planType });
      await refreshUser();
      notify('Plan switched');
      load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyPlan('');
    }
  };

  const order = { basic: 0, gym: 1, individual: 2 };
  const sorted = [...plans].sort((a, b) => (order[a.planType] ?? 9) - (order[b.planType] ?? 9));

  return (
    <div className="stack">
      <div className="ui-header">
        <p className="ui-eyebrow">Plans</p>
        <h1 className="ui-title">Choose your plan</h1>
        <p className="ui-muted">One payment, valid for the period shown. Plans are non-refundable. Switching to a lower plan is free, and an upgrade costs only the difference.</p>
      </div>
      {error && <p className="error-text">{error}</p>}

      {offers.length > 0 && (
        <Card className="offers">
          <h3 className="offer-title"><Gift size={18} aria-hidden="true" /> Offers for you</h3>
          {offers.map((o) => (
            <div key={o.id} className="offer-row">
              <span className="offer-text">{o.text}</span>
              <span className="ui-muted">{o.title}{o.description ? ` · ${o.description}` : ''}{o.endsAt ? ` · until ${new Date(o.endsAt).toLocaleDateString('en-IN')}` : ''}</span>
            </div>
          ))}
          <p className="ui-muted">These are added automatically when you pay. Have a coupon code? Enter it under the plan.</p>
        </Card>
      )}

      {loadingPlans && <><Skeleton height={260} /><Skeleton height={260} /></>}

      {sorted.map((plan) => {
        const isCurrent = current?.planType === plan.planType;
        const cp = coupons[plan.planType] || {};
        const priced = cp.result || plan; // the coupon result, or the plan with offers for everyone
        const pay = priced.payRupees;
        const label = plan.action === 'upgrade' ? `Upgrade for ₹${pay}`
          : plan.action === 'extend' ? `Extend for ₹${pay}` : `Pay ₹${pay}`;
        const canCoupon = plan.action === 'buy' || plan.action === 'extend';
        const endDate = current ? new Date(current.expiresAt).toLocaleDateString('en-IN') : '';
        const hot = plan.planType === 'gym';
        return (
          <Card key={plan.planType} hero={hot} className={`plan ${isCurrent ? 'current' : ''}`}>
            <div className="plan-head">
              <div>
                <h2>{plan.title}</h2>
                <p className="ui-muted">Valid for {validityText(plan.validityDays)}</p>
              </div>
              <div className="plan-price">
                {canCoupon && priced.discountRupees > 0 && <s>₹{plan.priceRupees}</s>}
                <strong>₹{canCoupon ? pay : plan.priceRupees}</strong>
              </div>
            </div>
            <div className="plan-tags">
              {isCurrent && <Chip>Active until {endDate}</Chip>}
              {canCoupon && priced.bonusDays > 0 && <Chip tone="warn">+ {validityText(priced.bonusDays)} free (total {validityText(priced.totalDays)})</Chip>}
            </div>
            {canCoupon && (cp.result ? cp.result.applied : plan.offers)?.length > 0 && (
              <p className="ui-muted"><Gift size={14} aria-hidden="true" /> {(cp.result ? cp.result.applied.map((a) => a.text) : plan.offers).join(' · ')}</p>
            )}
            <p className="ui-muted">{plan.description}</p>
            <ul className="plan-features">{plan.features?.map((f) => <li key={f}><Check size={16} aria-hidden="true" /><span>{f}</span></li>)}</ul>
            {canCoupon && (
              <div className="coupon-row">
                <input type="text" aria-label="Coupon code" placeholder="Coupon code" value={cp.code || ''} maxLength={20} onChange={(e) => setCoupon(plan.planType, { code: e.target.value.toUpperCase(), result: null, error: '' })} />
                <Button variant="soft" disabled={cp.busy || !(cp.code || '').trim()} onClick={() => applyCoupon(plan.planType)}><Tag size={16} aria-hidden="true" /> {cp.busy ? 'Checking...' : 'Apply'}</Button>
              </div>
            )}
            {cp.error && <p className="error-text">{cp.error}</p>}
            {cp.result && <p className="success-text">Coupon applied. You pay ₹{cp.result.payRupees}.</p>}
            {plan.action === 'upgrade' && (
              <p className="ui-muted">Pay only the difference (₹{plan.payRupees}). Your end date, {endDate}, stays the same.</p>
            )}
            {plan.action === 'switch' ? (
              <>
                <p className="ui-muted">Switch for free. Your end date, {endDate}, stays the same.</p>
                <Button variant="soft" block disabled={busyPlan === plan.planType} onClick={() => switchPlan(plan.planType)}>
                  {busyPlan === plan.planType ? 'Please wait...' : 'Switch to this plan (free)'}
                </Button>
              </>
            ) : (
              <Button variant={hot ? 'accent' : 'primary'} block disabled={busyPlan === plan.planType} onClick={() => buy(plan.planType)}>
                {busyPlan === plan.planType ? 'Please wait...' : label}
              </Button>
            )}
          </Card>
        );
      })}

      {history.length > 0 && (
        <>
          <h3>Payment history</h3>
          {history.map((p) => (
            <Card key={p._id} className="pay-row">
              <div className="pay-top">
                <strong>{p.kind === 'upgrade' ? `Upgrade to ${p.planSnapshot?.title}` : p.planSnapshot?.title}</strong>
                <strong>{rupees(p.amountPaise)}</strong>
              </div>
              <div className="pay-top ui-muted">
                <span>{new Date(p.paidAt || p.createdAt).toLocaleDateString('en-IN')}</span>
                <Chip tone={p.status === 'paid' ? '' : p.status === 'failed' ? 'bad' : 'warn'}>{STATUS[p.status]}</Chip>
              </div>
              {p.refundedPaise > 0 && <span className="ui-muted">Refunded {rupees(p.refundedPaise)}</span>}
              {p.razorpayPaymentId && <span className="ui-muted">Ref: {p.razorpayPaymentId}</span>}
            </Card>
          ))}
        </>
      )}
    </div>
  );
}
