import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { useApp } from './contexts/AppContext';

const HomeScreen = lazy(() => import('./components/screens/HomeScreen'));
const DrawScreen = lazy(() => import('./components/screens/DrawScreen'));
const DoneScreen = lazy(() => import('./components/screens/DoneScreen'));
const PortfolioScreen = lazy(() => import('./components/screens/PortfolioScreen'));

function LoadingFallback() {
  return (
    <div
      style={{
        height: '100vh',
        display: 'grid',
        placeItems: 'center',
        color: 'var(--color-ink-soft)',
        fontFamily: 'var(--font-display)',
      }}
    >
      Loading…
    </div>
  );
}

export default function App() {
  const { isReady } = useApp();

  if (!isReady) {
    return <LoadingFallback />;
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/draw/:slug" element={<DrawScreen />} />
        <Route path="/done/:slug" element={<DoneScreen />} />
        <Route path="/portfolio" element={<PortfolioScreen />} />
        <Route path="*" element={<HomeScreen />} />
      </Routes>
    </Suspense>
  );
}
