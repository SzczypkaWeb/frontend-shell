import { beforeEach, describe, expect, it, vi } from 'vitest';

// index.tsx must stay a tiny dynamic-import boundary: the real startup logic
// (mocking, CSS, rendering) lives in ./bootstrap, loaded asynchronously so
// Module Federation's shared scope (react, react-dom, zustand - see
// webpack.config.ts) finishes initializing before this app's own code runs.
const bootstrapModuleLoaded = vi.fn();
vi.mock('./bootstrap', () => {
  bootstrapModuleLoaded();
  return {};
});

describe('index entry point', () => {
  beforeEach(() => {
    vi.resetModules();
    bootstrapModuleLoaded.mockClear();
  });

  it('starts the app via a dynamic import of ./bootstrap', async () => {
    await import('./index');
    // Flush the microtask queue so the dynamic import has a chance to settle.
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(bootstrapModuleLoaded).toHaveBeenCalledTimes(1);
  });
});
