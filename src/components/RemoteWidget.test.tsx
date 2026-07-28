import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The remote's widget is fetched via a dedicated loader module (a thin wrapper around
// `import('reactApp/Widget')`), so tests can mock the loader instead of needing a real
// Module Federation remote (remoteEntry.js) available at test time.
vi.mock('../remotes/reactAppWidget', () => ({
  loadReactAppWidget: vi.fn(),
}));

describe('RemoteWidget', () => {
  beforeEach(() => {
    // React.lazy() resolves its loader once and caches the result for the lifetime of
    // the component reference. Since that reference is created at module scope, each
    // test needs a fresh module instance to observe a fresh load.
    vi.resetModules();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('shows a loading fallback while the remote module is being fetched', async () => {
    const { loadReactAppWidget } = await import('../remotes/reactAppWidget');
    const { RemoteWidget } = await import('./RemoteWidget');

    let resolveImport!: (value: { default: React.ComponentType }) => void;
    (loadReactAppWidget as ReturnType<typeof vi.fn>).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveImport = resolve;
        }),
    );

    render(<RemoteWidget />);

    expect(screen.getByText(/ładowanie/i)).toBeInTheDocument();

    resolveImport({ default: () => <div>Remote widget content</div> });

    await screen.findByText('Remote widget content');
  });

  it('renders the exposed remote Widget component once it has loaded', async () => {
    const { loadReactAppWidget } = await import('../remotes/reactAppWidget');
    const { RemoteWidget } = await import('./RemoteWidget');

    (loadReactAppWidget as ReturnType<typeof vi.fn>).mockResolvedValue({
      default: () => <div data-testid="remote-widget">Hello from react-app</div>,
    });

    render(<RemoteWidget />);

    expect(await screen.findByTestId('remote-widget')).toBeInTheDocument();
    expect(screen.getByText('Hello from react-app')).toBeInTheDocument();
  });

  it('fetches the remote module via the reactApp/Widget loader', async () => {
    const { loadReactAppWidget } = await import('../remotes/reactAppWidget');
    const { RemoteWidget } = await import('./RemoteWidget');

    (loadReactAppWidget as ReturnType<typeof vi.fn>).mockResolvedValue({
      default: () => <div>Remote widget content</div>,
    });

    render(<RemoteWidget />);

    await screen.findByText('Remote widget content');
    expect(loadReactAppWidget).toHaveBeenCalledTimes(1);
  });

  it('shows a friendly error message if the remote module fails to load', async () => {
    const { loadReactAppWidget } = await import('../remotes/reactAppWidget');
    const { RemoteWidget } = await import('./RemoteWidget');

    const loadError = new Error('Failed to load remote module at localhost:8081');
    (loadReactAppWidget as ReturnType<typeof vi.fn>).mockRejectedValue(loadError);

    // Suppress React error boundary warnings in console during this test
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<RemoteWidget />);

    // The error boundary should catch the error and display a friendly fallback
    const errorMessage = await screen.findByText(/nie można załadować widgetu/i);
    expect(errorMessage).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });
});
