import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AiChat } from './AiChat';

/**
 * Resilience regression (CODE-QUALITY SWEEP, AL-724): `onSubmit` wraps its fetch + SSE-read in
 * `try { … } finally { setStreaming(false) }`. Before the fix it had NO `catch`, so a fetch
 * REJECTION (offline / DNS / CORS / ad-blocker) or a mid-stream reader throw left the empty
 * assistant bubble hanging forever AND surfaced an unhandled promise rejection (a console-error
 * gate failure). This drives a real render with a rejecting fetch and asserts the bubble fills
 * with the graceful fallback instead of staying empty — proving the catch fires.
 */
describe('AiChat — network-failure resilience', () => {
  beforeEach(() => {
    // jsdom doesn't implement these — AiChat's open/close effect + scroll-to-latest call them.
    HTMLDialogElement.prototype.showModal = vi.fn();
    HTMLDialogElement.prototype.close = vi.fn();
    Element.prototype.scrollIntoView = vi.fn();
    Element.prototype.scrollTo = vi.fn();
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('network down'))),
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('fills the assistant bubble with a graceful fallback when the fetch rejects (no empty hang)', async () => {
    render(<AiChat endpoint="/api/ai/chat" />);
    // The <dialog> children are in the DOM under jsdom, so the composer is reachable without
    // opening the launcher. Type a question and submit the form.
    const textarea = screen.getByPlaceholderText(/ask anything/i);
    fireEvent.change(textarea, { target: { value: 'Do you take reservations?' } });
    fireEvent.submit(textarea.closest('form')!);

    await waitFor(() =>
      expect(screen.getByText(/can't reach the AI service right now/i)).toBeInTheDocument(),
    );
    // fetch WAS attempted (the rejection is what we handled — not a pre-flight bail).
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
