import { createRoot } from 'react-dom/client';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { AppShell } from './AppShell';
// Tailwind's base/components/utilities layers. Imported here rather than in
// index.tsx: index.tsx is only a dynamic-import boundary (see its own
// comment), and this is the module that actually renders the app, so it's
// the natural place for the app's global stylesheet too.
import './styles.css';
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT,
  release: process.env.SENTRY_RELEASE,
  debug: true,
  dataCollection: {
    // To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/react/configuration/options/#dataCollection
    // userInfo: false,
    // httpBodies: []
  },
});

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <AppShell />
  </QueryClientProvider>,
);
