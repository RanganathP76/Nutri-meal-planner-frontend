import { useEffect, useState } from 'react';
import api, { errorMessage } from '../api/client';
import ReferralList from '../components/ReferralList';
import './Wallet.css';

const rupees = (n) => `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const STATUS = {
  pending: ['Waiting for approval', 'tag-amber'],
  approved: ['Approved, payment in progress', 'tag-amber'],
  paid: ['Paid', 'tag-green'],
  rejected: ['Rejected, money returned', '']
};
const LEDGER = { referral_credit: 'Referral reward', withdrawal_hold: 'Withdrawal requested', withdrawal_refund: 'Withdrawal returned' };
const EMPTY = { amount: '', upiId: '', accountHolder: '', accountNumber: '', ifsc: '' };

export default function Wallet() {
  const [wallet, setWallet] = useState(null);
  const [method, setMethod] = useState('upi');
  const [form, setForm] = useState(EMPTY);
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () =>
    api.get('/wallet/my-wallet').then((res) => setWallet(res.data)).catch((err) => setError(errorMessage(err)));
  useEffect(() => { load(); }, []);

  // The server calculates the charges. This only shows them.
  useEffect(() => {
    const amount = Number(form.amount);
    if (!form.amount || !Number.isFinite(amount)) { setQuote(null); setQuoteError(''); return undefined; }
    let cancelled = false;
    const timer = setTimeout(() => {
      api.get('/wallet/withdraw-quote', { params: { amount } })
        .then(({ data }) => { if (!cancelled) { setQuote(data); setQuoteError(''); } })
        .catch((err) => { if (!cancelled) { setQuote(null); setQuoteError(errorMessage(err)); } });
    }, 400);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [form.amount]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const referralLink = wallet ? `${window.location.origin}/register?ref=${wallet.referralCode}` : '';

  const share = async () => {
    const text = `Join Nutrition Planner and plan balanced meals. Use my code ${wallet.referralCode}: ${referralLink}`;
    if (navigator.share) navigator.share({ text }).catch(() => {});
    else { await navigator.clipboard.writeText(text); setMessage('Referral link copied'); }
  };

  const withdraw = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!quote) return setError(quoteError || 'Enter an amount');
    if (!window.confirm(`Withdraw ${rupees(quote.amountRupees)}? You will receive ${rupees(quote.netPayableRupees)} after charges.`)) return;
    setBusy(true);
    try {
      await api.post('/wallet/withdraw', {
        amountRupees: Number(form.amount), method,
        upiId: form.upiId, accountHolder: form.accountHolder, accountNumber: form.accountNumber, ifsc: form.ifsc
      });
      setMessage('Withdrawal requested. We will pay it after review.');
      setForm(EMPTY);
      load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (!wallet) return error ? <p className="error-text">{error}</p> : <p className="center-note">Loading wallet...</p>;

  const openOne = wallet.withdrawals.find((w) => w.open);
  const canRequest = wallet.rules.enabled && !openOne;

  return (
    <div className="stack">
      <div className="balance">
        <span>Available balance</span>
        <h1>{rupees(wallet.balance)}</h1>
        <div className="code">Your code: <strong>{wallet.referralCode}</strong></div>
        <button className="btn btn-light" onClick={share}>Share referral link</button>
      </div>

      <ReferralList />

      <form className="card stack" onSubmit={withdraw}>
        <h4>Withdraw money</h4>
        {!wallet.rules.enabled && <p className="error-text">Withdrawals are paused right now. Please try again later.</p>}
        {openOne && <p className="muted">You have a withdrawal in progress. You can request another after it is paid or rejected.</p>}

        <div className="seg">
          <button type="button" className={method === 'upi' ? 'on' : ''} onClick={() => setMethod('upi')}>UPI</button>
          <button type="button" className={method === 'bank' ? 'on' : ''} onClick={() => setMethod('bank')}>Bank account</button>
        </div>

        <p className="muted">
          Each withdrawal: ₹{wallet.rules.minWithdrawalRupees} to ₹{wallet.rules.maxWithdrawalRupees}.
          You can still withdraw up to ₹{Math.min(wallet.rules.leftTodayRupees, wallet.balance)} today.
        </p>
        <input type="number" inputMode="numeric" min="1" step="1" placeholder={`Amount in ₹ (minimum ₹${wallet.rules.minWithdrawalRupees})`}
          value={form.amount} onChange={(e) => set({ amount: e.target.value })} disabled={!canRequest} required />

        {method === 'upi' ? (
          <input placeholder="UPI ID (name@bank)" value={form.upiId} onChange={(e) => set({ upiId: e.target.value })} disabled={!canRequest} required />
        ) : (
          <>
            <input placeholder="Account holder name" value={form.accountHolder} onChange={(e) => set({ accountHolder: e.target.value })} disabled={!canRequest} required />
            <input inputMode="numeric" placeholder="Account number" value={form.accountNumber} onChange={(e) => set({ accountNumber: e.target.value })} disabled={!canRequest} required />
            <input placeholder="IFSC code" value={form.ifsc} onChange={(e) => set({ ifsc: e.target.value })} disabled={!canRequest} required />
          </>
        )}

        {quote && (
          <table className="quote">
            <tbody>
              <tr><td>Withdrawal amount</td><td>{rupees(quote.amountRupees)}</td></tr>
              <tr><td>Payment gateway fee</td><td>- {rupees(quote.deductions.gatewayFeeRupees)}</td></tr>
              <tr><td>GST on fee</td><td>- {rupees(quote.deductions.gstRupees)}</td></tr>
              <tr><td>Platform fee</td><td>- {rupees(quote.deductions.platformFeeRupees)}</td></tr>
              <tr className="net"><td>You receive</td><td>{rupees(quote.netPayableRupees)}</td></tr>
            </tbody>
          </table>
        )}
        {quoteError && <p className="error-text">{quoteError}</p>}
        {error && <p className="error-text">{error}</p>}
        {message && <p className="success-text">{message}</p>}
        <button className="btn btn-success" disabled={busy || !canRequest || !quote}>{busy ? 'Please wait...' : 'Request withdrawal'}</button>
      </form>

      <h4>Withdrawals</h4>
      {wallet.withdrawals.length === 0 && <p className="center-note">No withdrawals yet.</p>}
      {wallet.withdrawals.map((w) => (
        <div key={w.id} className="card tx">
          <div className="tx-row">
            <strong>{rupees(w.amountRupees)}</strong>
            <span className={`tag ${STATUS[w.status][1]}`}>{STATUS[w.status][0]}</span>
          </div>
          <div className="tx-row muted"><span>{w.payout}</span><span>You receive {rupees(w.netPayableRupees)}</span></div>
          <div className="tx-row muted">
            <span>{new Date(w.createdAt).toLocaleDateString('en-IN')}</span>
            {w.paymentReference && <span>Ref: {w.paymentReference}</span>}
          </div>
          {w.rejectionReason && <span className="error-text">Reason: {w.rejectionReason}</span>}
        </div>
      ))}

      <h4>Wallet activity</h4>
      {wallet.ledger.length === 0 && <p className="center-note">Nothing yet.</p>}
      {wallet.ledger.map((t) => (
        <div key={t.id} className="card tx">
          <div className="tx-row">
            <strong>{LEDGER[t.type]}</strong>
            <strong className={t.direction === 'credit' ? 'plus' : 'minus'}>{t.direction === 'credit' ? '+' : '-'}{rupees(t.amountRupees)}</strong>
          </div>
          <div className="tx-row muted">
            <span>{new Date(t.createdAt).toLocaleDateString('en-IN')}</span>
            {t.balanceAfter != null && <span>Balance {rupees(t.balanceAfter)}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}