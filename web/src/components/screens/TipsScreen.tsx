import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import type { Guideline, GuidelineCategory } from '../../shared/types';
import './TipsScreen.css';

const CATEGORY_LABEL: Record<GuidelineCategory, string> = {
  foundational:  'Foundational',
  construction:  'Construction',
  proportion:    'Proportion',
  'line-quality':'Line Quality',
  observation:   'Observation',
  composition:   'Composition',
  style:         'Style',
};

export default function TipsScreen() {
  const { guidelines, projects, portfolio } = useApp();

  const { encountered, notYet } = useMemo(() => {
    const completedSlugs = new Set(portfolio.map((e) => e.projectSlug));
    const encounteredIds = new Set(
      projects
        .filter((p) => completedSlugs.has(p.slug))
        .flatMap((p) => p.focusGuidelines),
    );
    return {
      encountered: guidelines.filter((g) => encounteredIds.has(g.id)),
      notYet:      guidelines.filter((g) => !encounteredIds.has(g.id)),
    };
  }, [guidelines, projects, portfolio]);

  return (
    <div className="tips">
      <header className="tips__header">
        <Link to="/" className="tips__back">← Home</Link>
        <div>
          <h1 className="tips__title">Sketching Tips</h1>
          <p className="tips__subtitle">
            Principles that guide every great sketch — from your first line to your hundredth.
          </p>
        </div>
      </header>

      {encountered.length > 0 && (
        <section className="tips__section">
          <div className="tips__section-header">
            <h2 className="tips__section-title">Techniques you've worked on</h2>
            <p className="tips__section-sub">
              These principles came up in projects you've completed. Keep practising — mastery takes time.
            </p>
          </div>
          <div className="tips__grid">
            {encountered.map((g) => <GuidelineCard key={g.id} guideline={g} encountered />)}
          </div>
        </section>
      )}

      <section className="tips__section">
        <div className="tips__section-header">
          <h2 className="tips__section-title">
            {encountered.length > 0 ? 'Still to discover' : 'All techniques'}
          </h2>
          <p className="tips__section-sub">
            {encountered.length > 0
              ? 'These principles are waiting for you in future projects. No need to memorise them — the coach will introduce them when the moment is right.'
              : 'Complete your first project and the coach will start introducing these one by one.'}
          </p>
        </div>
        <div className="tips__grid">
          {notYet.map((g) => <GuidelineCard key={g.id} guideline={g} encountered={false} />)}
        </div>
      </section>
    </div>
  );
}

function GuidelineCard({ guideline: g, encountered }: { guideline: Guideline; encountered: boolean }) {
  return (
    <div className={`tip-card ${encountered ? 'tip-card--encountered' : 'tip-card--future'}`}>
      <div className="tip-card__meta">
        <span className="tip-card__category">{CATEGORY_LABEL[g.category]}</span>
        <span className="tip-card__level">{g.level}</span>
      </div>
      <h3 className="tip-card__title">{g.title}</h3>
      <p className="tip-card__desc">{g.description}</p>
      {encountered && g.coachCues.length > 0 && (
        <ul className="tip-card__cues">
          {g.coachCues.map((cue, i) => (
            <li key={i}>{cue}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
