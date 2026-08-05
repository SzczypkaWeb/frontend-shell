import { describe, expect, it } from 'vitest';
import config from './webpack.config';

// Reads a rule's `use` entries as plain loader-name strings, regardless of
// whether each entry is written as a bare string ('css-loader') or an object
// ({ loader: 'css-loader' }).
function loaderNames(use: unknown): string[] {
  const entries = Array.isArray(use) ? use : [use];
  return entries.map((entry) =>
    typeof entry === 'string' ? entry : (entry as { loader: string }).loader,
  );
}

describe('webpack.config', () => {
  it('pipes .css files through postcss-loader -> css-loader -> style-loader', () => {
    const rules = config.module?.rules ?? [];
    const cssRule = rules.find(
      (rule) =>
        rule &&
        typeof rule === 'object' &&
        'test' in rule &&
        String(rule.test) === String(/\.css$/i),
    ) as { use: unknown } | undefined;

    expect(cssRule).toBeDefined();
    // style-loader must run last (it's applied right-to-left by webpack), so
    // CSS ends up injected into the page only after postcss-loader (Tailwind +
    // autoprefixer) and css-loader (resolving @import/url()) have run.
    expect(loaderNames(cssRule!.use)).toEqual(['style-loader', 'css-loader', 'postcss-loader']);
  });
});
