import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// Browser-side MSW worker, started only in development (see src/index.tsx).
// Requests not matched by `handlers` (e.g. POST /auth/login) pass through to
// the real network untouched.
export const worker = setupWorker(...handlers);
