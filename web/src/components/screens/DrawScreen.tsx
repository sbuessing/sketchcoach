import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { DrawMode, ToolMode } from '../../shared/types';
import { useApp } from '../../contexts/AppContext';
import {
  findGuideline,
  findProject,
  loadProjectSteps,
  resolveGuidelines,
} from '../../services/dataService';
import { isCoachConfigured, requestStrokeHint } from '../../services/claudeClient';
import { svgToPngDataUrl } from '../../services/snapshot';
import { useDrawing } from '../../hooks/useDrawing';
import { useCoach } from '../../hooks/useCoach';
import { useAmbientAudio } from '../../hooks/useAmbientAudio';
import { sfx } from '../../services/audioService';
import { prefs } from '../../services/prefsStore';
import SketchCanvas from '../canvas/SketchCanvas';
import StepList from '../steps/StepList';
import CoachPanel from '../coach/CoachPanel';
import AudioControls from '../ui/AudioControls';
import SaveIndicator from '../ui/SaveIndicator';
import ToolModeSelector from '../canvas/ToolModeSelector';
import type { Guideline, ProjectSteps } from '../../shared/types';
import './DrawScreen.css';

export default function DrawScreen() {
  const { slug = '' } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { projects, guidelines, audioVolume, setAudioVolume, sfxEnabled, setSfxEnabled } = useApp();

  const project = findProject(projects, slug);
  const focusGuideline = project
    ? findGuideline(guidelines, project.focusGuidelines[0])
    : undefined;

  // Resolve all focus guidelines (project.focusGuidelines is an array of ids)
  const resolvedFocusGuidelines = useMemo<Guideline[]>(() => {
    if (!project) return [];
    return resolveGuidelines(project.focusGuidelines, guidelines);
  }, [project, guidelines]);

  const [stepsData, setStepsData] = useState<ProjectSteps | null>(null);
  const [doneStepNumbers, setDoneStepNumbers] = useState<Set<number>>(new Set());

  // ── Stroke hints ─────────────────────────────────────────────────────────
  const [hintPaths, setHintPaths] = useState<string[]>([]);
  const [hintLoading, setHintLoading] = useState(false);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    strokes,
    addStroke,
    undo,
    redo,
    eraseStroke,
    resumeStatus,
    resume,
    startFresh,
    serializeSvg,
    lastStrokeAt,
    startedAt,
    savedAt,
    flushSave,
  } = useDrawing(slug);

  const [drawMode, setDrawMode] = useState<DrawMode>('pencil');
  const [toolMode, setToolMode] = useState<ToolMode>('draw');

  const handleToolChange = useCallback((dm: DrawMode, tm: ToolMode) => {
    setDrawMode(dm);
    setToolMode(tm);
    sfx.play('button', sfxEnabled, audioVolume);
  }, [sfxEnabled]);

  // Keyboard shortcuts: Cmd/Ctrl+Z undo, Cmd/Ctrl+Shift+Z redo.
  // Ignore when focus is in an input/textarea so native form undo still works.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return;
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key !== 'z' && e.key !== 'Z') return;
      e.preventDefault();
      if (e.shiftKey) {
        redo();
      } else {
        undo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  // Load step list for this project
  useEffect(() => {
    let cancelled = false;
    if (!project) return;
    loadProjectSteps(slug)
      .then((data) => {
        if (!cancelled) setStepsData(data);
      })
      .catch((err) => {
        if (!cancelled) console.error('Failed to load steps for', slug, err);
      });
    return () => {
      cancelled = true;
    };
  }, [project, slug]);

  // Snapshot generator passed to the coach. New identity per stroke change is
  // fine — useCoach reads it via ref so the interval isn't restarted.
  const getSnapshot = useCallback(async () => {
    const svg = serializeSvg();
    return svgToPngDataUrl(svg, 1024);
  }, [serializeSvg]);

  // Coach loop. Disabled while the resume modal is up so the user can decide
  // before the coach starts looking at a stale drawing.
  const coachEnabled =
    isCoachConfigured() &&
    !!project &&
    !!focusGuideline &&
    resumeStatus === 'no-resume';

  const handleStepsCompleted = useCallback((stepNumbers: number[]) => {
    setDoneStepNumbers((prev) => {
      const next = new Set(prev);
      stepNumbers.forEach((n) => next.add(n));
      return next;
    });
  }, []);

  const {
    messages: coachMessages,
    isFetching: coachFetching,
    error: coachError,
  } = useCoach({
    enabled: coachEnabled,
    project,
    primaryFocus: focusGuideline,
    focusGuidelines: resolvedFocusGuidelines,
    steps: stepsData?.steps ?? [],
    strokeCount: strokes.length,
    lastStrokeAt,
    getSnapshot,
    onStepsCompleted: handleStepsCompleted,
  });

  // ── Audio ────────────────────────────────────────────────────────────────

  const ambient = useAmbientAudio(audioVolume, {
    initialTrack: prefs.getLastTrack() ?? undefined,
    onTrackChange: (filename) => prefs.setLastTrack(filename),
  });
  // Stable ref so the callbacks below don't re-create on every render.
  const ambientRef = useRef(ambient);
  ambientRef.current = ambient;

  // Start ambient when the resume decision is made.
  useEffect(() => {
    if (resumeStatus === 'no-resume') {
      ambientRef.current.play();
    }
  }, [resumeStatus]);

  // Coach ping SFX when a new message arrives.
  const coachCountRef = useRef(coachMessages.length);
  useEffect(() => {
    if (coachMessages.length > coachCountRef.current) {
      sfx.play('coach', sfxEnabled, audioVolume);
    }
    coachCountRef.current = coachMessages.length;
  }, [coachMessages.length, sfxEnabled]);

  const handleStrokeEnd = useCallback(() => {
    sfx.play('stroke-end', sfxEnabled, audioVolume);
  }, [sfxEnabled]);

  const handleHint = useCallback(async () => {
    if (hintLoading || !project || !focusGuideline) return;
    // Clear any previous hint and its timer.
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    setHintPaths([]);
    setHintLoading(true);

    const steps = stepsData?.steps ?? [];
    const nextStep = steps.find((s) => !doneStepNumbers.has(s.number)) ?? steps[0] ?? null;

    try {
      const snapshot = await getSnapshot();
      const result = await requestStrokeHint({
        project,
        steps,
        nextStep,
        primaryFocus: focusGuideline,
        imageDataUrl: snapshot,
      });
      setHintPaths(result.paths);
      // Auto-dismiss after 5 s (matches animation duration).
      hintTimerRef.current = setTimeout(() => setHintPaths([]), 5000);
    } catch (err) {
      console.error('[hint] failed', err);
    } finally {
      setHintLoading(false);
    }
  }, [hintLoading, project, focusGuideline, stepsData, doneStepNumbers, getSnapshot]);

  if (!project) {
    return (
      <div className="draw-screen draw-screen--missing">
        <p>Project not found.</p>
        <Link to="/">Back home</Link>
      </div>
    );
  }

  const toggleStep = (n: number) => {
    setDoneStepNumbers((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  };

  const handleFinish = async () => {
    sfx.play('complete', sfxEnabled, audioVolume);
    ambientRef.current.pause();
    await flushSave();
    const recentAdviceText = coachMessages
      .slice(0, 10)
      .map((m) => `- ${m.text}`)
      .join('\n');
    navigate(`/done/${slug}`, {
      state: { recentAdviceText, startedAt },
    });
  };

  return (
    <div className="draw-screen">
      <header className="draw-screen__header">
        <Link to="/" className="draw-screen__back">
          ← Back
        </Link>
        <div className="draw-screen__title-block">
          <h1 className="draw-screen__title">{project.title}</h1>
          {focusGuideline && (
            <p className="draw-screen__focus">
              Focus: <strong>{focusGuideline.title}</strong>
            </p>
          )}
        </div>

        <div className="draw-screen__header-tools">
          <ToolModeSelector
            drawMode={drawMode}
            toolMode={toolMode}
            onChange={handleToolChange}
          />
          <button
            className="draw-screen__icon-btn"
            type="button"
            onClick={() => { sfx.play('button', sfxEnabled, audioVolume); undo(); }}
            disabled={strokes.length === 0}
            aria-label="Undo last stroke"
            title="Undo"
          >
            ↩
          </button>
          {isCoachConfigured() && (
            <button
              className={`draw-screen__icon-btn draw-screen__hint-btn${hintLoading ? ' draw-screen__hint-btn--loading' : ''}`}
              type="button"
              onClick={handleHint}
              disabled={hintLoading || strokes.length === 0}
              aria-label="Show stroke hint"
              title="Show me what to draw next"
            >
              💡
            </button>
          )}
          <SaveIndicator savedAt={savedAt} />
        </div>

        <div className="draw-screen__header-right">
          <AudioControls
            volume={audioVolume}
            onVolumeChange={setAudioVolume}
            sfxEnabled={sfxEnabled}
            onSfxToggle={() => setSfxEnabled(!sfxEnabled)}
            isPlaying={ambient.isPlaying}
            trackName={ambient.trackName}
            onSkipTrack={ambient.skipTrack}
            onPlayPause={() => ambient.isPlaying ? ambient.pause() : ambient.play()}
          />
          <button
            className="draw-screen__finish-btn"
            type="button"
            onClick={handleFinish}
            disabled={strokes.length === 0}
          >
            Finish
          </button>
        </div>
      </header>

      <div className="draw-screen__layout">
        <aside className="draw-screen__steps">
          {stepsData && (
            <StepList
              steps={stepsData.steps}
              doneStepNumbers={doneStepNumbers}
              onToggle={toggleStep}
            />
          )}
        </aside>

        <main className="draw-screen__canvas-area">
          <div className="draw-screen__canvas">
            <SketchCanvas
              strokes={strokes}
              onStrokeComplete={addStroke}
              onStrokeEnd={handleStrokeEnd}
              onEraseStroke={eraseStroke}
              drawMode={drawMode}
              toolMode={toolMode}
              hintPaths={hintPaths}
            />
          </div>
        </main>
      </div>

      <CoachPanel
        messages={coachMessages}
        isFetching={coachFetching}
        focusGuideline={focusGuideline}
        error={coachError}
        disabled={!isCoachConfigured()}
        disabledReason="Add your Anthropic API key via the home screen settings to enable coaching."
        variant="toast"
      />

      {resumeStatus === 'has-resume' && (
        <ResumePrompt onResume={resume} onStartFresh={startFresh} />
      )}
    </div>
  );
}

function ResumePrompt({
  onResume,
  onStartFresh,
}: {
  onResume: () => void;
  onStartFresh: () => void;
}) {
  return (
    <div className="resume-modal" role="dialog" aria-modal="true">
      <div className="resume-modal__inner">
        <h2 className="resume-modal__title">You have a sketch in progress.</h2>
        <p className="resume-modal__body">Pick up where you left off, or start over with a clean canvas.</p>
        <div className="resume-modal__actions">
          <button type="button" className="resume-modal__btn resume-modal__btn--secondary" onClick={onStartFresh}>
            Start fresh
          </button>
          <button type="button" className="resume-modal__btn resume-modal__btn--primary" onClick={onResume}>
            Resume
          </button>
        </div>
      </div>
    </div>
  );
}
