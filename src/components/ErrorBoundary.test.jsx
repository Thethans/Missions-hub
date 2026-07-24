import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorBoundary from './ErrorBoundary.jsx';

function Bomb() {
  throw new Error('boom');
}

describe('ErrorBoundary', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children normally when nothing throws', () => {
    render(
      <ErrorBoundary>
        <p>All good</p>
      </ErrorBoundary>
    );
    expect(screen.getByText('All good')).toBeInTheDocument();
  });

  it('renders a fallback instead of unmounting the whole tree when a child throws', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toHaveTextContent(/something went wrong/i);
    expect(consoleError).toHaveBeenCalled();
  });

  it('reloads the page when the fallback button is clicked', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const reload = vi.fn();
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, reload }
    });

    const user = userEvent.setup();
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );

    await user.click(screen.getByRole('button', { name: /reload page/i }));
    expect(reload).toHaveBeenCalled();

    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
    consoleError.mockRestore();
  });
});
