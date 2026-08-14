import { Component, ReactNode } from 'react';
import * as Sentry from '@sentry/react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary component that catches errors in child components
 * and displays a friendly fallback message instead of crashing the app.
 * Used to handle failures when loading remote modules via Module Federation.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error) {
    // Log error for debugging purposes
    console.error('Error caught by ErrorBoundary:', error);
    // React error boundaries catch render-phase errors and stop them from
    // ever reaching window.onerror/unhandledrejection - which means they
    // never reached Sentry either, despite Sentry.init() already running in
    // this same app (bootstrap.tsx). This was a real blind spot: this
    // boundary wraps the Module Federation remote (RemoteWidget/react-app),
    // so a render bug in that widget specifically was invisible in
    // production monitoring until now. See BLOG_NOTES.md.
    Sentry.captureException(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div style={{ padding: '1rem', backgroundColor: '#fee', borderRadius: '0.5rem' }}>
            <p style={{ color: '#c33', fontWeight: 'bold' }}>Nie można załadować widgetu</p>
            <p style={{ color: '#666', fontSize: '0.875rem' }}>
              Zdalny moduł nie jest dostępny. Sprawdź, czy serwer jest uruchomiony.
            </p>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
