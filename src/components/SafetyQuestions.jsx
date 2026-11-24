import { Link } from 'react-router-dom';
import { Field, CheckPills } from '../ui/Kit';
import { ALLERGENS, ageFromDob, dobLimits } from '../utils/allergens';

// Date of birth and pregnancy / breastfeeding. f: the form values. set: patch function.
export function BirthAndPregnancy({ f, set, legacyAge }) {
  const age = ageFromDob(f.dateOfBirth);
  const { min, max } = dobLimits();
  return (
    <>
      <Field label="Date of birth" hint="Adults 18 to 75. Your age updates by itself on your birthday, and your targets and portions change with it.">
        <input type="date" min={min} max={max} value={f.dateOfBirth} onChange={(e) => set({ dateOfBirth: e.target.value })} />
      </Field>
      {age != null && age >= 18 && age <= 75 && <p className="setup-note">You are {age} years old.</p>}
      {!f.dateOfBirth && legacyAge && <p className="setup-note">We have your age as {legacyAge}. Please enter your date of birth so it can update by itself.</p>}

      {f.gender && f.gender !== 'male' && (
        <Field label="Are you pregnant or breastfeeding?">
          <select value={f.pregnancyBreastfeeding} onChange={(e) => set({ pregnancyBreastfeeding: e.target.value })}>
            <option value="">Choose...</option>
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </Field>
      )}
      {f.pregnancyBreastfeeding === 'yes' && (
        <p className="error-text">These plans are not made for pregnancy or breastfeeding, when energy and nutrient needs change a lot. Please follow your doctor or dietitian. You can still use the Basic plan to see portions.</p>
      )}
    </>
  );
}

// Food allergies as tappable pills, plus one free-text box
export function Allergies({ f, set }) {
  const flip = (k) => set({ allergies: f.allergies.includes(k) ? f.allergies.filter((x) => x !== k) : [...f.allergies, k] });
  return (
    <>
      <div className="ui-field"><span>Food allergies (optional)</span></div>
      <CheckPills label="Food allergies" value={f.allergies} onChange={flip} options={ALLERGENS} />
      <Field label="Any other allergy (optional)">
        <input type="text" maxLength="100" placeholder="For example: kiwi, coconut" value={f.otherAllergies} onChange={(e) => set({ otherAllergies: e.target.value })} />
      </Field>
      <p className="setup-note">We hide meals that list these foods. Ingredient lists can be incomplete, so always check the food yourself. See the <Link to="/disclaimer" target="_blank">Health Disclaimer</Link>.</p>
    </>
  );
}
