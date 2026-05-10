import { Link } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';

// Placeholder — grid of completed sketches, modal on click.
export default function PortfolioScreen() {
  const { portfolio } = useApp();

  return (
    <div style={{ padding: 'var(--space-4)', maxWidth: 1100, margin: '0 auto' }}>
      <Link to="/" style={{ color: 'var(--color-ink-soft)', fontSize: '0.9rem' }}>
        ← Back
      </Link>
      <h1 style={{ marginTop: 'var(--space-4)' }}>Portfolio</h1>
      {portfolio.length === 0 ? (
        <p style={{ color: 'var(--color-ink-soft)', marginTop: 'var(--space-4)' }}>
          No sketches yet. <Link to="/">Pick a project</Link> to get started.
        </p>
      ) : (
        <p style={{ color: 'var(--color-ink-soft)' }}>
          {portfolio.length} sketch{portfolio.length === 1 ? '' : 'es'} saved. Gallery view coming soon.
        </p>
      )}
    </div>
  );
}
