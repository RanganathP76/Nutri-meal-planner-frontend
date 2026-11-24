import { useEffect, useState } from 'react';
import { Check, Minus, Pencil, Plus } from 'lucide-react';
import api, { errorMessage } from '../api/client';
import { DISEASE_LABEL, RATING_LABEL, NUTRIENT_GROUPS, NUTRIENT_GROUP_TITLES } from '../utils/health';
import { Button, Chip, PageSkeleton, Photo, Segmented, Sheet } from '../ui/Kit';
import { combineDetailed, combineNutrition } from './mealHelpers';

// Basic plan: portions are shown by age. Two tables, loaded only when opened.
function AgePortions({ mealId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [sex, setSex] = useState('male');
  useEffect(() => {
    let off = false;
    api.get('/meals/age-portions', { params: { mealId } })
      .then((r) => { if (!off) setData(r.data); })
      .catch((err) => { if (!off) setError(errorMessage(err)); });
    return () => { off = true; };
  }, [mealId]);
  if (error) return <p className="error-text">{error}</p>;
  if (!data) return <PageSkeleton label="Loading meal" />;
  return (
    <div className="stack">
      <Segmented value={sex} onChange={setSex} label="Portions for" options={[['male', 'Boys and men'], ['female', 'Girls and women']]} />
      <table className="age-table"><thead><tr><th>Age</th><th>What to serve</th><th>kcal</th></tr></thead><tbody>
        {data[sex].map((b) => (
          <tr key={b.id}><td>{b.ageFrom}{b.ageTo ? `–${b.ageTo}` : '+'} yrs</td><td>{b.portionText}</td><td>{b.nutrition.calories}</td></tr>
        ))}
      </tbody></table>
      <p className="ui-muted">{data.note}</p>
    </div>
  );
}

// Choose another add-on for a Basic meal
function AddonOptions({ meal, options, current, onPick }) {
  const [list, setList] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let off = false;
    api.get('/meals/addon-options', { params: { slot: options.slot, mealId: meal._id, dietType: options.dietType } })
      .then((r) => { if (!off) setList(r.data.options); })
      .catch((err) => { if (!off) setError(errorMessage(err)); });
    return () => { off = true; };
  }, [meal._id, options.slot, options.dietType]);
  return (
    <div className="stack">
      {error && <p className="error-text">{error}</p>}
      {!list && !error && <PageSkeleton label="Loading meals" />}
      {list && list.length === 0 && <p className="ui-muted">No add-on is available for this meal right now.</p>}
      {(list || []).map((o) => (
        <button key={o.meal._id} type="button" className={`addon-opt${current?.meal?._id === o.meal._id ? ' current' : ''}`} onClick={() => onPick({ meal: o.meal })}>
          <Photo src={o.meal.imageUrl} alt={o.meal.name} className="addon-opt-photo" iconSize={20} />
          <span><strong>{o.meal.name}</strong><small>{Math.round(o.meal.nutritionPerServing.calories)} kcal, {o.meal.nutritionPerServing.protein} g protein. Together {Math.round(o.combined.calories)} kcal.</small></span>
          <Chip tone={o.fits ? '' : 'warn'}>{o.fits ? (o.fills.length ? 'Fills a gap' : 'Fits') : 'A bit big'}</Chip>
        </button>
      ))}
    </div>
  );
}

// How the engine scored this meal (all numbers come from the server)
function ScoreDetails({ d }) {
  const label = { cal: 'Calories', protein: 'Protein', carb: 'Carbs', fat: 'Fat', fiber: 'Fibre', digest: 'Easy to digest' };
  return (
    <>
      <table className="engine-table"><tbody>
        {Object.keys(d.weights).map((k) => <tr key={k}><td>{label[k] || k}</td><td>{d.points[k]} of {d.weights[k]} points</td></tr>)}
        {d.goalPoints > 0 && <tr><td>Matches your goal</td><td>+{d.goalPoints}</td></tr>}
        {d.healthBonus > 0 && <tr><td>Suits your health conditions</td><td>+{d.healthBonus}</td></tr>}
        {d.healthPenalty > 0 && <tr><td>Not ideal for your health conditions</td><td>−{d.healthPenalty}</td></tr>}
        {d.varietyPenalty > 0 && <tr><td>Same main food as another meal today</td><td>−{d.varietyPenalty}</td></tr>}
        {d.microAdjust !== 0 && <tr><td>Vitamins, minerals and limits</td><td>{d.microAdjust > 0 ? '+' : '−'}{Math.abs(d.microAdjust)}</td></tr>}
      </tbody></table>
      <p className="ui-muted">
        This meal needs about {d.idealForSlot.calories} kcal and {d.idealForSlot.protein} g protein
        {d.alreadyEaten ? ` (already chosen today: ${d.alreadyEaten.calories} kcal, ${d.alreadyEaten.protein} g protein)` : ''}.
        {d.lastEatenDaysAgo != null ? ` You ate this ${d.lastEatenDaysAgo} day${d.lastEatenDaysAgo === 1 ? '' : 's'} ago, so it is shown lower.` : ''} Scores are estimates, not medical advice.
      </p>
    </>
  );
}

const Fold = ({ title, children }) => <details className="fold"><summary>{title}</summary><div className="fold-body">{children}</div></details>;

// Everything about one meal, with the pick button at the bottom.
//  meal, stepLabel      the meal and the plate it would go on
//  picked               is this meal already in the plan for this step
//  currentAddon         the add-on now in the plan for this step (if picked)
//  addonOptions         { slot, dietType } on Basic, where the customer can choose another add-on
//  onPick(meal, addon)  put it on the plate;  onRemove() take it off
export default function MealSheet({ meal, stepLabel, picked, currentAddon, addonOptions, onPick, onRemove, onClose }) {
  const suggestion = meal?.addon?.meal ? meal.addon : null;
  const [addon, setAddon] = useState(null);
  const [choosing, setChoosing] = useState(false);
  const mealId = meal?._id;
  const startAddon = picked ? currentAddon : suggestion;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setAddon(startAddon || null); setChoosing(false); }, [mealId]);

  if (!meal) return null;
  const rec = meal.recommendation;
  const n = addon ? combineNutrition(meal.nutritionPerServing, addon.meal.nutritionPerServing) : (meal.nutritionPerServing || {});
  const detailed = addon ? combineDetailed(meal.detailedNutrition, addon.meal.detailedNutrition) : meal.detailedNutrition;
  const changed = picked && (addon?.meal?._id || null) !== (currentAddon?.meal?._id || null);

  const footer = picked && !changed
    ? <Button variant="danger" block onClick={onRemove}>Remove from {stepLabel}</Button>
    : <Button block onClick={() => onPick(meal, addon)}>{picked ? 'Update this plate' : addon ? `Add to ${stepLabel} with add-on` : `Add to ${stepLabel}`}</Button>;

  return (
    <Sheet open onClose={onClose} title={meal.name} footer={footer}>
      <div className="msheet-photos">
        <Photo src={meal.imageUrl} alt={meal.name} className="msheet-photo" iconSize={48} />
        {addon && <><span className="msheet-plus" aria-hidden="true">+</span><Photo src={addon.meal.imageUrl} alt={addon.meal.name} className="msheet-photo" iconSize={48} /></>}
      </div>
      <div className="chips-wrap">
        {rec?.fit && <Chip>{rec.fit}</Chip>}
        <Chip tone="sky">{meal.cuisine}</Chip>
        {meal.digestiveProfile?.digestiveLoad && <Chip tone="lilac">{meal.digestiveProfile.digestiveLoad} to digest</Chip>}
        {meal.madeInLast3Days && <Chip tone="warn">Made in the last 3 days</Chip>}
        {(meal.healthLabels || []).map((l) => <Chip key={l.disease} tone={l.verdict === 'good' ? '' : 'bad'}>{l.verdict === 'good' ? '✓' : '✕'} {l.text}</Chip>)}
      </div>
      {rec?.reason && !addon && <p className="msheet-reason">{rec.reason}</p>}
      {addon?.reason && <p className="msheet-reason">{addon.reason}</p>}

      <div className="macro-grid">
        <div><b>{Math.round(n.calories || 0)}</b><span>kcal</span></div>
        <div><b>{n.protein}g</b><span>protein</span></div>
        <div><b>{n.carbohydrates}g</b><span>carbs</span></div>
        <div><b>{n.fat}g</b><span>fat</span></div>
      </div>
      <p className="ui-muted">{addon ? 'Nutrients are for the meal and add-on together. ' : ''}Numbers are estimates, not medical advice.</p>

      {(suggestion || addonOptions) && (
        <div className="addon-box">
          {addon ? (
            <div className="addon-row">
              <span><Chip>✓ Add-on included</Chip> <strong>{addon.meal.name}</strong></span>
              <span className="addon-actions">
                {addonOptions && <button type="button" className="ui-icon-btn" aria-label="Choose another add-on" onClick={() => setChoosing(!choosing)}><Pencil size={16} /></button>}
                <button type="button" className="ui-icon-btn" aria-label="Remove the add-on" onClick={() => { setAddon(null); setChoosing(false); }}><Minus size={16} /></button>
              </span>
            </div>
          ) : (
            <button type="button" className="addon-add" onClick={() => (addonOptions ? setChoosing(true) : setAddon(suggestion))}>
              <span className="ui-icon-btn"><Plus size={16} /></span> Add a small food to complete this meal
            </button>
          )}
          {choosing && addonOptions && <AddonOptions meal={meal} options={addonOptions} current={addon} onPick={(a) => { setAddon(a); setChoosing(false); }} />}
        </div>
      )}

      {rec?.healthFlags?.length > 0 && (
        <ul className="warn-list">
          {rec.healthFlags.filter((f) => f.kind === 'rated').map((f) => (
            <li key={f.disease} className={`rate-${f.rating}`}>{DISEASE_LABEL[f.disease]}: {f.label || RATING_LABEL[f.rating]}{f.reason ? `. ${f.reason}` : ''}</li>
          ))}
          {rec.healthFlags.filter((f) => f.kind === 'conflict').map((f) => (
            <li key={`c-${f.disease}`} style={{ color: '#92400e' }}>{DISEASE_LABEL[f.disease]}: rated suitable, but its own numbers say otherwise ({f.conflict}). The rating was not used. Check this meal once.</li>
          ))}
          {rec.healthFlags.some((f) => f.kind === 'not_reviewed') && (
            <li style={{ color: '#92400e' }}>Not yet reviewed for {rec.healthFlags.filter((f) => f.kind === 'not_reviewed').map((f) => DISEASE_LABEL[f.disease]).join(', ')}. It is shown lower in the list. If you have this health condition, check this meal with your doctor or dietitian first.</li>
          )}
        </ul>
      )}
      {meal.portion && meal.portion.percentChange !== 0 && (
        <p className="note-box">Portion adjusted for your age, goal, height and weight: {meal.portion.percentChange > 0 ? '+' : ''}{meal.portion.percentChange}% compared with {meal.portion.referenceLabel || `a ${meal.portion.referenceWeightKg} kg person`}.</p>
      )}
      {meal.dietitianNote && <p className="note-box">Dietitian note: {meal.dietitianNote}</p>}

      {meal.components?.length > 0 && (
        <div className="plate-box">
          <strong>{meal.portion ? 'Your portion' : 'One serving'}</strong>
          <p>{meal.portionText || meal.components.map((c) => `${c.quantityText ?? c.quantity} ${c.unit === 'piece' ? '' : `${c.unit} `}${c.name.toLowerCase()}`).join(', ')}</p>
          {addon?.meal.portionText && <p className="ui-muted">Add-on: {addon.meal.portionText}</p>}
        </div>
      )}
      {meal.mainIngredients?.length > 0 && <div className="chips-wrap">{meal.mainIngredients.map((m) => <span key={m} className="ing">{m}</span>)}</div>}

      {addonOptions && <Fold title="Portions by age"><AgePortions mealId={meal._id} /></Fold>}
      {meal.portion && meal.components?.length > 0 && (
        <Fold title="Compare with the reference person">
          <ul className="ing-list">
            {meal.components.map((c) => <li key={c.name}>{c.name}: {c.quantityText ?? c.quantity} {c.unit} <span className="ui-muted">({c.referenceQuantity} {c.unit} for {meal.portion.referenceLabel || `a ${meal.portion.referenceWeightKg} kg person`})</span></li>)}
          </ul>
          <p className="ui-muted">Amounts are estimates, adjusted for your age, goal, height and weight.</p>
        </Fold>
      )}
      {rec && !addon && rec.percentOfDaily && (
        <Fold title="What this adds to your day">
          <p>Covers {rec.percentOfDaily.calories}% of your daily calories and {rec.percentOfDaily.protein}% of your protein. Left for the day after this meal: {rec.remainingAfter.calories} kcal, {rec.remainingAfter.protein} g protein.</p>
        </Fold>
      )}
      {rec?.why?.length > 0 && <Fold title="Know why this recommendation"><ul className="why-list">{rec.why.map((w, i) => <li key={i} className={`why-${w.tone}`}>{w.text}</li>)}</ul></Fold>}
      {rec?.details && <Fold title="How this was scored"><ScoreDetails d={rec.details} /></Fold>}
      {detailed && (
        <Fold title={`All nutrients${addon ? ' (meal and add-on together)' : meal.portion ? ' (for your portion)' : ''}`}>
          {Object.entries(NUTRIENT_GROUPS).map(([group, list]) => (
            <div key={group} className="nut-group">
              <strong>{NUTRIENT_GROUP_TITLES[group]}</strong>
              <table className="nut-table"><tbody>
                {list.map((nu) => {
                  const v = detailed?.[group]?.[nu.key];
                  return <tr key={nu.key}><td>{nu.label}</td><td className={v == null ? 'na' : ''}>{v == null ? 'NA' : `${v} ${nu.unit}`}</td></tr>;
                })}
              </tbody></table>
            </div>
          ))}
          <p className="ui-muted">NA means our team has not entered this value.</p>
        </Fold>
      )}
      {picked && !changed && <p className="ui-muted" style={{ textAlign: 'center' }}><Check size={14} aria-hidden="true" /> This meal is on your {stepLabel} plate.</p>}
    </Sheet>
  );
}
