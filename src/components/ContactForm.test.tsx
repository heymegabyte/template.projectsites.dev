import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ContactForm,
  isMinLength,
  isValidEmail,
  isValidPhone,
  isFieldValid,
} from './ContactForm';

/**
 * ContactForm — the primary conversion surface (the golden journey's contact→/admin/forms leg).
 * Locks two contracts:
 *   1. The pure BE-parity validity helpers (same thresholds as the server Zod guard).
 *   2. The controlled-input RESET-ON-SUCCESS fix: the fields are controlled (`value={values...}`),
 *      which React 19's native `<form action>` reset can NOT clear — without the success effect the
 *      visitor's just-sent text lingers next to "Thanks…" ("did it send? resend?"). This asserts a
 *      successful send both SHOWS the success status AND clears every field.
 */

describe('ContactForm — pure validity helpers (BE-parity thresholds)', () => {
  it('isMinLength trims then thresholds', () => {
    expect(isMinLength('  ab  ', 2)).toBe(true);
    expect(isMinLength('a', 2)).toBe(false);
    expect(isMinLength('   ', 2)).toBe(false);
  });

  it('isValidEmail accepts a real address, rejects junk + partials', () => {
    expect(isValidEmail('jane@example.com')).toBe(true);
    expect(isValidEmail('  jane@example.com  ')).toBe(true);
    expect(isValidEmail('nope')).toBe(false);
    expect(isValidEmail('a@b')).toBe(false); // no TLD
    expect(isValidEmail('a b@c.com')).toBe(false); // whitespace
  });

  it('isValidPhone is OPTIONAL (empty ok) else needs ≥7 digits', () => {
    expect(isValidPhone('')).toBe(true);
    expect(isValidPhone('   ')).toBe(true);
    expect(isValidPhone('123')).toBe(false);
    expect(isValidPhone('(555) 123-4567')).toBe(true);
  });

  it('isFieldValid routes to the right rule per field', () => {
    expect(isFieldValid('name', 'Jo')).toBe(true);
    expect(isFieldValid('name', 'J')).toBe(false);
    expect(isFieldValid('email', 'a@b.co')).toBe(true);
    expect(isFieldValid('phone', '')).toBe(true); // optional
    expect(isFieldValid('message', 'too short')).toBe(false);
    expect(isFieldValid('message', 'A genuinely long enough message.')).toBe(true);
  });
});

describe('ContactForm — clears controlled fields on a successful send', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
      ),
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('fill → submit → success status shown AND every field reset to empty', async () => {
    render(<ContactForm slug="test-slug" />);
    const name = screen.getByLabelText(/name/i) as HTMLInputElement;
    const email = screen.getByLabelText(/email/i) as HTMLInputElement;
    const message = screen.getByLabelText(/message/i) as HTMLTextAreaElement;

    fireEvent.change(name, { target: { value: 'Jane Doe' } });
    fireEvent.change(email, { target: { value: 'jane@example.com' } });
    fireEvent.change(message, { target: { value: 'Hello — I have a real question about a booking.' } });

    // With all required fields valid, the submit button un-gates.
    const submit = screen.getByRole('button', { name: /send message/i });
    await waitFor(() => expect(submit).not.toBeDisabled());

    fireEvent.click(submit);

    // The success status renders …
    await waitFor(() => expect(screen.getByRole('status')).toBeInTheDocument());
    expect(screen.getByRole('status').textContent).toMatch(/thanks/i);
    // … and the controlled fields are cleared (the fix — no lingering text next to "Thanks…").
    await waitFor(() => {
      expect(name).toHaveValue('');
      expect(email).toHaveValue('');
      expect(message).toHaveValue('');
    });
    // Exactly one POST to the slug endpoint (contract intact).
    expect(fetch).toHaveBeenCalledTimes(1);
    expect((fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]).toContain('test-slug');
  });
});
