import { Link, useParams } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { findProject } from '../../services/dataService';

// Placeholder — final summary, save-to-portfolio button.
export default function DoneScreen() {
  const { slug = '' } = useParams<{ slug: string }>();
  const { projects } = useApp();
  const project = findProject(projects, slug);

  return (
    <div style={{ padding: 'var(--space-4)' }}>
      <h1>Nice work on {project?.title ?? slug}!</h1>
      <p style={{ color: 'var(--color-ink-soft)' }}>
        Final summary, save-to-portfolio, and try-next will live here.
      </p>
      <Link to="/" style={{ display: 'inline-block', marginTop: 'var(--space-4)' }}>
        Back home
      </Link>
    </div>
  );
}
