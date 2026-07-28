// Loads the './Widget' component exposed by the 'reactApp' Module Federation remote
// (see the `remotes` entry in webpack.config.ts). This indirection exists so the remote
// import can be mocked in tests without needing a real remoteEntry.js to be reachable.
export function loadReactAppWidget() {
  return import('reactApp/Widget');
}
