import { Link } from 'react-router-dom';
import { BUSINESS } from '../utils/business';
import './Legal.css';

// Written with India's Digital Personal Data Protection Act, 2023 and the IT Act, 2000 in mind.
// Have a lawyer review it before launch. Fill in utils/business.js.
export default function Privacy() {
  return (
    <div className="legal-page">
      <Link className="back" to="/">&larr; Back</Link>
      <h1>Privacy Policy</h1>
      <p className="updated">Last updated: {BUSINESS.updated}</p>
      <p>{BUSINESS.legalName} ("we") runs {BUSINESS.name}. We are the "data fiduciary" for the personal data described here. This policy explains what we collect, why, who sees it, how long we keep it and what you can do. By creating an account and ticking the consent box you agree to it.</p>

      <h2>1. What we collect</h2>
      <ul>
        <li><strong>Google sign-in:</strong> your name and email address. We never get your Google password.</li>
        <li><strong>What you enter:</strong> date of birth (Gym and Individual plans), sex, height, weight, activity level, goals, target weight, food preference and the health conditions you choose (for example diabetes or blood pressure), your food allergies, your answer to whether you are pregnant or breastfeeding (we keep only a yes/no confirmation and do not offer a plan if the answer is yes), and the weight you give at each check-in. Health conditions are sensitive; you choose whether to give them, and you can remove them any time. For the Basic plan you may enter the age of a child you cook for.</li>
        <li><strong>Use of the app:</strong> your saved meal plans (kept for about 10 days), plan purchases, referral activity, wallet entries and withdrawal requests, including the UPI ID you give us (stored encrypted).</li>
        <li><strong>Payments:</strong> order and payment IDs, amount and status. Card, UPI and bank details are handled by Razorpay and are not stored by us.</li>
        <li><strong>Technical data:</strong> device and browser type, IP address and security logs, to keep your account safe and stop misuse.</li>
      </ul>
      <p>Allergy, pregnancy and weight details are sensitive health information. We use them only to make your plan safer and more accurate, never for ads, and you can change or delete them any time in your profile or by deleting your account. We do not collect your contacts, location, photos or microphone.</p>

      <h2>2. Why we use it (and our legal basis)</h2>
      <ul>
        <li>To create your account and sign you in (your consent, and to provide the service).</li>
        <li>To work out your daily targets, portions and meal suggestions (your consent).</li>
        <li>To take payments, activate plans, run referrals and wallet payouts, and keep accounts for tax and legal records (contract and legal duty).</li>
        <li>To prevent fraud, abuse and multiple logins, and to fix errors (legitimate use, security).</li>
        <li>To answer your support requests.</li>
      </ul>
      <p>We do not sell your data. We do not show advertising and do not use your health details for advertising or to track you across other sites.</p>

      <h2>3. Who we share it with</h2>
      <ul>
        <li><strong>Google</strong> (sign-in), <strong>Razorpay</strong> (payments), our <strong>hosting and database providers</strong> (for example MongoDB Atlas and our cloud host) and <strong>Cloudinary</strong> (meal photos, not your data).</li>
        <li>Authorities, where the law or a valid order requires it.</li>
        <li>A buyer or successor, if the business changes hands, under the same protections.</li>
      </ul>
      <p>These providers may process data on servers outside India. We choose providers with proper security and only share what is needed.</p>

      <h2>4. How long we keep it</h2>
      <ul>
        <li>Your profile and account: until you ask us to delete it.</li>
        <li>Daily meal plans: about 10 days, then deleted automatically.</li>
        <li>Payment, referral and wallet records: as long as tax and accounting law requires (usually up to 8 years). After deleting your account these are kept without your profile details where possible.</li>
        <li>Security logs: up to 12 months.</li>
      </ul>

      <h2>5. Your rights</h2>
      <p>You can ask us to: show what we hold about you, correct it, delete it, withdraw your consent, and nominate another person to act for you if you die or cannot act. You can change your profile and health conditions inside the app at any time. Email <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> from your account email. We reply within 30 days. If we cannot help you can complain to the Data Protection Board of India once it is in place.</p>
      <p>Withdrawing consent may stop us from providing the personalised service. It does not affect what we did lawfully before.</p>

      <h2>6. Children</h2>
      <p>Accounts are for adults (18 and over). If you enter a child's age or details, you confirm that you are the child's parent or legal guardian and give consent for the child. We use it only to work out portions and targets, we do not track children, show them ads or profile them for ads, and you can delete it any time.</p>

      <h2>7. Security</h2>
      <p>We use encrypted connections, restricted access, secure sign-in and encrypted storage of payout details. No system is perfectly safe. If a breach affects you we will tell you and the authorities as the law requires.</p>

      <h2>8. Cookies and storage</h2>
      <p>We keep a sign-in token and a few settings (for example your referral code from a link) in your browser or app storage so the service works. We do not use advertising cookies.</p>

      <h2>9. Changes</h2>
      <p>We may update this policy and will change the date above. For big changes we will tell you in the app.</p>

      <h2>10. Contact and grievance officer</h2>
      <p>{BUSINESS.legalName}, {BUSINESS.address}.<br />Grievance Officer: {BUSINESS.grievanceOfficer}, <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>. See also our <Link to="/terms">Terms</Link> and <Link to="/disclaimer">Health Disclaimer and Estimates</Link>.</p>
    </div>
  );
}
