import { readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

describe('styles.css', () => {
  it('declares the three Tailwind layers', () => {
    const css = readFileSync(path.resolve(__dirname, './styles.css'), 'utf-8');

    expect(css).toMatch(/@tailwind\s+base;/);
    expect(css).toMatch(/@tailwind\s+components;/);
    expect(css).toMatch(/@tailwind\s+utilities;/);
  });
});
