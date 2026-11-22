import { useEffect, useState } from 'react';
import { Users, Check, Circle } from 'lucide-react';
import api, { errorMessage } from '../api/client';
import { Card, Empty, Skeleton } from '../ui/Kit';
import './ReferralList.css';

export default function ReferralList() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/wallet/referrals').then((res) => setData(res.data)).catch((err) => setError(errorMessage(err)));
  }, []);

  if (error) return <p className="error-text">{error}</p>;
  if (!data) return <Skeleton height={140} />;
  const { summary, referrals } = data;

  return (
    <div className="stack">
      <h3>People you referred</h3>
      <div className="ref-summary">
        <div><strong>{summary.total}</strong><span>Joined</span></div>
        <div><strong>{summary.successful}</strong><span>Bought a plan</span></div>
        <div><strong>₹{summary.earnedRupees}</strong><span>Earned</span></div>
      </div>

      {referrals.length === 0 && (
        <Empty icon={<Users size={26} />} title="No one yet" text="Nobody has joined with your code yet. Share your link to start earning." />
      )}

      {referrals.map((r) => (
        <Card key={r.id} className="ref-row">
          <div className="ref-top">
            <strong>{r.name}</strong>
            <span className="ui-muted">{r.phone}</span>
          </div>
          <div className="ref-steps">
            <span className="done"><Check size={16} aria-hidden="true" /> Account created · {new Date(r.joinedAt).toLocaleDateString('en-IN')}</span>
            {r.purchased
              ? <span className="done"><Check size={16} aria-hidden="true" /> First plan bought{r.rewardRupees ? ` · ₹${r.rewardRupees} earned` : ''}</span>
              : <span className="wait"><Circle size={16} aria-hidden="true" /> Waiting for their first plan</span>}
          </div>
        </Card>
      ))}
    </div>
  );
}
