import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import ApiKeyModal from '../settings/ApiKeyModal';
import { isByokMode, isCoachConfigured } from '../../services/claudeClient';
import type { Project, Tier } from '../../shared/types';
import './HomeScreen.css';

const TIER_ORDER: Tier[] = ['beginner', 'developing', 'intermediate', 'advanced'];
const TIER_LABEL: Record<Tier, string> = {
  beginner: 'Beginner',
  developing: 'Developing',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

// Tier unlocking rules from the spec.
function isTierUnlocked(tier: Tier, completedSlugs: Set<string>, projects: Project[]): boolean {
  if (tier === 'beginner') return true;
  const beginnerCount = projects.filter(
    (p) => p.tier === 'beginner' && completedSlugs.has(p.slug),
  ).length;
  if (tier === 'developing') return beginnerCount >= 2;
  const developingCount = projects.filter(
    (p) => p.tier === 'developing' && completedSlugs.has(p.slug),
  ).length;
  if (tier === 'intermediate') return developingCount >= 2;
  const intermediateCount = projects.filter(
    (p) => p.tier === 'intermediate' && completedSlugs.has(p.slug),
  ).length;
  return intermediateCount >= 2;
}

export default function HomeScreen() {
  const { projects, portfolio } = useApp();
  const [showKeyModal, setShowKeyModal] = useState(false);

  const completedSlugs = new Set(portfolio.map((e) => e.projectSlug));
  const configured = isCoachConfigured();
  const byok = isByokMode();

  return (
    <div className="home">
      <header className="home__header">
        <div>
          <h1 className="home__title">Sketch Coach</h1>
          <p className="home__subtitle">A cozy place to practice line drawing.</p>
        </div>
        <div className="home__header-actions">
          <button
            className={`home__key-btn ${!configured ? 'home__key-btn--missing' : ''}`}
            onClick={() => setShowKeyModal(true)}
            title={configured ? (byok ? 'Your API key is active' : 'Using built-in key') : 'Add your Anthropic API key'}
          >
            {!configured && <span className="home__key-dot home__key-dot--missing" />}
            {configured && <span className="home__key-dot home__key-dot--ok" />}
            API key
          </button>
          <Link to="/tips" className="home__portfolio-link">
            Sketching Tips
          </Link>
          <Link to="/portfolio" className="home__portfolio-link">
            Portfolio · {portfolio.length}
          </Link>
        </div>
      </header>

      {!configured && (
        <div className="home__key-banner">
          The coach needs an Anthropic API key to give feedback.{' '}
          <button className="home__key-banner-btn" onClick={() => setShowKeyModal(true)}>
            Add your key →
          </button>
        </div>
      )}

      {showKeyModal && <ApiKeyModal onClose={() => setShowKeyModal(false)} />}

      {TIER_ORDER.map((tier) => {
        const tierProjects = projects.filter((p) => p.tier === tier);
        const unlocked = isTierUnlocked(tier, completedSlugs, projects);
        return (
          <section key={tier} className={`tier tier--${tier}`}>
            <div className="tier__heading">
              <h2 className="tier__title">{TIER_LABEL[tier]}</h2>
              {!unlocked && <span className="tier__locked">Locked — finish 2 from the previous tier</span>}
            </div>
            <div className={`tier__grid ${unlocked ? '' : 'tier__grid--locked'}`}>
              {tierProjects.map((project) => {
                const completed = completedSlugs.has(project.slug);
                return (
                  <ProjectCard
                    key={project.slug}
                    project={project}
                    completed={completed}
                    disabled={!unlocked}
                  />
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function ProjectCard({
  project,
  completed,
  disabled,
}: {
  project: Project;
  completed: boolean;
  disabled: boolean;
}) {
  const inner = (
    <div className={`card ${completed ? 'card--completed' : ''} ${disabled ? 'card--disabled' : ''}`}>
      <div className="card__check" aria-hidden>
        {completed ? '✓' : ''}
      </div>
      <h3 className="card__title">{project.title}</h3>
      <p className="card__desc">{project.description}</p>
      <div className="card__meta">
        <span>{project.estimatedMinutes} min</span>
      </div>
    </div>
  );

  if (disabled) {
    return <div aria-disabled>{inner}</div>;
  }

  return (
    <Link to={`/draw/${project.slug}`} className="card__link">
      {inner}
    </Link>
  );
}
