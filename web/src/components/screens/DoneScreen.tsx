// DoneScreen — shown after the user clicks Finish on the drawing canvas.
//
// Renders the user's drawing immediately. Claude's final summary streams in
// asynchronously — the page is interactive long before the AI is done.
// A "Hide pencil construction" toggle filters out pencil-mode strokes for a
// clean inked final image. Saving navigates to the scene view with the
// new piece flagged so the scene animates it in.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import {
  findGuideline,
  findProject,
  loadProjectSteps,
  resolveGuidelines,
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
import { makeId, strokesToSvg } from '../../services/strokeUtils';
import { formatDuration } from '../../shared/utils';
import type { PortfolioEntry, Stroke } from '../../shared/types';
import './DoneScreen.css';

interface NavState {
  recentAdviceText?: string;
  startedAt?: number;
}

interface DrawingData {
  strokes: Stroke[];
  durationSeconds: number;
}

type SaveState = { phase: 'idle' } | { phase: 'saving' } | { phase: 'error'; message: string };

export default function DoneScreen() {
  const { slug = '' } = useParams<{ slug: string }>();
  const { state: navState } = useLocation() as { state: NavState | null };
  const navigate = useNavigate();
  const { projects, guidelines, refreshPortfolio } = useApp();

  const [drawing, setDrawing] = useState<DrawingData | null>(null);
  const [missing, setMissing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [tryNext, setTryNext] = useState<string[]>([]);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [hidePencil, setHidePencil] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>({ phase: 'idle' });

  const hasRunRef = useRef(false);

  const project = findProject(projects, slug);
  const focusGuideline = project
    ? findGuideline(guidelines, project.focusGuidelines[0])
    : undefined;

  // Load drawing + (optionally, in parallel) the AI summary. The drawing
  // is what gates the UI — summary slots in whenever it's done.
  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;
    let cancelled = false;

    async function run() {
      const d = await getInProgress(slug);
      if (!d || !d.strokesJson) {
        if (!cancelled) setMissing(true);
        return;
      }

      let parsedStrokes: Stroke[] = [];
      try {
        parsedStrokes = JSON.parse(d.strokesJson);
      } catch {
        // fall through with empty strokes — treated as missing
      }
      if (parsedStrokes.length === 0) {
        if (!cancelled) setMissing(true);
        return;
      }

      const completedAt = Date.now();
      const sessionStart = navState?.startedAt ?? d.startedAt ?? d.updatedAt ?? completedAt;
      const durationSeconds = Math.max(0, Math.round((completedAt - sessionStart) / 1000));

      if (!cancelled) {
        setDrawing({ strokes: parsedStrokes, durationSeconds });
      }

      // No coach? Skip the API call and use a fallback message immediately.
      if (!isCoachConfigured() || !project || !focusGuideline) {
        if (!cancelled) {
          setSummary('Great session! Keep sketching.');
          setTryNext([]);
        }
        return;
      }

      try {
        // Build the snapshot from the FULL strokes (with pencil), since the
        // pencil layer is part of what the coach should evaluate.
        const fullSvg = strokesToSvg(parsedStrokes);
        const [stepsData, imageDataUrl] = await Promise.all([
          loadProjectSteps(slug),
          svgToPngDataUrl(fullSvg, 1024),
        ]);
        if (cancelled) return;

        const resolvedFocusGuidelines = resolveGuidelines(project.focusGuidelines, guidelines);
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
          setSummary(result.summary);
          setTryNext(result.tryNext);
        }
      } catch (err) {
        if (!cancelled) {
          setSummaryError(err instanceof Error ? err.message : 'Could not load the final summary.');
        }
      }
    }

    run().catch((err) => {
      if (!cancelled) setSummaryError(String(err));
    });

    return () => {
      cancelled = true;
      hasRunRef.current = false;
    };
  }, [slug, navState, project, focusGuideline, guidelines]);

  // Derive the displayed SVG from strokes + toggle.
  const visibleSvg = useMemo(() => {
    if (!drawing) return '';
    const visible = hidePencil
      ? drawing.strokes.filter((s) => s.drawMode !== 'pencil')
      : drawing.strokes;
    return strokesToSvg(visible);
  }, [drawing, hidePencil]);

  const handleSave = useCallback(async () => {
    if (!drawing) return;
    setSaveState({ phase: 'saving' });

    try {
      // Save whatever the user currently sees (respecting the toggle).
      const thumbnailDataUrl = await svgToThumbnail(visibleSvg, 256);
      const entry: PortfolioEntry = {
        id: makeId(),
        projectSlug: slug,
        completedAt: Date.now(),
        svg: visibleSvg,
        thumbnailDataUrl,
        finalFeedback: summary ?? '',
        tryNext: tryNext,
        focusGuidelineId: focusGuideline?.id ?? '',
        durationSeconds: drawing.durationSeconds,
      };
      await savePortfolioEntry(entry);
      await clearInProgress(slug);
      await refreshPortfolio();

      // Send the user to the scene view with the new slug flagged so the
      // scene knows to pop the new piece into place with a bounce.
      const sceneId = project?.sceneId;
      if (sceneId) {
        navigate(`/scene/${sceneId}`, { state: { newSlug: slug } });
      } else {
        navigate('/');
      }
    } catch (err) {
      setSaveState({
        phase: 'error',
        message: err instanceof Error ? err.message : 'Failed to save.',
      });
    }
  }, [drawing, visibleSvg, summary, tryNext, slug, focusGuideline, refreshPortfolio, navigate, project]);

  const handleDiscard = useCallback(async () => {
    await clearInProgress(slug);
    navigate('/');
  }, [slug, navigate]);

  // ── Render ──────────────────────────────────────────────────────────────

  if (missing) {
    return (
      <div className="done-screen done-screen--missing">
        <h1 className="done-screen__title">Nothing to review</h1>
        <p className="done-screen__body">There's no drawing in progress for this project.</p>
        <Link to="/" className="done-screen__link">Pick a project</Link>
      </div>
    );
  }

  if (saveState.phase === 'error') {
    return (
      <div className="done-screen done-screen--error">
        <h1 className="done-screen__title">Couldn't save</h1>
        <p className="done-screen__body done-screen__body--error">{saveState.message}</p>
        <button type="button" className="done-screen__link" onClick={() => setSaveState({ phase: 'idle' })}>
          Try again
        </button>
      </div>
    );
  }

  if (!drawing) {
    return (
      <div className="done-screen done-screen--loading">
        <div className="done-screen__spinner" aria-busy="true" />
        <p className="done-screen__loading-text">Loading your drawing…</p>
      </div>
    );
  }

  if (saveState.phase === 'saving') {
    return (
      <div className="done-screen done-screen--loading">
        <div className="done-screen__spinner" aria-busy="true" />
        <p className="done-screen__loading-text">Saving to your scene…</p>
      </div>
    );
  }

  const durationLabel = formatDuration(drawing.durationSeconds);

  return (
    <div className="done-screen">
      <header className="done-screen__header">
        <Link to="/" className="done-screen__back">← Home</Link>
        <h1 className="done-screen__title">
          {project ? `Nice work on ${project.title}!` : 'Session complete!'}
        </h1>
        <span className="done-screen__duration">{durationLabel} session</span>
      </header>

      <div className="done-screen__layout">
        <div className="done-screen__preview">
          <div
            className="done-screen__svg-wrap"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: visibleSvg }}
          />
          <label className="done-screen__toggle">
            <input
              type="checkbox"
              checked={hidePencil}
              onChange={(e) => setHidePencil(e.target.checked)}
            />
            <span>Hide pencil construction</span>
          </label>
        </div>

        <aside className="done-screen__summary">
          {focusGuideline && (
            <p className="done-screen__focus-label">
              Focus: <strong>{focusGuideline.title}</strong>
            </p>
          )}

          {summary === null && !summaryError ? (
            <p className="done-screen__summary-pending">Claude is reviewing your sketch…</p>
          ) : summaryError ? (
            <p className="done-screen__summary-pending">
              (Couldn't load the final feedback — your drawing is still safe to save.)
            </p>
          ) : (
            <>
              <p className="done-screen__summary-text">{summary}</p>
              {tryNext.length > 0 && (
                <div className="done-screen__try-next">
                  <h3 className="done-screen__try-next-heading">Try next time</h3>
                  <ul className="done-screen__try-next-list">
                    {tryNext.map((tip, i) => (
                      <li key={i} className="done-screen__try-next-item">{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          <div className="done-screen__actions">
            <button
              type="button"
              className="done-screen__btn done-screen__btn--primary"
              onClick={handleSave}
            >
              Save to Scene
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
