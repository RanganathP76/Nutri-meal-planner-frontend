import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../api/client';
import './MealBrowse.css';

// Photo and name only. Mount with a `key` of the filters so it resets when they change.
export default function MealBrowse({ slot, dietType, cuisine }) {
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meals, setMeals] = useState([]);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(null);
  const [error, setError] = useState('');
  const [tapped, setTapped] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.get('/meals/browse', { params: { mealType: slot, dietType, cuisine, q: search, page } })
      .then(({ data }) => {
        if (cancelled) return;
        setMeals((prev) => (data.page === 1 ? data.meals : [...prev, ...data.meals]));
        setPages(data.pages);
        setTotal(data.total);
      })
      .catch((err) => { if (!cancelled) setError(errorMessage(err)); });
    return () => { cancelled = true; };
  }, [slot, dietType, cuisine, search, page]);

  const submit = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(q.trim());
  };

  return (
    <div className="stack">
      <form onSubmit={submit}><input placeholder="Search meals" value={q} onChange={(e) => setQ(e.target.value)} /></form>

      {tapped && (
        <div className="card browse-lock stack">
          <strong>🔒 Subscribe to see this meal's details</strong>
          <p className="muted">A plan unlocks nutrition, digestion information and personal recommendations.</p>
          <Link to="/plans" className="btn btn-primary">See plans</Link>
        </div>
      )}
      {error && <p className="error-text">{error}</p>}
      {total === 0 && <p className="center-note">No meals found.</p>}

      <div className="browse-grid">
        {meals.map((m) => (
          <button key={m._id} type="button" className="browse-card" onClick={() => setTapped(true)}>
            <img src={m.imageUrl} alt={m.name} loading="lazy" />
            <span>{m.name}</span>
          </button>
        ))}
      </div>

      {page < pages && <button className="btn btn-light" onClick={() => setPage(page + 1)}>Show more meals</button>}
    </div>
  );
}