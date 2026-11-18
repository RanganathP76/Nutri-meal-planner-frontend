import { Link } from 'react-router-dom';
import { BUSINESS } from '../utils/business';
import './Legal.css';

// Have a lawyer review these pages before launch. Fill in utils/business.js.
export default function Terms() {
  return (
    <div className="legal-page">
      <Link className="back" to="/">&larr; Back</Link>
      <h1>Terms of Service</h1>
      <p className="updated">Last updated: {BUSINESS.updated}</p>
      <p>These terms are an agreement between you and {BUSINESS.legalName} ("we", "us"), who run {BUSINESS.name} (the "service"). By creating an account or using the service you agree to them, to our <Link to="/privacy">Privacy Policy</Link>, <Link to="/disclaimer">Health Disclaimer and Estimates</Link> and <Link to="/refund-policy">Refund Policy</Link>.</p>

      <h2>1. The service</h2>
      <p>We give daily meal suggestions, nutrition targets and portion guidance based on the details you enter. There are three plans: Basic, Gym and Individual. Without a plan you can browse meal names and photos. Nutrition details, recommendations and saving a plan need an active plan.</p>

      <h2>2. Who can use it</h2>
      <ul>
        <li>You must be 18 or older to create an account. The Gym and Individual plans are for adults aged 18 to 75.</li>
        <li>If you enter details of a child (for example for the Basic plan), you confirm that you are the child's parent or legal guardian and that you agree on the child's behalf. A child's details are used only to work out portions and targets.</li>
        <li>Give correct details. Wrong details give wrong suggestions.</li>
      </ul>

      <h2>3. Your account</h2>
      <ul>
        <li>You sign in with Google. We use your Google name and email only.</li>
        <li>Only one device can be logged in at a time. Logging in on a new device logs out the old one.</li>
        <li>You are responsible for your Google account and for activity under your account. Tell us if you think someone else is using it.</li>
      </ul>

      <h2>4. Health and estimates</h2>
      <p>The service gives general information, not medical advice. Meal nutrition values, portions, targets, limits and health ratings are <strong>estimates</strong> and can be wrong or incomplete. Read the <Link to="/disclaimer">Health Disclaimer and Estimates</Link>. Check with a doctor or registered dietitian before changing your diet, especially with a health condition, pregnancy, allergies or medicines. The Gym and Individual plans are only for adults aged 18 to 75 who are not pregnant or breastfeeding, and you must give true details (date of birth, weight, allergies) and update your weight when we ask. You use the suggestions at your own risk and responsibility.</p>

      <h2>5. Plans, payments and no refunds</h2>
      <ul>
        <li>Prices (in Indian rupees, with taxes as shown) and validity are shown before you pay. Payments are processed by Razorpay. We do not store your card, UPI or bank details.</li>
        <li><strong>All purchases are final. We do not give refunds</strong>, except where the law requires, or for a failed or double payment as described in the <Link to="/refund-policy">Refund Policy</Link>.</li>
        <li>Upgrade to a higher plan by paying the difference; your end date stays the same. Switch to a lower or equal plan free for the rest of your validity.</li>
        <li>When a plan ends you return to browse-only access. Your saved profile stays.</li>
      </ul>

      <h2>6. Referrals and wallet</h2>
      <ul>
        <li>You earn a referral reward once for each person you refer, when that person buys their first plan. Later purchases by that person earn nothing more.</li>
        <li>Rewards go into your wallet. You can withdraw by UPI above the minimum shown in the app, within the daily and per-request limits shown. We pay manually after checking the request. Taxes that apply to payouts are your responsibility.</li>
        <li>We may refuse or reverse rewards and withdrawals linked to fake accounts, self-referral, shared accounts or misuse, and may suspend those accounts.</li>
      </ul>

      <h2>7. Acceptable use</h2>
      <p>Do not misuse the service, create fake accounts or abuse referrals, scrape or copy our meal data in bulk, resell it, share your login, or try to break or bypass our security. We may suspend or end accounts that do.</p>

      <h2>8. Our content</h2>
      <p>The meal data, recipes, photos, text and design belong to us or our licensors. You get a personal, non-transferable right to use them inside the service. Meal names and photos are shown for browsing; do not republish them.</p>

      <h2>9. Changes and availability</h2>
      <p>We may change meals, plans, prices, features or these terms. We will show the date of the latest version. A price change does not affect a plan you already paid for. We try to keep the service running but do not promise it will always be available or error-free.</p>

      <h2>10. Liability</h2>
      <p>The service is provided "as is". To the extent the law allows, we are not liable for indirect or consequential loss, or for health outcomes from following the suggestions. Our total liability to you is limited to the amount you paid for your current plan. Nothing here limits any right you have under law that cannot be limited, including under the Consumer Protection Act, 2019.</p>

      <h2>11. Ending your account</h2>
      <p>You can stop using the service at any time and ask us to delete your account (see the <Link to="/privacy">Privacy Policy</Link>). Unused plan time is not refunded. We may end accounts that break these terms.</p>

      <h2>12. Governing law and disputes</h2>
      <p>These terms are governed by the laws of India. Courts at {BUSINESS.city} have jurisdiction, subject to your rights as a consumer. First write to us and we will try to settle it. You can also use the National Consumer Helpline (1915 / consumerhelpline.gov.in).</p>

      <h2>13. Contact and grievances</h2>
      <p>{BUSINESS.legalName}, {BUSINESS.address}.<br />
        Grievance Officer: {BUSINESS.grievanceOfficer}, <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>. We acknowledge a complaint within 48 hours and aim to resolve it within 30 days.</p>
    </div>
  );
}
