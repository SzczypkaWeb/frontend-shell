import { lazy, Suspense } from 'react';
import { loadReactAppWidget } from '../remotes/reactAppWidget';
import { ErrorBoundary } from './ErrorBoundary';

// Lazily load the remote's exposed component so the shell's initial bundle never pays
// for react-app's code, and so a slow/unavailable remote can't block the host from
// rendering the rest of the page. Declared once at module scope (not inside the
// component) since React.lazy components must not be recreated on every render.
const Widget = lazy(loadReactAppWidget);

export function RemoteWidget() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<p>Ładowanie widgetu...</p>}>
        <Widget />
      </Suspense>
    </ErrorBoundary>
  );
}
