import { useEffect, useRef, useState } from 'react';
import MealCard from './MealCard';
import './MealPicker.css';

// The server ranks every suitable meal but sends only 3 at a time, so the phone never holds the whole list.
//  meals      the first 3 meals from the server (best first)
//  total      how many suitable meals there are
//  fetchMore  (extraParams) => Promise<server response>. "shown" asks for the next 3, "q" searches.
//  resetKey   changes when the slot, diet, cuisine or date changes, so we start again at the top 3
const SIZE = 3;

export default function MealPicker({ notice = '', meals, total = 0, fetchMore, loading, selectedId, onSelect, resetKey, ageTable = false, canAddon = false, addonOptions = null, addonFor = null, onAddonChange = null }) {
  const [pages, setPages] = useState([]); // pages of meals already received, oldest first
  const [at, setAt] = useState(0);
  const [more, setMore] = useState(false);
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');
  const [found, setFound] = useState(null); // search results from the server
  const [searching, setSearching] = useState(false);
  const wait = useRef(null);
  const idsKey = meals.map((m) => m._id).join(',');

  // Start (again) at the top 3 when the choice changes or the first page changes
  useEffect(() => {
    setPages(meals.length ? [meals] : []);
    setAt(0); setQ(''); setFound(null); setErr('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, idsKey]);

  // Search on the server after the customer stops typing
  useEffect(() => {
    clearTimeout(wait.current);
    const term = q.trim();
    if (!term) { setFound(null); return undefined; }
    wait.current = setTimeout(async () => {
      setSearching(true);
      try { setFound(await fetchMore({ q: term })); setErr(''); } catch { setErr('Could not search right now. Please try again.'); } finally { setSearching(false); }
    }, 400);
    return () => clearTimeout(wait.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const seen = pages.flat();
  const current = pages[at] || [];
  const canGoOn = at < pages.length - 1 || total > seen.length || total > SIZE;

  const showOther = async () => {
    if (at < pages.length - 1) return setAt(at + 1); // already received: go forward
    setMore(true); setErr('');
    try {
      const data = await fetchMore({ shown: seen.map((m) => m._id).join(',') });
      if (!data.meals.length) return;
      if (data.restarted) { setPages([data.meals]); setAt(0); } // everything was seen: start again
      else { setPages([...pages, data.meals]); setAt(pages.length); }
    } catch { setErr('Could not load more meals. Please try again.'); } finally { setMore(false); }
  };

  if (!meals.length) return null;
  const term = q.trim();
  return (
    <div className="picker">
      <div className="picker-search">
        <input type="search" placeholder="Search meals or ingredients, e.g. fish, ragi, paneer" value={q} onChange={(e) => setQ(e.target.value)} />
        {q && <button type="button" className="btn btn-light btn-sm" onClick={() => setQ('')}>Clear</button>}
      </div>
      {notice && <p className="note-box">{notice}</p>}
      {err && <p className="error-text">{err}</p>}

      {term ? (
        <div className="stack">
          <p className="muted">{searching || !found ? 'Searching...' : found.matches ? `${found.matches} meal${found.matches === 1 ? '' : 's'} found for "${term}"${found.matches > found.meals.length ? ` (showing the best ${found.meals.length}, try a longer word to narrow it)` : ''}` : `No meal found for "${term}". Try another word.`}</p>
          {(found?.meals || []).map((m) => <MealCard key={m._id} meal={m} selected={selectedId === m._id} onSelect={onSelect} ageTable={ageTable} canAddon={canAddon} addonOptions={addonOptions} addonValue={addonFor ? addonFor(m) : null} onAddonChange={onAddonChange} />)}
        </div>
      ) : (
        <div className="stack" style={{ opacity: loading || more ? 0.6 : 1 }}>
          <div className="picker-head">
            <strong>{at === 0 ? 'Top picks for you' : `More ideas (set ${at + 1})`}</strong>
            <span className="muted">{Math.min(seen.length, total)} of {total} seen</span>
          </div>
          {current.map((m) => <MealCard key={m._id} meal={m} selected={selectedId === m._id} onSelect={onSelect} ageTable={ageTable} canAddon={canAddon} addonOptions={addonOptions} addonValue={addonFor ? addonFor(m) : null} onAddonChange={onAddonChange} />)}
          <div className="picker-bar">
            <button type="button" className="btn btn-light" onClick={() => setAt(at - 1)} disabled={at === 0}>&larr; Previous {SIZE}</button>
            <button type="button" className="btn btn-primary" onClick={showOther} disabled={more || total <= SIZE}>
              {more ? 'Loading...' : seen.length >= total && at === pages.length - 1 ? 'Start again ↻' : `Show other ${SIZE} ↻`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// What the customer has picked so far, kept at the top of the planner
export function PickedSummary({ items }) {
  // each item: { key, label, name, addonName? } ; a meal with an add-on reads "Meal + Add-on"
  if (!items.some((i) => i.name)) return null;
  return (
    <div className="card picked">
      {items.map((i) => (
        <div key={i.key} className="picked-row">
          <span className="muted">{i.label}</span>
          <span>{i.name ? `✓ ${i.name}${i.addonName ? ` + ${i.addonName}` : ''}` : '—'}</span>
        </div>
      ))}
    </div>
  );
}
