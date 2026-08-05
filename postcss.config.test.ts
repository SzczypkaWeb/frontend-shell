import { describe, expect, it } from 'vitest';
// @ts-expect-error - postcss.config.cjs is a plain CommonJS file, not typed.
import postcssConfig from './postcss.config.cjs';

describe('postcss.config', () => {
  it('runs the tailwindcss and autoprefixer plugins', () => {
    expect(Object.keys(postcssConfig.plugins)).toEqual(
      expect.arrayContaining(['tailwindcss', 'autoprefixer']),
    );
  });
});
