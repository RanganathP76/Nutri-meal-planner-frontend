import { useEffect, useState } from 'react';
import { Share2, Copy, ArrowDownToLine, ArrowUpRight, ArrowDownLeft, Inbox } from 'lucide-react';
import api, { errorMessage } from '../api/client';
import ReferralList from '../components/ReferralList';
import { Button, Card, Chip, Empty, Field, Segmented, Skeleton, useFeedback } from '../ui/Kit';
import './Wallet.css';

const rupees = (n) => `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const STATUS = {
  pending: ['Waiting for approval', 'warn'],
  approved: ['Approved, payment in progress', 'warn'],
  paid: ['Paid', ''],
  rejected: ['Rejected, money returned', 'bad']
};
const LEDGER = { referral_credit: 'Referral reward', withdrawal_hold: 'Withdrawal requested', withdrawal_refund: 'Withdrawal returned' };
const EMPTY = { amount: '', upiId: '', accountHolder: '', accountNumber: '', ifsc: '' };
const day = (d) => new Date(d).toLocaleDateString('en-IN');

export default function Wallet() {
  const { notify, confirm } = useFeedback();
  const [wallet, setWallet] = useState(null);
  const [tab, setTab] = useState('overview');
  const [method, setMethod] = useState('upi');
  const [form, setForm] = useState(EMPTY);
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState('');
  const [error, setError] = useState('');
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
  const shareText = wallet ? `Join Nutrition Planner and plan balanced meals. Use my code ${wallet.referralCode}: ${referralLink}` : '';

  const share = async () => {
    if (navigator.share) { navigator.share({ text: shareText }).catch(() => {}); return; }
    try { await navigator.clipboard.writeText(shareText); notify('Referral link copied'); } catch { notify('Could not copy. Copy the code by hand.', 'bad'); }
  };
  const copyCode = async () => {
    try { await navigator.clipboard.writeText(wallet.referralCode); notify('Code copied'); } catch { notify('Could not copy. Copy the code by hand.', 'bad'); }
  };

  const withdraw = async (e) => {
    e.preventDefault();
    setError('');
    if (!quote) return setError(quoteError || 'Enter an amount');
    const ok = await confirm({
      title: `Withdraw ${rupees(quote.amountRupees)}?`,
      text: `You will receive ${rupees(quote.netPayableRupees)} after charges.`,
      okLabel: 'Request withdrawal'
    });
    if (!ok) return undefined;
    setBusy(true);
    try {
      await api.post('/wallet/withdraw', {
        amountRupees: Number(form.amount), method,
        upiId: form.upiId, accountHolder: form.accountHolder, accountNumber: form.accountNumber, ifsc: form.ifsc
      });
      notify('Withdrawal requested. We will pay it after review.');
      setForm(EMPTY);
      setTab('activity');
      load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
    return undefined;
  };

  if (!wallet) return error ? <p className="error-text">{error}</p> : <div className="stack"><Skeleton height={190} /><Skeleton /></div>;

  const openOne = wallet.withdrawals.find((w) => w.open);
  const canRequest = wallet.rules.enabled && !openOne;

  return (
    <div className="stack">
      <Card hero className="wal-hero">
        <p className="ui-muted">Available balance</p>
        <h1 className="wal-balance">{rupees(wallet.balance)}</h1>
        <div className="wal-code">
          <span>Your code <strong>{wallet.referralCode}</strong></span>
          <button type="button" onClick={copyCode} aria-label="Copy referral code"><Copy size={16} aria-hidden="true" /></button>
        </div>
        <div className="wal-actions">
          <Button variant="accent" onClick={share}><Share2 size={18} aria-hidden="true" /> Share link</Button>
          <Button variant="soft" onClick={() => setTab('withdraw')}><ArrowDownToLine size={18} aria-hidden="true" /> Withdraw</Button>
        </div>
      </Card>

      <Segmented value={tab} onChange={setTab} label="Wallet sections" options={[['overview', 'Referrals'], ['withdraw', 'Withdraw'], ['activity', 'Activity']]} />

      {tab === 'overview' && (
        <>
          <Card flat>
            <h3>How rewards work</h3>
            <p className="ui-muted">Share your code. When a friend buys their first plan, you get a reward once for that friend.</p>
          </Card>
          <ReferralList />
        </>
      )}

      {tab === 'withdraw' && (
        <form className="stack" onSubmit={withdraw}>
          <Card>
            <h3>Withdraw money</h3>
            {!wallet.rules.enabled && <p className="error-text">Withdrawals are paused right now. Please try again later.</p>}
            {openOne && <p className="ui-muted">You have a withdrawal in progress. You can request another after it is paid or rejected.</p>}
            <Segmented value={method} onChange={setMethod} label="Payout method" options={[['upi', 'UPI'], ['bank', 'Bank account']]} />
            <p className="ui-muted">
              Each withdrawal: ₹{wallet.rules.minWithdrawalRupees} to ₹{wallet.rules.maxWithdrawalRupees}.
              You can still withdraw up to ₹{Math.min(wallet.rules.leftTodayRupees, wallet.balance)} today.
            </p>
            <Field label="Amount in ₹">
              <input type="number" inputMode="numeric" min="1" step="1" placeholder={`Minimum ₹${wallet.rules.minWithdrawalRupees}`} value={form.amount} onChange={(e) => set({ amount: e.target.value })} disabled={!canRequest} required />
            </Field>
            {method === 'upi' ? (
              <Field label="UPI ID"><input placeholder="name@bank" value={form.upiId} onChange={(e) => set({ upiId: e.target.value })} disabled={!canRequest} required /></Field>
            ) : (
              <>
                <Field label="Account holder name"><input value={form.accountHolder} onChange={(e) => set({ accountHolder: e.target.value })} disabled={!canRequest} required /></Field>
                <Field label="Account number"><input inputMode="numeric" value={form.accountNumber} onChange={(e) => set({ accountNumber: e.target.value })} disabled={!canRequest} required /></Field>
                <Field label="IFSC code"><input value={form.ifsc} onChange={(e) => set({ ifsc: e.target.value })} disabled={!canRequest} required /></Field>
              </>
            )}
          </Card>

          {quote && (
            <Card flat>
              <h3>What you receive</h3>
              <table className="quote">
                <tbody>
                  <tr><td>Withdrawal amount</td><td>{rupees(quote.amountRupees)}</td></tr>
                  <tr><td>Payment gateway fee</td><td>- {rupees(quote.deductions.gatewayFeeRupees)}</td></tr>
                  <tr><td>GST on fee</td><td>- {rupees(quote.deductions.gstRupees)}</td></tr>
                  <tr><td>Platform fee</td><td>- {rupees(quote.deductions.platformFeeRupees)}</td></tr>
                  <tr className="net"><td>You receive</td><td>{rupees(quote.netPayableRupees)}</td></tr>
                </tbody>
              </table>
            </Card>
          )}
          {quoteError && <p className="error-text">{quoteError}</p>}
          {error && <p className="error-text">{error}</p>}
          <Button block className="wal-submit" disabled={busy || !canRequest || !quote} type="submit">{busy ? 'Please wait...' : 'Request withdrawal'}</Button>
        </form>
      )}

      {tab === 'activity' && (
        <>
          <h3>Withdrawals</h3>
          {wallet.withdrawals.length === 0 && <Empty icon={<Inbox size={26} />} title="No withdrawals yet" text="Your requests will show here." />}
          {wallet.withdrawals.map((w) => (
            <Card key={w.id}>
              <div className="wal-line"><strong>{rupees(w.amountRupees)}</strong><Chip tone={STATUS[w.status][1]}>{STATUS[w.status][0]}</Chip></div>
              <div className="wal-line ui-muted"><span>{w.payout}</span><span>You receive {rupees(w.netPayableRupees)}</span></div>
              <div className="wal-line ui-muted"><span>{day(w.createdAt)}</span>{w.paymentReference && <span>Ref: {w.paymentReference}</span>}</div>
              {w.rejectionReason && <p className="error-text">Reason: {w.rejectionReason}</p>}
            </Card>
          ))}

          <h3>Wallet activity</h3>
          {wallet.ledger.length === 0 && <Empty icon={<Inbox size={26} />} title="Nothing yet" text="Rewards and withdrawals will be listed here." />}
          {wallet.ledger.map((t) => (
            <Card key={t.id} className="wal-ledger">
              <span className={`wal-dir ${t.direction}`} aria-hidden="true">{t.direction === 'credit' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}</span>
              <div className="wal-ledger-main">
                <strong>{LEDGER[t.type]}</strong>
                <span className="ui-muted">{day(t.createdAt)}{t.balanceAfter != null ? ` · Balance ${rupees(t.balanceAfter)}` : ''}</span>
              </div>
              <strong className={t.direction === 'credit' ? 'plus' : 'minus'}>{t.direction === 'credit' ? '+' : '-'}{rupees(t.amountRupees)}</strong>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}
