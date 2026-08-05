import { createRoot } from 'react-dom/client';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { AppShell } from './AppShell';

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
