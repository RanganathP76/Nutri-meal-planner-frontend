import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Pencil, Droplets, Flame } from 'lucide-react';
import api, { errorMessage } from '../api/client';
import CheckinCard from '../components/CheckinCard';
import { BirthAndPregnancy, Allergies } from '../components/SafetyQuestions';
import { GoalAndTarget, BodySummary } from '../components/BodyGoal';
import TargetsEditor from '../components/TargetsEditor';
import MicroTargets from '../components/MicroTargets';
import { DISEASES, GOAL_LABEL, toggleCondition } from '../utils/health';
import { Button, Card, ChoiceChips, CheckPills, ErrorState, Field, Header, PageSkeleton, Row, Stepper, useFeedback } from '../ui/Kit';
import './ProfileSetup.css';

// One screen for both the Gym and the Individual plan. The only differences are listed here.
const KINDS = {
  gym: {
    base: '/gym', title: 'Your gym profile', needCode: 'GYM_PLAN_REQUIRED', needText: 'The Gym plan is needed for this page.', activity: 'moderate',
    activityLabel: 'Daily activity outside the gym', steps: ['About you', 'Body', 'Goal', 'Workouts', 'Food and health', 'Review']
  },
  individual: {
    base: '/individual', title: 'Your profile', needCode: 'INDIVIDUAL_PLAN_REQUIRED', needText: 'The Individual plan is needed for this page.', activity: 'light',
    activityLabel: 'How active are you in a normal day?', steps: ['About you', 'Body', 'Goal', 'Food and health', 'Review']
  }
};
const GYM_ONLY = ['workoutSchedule', 'morningTime', 'eveningTime', 'intensity', 'bodyFatPercent'];
const ACTIVITY = [['sedentary', 'Mostly sitting'], ['light', 'Light (some walking)'], ['moderate', 'Moderate (on your feet)'], ['intense', 'Very active (physical job)']];
const s = (v) => (v == null ? '' : String(v));

const blank = (kind) => ({
  gender: '', age: '', dateOfBirth: '', pregnancyBreastfeeding: '', allergies: [], otherAllergies: '', heightCm: '', weightKg: '', targetWeightKg: '', bodyFatPercent: '',
  activityLevel: KINDS[kind].activity, goal: 'maintain', workoutSchedule: 'morning', morningTime: '06:30', eveningTime: '18:00', intensity: 'moderate',
  dietType: 'vegetarian', healthConditions: [], acceptedNotice: false
});

const fromProfile = (kind, p) => ({
  ...blank(kind), gender: p.gender, age: s(p.age), dateOfBirth: p.dateOfBirth || '', pregnancyBreastfeeding: p.pregnancyBreastfeeding === 'no' ? 'no' : '', allergies: p.allergies || [], otherAllergies: p.otherAllergies || '',
  heightCm: s(p.heightCm), weightKg: s(p.weightKg), targetWeightKg: s(p.targetWeightKg), bodyFatPercent: s(p.bodyFatPercent), activityLevel: p.activityLevel, goal: p.goal,
  workoutSchedule: p.workoutSchedule || 'morning', morningTime: p.morningTime || '06:30', eveningTime: p.eveningTime || '18:00', intensity: p.intensity || 'moderate',
  dietType: p.dietType, healthConditions: p.healthConditions || [], acceptedNotice: false
});

// What is missing on a step, in words. Empty text means the step is fine. The server still checks everything.
function problemOn(step, f) {
  if (step === 'About you') {
    if (!f.gender) return 'Choose your gender.';
    if (!f.dateOfBirth) return 'Enter your date of birth.';
    if (f.gender !== 'male' && !f.pregnancyBreastfeeding) return 'Tell us if you are pregnant or breastfeeding.';
    if (f.pregnancyBreastfeeding === 'yes') return 'These plans are not made for pregnancy or breastfeeding.';
  }
  if (step === 'Body') {
    if (!(Number(f.heightCm) >= 120 && Number(f.heightCm) <= 230)) return 'Enter your height between 120 and 230 cm.';
    if (!(Number(f.weightKg) >= 30 && Number(f.weightKg) <= 250)) return 'Enter your weight between 30 and 250 kg.';
  }
  if (step === 'Review' && !f.acceptedNotice) return 'Please tick the box to agree before you continue.';
  return '';
}

export default function ProfileSetup({ kind }) {
  const cfg = KINDS[kind];
  const { notify } = useFeedback();
  const [f, setF] = useState(() => blank(kind));
  const [result, setResult] = useState(null);
  const [editing, setEditing] = useState(false);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = useCallback((patch) => setF((o) => ({ ...o, ...patch })), []);
  const aboutDone = Boolean(f.gender && f.dateOfBirth && f.heightCm && f.weightKg && f.activityLevel);
  const name = cfg.steps[step];

  const load = useCallback(() => {
    setLoading(true); setLoadError(null);
    api.get(`${cfg.base}/profile`)
      .then(({ data }) => { if (data.profile) { setF(fromProfile(kind, data.profile)); setResult(data); } })
      .catch((err) => setLoadError({ plan: err.response?.data?.code === cfg.needCode, text: err.response?.data?.code === cfg.needCode ? cfg.needText : errorMessage(err) }))
      .finally(() => setLoading(false));
  }, [cfg, kind]);
  useEffect(() => { load(); }, [load]);

  const go = (i) => { setError(''); setStep(i); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const next = () => { const p = problemOn(name, f); if (p) { setError(p); return; } go(step + 1); };

  const submit = async () => {
    const p = problemOn(name, f);
    if (p) { setError(p); return; }
    setBusy(true); setError('');
    try {
      const body = { ...f };
      if (kind !== 'gym') GYM_ONLY.forEach((k) => delete body[k]);
      const { data } = await api.put(`${cfg.base}/profile`, body);
      setResult(data); setEditing(false); setStep(0);
      notify(data.customCleared ? 'Saved. Your details changed, so your targets were recalculated.' : 'Profile saved');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  // After the target weight or the weight check-in changes, the server may have changed the goal too.
  // The form must start from the saved values, or "Edit my details" would save the old goal and target back.
  const merge = (data) => {
    setResult((r) => ({ ...r, ...data }));
    if (data?.profile) setF((o) => ({ ...fromProfile(kind, data.profile), acceptedNotice: o.acceptedNotice }));
  };
  const startEdit = () => { setStep(0); setError(''); setEditing(true); };

  if (loading) return <PageSkeleton variant="form" label="Loading your profile" />;
  if (loadError) {
    return (
      <ErrorState title={loadError.plan ? 'This plan is needed' : 'Could not load your profile'} text={loadError.text} onRetry={loadError.plan ? undefined : load} />
    );
  }

  // Saved profile: show the targets. "Edit my details" opens the steps again.
  if (result && !editing) {
    const t = kind === 'gym' ? result.targets : result;
    return (
      <div className="stack setup">
        <Header eyebrow="My targets" title={cfg.title} sub="Worked out from your details. All numbers are estimates, not medical advice." />
        {result.goalNote && <Card cream><p className="success-text">{result.goalNote}</p></Card>}
        <Card hero className="setup-hero">
          <div><Flame size={20} aria-hidden="true" /><strong>{Math.round(t.maintenanceCalories)}</strong><span>kcal a day to stay the same weight</span></div>
          {t.waterLitres != null && <div><Droplets size={20} aria-hidden="true" /><strong>{t.waterLitres} L</strong><span>water a day</span></div>}
          <p>Your body uses about {Math.round(t.bmr)} kcal at rest. Method: {t.method}.</p>
        </Card>
        <Link to="/planner" className="ui-btn primary block">Start planning my meals <ArrowRight size={18} aria-hidden="true" /></Link>
        <CheckinCard always base={cfg.base} checkin={result.checkin} weightKg={result.profile.weightKg} onDone={merge} />
        <BodySummary body={result.body} base={cfg.base} onChanged={merge} />
        <TargetsEditor details={result.details} base={cfg.base} onChanged={merge} />
        <MicroTargets micro={result.micro} />
        <Button variant="ghost" block onClick={startEdit}><Pencil size={18} aria-hidden="true" /> Edit my details</Button>
      </div>
    );
  }

  const choose = (key, options) => (
    <select value={f[key]} onChange={(e) => set({ [key]: e.target.value })}>
      <option value="">Choose...</option>
      {options.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
    </select>
  );
  const last = step === cfg.steps.length - 1;

  return (
    <div className="stack setup">
      {result && <button type="button" className="setup-back" onClick={() => { setEditing(false); setError(''); }}><ArrowLeft size={16} aria-hidden="true" /> Back to my targets</button>}
      <Stepper steps={cfg.steps} current={step} onJump={go} />

      <Card className={`stack setup-card${name === 'Goal' ? ' plain' : ''}`}>
        {name === 'About you' && (
          <>
            <Field label="Gender">{choose('gender', [['male', 'Male'], ['female', 'Female'], ['other', 'Other']])}</Field>
            <BirthAndPregnancy f={f} set={set} legacyAge={result?.profile && !result.profile.ageFromDob ? result.profile.age : null} />
          </>
        )}

        {name === 'Body' && (
          <>
            <div className="setup-two">
              <Field label="Height (cm)"><input type="number" inputMode="decimal" min="120" max="230" value={f.heightCm} onChange={(e) => set({ heightCm: e.target.value })} /></Field>
              <Field label="Weight (kg)"><input type="number" inputMode="decimal" step="0.1" min="30" max="250" value={f.weightKg} onChange={(e) => set({ weightKg: e.target.value })} /></Field>
            </div>
            {kind === 'gym' && <Field label="Body fat % (optional)" hint="Only if you know it."><input type="number" inputMode="decimal" step="0.1" min="3" max="60" value={f.bodyFatPercent} onChange={(e) => set({ bodyFatPercent: e.target.value })} /></Field>}
            <div className="ui-field"><span>{cfg.activityLabel}</span></div>
            <ChoiceChips label={cfg.activityLabel} value={f.activityLevel} onChange={(activityLevel) => set({ activityLevel })} options={ACTIVITY} />
          </>
        )}

        {name === 'Goal' && <GoalAndTarget plan={kind} f={f} set={set} ready={aboutDone} prefill={!result} />}

        {name === 'Workouts' && (
          <>
            <Field label="When do you work out?">{choose('workoutSchedule', [['morning', 'Morning'], ['evening', 'Evening'], ['both', 'Morning and evening']])}</Field>
            <div className="setup-two">
              {f.workoutSchedule !== 'evening' && <Field label="Morning time"><input type="time" value={f.morningTime} onChange={(e) => set({ morningTime: e.target.value })} /></Field>}
              {f.workoutSchedule !== 'morning' && <Field label="Evening time"><input type="time" value={f.eveningTime} onChange={(e) => set({ eveningTime: e.target.value })} /></Field>}
            </div>
            <Field label="Workout intensity">{choose('intensity', [['low', 'Light'], ['moderate', 'Moderate'], ['high', 'Hard']])}</Field>
          </>
        )}

        {name === 'Food and health' && (
          <>
            <div className="ui-field"><span>Food preference</span></div>
            <ChoiceChips label="Food preference" value={f.dietType} onChange={(dietType) => set({ dietType })} options={[['vegetarian', 'Vegetarian'], ['non-vegetarian', 'Non-vegetarian']]} />
            <Allergies f={f} set={set} />
            <div className="ui-field"><span>Health conditions (optional)</span></div>
            <CheckPills label="Health conditions" value={f.healthConditions} onChange={(k) => set({ healthConditions: toggleCondition(f.healthConditions, k) })} options={DISEASES} />
            <p className="setup-note">Choose only one for blood pressure (high or low) and one for thyroid (under or over active). We hide meals marked as not suitable for your conditions, rank the most supportive first, and tell you when a meal has not been rated for your condition.</p>
          </>
        )}

        {name === 'Review' && (
          <>
            <p className="ui-muted">Check your answers. Tap Edit to change any of them.</p>
            <ul className="ui-list">
              <li><Row value={`${f.gender || '-'}, ${f.dateOfBirth || '-'}`}>About you</Row></li>
              <li><Row value={`${f.heightCm} cm, ${f.weightKg} kg`}>Body</Row></li>
              <li><Row value={`${GOAL_LABEL[f.goal] || f.goal}${f.targetWeightKg ? `, ${f.targetWeightKg} kg` : ''}`}>Goal</Row></li>
              {kind === 'gym' && <li><Row value={f.workoutSchedule}>Workouts</Row></li>}
              <li><Row value={`${f.dietType}${f.allergies.length ? `, ${f.allergies.length} allergies` : ''}`}>Food</Row></li>
            </ul>
            <label className="setup-consent">
              <input type="checkbox" checked={f.acceptedNotice} onChange={(e) => set({ acceptedNotice: e.target.checked })} />
              <span>I have read and agree to the <Link to="/terms" target="_blank">Terms</Link>, <Link to="/privacy" target="_blank">Privacy Policy</Link> and <Link to="/disclaimer" target="_blank">Health Disclaimer</Link>. I understand all numbers are estimates, not medical advice.</span>
            </label>
          </>
        )}

        {error && <p className="error-text" role="alert">{error}</p>}
        <div className="setup-actions">
          {step > 0 && <Button variant="ghost" onClick={() => go(step - 1)} disabled={busy}><ArrowLeft size={18} aria-hidden="true" /> Back</Button>}
          {last
            ? <Button block onClick={submit} disabled={busy}>{busy ? 'Saving...' : result ? 'Update my profile' : 'Calculate my targets'}</Button>
            : <Button block onClick={next}>Next <ArrowRight size={18} aria-hidden="true" /></Button>}
        </div>
      </Card>
    </div>
  );
}
