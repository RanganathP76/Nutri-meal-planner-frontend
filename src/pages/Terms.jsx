import { Link } from 'react-router-dom';
import './Legal.css';

// TODO: replace BUSINESS_NAME and SUPPORT_EMAIL, and have a lawyer review before launch.
const BUSINESS_NAME = 'Nutrition Planner';
const SUPPORT_EMAIL = 'support@example.com';

export default function Terms() {
  return (
    <div className="legal-page">
      <Link className="back" to="/">&larr; Back</Link>
      <h1>Terms of Service</h1>
      <p className="updated">Last updated: November 2026</p>

      <h2>1. About the service</h2>
      <p>{BUSINESS_NAME} gives you daily meal suggestions based on the details you share. We offer three plans: Basic, Gym and Individual. You can browse meal names and photos without a plan; nutrition details and recommendations need an active plan.</p>

      <h2>2. Accounts</h2>
      <ul>
        <li>You sign in with your Google account. We use your Google name and email only.</li>
        <li>Only one device can be logged in at a time. Logging in on a new device logs out the old one.</li>
        <li>Keep your Google account secure. You are responsible for activity under your account.</li>
      </ul>

      <h2>3. Plans, payments and no refunds</h2>
      <ul>
        <li>Prices and validity are shown on the Plans page before you pay. Payments are processed by Razorpay.</li>
        <li><strong>All plan purchases are final. We do not offer refunds.</strong></li>
        <li>You can upgrade to a higher plan by paying the price difference. Your original expiry date stays the same.</li>
        <li>You can switch to a lower or equal plan at no extra cost, for the rest of your current validity.</li>
        <li>When your plan expires, you go back to browse-only access.</li>
      </ul>

      <h2>4. Referrals and wallet</h2>
      <ul>
        <li>You earn a referral reward only once per referred person, when that person buys their first plan. Later purchases by the same person do not earn a reward.</li>
        <li>Wallet money can be withdrawn by UPI above the minimum amount shown in the app. Withdrawal fees and taxes shown at the time of the request apply.</li>
        <li>We may reject or reverse rewards and withdrawals that come from fake accounts, self-referrals or misuse.</li>
      </ul>

      <h2>5. Health notice</h2>
      <p>Our meal suggestions and calorie or nutrient targets are general information. They are not medical advice and do not replace a doctor or registered dietitian. Talk to a professional before changing your diet if you are pregnant, have a medical condition, have allergies, or take medication. Nutrient values are estimates and can differ from the food you actually eat.</p>

      <h2>6. Acceptable use</h2>
      <p>Do not misuse the service, create accounts to abuse referrals, copy our meal data in bulk, or try to break or bypass our security. We may suspend accounts that do.</p>

      <h2>7. Changes and availability</h2>
      <p>We may update meals, plans, prices or these terms. Price changes do not affect a plan you have already paid for. We try to keep the service available but do not promise it will always be uninterrupted.</p>

      <h2>8. Liability</h2>
      <p>To the extent allowed by law, we are not liable for indirect losses or for health outcomes from following the suggestions. Our total liability is limited to the amount you paid for your current plan.</p>

      <h2>9. Contact</h2>
      <p>Questions: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></p>
    </div>
  );
}
