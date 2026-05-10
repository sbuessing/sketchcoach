import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import {
  findGuideline,
  findProject,
  loadProjectSteps,
} from '../../services/dataService';
import { isCoachConfigured } from '../../services/claudeClient';
import { svgToPngDataUrl } from '../../services/snapshot';
import { useDrawing } from '../../hooks/useDrawing';
import { useCoach } from '../../hooks/useCoach';
import SketchCanvas from '../canvas/SketchCanvas';
import Toolbar from '../canvas/Toolbar';
import StepList from '../steps/StepList';
import CoachPanel from '../coach/CoachPanel';
import type { Guideline, ProjectSteps } from '../../shared/types';
import './DrawScreen.css';

export default function DrawScreen() {
  const { slug = '' } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { projects, guidelines } = useApp();

  const project = findProject(projects, slug);
  const focusGuideline = project
    ? findGuideline(guidelines, project.focusGuidelines[0])
    : undefined;

  // Resolve all focus guidelines (project.focusGuidelines is an array of ids)
  const resolvedFocusGuidelines = useMemo<Guideline[]>(() => {
    if (!project) return [];
    return project.focusGuidelines
      .map((id) => findGuideline(guidelines, id))
      .filter((g): g is Guideline => !!g);
  }, [project, guidelines]);

  const [stepsData, setStepsData] = useState<ProjectSteps | null>(null);
  const [doneStepNumbers, setDoneStepNumbers] = useState<Set<number>>(new Set());

  const {
    strokes,
    addStroke,
    undo,
    eraseAll,
    resumeStatus,
    resume,
    startFresh,
    serializeSvg,
    lastStrokeAt,
    startedAt,
    flushSave,
  } = useDrawing(slug);

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
  });

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
            <SketchCanvas strokes={strokes} onStrokeComplete={addStroke} />
          </div>
          <Toolbar
            canUndo={strokes.length > 0}
            canErase={strokes.length > 0}
            onUndo={undo}
            onErase={eraseAll}
            onFinish={handleFinish}
          />
        </main>

        <aside className="draw-screen__coach">
          <CoachPanel
            messages={coachMessages}
            isFetching={coachFetching}
            focusGuideline={focusGuideline}
            error={coachError}
            disabled={!isCoachConfigured()}
          />
        </aside>
      </div>

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
