import { Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import MobileForm from '../components/MobileForm';
import './MobileGate.css';

// Shown once, right after the first sign-in, until a mobile number is saved.
export default function MobileGate() {
  const { user, logout } = useAuth();
  const first = (user.fullName || '').split(' ')[0];
  return (
    <main className="gate">
      <div className="gate-card ui-card">
        <span className="gate-ico" aria-hidden="true"><Phone size={26} /></span>
        <p className="ui-eyebrow">One last step</p>
        <h1>{first ? `Welcome, ${first}` : 'Welcome'}</h1>
        <p className="ui-muted">Add your mobile number to finish setting up your account. You can change it later in Account.</p>
        <MobileForm submitLabel="Continue" autoFocus />
        <button type="button" className="gate-out" onClick={() => logout()}>Use a different account</button>
      </div>
    </main>
  );
}
