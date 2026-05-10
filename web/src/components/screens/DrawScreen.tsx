import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import {
  findGuideline,
  findProject,
  loadProjectSteps,
} from '../../services/dataService';
import { useDrawing } from '../../hooks/useDrawing';
import SketchCanvas from '../canvas/SketchCanvas';
import Toolbar from '../canvas/Toolbar';
import StepList from '../steps/StepList';
import CoachPanel from '../coach/CoachPanel';
import type { ProjectSteps } from '../../shared/types';
import './DrawScreen.css';

export default function DrawScreen() {
  const { slug = '' } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { projects, guidelines } = useApp();

  const project = findProject(projects, slug);
  const focusGuideline = project
    ? findGuideline(guidelines, project.focusGuidelines[0])
    : undefined;

  const [stepsData, setStepsData] = useState<ProjectSteps | null>(null);
  const [doneStepNumbers, setDoneStepNumbers] = useState<Set<number>>(new Set());

  // Drawing state + autosave
  const {
    strokes,
    addStroke,
    undo,
    eraseAll,
    resumeStatus,
    resume,
    startFresh,
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

  const handleFinish = () => {
    navigate(`/done/${slug}`);
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
            messages={[]}
            isFetching={false}
            focusGuideline={focusGuideline}
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
