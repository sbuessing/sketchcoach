import type { Guideline, Project, ProjectSteps } from '../shared/types';

// Module-level caches: each file is fetched at most once per page load.
let projectsCache: Project[] | null = null;
let guidelinesCache: Guideline[] | null = null;
const stepsCache = new Map<string, ProjectSteps>();

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) {
    throw new Error(`Failed to load ${path}: ${res.status}`);
  }
  return res.json();
}

export async function loadProjects(): Promise<Project[]> {
  if (projectsCache) return projectsCache;
  const data = await fetchJson<{ projects: Project[] }>('/data/projects.json');
  projectsCache = data.projects;
  return projectsCache;
}

export async function loadGuidelines(): Promise<Guideline[]> {
  if (guidelinesCache) return guidelinesCache;
  const data = await fetchJson<{ guidelines: Guideline[] }>('/data/guidelines.json');
  guidelinesCache = data.guidelines;
  return guidelinesCache;
}

export async function loadProjectSteps(slug: string): Promise<ProjectSteps> {
  const cached = stepsCache.get(slug);
  if (cached) return cached;
  const data = await fetchJson<ProjectSteps>(`/data/${slug}.json`);
  stepsCache.set(slug, data);
  return data;
}

// Convenience lookups, available once data is loaded.
export function findProject(projects: Project[], slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export function findGuideline(guidelines: Guideline[], id: string): Guideline | undefined {
  return guidelines.find((g) => g.id === id);
}
