import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Suppress console.error output during tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>,
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('displays the default error fallback when an error is caught', () => {
    // Create a component that throws an error
    const ThrowingComponent = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>,
    );

    // Check for the default error message in Polish
    expect(screen.getByText('Nie można załadować widgetu')).toBeInTheDocument();
    expect(
      screen.getByText('Zdalny moduł nie jest dostępny. Sprawdź, czy serwer jest uruchomiony.'),
    ).toBeInTheDocument();
  });

  it('displays a custom fallback when provided', () => {
    const ThrowingComponent = () => {
      throw new Error('Test error');
    };

    const customFallback = <div>Custom error message</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowingComponent />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
  });

  it('logs the error to console', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const testError = new Error('Test logging error');

    const ThrowingComponent = () => {
      throw testError;
    };

    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>,
    );

    // Check that the error was logged
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error caught by ErrorBoundary:', testError);

    consoleErrorSpy.mockRestore();
  });
});
