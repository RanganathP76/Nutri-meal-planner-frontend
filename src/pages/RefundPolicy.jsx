import { Link } from 'react-router-dom';
import { BUSINESS } from '../utils/business';
import './Legal.css';

export default function RefundPolicy() {
  return (
    <div className="legal-page">
      <Link className="back" to="/">&larr; Back</Link>
      <h1>Cancellation and Refund Policy</h1>
      <p className="updated">Last updated: {BUSINESS.updated}</p>

      <h2>No refunds</h2>
      <p>Plans are digital services that start working as soon as payment is confirmed. <strong>All plan purchases are final. We do not offer refunds or cancellations after payment</strong>, except where the law requires otherwise.</p>
      <p>Prices, the plan name and how long it lasts are shown on the Plans page before you pay, and again on the payment screen.</p>

      <h2>Changing your plan</h2>
      <ul>
        <li><strong>Upgrade</strong> to a higher plan: pay only the price difference. Your original end date stays the same.</li>
        <li><strong>Switch to a lower or equal plan:</strong> free, for the rest of your current validity.</li>
        <li>When a plan ends, you can still browse meal names and photos.</li>
      </ul>

      <h2>Failed or double payments</h2>
      <p>If money was deducted but your plan is not active, or you were charged twice for the same order, email us with the payment ID. We check with our payment partner (Razorpay). A payment that was not used for a plan, or was charged twice by mistake, is returned to the original payment method. Banks may take 5 to 7 working days to show it.</p>

      <h2>Referral wallet</h2>
      <p>Referral rewards are credited once per referred person, after that person's first plan purchase. They are promotional credits, can be withdrawn by UPI above the minimum shown in the app, and may be reversed if they came from fake accounts, self-referral or misuse.</p>

      <h2>Contact</h2>
      <p>Write to <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> with your account email and payment ID. We reply within 48 hours on working days.</p>
    </div>
  );
}
