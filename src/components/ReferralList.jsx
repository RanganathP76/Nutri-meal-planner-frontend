import { useEffect, useState } from 'react';
import api, { errorMessage } from '../api/client';
import './ReferralList.css';

export default function ReferralList() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/wallet/referrals').then((res) => setData(res.data)).catch((err) => setError(errorMessage(err)));
  }, []);

  if (error) return <p className="error-text">{error}</p>;
  if (!data) return null;
  const { summary, referrals } = data;

  return (
    <div className="stack">
      <h4>People you referred</h4>
      <div className="ref-summary">
        <div><strong>{summary.total}</strong><span>Joined</span></div>
        <div><strong>{summary.successful}</strong><span>Bought a plan</span></div>
        <div><strong>₹{summary.earnedRupees}</strong><span>Earned</span></div>
      </div>
      <p className="muted">You earn a reward once for each person, when they buy their first plan.</p>

      {referrals.length === 0 && <p className="center-note">Nobody has joined with your code yet. Share your link to start earning.</p>}

      {referrals.map((r) => (
        <div key={r.id} className="card ref-row">
          <div className="ref-top">
            <strong>{r.name}</strong>
            <span className="muted">{r.phone}</span>
          </div>
          <div className="ref-steps">
            <span className="done">✓ Account created · {new Date(r.joinedAt).toLocaleDateString('en-IN')}</span>
            {r.purchased
              ? <span className="done">✓ First plan bought{r.rewardRupees ? ` · ₹${r.rewardRupees} earned` : ''}</span>
              : <span className="wait">○ Waiting for their first plan</span>}
          </div>
        </div>
      ))}
    </div>
  );
}