import { readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

// Production equivalent of two things that already exist only for local dev:
//  - webpack devServer's `historyApiFallback: true` (client-side routing -
//    unmatched paths must still serve index.html, not 404)
//  - devServer's 'Access-Control-Allow-Origin': '*' header on this app's own
//    remoteEntry.js (this shell is itself a Module Federation container,
//    name 'shell', exposing ./authStore - see webpack.config.ts) so it can
//    be consumed cross-origin once frontend-shell and react-app are two
//    separate Azure Static Web Apps (task #8).
describe('staticwebapp.config.json', () => {
  const config = JSON.parse(
    readFileSync(path.resolve(__dirname, './staticwebapp.config.json'), 'utf-8'),
  );

  it('falls back unmatched routes to index.html, so client-side routing works on refresh/direct navigation', () => {
    expect(config.navigationFallback?.rewrite).toBe('/index.html');
  });

  it('excludes remoteEntry.js and static assets from the SPA fallback, so they are served as-is instead of index.html', () => {
    const exclude: string[] = config.navigationFallback?.exclude ?? [];
    expect(exclude).toContain('/remoteEntry.js');
  });

  it('allows cross-origin loading of this shell’s own remoteEntry.js', () => {
    const route = config.routes.find((r: { route: string }) => r.route === '/remoteEntry.js');
    expect(route?.headers?.['Access-Control-Allow-Origin']).toBe('*');
  });

  it("doesn't let remoteEntry.js be cached, since its filename is stable and must always resolve to the latest build", () => {
    const route = config.routes.find((r: { route: string }) => r.route === '/remoteEntry.js');
    expect(route?.headers?.['Cache-Control']).toMatch(/no-cache/);
  });

  it('allows cross-origin loading of the content-hashed chunk files too', () => {
    const route = config.routes.find((r: { route: string }) => r.route === '/*.js');
    expect(route?.headers?.['Access-Control-Allow-Origin']).toBe('*');
  });

  it("doesn't let the main entry bundle be cached either, since bundle.js (unlike MF chunks) has a stable filename with no content hash - a stale cached copy silently keeps serving build-time values (API_URL, etc.) from whenever it was first cached, even after a new deploy", () => {
    const route = config.routes.find((r: { route: string }) => r.route === '/*.js');
    expect(route?.headers?.['Cache-Control']).toMatch(/no-cache/);
  });
});
