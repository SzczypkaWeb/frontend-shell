import { describe, expect, it } from 'vitest';
// @ts-expect-error - postcss.config.cjs is a plain CommonJS file, not typed.
import postcssConfig from './postcss.config.cjs';

describe('postcss.config', () => {
  it('runs the Tailwind v4 postcss plugin', () => {
    expect(Object.keys(postcssConfig.plugins)).toEqual(
      expect.arrayContaining(['@tailwindcss/postcss']),
    );
  });
});
