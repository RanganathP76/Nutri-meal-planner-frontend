import { Link } from 'react-router-dom';
import { ALLERGENS, ageFromDob, dobLimits } from '../utils/allergens';

// Date of birth, pregnancy / breastfeeding and allergies. Used by the Gym and Individual profile forms.
// f: the form values. set: patch function.
export default function SafetyQuestions({ f, set, legacyAge }) {
  const age = ageFromDob(f.dateOfBirth);
  const { min, max } = dobLimits();
  const flip = (k) => set({ allergies: f.allergies.includes(k) ? f.allergies.filter((x) => x !== k) : [...f.allergies, k] });
  return (
    <>
      <label>Date of birth (adults 18 to 75)
        <input type="date" required min={min} max={max} value={f.dateOfBirth} onChange={(e) => set({ dateOfBirth: e.target.value })} />
      </label>
      {age != null && age >= 18 && age <= 75 && <p className="muted">You are {age} years old. Your age updates by itself on your birthday, and your targets and portions change with it.</p>}
      {!f.dateOfBirth && legacyAge && <p className="muted">We have your age as {legacyAge}. Please enter your date of birth so it can update by itself.</p>}

      {f.gender && f.gender !== 'male' && (
        <label>Are you pregnant or breastfeeding?
          <select required value={f.pregnancyBreastfeeding} onChange={(e) => set({ pregnancyBreastfeeding: e.target.value })}>
            <option value="">Choose...</option>
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </label>
      )}
      {f.pregnancyBreastfeeding === 'yes' && (
        <p className="error-text">These plans are not made for pregnancy or breastfeeding, when energy and nutrient needs change a lot. Please follow your doctor or dietitian. You can still use the Basic plan to see portions.</p>
      )}

      <span className="lbl">Food allergies (optional)</span>
      <div className="toggles">
        {ALLERGENS.map(([k, label]) => (
          <label key={k} className="tick"><input type="checkbox" checked={f.allergies.includes(k)} onChange={() => flip(k)} /> {label}</label>
        ))}
      </div>
      <label>Any other allergy (optional)
        <input type="text" maxLength="100" placeholder="For example: kiwi, coconut" value={f.otherAllergies} onChange={(e) => set({ otherAllergies: e.target.value })} />
      </label>
      <p className="muted">We hide meals that list these foods. Ingredient lists can be incomplete, so always check the food yourself. See the <Link to="/disclaimer" target="_blank">Health Disclaimer</Link>.</p>
    </>
  );
}
