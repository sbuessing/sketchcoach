import type { ProjectStep } from '../../shared/types';
import './StepList.css';

interface StepListProps {
  steps: ProjectStep[];
  doneStepNumbers: Set<number>;
  onToggle: (stepNumber: number) => void;
}

export default function StepList({ steps, doneStepNumbers, onToggle }: StepListProps) {
  return (
    <div className="steplist">
      <h3 className="steplist__title">Steps</h3>
      <ol className="steplist__list">
        {steps.map((step) => {
          const done = doneStepNumbers.has(step.number);
          return (
            <li
              key={step.number}
              className={`steplist__item ${done ? 'steplist__item--done' : ''}`}
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
