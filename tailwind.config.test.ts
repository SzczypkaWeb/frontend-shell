import { describe, expect, it } from 'vitest';
// @ts-expect-error - tailwind.config.js is a plain CommonJS file, not typed.
import tailwindConfig from './tailwind.config';

describe('tailwind.config', () => {
  it("scans this app's own source files for Tailwind class names", () => {
    expect(tailwindConfig.content).toContain('./src/**/*.{ts,tsx}');
  });

  it('also scans the compiled @szczypkaweb/shared-ui output, so classes used inside shared-ui components are generated too', () => {
    expect(tailwindConfig.content).toContain('./node_modules/@szczypkaweb/shared-ui/dist/**/*.js');
  });
});
