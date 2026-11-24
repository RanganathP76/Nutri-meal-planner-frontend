import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, RefreshCw, Search, X, Flame } from 'lucide-react';
import { Photo, Button, IconButton } from '../ui/Kit';

// The server ranks every suitable meal but sends only 3 at a time, so the phone never holds the whole list.
//  meals      the first 3 meals from the server (best first)
//  total      how many suitable meals there are
//  fetchMore  (extraParams) => Promise<server response>. "shown" asks for the next 3, "q" searches.
//  resetKey   changes when the slot, diet, cuisine or date changes, so we start again at the top 3
const SIZE = 3;

export function MealCard({ meal, picked, onOpen, onQuick, recent }) {
  const rec = meal.recommendation;
  const n = meal.nutritionPerServing || {};
  return (
    <article className={`mcard${picked ? ' picked' : ''}`}>
      <button type="button" className="mcard-photo" onClick={() => onOpen(meal)} aria-label={`Details for ${meal.name}`}>
        <Photo src={meal.imageUrl} alt={meal.name} iconSize={40} />
        {rec?.fit && <span className="mcard-fit">{rec.fit}</span>}
        {picked && <span className="mcard-check" aria-hidden="true"><Check size={18} /></span>}
        {meal.addon?.meal && <span className="mcard-plus">+ {meal.addon.meal.name}</span>}
      </button>
      <div className="mcard-body">
        <h3 onClick={() => onOpen(meal)}>{meal.name}</h3>
        <p className="mcard-sub">{meal.cuisine}{meal.digestiveProfile?.digestiveLoad ? ` · ${meal.digestiveProfile.digestiveLoad} to digest` : ''}</p>
        <div className="mcard-stats">
          <span><Flame size={14} aria-hidden="true" /><b>{Math.round(n.calories || 0)}</b> kcal</span>
          <span><b>{Math.round(n.protein || 0)}g</b> protein</span>
          <span><b>{Math.round(n.carbohydrates || 0)}g</b> carbs</span>
        </div>
        {recent && <span className="ui-chip warn">Made in the last 3 days</span>}
        {rec?.reason && <p className="mcard-reason">{rec.reason}</p>}
        <div className="mcard-actions">
          <Button variant="ghost" small onClick={() => onOpen(meal)}>Details</Button>
          <Button variant={picked ? 'soft' : 'primary'} small onClick={() => onQuick(meal)}>{picked ? <><Check size={16} aria-hidden="true" /> Picked</> : 'Pick'}</Button>
        </div>
      </div>
    </article>
  );
}

export default function MealStage({ notice = '', meals, total = 0, fetchMore, loading, selectedId, onOpen, onQuick, resetKey }) {
  const [pages, setPages] = useState([]); // pages of meals already received, oldest first
  const [at, setAt] = useState(0);
  const [more, setMore] = useState(false);
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [found, setFound] = useState(null);
  const [searching, setSearching] = useState(false);
  const wait = useRef(null);
  const fetchRef = useRef(fetchMore);
  fetchRef.current = fetchMore;
  const idsKey = meals.map((m) => m._id).join(',');

  // Start again at the top 3 when the choice changes or the first page changes
  useEffect(() => {
    setPages(meals.length ? [meals] : []);
    setAt(0); setQ(''); setFound(null); setErr(''); setSearchOpen(false);
  // meals is covered by idsKey
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, idsKey]);

  // Search on the server after the customer stops typing
  useEffect(() => {
    clearTimeout(wait.current);
    const term = q.trim();
    if (!term) { setFound(null); return undefined; }
    wait.current = setTimeout(async () => {
      setSearching(true);
      try { setFound(await fetchRef.current({ q: term })); setErr(''); } catch { setErr('Could not search right now. Please try again.'); } finally { setSearching(false); }
    }, 400);
    return () => clearTimeout(wait.current);
  }, [q]);

  const seen = pages.flat();
  const current = pages[at] || [];
  const term = q.trim();

  const showOther = async () => {
    if (at < pages.length - 1) { setAt(at + 1); return; } // already received: go forward
    setMore(true); setErr('');
    try {
      const data = await fetchMore({ shown: seen.map((m) => m._id).join(',') });
      if (!data.meals.length) return;
      if (data.restarted) { setPages([data.meals]); setAt(0); } // everything was seen: start again
      else { setPages([...pages, data.meals]); setAt(pages.length); }
    } catch { setErr('Could not load more meals. Please try again.'); } finally { setMore(false); }
  };

  if (!meals.length) return null;
  const everySeen = seen.length >= total && at === pages.length - 1;

  return (
    <section className="stage" aria-busy={loading || more}>
      <div className="stage-head">
        <div>
          <h2>{term ? 'Search results' : at === 0 ? 'Top picks for you' : `More ideas · set ${at + 1}`}</h2>
          {!term && <p className="ui-muted">{Math.min(seen.length, total)} of {total} meals seen</p>}
        </div>
        <IconButton label={searchOpen ? 'Close search' : 'Search meals'} onClick={() => { setSearchOpen(!searchOpen); if (searchOpen) setQ(''); }}>
          {searchOpen ? <X size={20} /> : <Search size={20} />}
        </IconButton>
      </div>

      {searchOpen && (
        <input type="search" autoFocus className="stage-search" placeholder="Search meals or ingredients, e.g. fish, ragi, paneer" value={q} onChange={(e) => setQ(e.target.value)} />
      )}
      {notice && <p className="note-box">{notice}</p>}
      {err && <p className="error-text">{err}</p>}

      {term ? (
        <>
          <p className="ui-muted">{searching || !found ? 'Searching…' : found.matches ? `${found.matches} meal${found.matches === 1 ? '' : 's'} found for "${term}"${found.matches > found.meals.length ? ` (showing the best ${found.meals.length}; try a longer word to narrow it)` : ''}` : `No meal found for "${term}". Try another word.`}</p>
          <div className="mrow">{(found?.meals || []).map((m) => <MealCard key={m._id} meal={m} picked={selectedId === m._id} recent={m.madeInLast3Days} onOpen={onOpen} onQuick={onQuick} />)}</div>
        </>
      ) : (
        <>
          <div className="mrow" style={{ opacity: loading || more ? 0.55 : 1 }}>
            {current.map((m) => <MealCard key={m._id} meal={m} picked={selectedId === m._id} recent={m.madeInLast3Days} onOpen={onOpen} onQuick={onQuick} />)}
          </div>
          <div className="stage-nav">
            <Button variant="ghost" small onClick={() => setAt(at - 1)} disabled={at === 0}><ArrowLeft size={16} aria-hidden="true" /> Previous {SIZE}</Button>
            <Button variant="soft" small onClick={showOther} disabled={more || total <= SIZE}>
              <RefreshCw size={16} aria-hidden="true" /> {more ? 'Loading…' : everySeen ? 'Start again' : `Show other ${SIZE}`}
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
