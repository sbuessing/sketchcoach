// DoneScreen — shown after the user clicks Finish on the drawing canvas.
//
// Loads the in-progress drawing from IndexedDB, rasterizes it, and asks
// Claude for a final summary. The user can then save to their portfolio or
// discard the session.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import {
  findGuideline,
  findProject,
  loadProjectSteps,
} from '../../services/dataService';
import {
  clearInProgress,
  getInProgress,
  savePortfolioEntry,
} from '../../services/portfolioStore';
import {
  isCoachConfigured,
  requestFinalSummary,
} from '../../services/claudeClient';
import { svgToPngDataUrl, svgToThumbnail } from '../../services/snapshot';
import { makeId } from '../../services/strokeUtils';
import type { PortfolioEntry } from '../../shared/types';
import './DoneScreen.css';

type ScreenState =
  | { phase: 'loading' }
  | { phase: 'summarizing'; svg: string; durationSeconds: number }
  | {
      phase: 'ready';
      svg: string;
      durationSeconds: number;
      summary: string;
      tryNext: string[];
    }
  | { phase: 'error'; message: string }
  | { phase: 'missing' }
  | { phase: 'saving' };

interface NavState {
  recentAdviceText?: string;
  startedAt?: number;
}

export default function DoneScreen() {
  const { slug = '' } = useParams<{ slug: string }>();
  const { state: navState } = useLocation() as { state: NavState | null };
  const navigate = useNavigate();
  const { projects, guidelines, refreshPortfolio } = useApp();

  const [screen, setScreen] = useState<ScreenState>({ phase: 'loading' });
  const summaryRef = useRef<{ summary: string; tryNext: string[] } | null>(null);

  const project = findProject(projects, slug);
  const focusGuideline = project
    ? findGuideline(guidelines, project.focusGuidelines[0])
    : undefined;

  // Run once on mount — load drawing, optionally request summary.
  useEffect(() => {
    let cancelled = false;

    async function run() {
      const drawing = await getInProgress(slug);
      if (!drawing || !drawing.svg || drawing.svg === '<svg></svg>') {
        if (!cancelled) setScreen({ phase: 'missing' });
        return;
      }

      const completedAt = Date.now();
      const sessionStart = navState?.startedAt ?? drawing.startedAt ?? drawing.updatedAt ?? completedAt;
      const durationSeconds = Math.max(0, Math.round((completedAt - sessionStart) / 1000));

      if (!cancelled) setScreen({ phase: 'summarizing', svg: drawing.svg, durationSeconds });

      // If Claude isn't configured, skip the summary API call.
      if (!isCoachConfigured() || !project || !focusGuideline) {
        if (!cancelled) {
          setScreen({
            phase: 'ready',
            svg: drawing.svg,
            durationSeconds,
            summary: 'Great session! Keep sketching.',
            tryNext: [],
          });
        }
        return;
      }

      try {
        const [stepsData, imageDataUrl] = await Promise.all([
          loadProjectSteps(slug),
          svgToPngDataUrl(drawing.svg, 1024),
        ]);
        if (cancelled) return;

        const resolvedFocusGuidelines = project.focusGuidelines
          .map((id) => findGuideline(guidelines, id))
          .filter((g) => !!g);

        const result = await requestFinalSummary({
          project,
          steps: stepsData?.steps ?? [],
          primaryFocus: focusGuideline,
          focusGuidelines: resolvedFocusGuidelines,
          recentAdviceText: navState?.recentAdviceText ?? '',
          imageDataUrl,
          durationSeconds,
        });

        if (!cancelled) {
          summaryRef.current = result;
          setScreen({
            phase: 'ready',
            svg: drawing.svg,
            durationSeconds,
            summary: result.summary,
            tryNext: result.tryNext,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setScreen({
            phase: 'error',
            message:
              err instanceof Error
                ? err.message
                : 'Could not load the final summary.',
          });
        }
      }
    }

    run().catch((err) => {
      if (!cancelled)
        setScreen({ phase: 'error', message: String(err) });
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const handleSave = useCallback(async () => {
    if (screen.phase !== 'ready') return;
    setScreen({ phase: 'saving' });

    try {
      const thumbnailDataUrl = await svgToThumbnail(screen.svg, 256);
      const completedAt = Date.now();
      const entry: PortfolioEntry = {
        id: makeId(),
        projectSlug: slug,
        completedAt,
        svg: screen.svg,
        thumbnailDataUrl,
        finalFeedback: screen.summary,
        tryNext: screen.tryNext,
        focusGuidelineId: focusGuideline?.id ?? '',
        durationSeconds: screen.durationSeconds,
      };
      await savePortfolioEntry(entry);
      await clearInProgress(slug);
      await refreshPortfolio();
      navigate('/portfolio');
    } catch (err) {
      setScreen({
        phase: 'error',
        message: err instanceof Error ? err.message : 'Failed to save.',
      });
    }
  }, [screen, slug, focusGuideline, refreshPortfolio, navigate]);

  const handleDiscard = useCallback(async () => {
    await clearInProgress(slug);
    navigate('/');
  }, [slug, navigate]);

  // ── Render ──────────────────────────────────────────────────────────────

  if (screen.phase === 'loading' || screen.phase === 'summarizing') {
    return (
      <div className="done-screen done-screen--loading">
        <div className="done-screen__spinner" aria-busy="true" />
        <p className="done-screen__loading-text">
          {screen.phase === 'loading'
            ? 'Loading your drawing…'
            : 'Claude is reviewing your sketch…'}
        </p>
      </div>
    );
  }

  if (screen.phase === 'missing') {
    return (
      <div className="done-screen done-screen--missing">
        <h1 className="done-screen__title">Nothing to review</h1>
        <p className="done-screen__body">
          There's no drawing in progress for this project.
        </p>
        <Link to="/" className="done-screen__link">
          Pick a project
        </Link>
      </div>
    );
  }

  if (screen.phase === 'error') {
    return (
      <div className="done-screen done-screen--error">
        <h1 className="done-screen__title">Something went wrong</h1>
        <p className="done-screen__body done-screen__body--error">
          {screen.message}
        </p>
        <Link to={`/draw/${slug}`} className="done-screen__link">
          Back to drawing
        </Link>
      </div>
    );
  }

  if (screen.phase === 'saving') {
    return (
      <div className="done-screen done-screen--loading">
        <div className="done-screen__spinner" aria-busy="true" />
        <p className="done-screen__loading-text">Saving to portfolio…</p>
      </div>
    );
  }

  // phase === 'ready'
  const { svg, durationSeconds, summary, tryNext } = screen;
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;
  const durationLabel =
    minutes > 0
      ? `${minutes}m ${seconds}s`
      : `${seconds}s`;

  return (
    <div className="done-screen">
      <header className="done-screen__header">
        <Link to="/" className="done-screen__back">
          ← Home
        </Link>
        <h1 className="done-screen__title">
          {project ? `Nice work on ${project.title}!` : 'Session complete!'}
        </h1>
        <span className="done-screen__duration">
          {durationLabel} session
        </span>
      </header>

      <div className="done-screen__layout">
        <div className="done-screen__preview">
          <div
            className="done-screen__svg-wrap"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </div>

        <aside className="done-screen__summary">
          {focusGuideline && (
            <p className="done-screen__focus-label">
              Focus: <strong>{focusGuideline.title}</strong>
            </p>
          )}

          <p className="done-screen__summary-text">{summary}</p>

          {tryNext.length > 0 && (
            <div className="done-screen__try-next">
              <h3 className="done-screen__try-next-heading">Try next time</h3>
              <ul className="done-screen__try-next-list">
                {tryNext.map((tip, i) => (
                  <li key={i} className="done-screen__try-next-item">
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="done-screen__actions">
            <button
              type="button"
              className="done-screen__btn done-screen__btn--primary"
              onClick={handleSave}
            >
              Save to Portfolio
            </button>
            <button
              type="button"
              className="done-screen__btn done-screen__btn--secondary"
              onClick={handleDiscard}
            >
              Discard
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
