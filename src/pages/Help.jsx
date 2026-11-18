import { Link } from 'react-router-dom';
import LegalLinks from '../components/LegalLinks';
import './Legal.css';

import { BUSINESS } from '../utils/business';
const SUPPORT_EMAIL = BUSINESS.email;

const FAQ = [
  ['How do I log in on another device?', 'Open the app on the new device and continue with the same Google account. Only one device can be logged in at a time, so the old device is logged out.'],
  ['Can I switch plans?', 'Yes. Upgrading to a higher plan costs the price difference and keeps your current expiry date. Switching to a lower or equal plan is free.'],
  ['Can I get a refund?', 'No. Plan purchases are final, as stated in the Terms.'],
  ['My payment went through but my plan is not active.', 'Wait a minute and refresh. If it is still not active, email us with your payment ID and we will check.'],
  ['How do referrals work?', 'Share your link or code. When the person you referred buys their first plan, you get the reward once. Later purchases by that person do not earn another reward.'],
  ['How do I withdraw wallet money?', 'Go to Wallet and request a withdrawal to your UPI ID. Check the minimum amount and fees shown there. Requests are paid manually after approval.'],
  ['Are the nutrition values exact?', 'No. Meal nutrition, portions, targets and health ratings are estimates and not medical advice. See Health & estimates.'],
  ['Why do I see "2 chapati, 250 g palya"?', 'Each meal is written for a default adult. We scale the plate for your age, goal, energy and protein need, height and weight, so the amounts are for you.'],
  ['Why can I only see meal names and photos?', 'Nutrition details and recommendations need an active plan.']
];

export default function Help() {
  return (
    <div className="legal-page">
      <Link className="back" to="/">&larr; Back</Link>
      <h1>Help &amp; Support</h1>
      {FAQ.map(([q, a]) => (
        <div key={q}>
          <h2>{q}</h2>
          <p>{a}</p>
        </div>
      ))}
      <h2>Still need help?</h2>
      <p>Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> and include your account email and, for payment issues, the payment ID.</p>
      <LegalLinks />
    </div>
  );
}
