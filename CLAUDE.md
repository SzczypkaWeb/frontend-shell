# frontend-shell

## Stack
React + TypeScript, webpack (Module Federation **host**) — composes remotes
(e.g. `react-app`) into one page for the customer-facing app.

## Run / test
- `pnpm install` then `pnpm dev` (webpack-dev-server).
- `pnpm test` — Vitest + @testing-library/react (config already set up, reuse it).
- `pnpm lint` — ESLint, zero warnings allowed.
- `pnpm typecheck` — `tsc --noEmit`.
- `pnpm build` — production bundle + static web app config.

## Structure
- `src/remotes/` — Module Federation remote wiring/loading.
- `src/components/`, `src/hooks/` — host-owned UI, not remote-specific.
- `src/api/` — REST calls to `backend`.
- `src/schemas/` — Zod schemas (forms + API response validation).
- `src/store/` — Zustand stores (UI/client state).
- `src/types/` — shared TS types.
- `src/test/` — test setup/utilities.

## Conventions
- Server state via TanStack Query, UI state via Zustand — don't put server
  data in a Zustand store or client-only UI state in a query cache.
- Conventional commits, everything in English.
- Tests are written FIRST, based on the task specification, before
  implementation (TDD-lite) — keeps tests an independent check of behavior,
  not a mirror of whatever got implemented.
- UI components come from `@szczypkaweb/shared-ui` — see that repo's own
  CLAUDE.md for the input/floating-surface/page-chrome styling conventions
  before adding a new shared component from here.

## Never do
- Never duplicate a component that already exists in `@szczypkaweb/shared-ui`
  — extend or compose it there instead of forking it locally.
- Never fetch server data outside TanStack Query (no ad-hoc `useEffect` +
  `fetch` for anything that belongs in the query cache).
- Never add a new Module Federation remote wiring without checking
  `webpack.config.ts`'s existing `remotes` entries for the pattern first.
- Never merge with a red `pnpm lint`/`pnpm typecheck`/`pnpm test`.
