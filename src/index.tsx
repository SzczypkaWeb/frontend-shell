// Kept intentionally tiny: it only triggers a dynamic import of ./bootstrap.
// That dynamic import creates an async boundary, which is what lets webpack /
// Module Federation resolve and initialize the shared scope (react,
// react-dom, zustand - see the ModuleFederationPlugin `shared` config in
// webpack.config.ts) before any of this app's own code runs. Importing
// ./bootstrap synchronously here instead would risk that code (and the
// singletons it depends on) executing before the shared scope is ready.
import('./bootstrap');

// Side-effect-only file: this empty export is what makes TypeScript treat it
// as an ES module (rather than a global script), which is required for
// `await import('./index')` to type-check from test files.
export {};
