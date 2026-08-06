import { readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

describe('styles.css', () => {
  it('imports Tailwind v4', () => {
    const css = readFileSync(path.resolve(__dirname, './styles.css'), 'utf-8');

    expect(css).toMatch(/@import\s+["']tailwindcss["'];/);
  });

  it("imports @szczypkaweb/shared-ui's shared design tokens instead of redefining them", () => {
    const css = readFileSync(path.resolve(__dirname, './styles.css'), 'utf-8');

    expect(css).toMatch(/@import\s+["']@szczypkaweb\/shared-ui\/globals\.css["'];/);
  });

  it('scans the compiled @szczypkaweb/shared-ui output, so classes used inside shared-ui components are generated too', () => {
    const css = readFileSync(path.resolve(__dirname, './styles.css'), 'utf-8');

    expect(css).toMatch(/@source\s+["']\.\.\/node_modules\/@szczypkaweb\/shared-ui\/dist["'];/);
  });
});
