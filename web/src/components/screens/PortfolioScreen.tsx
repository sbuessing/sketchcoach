// PortfolioScreen — grid of completed sketches.
//
// Thumbnail grid (from saved data URLs). Click opens a detail modal with
// the full SVG, final feedback, try-next tips, and a delete option.

import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { findProject } from '../../services/dataService';
import { clearPortfolio, deletePortfolioEntry } from '../../services/portfolioStore';
import { formatDate, formatDuration } from '../../shared/utils';
import type { PortfolioEntry } from '../../shared/types';
import './PortfolioScreen.css';

export default function PortfolioScreen() {
  const { portfolio, projects, refreshPortfolio } = useApp();
  const [selected, setSelected] = useState<PortfolioEntry | null>(null);

  const handleDelete = useCallback(
    async (entry: PortfolioEntry) => {
      if (!window.confirm('Delete this sketch from your portfolio?')) return;
      await deletePortfolioEntry(entry.id);
      await refreshPortfolio();
      setSelected(null);
    },
    [refreshPortfolio],
  );

  const handleClearAll = useCallback(async () => {
    if (!window.confirm(`Delete all ${portfolio.length} sketch${portfolio.length === 1 ? '' : 'es'}? This cannot be undone.`)) return;
    await clearPortfolio();
    await refreshPortfolio();
    setSelected(null);
  }, [portfolio.length, refreshPortfolio]);

  return (
    <div className="portfolio-screen">
      <header className="portfolio-screen__header">
        <Link to="/" className="portfolio-screen__back">
          ← Home
        </Link>
        <h1 className="portfolio-screen__title">Portfolio</h1>
        {portfolio.length > 0 && (
          <>
            <span className="portfolio-screen__count">
              {portfolio.length} sketch{portfolio.length === 1 ? '' : 'es'}
            </span>
            <button
              type="button"
              className="portfolio-screen__clear-btn"
              onClick={handleClearAll}
            >
              Clear all
            </button>
          </>
        )}
      </header>

      {portfolio.length === 0 ? (
        <div className="portfolio-screen__empty">
          <p className="portfolio-screen__empty-text">
            No sketches yet.
          </p>
          <Link to="/" className="portfolio-screen__cta">
            Pick a project to get started →
          </Link>
        </div>
      ) : (
        <div className="portfolio-screen__grid">
          {portfolio.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className="portfolio-screen__card"
              onClick={() => setSelected(entry)}
              aria-label={`View sketch: ${findProject(projects, entry.projectSlug)?.title ?? entry.projectSlug}`}
            >
              <img
                className="portfolio-screen__thumb"
                src={entry.thumbnailDataUrl}
                alt=""
                loading="lazy"
              />
              <div className="portfolio-screen__card-meta">
                <span className="portfolio-screen__card-title">
                  {findProject(projects, entry.projectSlug)?.title ?? entry.projectSlug}
                </span>
                <span className="portfolio-screen__card-date">
                  {formatDate(entry.completedAt)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <DetailModal
          entry={selected}
          projectTitle={findProject(projects, selected.projectSlug)?.title ?? selected.projectSlug}
          onClose={() => setSelected(null)}
          onDelete={() => handleDelete(selected)}
        />
      )}
    </div>
  );
}

// ── Detail modal ─────────────────────────────────────────────────────────────

interface DetailModalProps {
  entry: PortfolioEntry;
  projectTitle: string;
  onClose: () => void;
  onDelete: () => void;
}

function DetailModal({ entry, projectTitle, onClose, onDelete }: DetailModalProps) {
  const durationLabel = formatDuration(entry.durationSeconds);

  return (
    <div
      className="portfolio-modal"
      role="dialog"
      aria-modal="true"
      aria-label={`Sketch detail: ${projectTitle}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="portfolio-modal__inner">
        <button
          type="button"
          className="portfolio-modal__close"
          aria-label="Close"
          onClick={onClose}
        >
          ✕
        </button>

        <div className="portfolio-modal__layout">
          <div className="portfolio-modal__preview">
            <div
              className="portfolio-modal__svg-wrap"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: entry.svg }}
            />
          </div>

          <aside className="portfolio-modal__details">
            <h2 className="portfolio-modal__title">{projectTitle}</h2>
            <p className="portfolio-modal__meta">
              {formatDate(entry.completedAt)} · {durationLabel}
            </p>

            {entry.finalFeedback && (
              <p className="portfolio-modal__feedback">{entry.finalFeedback}</p>
            )}

            {entry.tryNext.length > 0 && (
              <div className="portfolio-modal__try-next">
                <h3 className="portfolio-modal__try-next-heading">Try next time</h3>
                <ul className="portfolio-modal__try-next-list">
                  {entry.tryNext.map((tip, i) => (
                    <li key={i} className="portfolio-modal__try-next-item">
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="portfolio-modal__actions">
              <Link
                to={`/draw/${entry.projectSlug}`}
                className="portfolio-modal__btn portfolio-modal__btn--primary"
              >
                Draw again
              </Link>
              <button
                type="button"
                className="portfolio-modal__btn portfolio-modal__btn--danger"
                onClick={onDelete}
              >
                Delete
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

