---
name: vitest-component-test
description: Use when adding a new React component or UI feature in this webpack + React app-shell, or when tests are needed for existing/new UI code. Covers this repo's Vitest + Testing Library setup and conventions.
---

# Writing component tests in this repo (Vitest + Testing Library)

Follow this order — tests before implementation (see CLAUDE.md: TDD-lite for this repo):

1. **Write the test(s) first**, based on the task's spec: what should render, what happens on fetch success, what happens on fetch failure/loading (render nothing, per this repo's convention — no error banners).
2. **Implement the component** to make those tests pass. Fetch data via the existing HTTP client/base-URL config — never hardcode a host.
3. Keep visual style consistent with existing low-emphasis/secondary text patterns when the task calls for something unobtrusive.
4. Run `pnpm test` until green.

## Common pitfalls to avoid

- Don't let a failed fetch throw/crash the shell — fail silently unless told otherwise.
- Don't block Module Federation host startup on a data fetch.
- Don't write a test that only asserts "doesn't crash" — assert the actual content/behavior from the spec.
