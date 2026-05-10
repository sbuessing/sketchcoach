// SaveIndicator — shows a brief "Saved ✓" badge when IndexedDB write completes.
// Fades in on savedAt change, then fades out after 2 seconds.

import { useEffect, useRef, useState } from 'react';
import './SaveIndicator.css';

const VISIBLE_MS = 2000;

interface SaveIndicatorProps {
  savedAt: number; // 0 = never saved; >0 = timestamp of last save
}

export default function SaveIndicator({ savedAt }: SaveIndicatorProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (savedAt === 0) return;
    setVisible(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(false), VISIBLE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [savedAt]);

  return (
    <span
      className={`save-indicator ${visible ? 'save-indicator--visible' : ''}`}
      aria-live="polite"
      aria-atomic="true"
    >
      Saved ✓
    </span>
  );
}
