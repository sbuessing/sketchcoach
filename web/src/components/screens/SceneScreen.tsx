import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { findScene, projectsInScene } from '../../services/dataService';
import { VIEWBOX_SIZE } from '../../services/strokeUtils';
import { svgToPngDataUrl } from '../../services/snapshot';
import type { PortfolioEntry, Project, Scene, SceneSlot } from '../../shared/types';
import './SceneScreen.css';

/** Paper color baked into the exported PNG. Mirrors --color-paper in index.css. */
const PAPER_COLOR = '#fbfaf4';

/** Size of the exported PNG. 2048 looks sharp pasted at native screen res. */
const EXPORT_PNG_SIZE = 2048;

interface SceneNavState {
  /** Slug of a piece that just landed in this scene — animate it in. */
  newSlug?: string;
}

/** Strip the outer <svg ...>…</svg> wrapper, leaving just the inner content. */
function stripSvgWrapper(svg: string): string {
  return svg
    .replace(/^[\s\S]*?<svg[^>]*>/i, '')
    .replace(/<\/svg>\s*$/i, '');
}

/**
 * Build a self-contained SVG of the scene for export: paper-color background,
 * the pencil scaffolding, and every completed piece in its slot. Crucially,
 * NO dashed placeholders — the image is meant to be handed to an image AI for
 * "fill in the rest" prompting, so showing what's missing would just confuse it.
 */
function buildExportSvg(
  bgInner: string,
  completedPieces: Array<{ project: Project; entry: PortfolioEntry }>,
): string {
  const piecesSvg = completedPieces
    .map(({ project, entry }) => {
      const inner = stripSvgWrapper(entry.svg);
      const { x, y, width, height } = project.sceneSlot;
      return `<svg x="${x}" y="${y}" width="${width}" height="${height}" viewBox="0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}" overflow="visible">${inner}</svg>`;
    })
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}">` +
    `<rect width="${VIEWBOX_SIZE}" height="${VIEWBOX_SIZE}" fill="${PAPER_COLOR}"/>` +
    `<g>${bgInner}</g>` +
    piecesSvg +
    `</svg>`;
}

/** Convert a data URL into a Blob via fetch — concise and well-supported. */
async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

/**
 * Build a scene-specific prompt for the user to paste alongside the image.
 * Critical: tell the AI (a) what the scene depicts and (b) what the faint
 * pencil scaffolding represents — without that context the AI tends to
 * treat the background as noise and either ignore it or weirdly interpret it.
 */
function buildSamplePrompt(scene: Scene): string {
  const bgLine = scene.backgroundDescription
    ? `\n\nAbout the setting: ${scene.backgroundDescription}\n\nThose faint pencil marks are scaffolding — they show what the scene is supposed to contain. Bring them to life by rendering full versions of those elements in the same hand-drawn aesthetic, around and behind my finished objects.`
    : '';

  return (
    `Here's a hand-drawn pencil-and-ink scene I made for a project called "${scene.title}" — ${scene.tagline}` +
    bgLine +
    `\n\nPlease render a fully-developed illustration in the same loose, hand-drawn style. Keep my drawn objects as the focal points — don't redraw them or change their shapes; preserve their proportions and placement. Fill the rest of the scene with matching atmosphere, light, and supporting detail so it all reads as one cohesive picture. Same square aspect ratio. Pen-and-ink linework with a soft watercolor wash, warm and quiet.`
  );
}

export default function SceneScreen() {
  const { sceneId = '' } = useParams<{ sceneId: string }>();
  const { scenes, projects, portfolio } = useApp();
  const navigate = useNavigate();
  const { state: navState } = useLocation() as { state: SceneNavState | null };

  // The "just-added" slug from navigation state. We hold onto it locally so
  // the animation keeps playing if the user re-renders, and we clear it after
  // the bounce so re-visits don't re-animate.
  const [newSlug, setNewSlug] = useState<string | undefined>(navState?.newSlug);
  useEffect(() => {
    if (!newSlug) return;
    const t = window.setTimeout(() => setNewSlug(undefined), 700);
    return () => window.clearTimeout(t);
  }, [newSlug]);

  const scene = findScene(scenes, sceneId);

  // Background SVG content (just the inner paths) — fetched once per scene.
  const [bgInner, setBgInner] = useState<string>('');
  useEffect(() => {
    if (!scene?.backgroundSvg) { setBgInner(''); return; }
    let cancelled = false;
    fetch(scene.backgroundSvg)
      .then((r) => r.text())
      .then((text) => { if (!cancelled) setBgInner(stripSvgWrapper(text)); })
      .catch((err) => { if (!cancelled) console.warn('Failed to load scene background', err); });
    return () => { cancelled = true; };
  }, [scene?.backgroundSvg]);

  // Copy-to-clipboard state. 'copied' shows for a couple seconds after success.
  const [copyState, setCopyState] = useState<'idle' | 'copying' | 'copied' | 'error'>('idle');
  const [copyError, setCopyError] = useState<string | null>(null);
  const [promptCopied, setPromptCopied] = useState(false);
  const [showRemix, setShowRemix] = useState(false);

  // Sort projects by z so back layers render first and front layers cover them.
  // Tie-breaker: slot y so within a z-layer, more-distant items still go behind.
  const sortedProjects = useMemo(() => {
    const sp = projectsInScene(projects, sceneId);
    return [...sp].sort(
      (a, b) => a.sceneSlot.z - b.sceneSlot.z || a.sceneSlot.y - b.sceneSlot.y,
    );
  }, [projects, sceneId]);

  // Map slug → entry for O(1) lookup while rendering.
  const entriesBySlug = useMemo(() => {
    const m = new Map<string, PortfolioEntry>();
    for (const e of portfolio) m.set(e.projectSlug, e);
    return m;
  }, [portfolio]);

  const completedCount = sortedProjects.filter((p) => entriesBySlug.has(p.slug)).length;
  const totalCount = sortedProjects.length;
  const canCopy = completedCount > 0;

  const handleCopyImage = useCallback(async () => {
    if (!canCopy) return;
    setCopyState('copying');
    setCopyError(null);
    try {
      const completedPieces = sortedProjects
        .map((p) => {
          const entry = entriesBySlug.get(p.slug);
          return entry ? { project: p, entry } : null;
        })
        .filter((x): x is { project: Project; entry: PortfolioEntry } => x !== null);

      const exportSvg = buildExportSvg(bgInner, completedPieces);
      const pngDataUrl = await svgToPngDataUrl(exportSvg, EXPORT_PNG_SIZE);
      const blob = await dataUrlToBlob(pngDataUrl);

      if (!navigator.clipboard || !window.ClipboardItem) {
        throw new Error('Your browser does not support image clipboard. Try Chrome, Safari, or Edge.');
      }
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setCopyState('copied');
      window.setTimeout(() => setCopyState('idle'), 2200);
    } catch (err) {
      setCopyState('error');
      setCopyError(err instanceof Error ? err.message : String(err));
    }
  }, [canCopy, sortedProjects, entriesBySlug, bgInner]);

  // Memoize the scene-specific prompt so the modal renders it consistently
  // and clipboard copies the exact same text the user sees.
  const samplePrompt = useMemo(
    () => (scene ? buildSamplePrompt(scene) : ''),
    [scene],
  );

  const handleCopyPrompt = useCallback(async () => {
    if (!samplePrompt) return;
    try {
      await navigator.clipboard.writeText(samplePrompt);
      setPromptCopied(true);
      window.setTimeout(() => setPromptCopied(false), 2200);
    } catch (err) {
      console.warn('Prompt copy failed', err);
    }
  }, [samplePrompt]);

  if (!scene) {
    return (
      <div className="scenescreen scenescreen--missing">
        <p>Scene not found.</p>
        <Link to="/">Back home</Link>
      </div>
    );
  }

  return (
    <div className="scenescreen">
      <header className="scenescreen__header">
        <Link to="/" className="scenescreen__back">← Home</Link>
        <div className="scenescreen__title-block">
          <h1 className="scenescreen__title">{scene.title}</h1>
          <span className="scenescreen__progress">{completedCount} / {totalCount} complete</span>
        </div>
        <div className="scenescreen__actions">
          <button
            type="button"
            className="scenescreen__btn scenescreen__btn--primary"
            onClick={handleCopyImage}
            disabled={!canCopy || copyState === 'copying'}
            title={
              !canCopy
                ? 'Draw at least one piece first.'
                : 'Copy your scene (without empty placeholders) as a PNG to paste into an image AI.'
            }
          >
            {copyState === 'copying' ? 'Copying…' : copyState === 'copied' ? '✓ Copied!' : 'Copy scene as image'}
          </button>
          <button
            type="button"
            className="scenescreen__btn scenescreen__btn--ghost"
            onClick={() => setShowRemix(true)}
            disabled={!canCopy}
            title={canCopy ? 'Get a sample prompt to remix this scene in an image AI.' : 'Draw at least one piece first.'}
          >
            Remix with AI →
          </button>
        </div>
      </header>

      {copyState === 'error' && copyError && (
        <div className="scenescreen__error">Couldn't copy: {copyError}</div>
      )}

      <div className="scenescreen__canvas-wrap">
        <svg
          className="scenescreen__canvas"
          viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
          xmlns="http://www.w3.org/2000/svg"
        >
          {bgInner && (
            <g
              className="scenescreen__background"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: bgInner }}
            />
          )}
          {sortedProjects.map((project) => {
            const entry = entriesBySlug.get(project.slug);
            return entry ? (
              <DrawingAtSlot
                key={project.slug}
                entry={entry}
                slot={project.sceneSlot}
                isNew={project.slug === newSlug}
              />
            ) : (
              <Placeholder
                key={project.slug}
                project={project}
                onClick={() => navigate(`/draw/${project.slug}`)}
              />
            );
          })}
        </svg>
      </div>

      {showRemix && (
        <RemixModal
          onClose={() => setShowRemix(false)}
          onCopyPrompt={handleCopyPrompt}
          promptCopied={promptCopied}
          samplePrompt={samplePrompt}
        />
      )}
    </div>
  );
}

/** Modal explaining how to take the copied scene into an image AI. */
function RemixModal({
  onClose,
  onCopyPrompt,
  promptCopied,
  samplePrompt,
}: {
  onClose: () => void;
  onCopyPrompt: () => void;
  promptCopied: boolean;
  samplePrompt: string;
}) {
  // Close on Escape — small ergonomic win.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Portal to <body> so the modal escapes any ancestor transform that would
  // otherwise become the containing block for position: fixed and break
  // viewport-anchored centering.
  return createPortal(
    <div className="scenescreen__modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="scenescreen__modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="remix-modal-title"
      >
        <button
          type="button"
          className="scenescreen__modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <h2 id="remix-modal-title" className="scenescreen__modal-title">Remix with AI</h2>
        <p className="scenescreen__modal-intro">
          You've already copied your scene as an image (or you can hit <strong>Copy scene as image</strong> behind this dialog). Paste it into <strong>Gemini</strong>, <strong>ChatGPT</strong>, or any image-generation tool along with a prompt like this:
        </p>
        <div className="scenescreen__modal-prompt">
          <pre>{samplePrompt}</pre>
          <button
            type="button"
            className="scenescreen__modal-copy"
            onClick={onCopyPrompt}
          >
            {promptCopied ? '✓ Copied' : 'Copy prompt'}
          </button>
        </div>
        <p className="scenescreen__modal-tip">
          Tip: experiment with the style ("watercolor wash", "muted pen-and-ink", "soft pastel") and the mood ("warm afternoon light", "early morning fog"). Your drawings stay the centerpiece — the AI fills in the world around them.
        </p>
      </div>
    </div>,
    document.body,
  );
}

/**
 * Render a saved drawing into its slot. The saved SVG is 1000×1000 in its own
 * viewBox; we use a nested <svg> with x/y/width/height + viewBox so CSS
 * transform (used for the bounce-in animation) doesn't conflict with positioning.
 */
function DrawingAtSlot({
  entry,
  slot,
  isNew,
}: {
  entry: PortfolioEntry;
  slot: SceneSlot;
  isNew?: boolean;
}) {
  const inner = stripSvgWrapper(entry.svg);
  return (
    <svg
      x={slot.x}
      y={slot.y}
      width={slot.width}
      height={slot.height}
      viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
      className={isNew ? 'scenescreen__piece scenescreen__piece--new' : 'scenescreen__piece'}
      overflow="visible"
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  );
}

/**
 * Faint pencil-style outline + title for an unfinished slot. Clickable to
 * jump straight into that project's draw screen.
 */
function Placeholder({
  project,
  onClick,
}: {
  project: Project;
  onClick: () => void;
}) {
  const { x, y, width, height } = project.sceneSlot;
  // Center the label inside the slot; use a font size that scales gently with slot height.
  const fontSize = Math.max(14, Math.min(28, height * 0.12));
  return (
    <g className="scenescreen__slot" onClick={onClick} role="button" aria-label={`Start drawing: ${project.title}`}>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="transparent"
        stroke="#808080"
        strokeWidth={1.5}
        strokeDasharray="6 6"
        opacity={0.35}
        rx={6}
      />
      <text
        x={x + width / 2}
        y={y + height / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="var(--font-display), serif"
        fontSize={fontSize}
        fill="#808080"
        opacity={0.7}
      >
        {project.title}
      </text>
    </g>
  );
}
