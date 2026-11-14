import { Link } from 'react-router-dom';
import './Legal.css';

// TODO: replace SUPPORT_EMAIL, and have a lawyer review before launch.
const SUPPORT_EMAIL = 'support@example.com';

export default function Privacy() {
  return (
    <div className="legal-page">
      <Link className="back" to="/">&larr; Back</Link>
      <h1>Privacy Policy</h1>
      <p className="updated">Last updated: November 2026</p>

      <h2>What we collect</h2>
      <ul>
        <li><strong>From Google sign-in:</strong> your name and email address. We do not get your Google password.</li>
        <li><strong>What you enter:</strong> age, gender, height, weight, activity level, goals, diet preferences and similar details used to work out your targets and meals.</li>
        <li><strong>Your use of the app:</strong> your meal plans, plan purchases, referral activity, wallet transactions and withdrawal requests (including the UPI ID you give us).</li>
        <li><strong>Payment records:</strong> order and payment IDs and status. Card, UPI and bank details are handled by Razorpay and are not stored by us.</li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To sign you in and keep your account secure, including the one-device-at-a-time rule.</li>
        <li>To calculate targets and recommend meals.</li>
        <li>To process payments, referral rewards and withdrawals, and to prevent fraud.</li>
        <li>To contact you about your account or service changes.</li>
      </ul>

      <h2>Who we share it with</h2>
      <p>We do not sell your data. We share it only with the services needed to run the app: Google (sign-in), Razorpay (payments), our hosting and database providers, and image storage. We may disclose data if the law requires it.</p>

      <h2>Health information</h2>
      <p>Details like your weight and goals are used only to make your suggestions. We do not use them for advertising.</p>

      <h2>Your choices</h2>
      <ul>
        <li>You can edit your profile details in Account.</li>
        <li>To ask for a copy or deletion of your data, email us. We may keep payment and withdrawal records as long as tax and legal rules require.</li>
      </ul>

      <h2>Security and retention</h2>
      <p>We use encrypted connections, access controls and logging. No system is perfectly secure. We keep data while your account is active and as needed for legal and accounting purposes. Daily meal plans older than 15 days are deleted automatically.</p>

      <h2>Contact</h2>
      <p><a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></p>
    </div>
  );
}
