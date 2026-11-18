import { Link } from 'react-router-dom';
import { BUSINESS } from '../utils/business';
import './Legal.css';

export default function Disclaimer() {
  return (
    <div className="legal-page">
      <Link className="back" to="/">&larr; Back</Link>
      <h1>Health Disclaimer and Estimates</h1>
      <p className="updated">Last updated: {BUSINESS.updated}</p>

      <h2>Not medical advice</h2>
      <p>{BUSINESS.name} gives general food and nutrition information. It is not medical advice, diagnosis or treatment, and it does not create a doctor-patient or dietitian-client relationship. Our suggestions do not replace a registered doctor or dietitian.</p>
      <p>Speak to a doctor or registered dietitian before you change your diet if you are a child, pregnant or breastfeeding, elderly, underweight, have diabetes, blood pressure problems, thyroid disease, high cholesterol, PCOS, kidney, liver or heart disease, an eating disorder or any allergy, or if you take medicines. Stop and get medical help if a food makes you unwell.</p>

      <h2>All numbers are estimates</h2>
      <ul>
        <li><strong>Nutrition values of meals</strong> (calories, protein, carbohydrates, fat, fibre, vitamins, minerals and others) are estimated from the ingredients and standard Indian food composition values. They are not laboratory results. Real food differs by recipe, cooking method, ingredient brand, size and the way it is served. A value marked <em>NA</em> has not been entered, and we never treat it as zero.</li>
        <li><strong>Portions</strong> (for example "2 chapati, 250 g palya") are worked out from your details and are estimates. Your own plate may be bigger or smaller.</li>
        <li><strong>Daily targets and limits</strong> are calculated from your age, sex, height, weight, activity, goal and health conditions using published reference values for Indians (such as ICMR-NIN) and standard formulas. They are general guidance, not a prescription. Different experts may recommend different numbers.</li>
        <li><strong>Health ratings of meals</strong> (suitable or not suitable for a condition) are entered by our team and may be incomplete. If a meal says it is not defined for your condition, check it with your doctor or dietitian first.</li>
        <li><strong>Sodium, sugar and other tips</strong> such as "use less salt" or "add less sugar" are estimates. The salt and sugar you add yourself are not in the numbers.</li>
        <li><strong>Allergies:</strong> in the Gym and Individual plans you can tell us your food allergies, and we hide meals that list those foods. Our allergen information is entered by our team and <strong>may be incomplete or wrong</strong>, and a meal can contain traces or hidden ingredients. Always check the ingredients yourself. If you have a severe allergy, ask your doctor first. The Basic plan does not ask about allergies, so check every meal yourself.</li>
        <li><strong>Pregnancy and breastfeeding:</strong> the Gym and Individual plans are not made for pregnancy or breastfeeding, when energy and nutrient needs change a lot, so we ask and do not create a plan. Please follow your doctor or dietitian. If you become pregnant or start breastfeeding, stop using these plans and tell your doctor.</li>
        <li><strong>Safe weight goals:</strong> we do not accept a target below a healthy weight for your height (BMI 18.5), and we plan to lose at most about 1 kg a week (or 1% of your body weight, whichever is less) and to gain at most about 0.5 kg a week. A large goal is split into steps of 30 days, and we ask for your weight again every 30 days (a reminder from day 15). If you lose weight much faster than planned, or feel weak or unwell, stop and see a doctor. Time estimates are rough.</li>
        <li><strong>Age:</strong> the Gym and Individual plans are for adults aged 18 to 75, and your age is worked out from your date of birth. The Basic plan shows portions for ages 4 and above; for a child, a parent or guardian should use it and check with a paediatrician.</li>
        <li><strong>Weight and time estimates</strong> (for example how long a goal may take) are rough and differ from person to person.</li>
      </ul>

      <h2>Your responsibility</h2>
      <p>You are responsible for the choices you make and for giving correct details. Use the app as one input, together with professional advice.</p>

      <h2>Contact</h2>
      <p>Questions about this page: <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>. See also our <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link>.</p>
    </div>
  );
}
