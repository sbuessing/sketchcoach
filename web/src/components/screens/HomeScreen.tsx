import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import ApiKeyModal from '../settings/ApiKeyModal';
import { isByokMode, isCoachConfigured } from '../../services/claudeClient';
import { findScene, projectsInScene } from '../../services/dataService';
import type { Project, Scene, Tier } from '../../shared/types';
import './HomeScreen.css';

const TIER_ORDER: Tier[] = ['beginner', 'developing', 'intermediate', 'advanced'];
const TIER_LABEL: Record<Tier, string> = {
  beginner: 'Beginner',
  developing: 'Developing',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export default function HomeScreen() {
  const { projects, scenes, activeSceneId, setActiveSceneId, portfolio } = useApp();
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [showSceneModal, setShowSceneModal] = useState(false);

  const completedSlugs = useMemo(
    () => new Set(portfolio.map((e) => e.projectSlug)),
    [portfolio],
  );

  const sceneProjects = useMemo(
    () => projectsInScene(projects, activeSceneId),
    [projects, activeSceneId],
  );

  const activeScene = findScene(scenes, activeSceneId);
  const configured = isCoachConfigured();
  const byok = isByokMode();

  return (
    <div className="home">
      <header className="home__header">
        <div className="home__title-block">
          <h1 className="home__title">
            Sketch Coach
            <Link to="/about" className="home__about-link" aria-label="About Sketch Coach">ⓘ</Link>
          </h1>
          <p className="home__subtitle">A cozy place to practice line drawing.</p>
          {activeScene && (
            <button
              type="button"
              className="home__scene-chip"
              onClick={() => setShowSceneModal(true)}
              title="Switch scene"
            >
              <span className="home__scene-chip-label">Scene</span>
              <span className="home__scene-chip-name">{activeScene.title}</span>
              <span className="home__scene-chip-caret" aria-hidden>▾</span>
            </button>
          )}
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
          <Link to={`/scene/${activeSceneId}`} className="home__view-scene-btn">
            View scene →
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

      {showSceneModal && (
        <SceneModal
          scenes={scenes}
          activeSceneId={activeSceneId}
          projects={projects}
          completedSlugs={completedSlugs}
          onSelect={(id) => {
            setActiveSceneId(id);
            setShowSceneModal(false);
          }}
          onClose={() => setShowSceneModal(false)}
        />
      )}

      {TIER_ORDER.map((tier) => {
        const tierProjects = sceneProjects.filter((p) => p.tier === tier);
        if (tierProjects.length === 0) return null;
        return (
          <section key={tier} className={`tier tier--${tier}`}>
            <div className="tier__heading">
              <h2 className="tier__title">{TIER_LABEL[tier]}</h2>
            </div>
            <div className="tier__grid">
              {tierProjects.map((project) => (
                <ProjectCard
                  key={project.slug}
                  project={project}
                  completed={completedSlugs.has(project.slug)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/**
 * Modal scene picker — replaces the previously inline horizontal card row.
 * Triggered by the scene chip in the home header. Picking a scene closes the modal.
 */
function SceneModal({
  scenes,
  activeSceneId,
  projects,
  completedSlugs,
  onSelect,
  onClose,
}: {
  scenes: Scene[];
  activeSceneId: string;
  projects: Project[];
  completedSlugs: Set<string>;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  // Escape closes the modal.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Portal to <body> so the modal escapes .home's transform animation, which
  // would otherwise become the containing block for position: fixed and break
  // viewport-anchored centering on a long scrolled page.
  return createPortal(
    <div className="home__scene-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="home__scene-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="scene-modal-title"
      >
        <button
          type="button"
          className="home__scene-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <h2 id="scene-modal-title" className="home__scene-modal-title">Choose a scene</h2>
        <p className="home__scene-modal-intro">
          Each scene is a themed collection of projects that build into one assembled picture. Switch any time — your progress in each scene stays put.
        </p>
        <div className="scene-picker">
          {scenes.map((scene) => {
            const sp = projectsInScene(projects, scene.id);
            const done = sp.filter((p) => completedSlugs.has(p.slug)).length;
            const active = scene.id === activeSceneId;
            return (
              <button
                key={scene.id}
                type="button"
                className={`scene-card ${active ? 'scene-card--active' : ''}`}
                onClick={() => onSelect(scene.id)}
              >
                <span className="scene-card__title">{scene.title}</span>
                <span className="scene-card__tagline">{scene.tagline}</span>
                <span className="scene-card__progress">{done} / {sp.length} complete</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function ProjectCard({
  project,
  completed,
}: {
  project: Project;
  completed: boolean;
}) {
  return (
    <Link to={`/draw/${project.slug}`} className="card__link">
      <div className={`card ${completed ? 'card--completed' : ''}`}>
        <div className="card__check" aria-hidden>
          {completed ? '✓' : ''}
        </div>
        <h3 className="card__title">{project.title}</h3>
        <p className="card__desc">{project.description}</p>
        <div className="card__meta">
          <span>{project.estimatedMinutes} min</span>
        </div>
      </div>
    </Link>
  );
}
