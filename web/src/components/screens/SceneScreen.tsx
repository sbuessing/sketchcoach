import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { findScene, projectsInScene } from '../../services/dataService';
import { VIEWBOX_SIZE } from '../../services/strokeUtils';
import type { PortfolioEntry, Project, SceneSlot } from '../../shared/types';
import './SceneScreen.css';

export default function SceneScreen() {
  const { sceneId = '' } = useParams<{ sceneId: string }>();
  const { scenes, projects, portfolio } = useApp();
  const navigate = useNavigate();

  const scene = findScene(scenes, sceneId);

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

  if (!scene) {
    return (
      <div className="scenescreen scenescreen--missing">
        <p>Scene not found.</p>
        <Link to="/">Back home</Link>
      </div>
    );
  }

  const completedCount = sortedProjects.filter((p) => entriesBySlug.has(p.slug)).length;
  const totalCount = sortedProjects.length;

  return (
    <div className="scenescreen">
      <header className="scenescreen__header">
        <Link to="/" className="scenescreen__back">← Home</Link>
        <div className="scenescreen__title-block">
          <h1 className="scenescreen__title">{scene.title}</h1>
          <span className="scenescreen__progress">{completedCount} / {totalCount} complete</span>
        </div>
      </header>

      <div className="scenescreen__canvas-wrap">
        <svg
          className="scenescreen__canvas"
          viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
          xmlns="http://www.w3.org/2000/svg"
        >
          {sortedProjects.map((project) => {
            const entry = entriesBySlug.get(project.slug);
            return entry ? (
              <DrawingAtSlot key={project.slug} entry={entry} slot={project.sceneSlot} />
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
    </div>
  );
}

/**
 * Render a saved drawing into its slot. The saved SVG is 1000×1000 in its own
 * viewBox; we strip the outer <svg> wrapper and embed the inner content inside
 * a <g> with a translate+scale transform so it lands cleanly in the slot box.
 */
function DrawingAtSlot({ entry, slot }: { entry: PortfolioEntry; slot: SceneSlot }) {
  const inner = entry.svg
    .replace(/^<svg[^>]*>/i, '')
    .replace(/<\/svg>\s*$/i, '');
  const sx = slot.width / VIEWBOX_SIZE;
  const sy = slot.height / VIEWBOX_SIZE;
  return (
    <g
      transform={`translate(${slot.x},${slot.y}) scale(${sx},${sy})`}
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
