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

// Reads the `ts-loader` entry's `options.compilerOptions` for a rule's `use`
// list, regardless of whether ts-loader is written as a bare string
// ('ts-loader', i.e. no per-loader options) or as an object
// ({ loader: 'ts-loader', options: {...} }).
function tsLoaderCompilerOptions(use: unknown): Record<string, unknown> | undefined {
  const entries = Array.isArray(use) ? use : [use];
  const tsLoaderEntry = entries.find(
    (entry) =>
      entry === 'ts-loader' ||
      (typeof entry === 'object' &&
        entry !== null &&
        (entry as { loader?: string }).loader === 'ts-loader'),
  );
  if (typeof tsLoaderEntry !== 'object' || tsLoaderEntry === null) {
    return undefined;
  }
  const options = (tsLoaderEntry as { options?: { compilerOptions?: Record<string, unknown> } })
    .options;
  return options?.compilerOptions;
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

  it('compiles app source with native ESM `import()` so it stays a real async chunk boundary for Module Federation', () => {
    // tsconfig.json's top-level `module` is CommonJS (required so ts-node/
    // webpack-cli can load this very config file, which uses CommonJS
    // globals like __dirname). TypeScript's CommonJS output downlevels
    // `import()` into a synchronous `require()` wrapped in an
    // already-resolved Promise - which happens BEFORE webpack's parser ever
    // sees the code. Webpack's code-splitting only recognizes the literal
    // `import()` syntax, so a downleveled dynamic import silently stops
    // being split into its own chunk.
    //
    // That matters because src/index.tsx uses `import('./bootstrap')`
    // specifically to create an async boundary: Module Federation needs
    // that boundary to initialize its shared scope (react/react-dom/
    // zustand) before any app code that consumes those shared singletons
    // runs. Without a real async chunk, react/react-dom/bootstrap all get
    // bundled into the synchronous main entry chunk together with the
    // `consume-shared` runtime module, which throws "Shared module is not
    // available for eager consumption" at runtime and leaves the page blank.
    //
    // So the ts-loader rule compiling app source (as opposed to the
    // webpack.config.ts file itself) must override `module`/`moduleResolution`
    // to keep native ESM `import()` syntax intact.
    const rules = config.module?.rules ?? [];
    const tsRule = rules.find(
      (rule) =>
        rule &&
        typeof rule === 'object' &&
        'test' in rule &&
        String(rule.test) === String(/\.tsx?$/),
    ) as { use: unknown } | undefined;

    expect(tsRule).toBeDefined();

    const compilerOptions = tsLoaderCompilerOptions(tsRule!.use);

    expect(compilerOptions).toBeDefined();
    expect(compilerOptions?.module).not.toBe('CommonJS');
    expect(compilerOptions?.module).not.toBe('commonjs');
  });
});
