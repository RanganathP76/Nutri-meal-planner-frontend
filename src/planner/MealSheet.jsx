import { useEffect, useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import api, { errorMessage } from '../api/client';
import { DISEASE_LABEL, RATING_LABEL, NUTRIENT_GROUPS, NUTRIENT_GROUP_TITLES } from '../utils/health';
import { Button, Chip, PageSkeleton, Photo, PhotoStack, Segmented, Sheet } from '../ui/Kit';
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

// Basic plan: the add-ons that go with this meal, as small photo cards. Loaded only when opened.
function AddonOptions({ meal, options, chosenIds, onPick }) {
  const [list, setList] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let off = false;
    api.get('/meals/addon-options', { params: { slot: options.slot, mealId: meal._id, dietType: options.dietType } })
      .then((r) => { if (!off) setList(r.data.options); })
      .catch((err) => { if (!off) setError(errorMessage(err)); });
    return () => { off = true; };
  }, [meal._id, options.slot, options.dietType]);
  if (error) return <p className="error-text">{error}</p>;
  if (!list) return <PageSkeleton label="Loading add-ons" />;
  if (list.length === 0) return <p className="ui-muted">No add-on is available for this meal right now.</p>;
  return (
    <div className="addon-opts">
      {list.map((o) => (
        <button key={o.meal._id} type="button" className={`addon-opt${chosenIds.includes(o.meal._id) ? ' current' : ''}`} onClick={() => onPick({ meal: o.meal })}>
          <Photo src={o.meal.imageUrl} alt={o.meal.name} className="addon-opt-photo" iconSize={20} />
          <strong>{o.meal.name}</strong>
          <small>{Math.round(o.meal.nutritionPerServing.calories)} kcal · together {Math.round(o.combined.calories)}</small>
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
//  meal, stepLabel         the meal and the plate it would go on
//  picked                  is this meal already in the plan for this step
//  currentAddons           the add-ons now in the plan for this step: [{ meal, reason }]
//  addonOptions            { slot, dietType } on Basic, where the customer picks the add-on from a list
//  maxAddons               1 on Basic, 3 on Gym and Individual
//  onMoreAddons            Gym and Individual: opens "Complete your day" for more add-on ideas
//  onPick(meal, addons)    put it on the plate;  onRemove() take it off
export default function MealSheet({ meal, stepLabel, picked, currentAddons = [], addonOptions, maxAddons = 1, onMoreAddons, onPick, onRemove, onClose }) {
  const suggestion = meal?.addon?.meal ? meal.addon : null;
  const startList = picked ? currentAddons : suggestion ? [suggestion] : [];
  const [list, setList] = useState(startList);
  const [choosing, setChoosing] = useState(false);
  const mealId = meal?._id;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setList(startList); setChoosing(false); }, [mealId]);

  if (!meal) return null;
  const rec = meal.recommendation;
  const n = list.reduce((sum, a) => combineNutrition(sum, a.meal.nutritionPerServing), meal.nutritionPerServing || {});
  const detailed = list.reduce((sum, a) => combineDetailed(sum, a.meal.detailedNutrition), meal.detailedNutrition);
  const ids = (l) => l.map((a) => a.meal._id).sort().join(',');
  const changed = picked && ids(list) !== ids(currentAddons);
  const have = list.length > 0;
  const canAdd = list.length < maxAddons;
  const chosenIds = list.map((a) => a.meal._id);
  const nameOf = (a) => a.meal.name || 'Add-on';

  const footer = picked && !changed
    ? <Button variant="danger" block onClick={onRemove}>Remove from {stepLabel}</Button>
    : <Button block onClick={() => onPick(meal, list)}>{picked ? 'Update this plate' : have ? `Add to ${stepLabel} with ${list.length === 1 ? 'add-on' : `${list.length} add-ons`}` : `Add to ${stepLabel}`}</Button>;

  const addFromSuggestion = () => { if (suggestion && !chosenIds.includes(suggestion.meal._id)) setList([...list, suggestion]); setChoosing(false); };

  return (
    <Sheet open onClose={onClose} title={meal.name} footer={footer}>
      <div className="msheet-photos">
        <Photo src={meal.imageUrl} alt={meal.name} className="msheet-photo" iconSize={48} />
        {have && <span className="msheet-addons"><PhotoStack items={list.map((a) => ({ name: nameOf(a), imageUrl: a.meal.imageUrl }))} size={30} max={3} /> {list.length === 1 ? '+ add-on' : `+ ${list.length} add-ons`}</span>}
      </div>
      <div className="chips-wrap">
        {rec?.fit && <Chip>{rec.fit}</Chip>}
        <Chip tone="sky">{meal.cuisine}</Chip>
        {meal.digestiveProfile?.digestiveLoad && <Chip tone="lilac">{meal.digestiveProfile.digestiveLoad} to digest</Chip>}
        {meal.madeInLast3Days && <Chip tone="warn">Made in the last 3 days</Chip>}
        {(meal.healthLabels || []).map((l) => <Chip key={l.disease} tone={l.verdict === 'good' ? '' : 'bad'}>{l.verdict === 'good' ? '✓' : '✕'} {l.text}</Chip>)}
      </div>
      {rec?.reason && !have && <p className="msheet-reason">{rec.reason}</p>}
      {list[0]?.reason && <p className="msheet-reason">{list[0].reason}</p>}

      <div className="macro-grid">
        <div><b>{Math.round(n.calories || 0)}</b><span>kcal</span></div>
        <div><b>{n.protein}g</b><span>protein</span></div>
        <div><b>{n.carbohydrates}g</b><span>carbs</span></div>
        <div><b>{n.fat}g</b><span>fat</span></div>
      </div>
      <p className="ui-muted">{have ? 'Nutrients are for the meal and its add-ons together. ' : ''}Numbers are estimates, not medical advice.</p>

      {(have || suggestion || addonOptions || onMoreAddons) && (
        <section className="addon-flow" aria-label="Add-ons">
          <header><h4>Add-on{maxAddons > 1 ? 's' : ''}</h4><small>optional, a small food that completes this meal</small></header>
          {list.map((a) => (
            <div key={a.meal._id} className="addon-item">
              <Photo src={a.meal.imageUrl} alt={nameOf(a)} className="ph" iconSize={20} />
              <span>
                <b>{nameOf(a)}</b>
                <small>{a.meal.nutritionPerServing ? `${Math.round(a.meal.nutritionPerServing.calories)} kcal · ${a.meal.nutritionPerServing.protein} g protein` : 'Added to this meal'}{a.meal.portionText ? ` · ${a.meal.portionText}` : ''}</small>
              </span>
              <button type="button" className="ui-icon-btn" aria-label={`Remove ${nameOf(a)}`} onClick={() => setList(list.filter((x) => x.meal._id !== a.meal._id))}><X size={16} /></button>
            </div>
          ))}
          {(canAdd || (maxAddons === 1 && addonOptions)) && !choosing && (
            <button type="button" className="addon-add" onClick={() => (addonOptions ? setChoosing(true) : suggestion && !chosenIds.includes(suggestion.meal._id) ? addFromSuggestion() : onMoreAddons?.())}>
              <span className="plus"><Plus size={16} aria-hidden="true" /></span>
              {have ? (maxAddons > 1 ? 'Add another add-on' : 'Change the add-on') : 'Add a small food to complete this meal'}
            </button>
          )}
          {choosing && addonOptions && (
            <>
              <p className="addon-steps"><b>Tap one to add it.</b> You can remove it again before you add the meal to your plate.</p>
              <AddonOptions meal={meal} options={addonOptions} chosenIds={chosenIds} onPick={(a) => { setList(maxAddons === 1 ? [a] : [...list.filter((x) => x.meal._id !== a.meal._id), a]); setChoosing(false); }} />
            </>
          )}
          {onMoreAddons && !addonOptions && (
            <button type="button" className="addon-more" onClick={onMoreAddons}>See more add-on ideas for your whole day</button>
          )}
        </section>
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
      {rec && !have && rec.percentOfDaily && (
        <Fold title="What this adds to your day">
          <p>Covers {rec.percentOfDaily.calories}% of your daily calories and {rec.percentOfDaily.protein}% of your protein. Left for the day after this meal: {rec.remainingAfter.calories} kcal, {rec.remainingAfter.protein} g protein.</p>
        </Fold>
      )}
      {rec?.why?.length > 0 && <Fold title="Know why this recommendation"><ul className="why-list">{rec.why.map((w, i) => <li key={i} className={`why-${w.tone}`}>{w.text}</li>)}</ul></Fold>}
      {rec?.details && <Fold title="How this was scored"><ScoreDetails d={rec.details} /></Fold>}
      {detailed && (
        <Fold title={`All nutrients${have ? ' (meal and add-ons together)' : meal.portion ? ' (for your portion)' : ''}`}>
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
