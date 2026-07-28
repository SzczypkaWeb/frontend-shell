# Conventions for this repo

Stack: React + TypeScript, webpack (Module Federation host).

- Server state via TanStack Query, UI state via Zustand.
- Tests: Vitest + @testing-library/react (set up already — reuse existing config).
- Conventional commits, everything in English.
- Tests are written FIRST, based on the task specification, before implementation
  (TDD-lite) — this keeps tests an independent check of behavior, not a mirror of
  whatever got implemented.
