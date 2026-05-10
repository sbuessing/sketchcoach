import { Link, useParams } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { findGuideline, findProject } from '../../services/dataService';
import './CoachingScreen.css';

export default function CoachingScreen() {
  const { slug = '' } = useParams<{ slug: string }>();
  const { projects, guidelines } = useApp();

  const project = findProject(projects, slug);
  if (!project) {
    return (
      <div className="coaching">
        <p>Project not found.</p>
        <Link to="/">Back home</Link>
      </div>
    );
  }

  const guideline = findGuideline(guidelines, project.focusGuidelines[0]);

  return (
    <div className="coaching">
      <Link to="/" className="coaching__back">
        ← Back
      </Link>

      <div className="coaching__inner">
        <p className="coaching__eyebrow">Today's principle for {project.title}</p>

        {guideline ? (
          <>
            <h1 className="coaching__title">{guideline.title}</h1>
            <p className="coaching__desc">{guideline.description}</p>
            {guideline.coachCues[0] && (
              <div className="coaching__cue">
                <p className="coaching__cue-label">In the moment, the coach might say…</p>
                <p className="coaching__cue-text">"{guideline.coachCues[0]}"</p>
              </div>
            )}
          </>
        ) : (
          <p>No focus principle found for this project.</p>
        )}

        <Link to={`/draw/${slug}`} className="coaching__cta">
          Start drawing
        </Link>
      </div>
    </div>
  );
}
