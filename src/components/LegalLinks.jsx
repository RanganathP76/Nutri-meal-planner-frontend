import { Link } from 'react-router-dom';

// One row of links to every policy page. Used under the sign-in pages and in Account.
export default function LegalLinks() {
  return (
    <p className="muted legal">
      <Link to="/terms">Terms</Link> &middot; <Link to="/privacy">Privacy</Link> &middot; <Link to="/disclaimer">Health &amp; estimates</Link> &middot;{' '}
      <Link to="/refund-policy">Refunds</Link> &middot; <Link to="/help">Help</Link>
    </p>
  );
}
