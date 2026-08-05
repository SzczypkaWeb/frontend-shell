import { readFileSync } from 'fs';
import path from 'path';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./mocks/browser', () => ({
  worker: { start: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock('./AppShell', () => ({
  AppShell: () => <div data-testid="app-shell" />,
}));

describe('bootstrap', () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = '<div id="root"></div>';
  });

  afterEach(() => {
    cleanup();
  });

  it('renders AppShell into #root', async () => {
    await import('./bootstrap');

    expect(await screen.findByTestId('app-shell')).toBeInTheDocument();
  });

  it('imports the Tailwind CSS entry file itself, not index.tsx, since index.tsx is only the dynamic-import boundary', () => {
    const bootstrapSource = readFileSync(path.resolve(__dirname, './bootstrap.tsx'), 'utf-8');
    const indexSource = readFileSync(path.resolve(__dirname, './index.tsx'), 'utf-8');

    expect(bootstrapSource).toMatch(/import\s+['"]\.\/styles\.css['"]/);
    expect(indexSource).not.toMatch(/styles\.css/);
  });
});
