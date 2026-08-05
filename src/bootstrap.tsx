import { createRoot } from 'react-dom/client';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { AppShell } from './AppShell';
// Tailwind's base/components/utilities layers. Imported here rather than in
// index.tsx: index.tsx is only a dynamic-import boundary (see its own
// comment), and this is the module that actually renders the app, so it's
// the natural place for the app's global stylesheet too.
import './styles.css';

const queryClient = new QueryClient();

// GET /auth/me and POST /auth/logout aren't implemented on the backend yet
// (see src/mocks/handlers.ts), so start the MSW worker in non-production
// builds only - real deployments talk to the real backend for every request.
async function enableMockingIfNeeded() {
  if (process.env.NODE_ENV === 'production') {
    return;
  }
  const { worker } = await import('./mocks/browser');
  await worker.start({ onUnhandledRequest: 'bypass' });
}

enableMockingIfNeeded().then(() => {
  createRoot(document.getElementById('root')!).render(
    <QueryClientProvider client={queryClient}>
      <AppShell />
    </QueryClientProvider>,
  );
});
