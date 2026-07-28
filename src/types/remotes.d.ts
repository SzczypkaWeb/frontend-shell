// Type declarations for Module Federation remotes consumed by this host.
// These modules don't exist on disk / in node_modules — they're resolved at runtime
// by webpack's ModuleFederationPlugin against the remote's remoteEntry.js.
declare module 'reactApp/Widget' {
  import type { ComponentType } from 'react';

  const Widget: ComponentType;
  export default Widget;
}
