import { useEffect, useRef } from 'react';
import type { ProjectStep } from '../../shared/types';
import './StepList.css';

interface StepListProps {
  steps: ProjectStep[];
  doneStepNumbers: Set<number>;
  onToggle: (stepNumber: number) => void;
}

export default function StepList({ steps, doneStepNumbers, onToggle }: StepListProps) {
  // Refs keyed by step number so we can scroll the current step to the top
  // of the scrollable container as soon as it changes.
  const itemRefs = useRef<Map<number, HTMLLIElement>>(new Map());

  // The "current" step is the first one not yet marked done.
  const currentStep = steps.find((s) => !doneStepNumbers.has(s.number));
  const currentStepNumber = currentStep?.number;

  useEffect(() => {
    if (currentStepNumber == null) return;
    const el = itemRefs.current.get(currentStepNumber);
    if (!el) return;
    // block: 'start' anchors the step to the top of the scrollable parent
    // (.draw-screen__steps has overflow-y: auto), not just somewhere visible.
    el.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [currentStepNumber]);

  return (
    <div className="steplist">
      <h3 className="steplist__title">Steps</h3>
      <ol className="steplist__list">
        {steps.map((step) => {
          const done = doneStepNumbers.has(step.number);
          return (
            <li
              key={step.number}
              ref={(el) => {
                if (el) itemRefs.current.set(step.number, el);
                else itemRefs.current.delete(step.number);
              }}
              className={`steplist__item ${done ? 'steplist__item--done' : ''} ${
                step.number === currentStepNumber ? 'steplist__item--current' : ''
              }`}
            >
              <button
                type="button"
                className="steplist__check"
                onClick={() => onToggle(step.number)}
                aria-label={`Mark step ${step.number} ${done ? 'incomplete' : 'complete'}`}
              >
                {done ? '✓' : step.number}
              </button>
              <div className="steplist__body">
                <p className="steplist__step-title">{step.title}</p>
                <p className="steplist__step-desc">{step.description}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
