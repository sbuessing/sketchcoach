// IndexedDB wrapper for the user's portfolio of completed sketches
// and any drawings-in-progress.
//
// Keep this lightweight — no schema migrations beyond v1.

import type { PortfolioEntry } from '../shared/types';

const DB_NAME = 'sketchcoach';
const DB_VERSION = 1;
const STORE_PORTFOLIO = 'portfolioEntries';
const STORE_IN_PROGRESS = 'drawingsInProgress';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_PORTFOLIO)) {
        const store = db.createObjectStore(STORE_PORTFOLIO, { keyPath: 'id' });
        store.createIndex('completedAt', 'completedAt', { unique: false });
        store.createIndex('projectSlug', 'projectSlug', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_IN_PROGRESS)) {
        // keyPath is the project slug — one in-progress drawing per project.
        db.createObjectStore(STORE_IN_PROGRESS, { keyPath: 'slug' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx<T>(
  storeName: string,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);
        const req = fn(store);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

// Portfolio CRUD

export async function listPortfolio(): Promise<PortfolioEntry[]> {
  const all = await tx<PortfolioEntry[]>(STORE_PORTFOLIO, 'readonly', (store) =>
    store.getAll(),
  );
  return all.sort((a, b) => b.completedAt - a.completedAt);
}

export async function savePortfolioEntry(entry: PortfolioEntry): Promise<void> {
  await tx(STORE_PORTFOLIO, 'readwrite', (store) => store.put(entry));
}

export async function deletePortfolioEntry(id: string): Promise<void> {
  await tx(STORE_PORTFOLIO, 'readwrite', (store) => store.delete(id));
}

// In-progress drawings

export interface InProgressDrawing {
  slug: string;
  svg: string;
  strokesJson: string; // JSON-stringified Stroke[]
  startedAt: number;
  updatedAt: number;
}

export async function getInProgress(slug: string): Promise<InProgressDrawing | undefined> {
  const result = await tx<InProgressDrawing | undefined>(
    STORE_IN_PROGRESS,
    'readonly',
    (store) => store.get(slug),
  );
  return result;
}

export async function saveInProgress(drawing: InProgressDrawing): Promise<void> {
  await tx(STORE_IN_PROGRESS, 'readwrite', (store) => store.put(drawing));
}

export async function clearInProgress(slug: string): Promise<void> {
  await tx(STORE_IN_PROGRESS, 'readwrite', (store) => store.delete(slug));
}
