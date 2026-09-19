import { render, act } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import PageviewBeacon from './PageviewBeacon';

/**
 * PageviewBeacon closes the SPA-nav analytics undercount (app.js fires one pageview on load only).
 * These lock the two invariants that keep the analytics count HONEST: (1) it NEVER fires on the
 * initial render (app.js + the server already count the first load → no double-count), and (2) it
 * DOES fire a contract-shaped `POST /api/events` pageview on every subsequent route change. Fully
 * fail-soft — a rejected beacon never throws.
 */
function Nav() {
  const navigate = useNavigate();
  return (
    <button data-testid="go" onClick={() => navigate('/about?x=1')}>
      go
    </button>
  );
}

describe('PageviewBeacon', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    fetchMock = vi.fn(() => Promise.resolve({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('does NOT beacon on the initial render (app.js owns the first load — no double-count)', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <PageviewBeacon />
      </MemoryRouter>,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('beacons a contract-shaped pageview to /api/events on a SPA route change', async () => {
    const { getByTestId } = render(
      <MemoryRouter initialEntries={['/']}>
        <PageviewBeacon />
        <Nav />
      </MemoryRouter>,
    );
    expect(fetchMock).not.toHaveBeenCalled(); // initial render is skipped
    await act(async () => {
      getByTestId('go').click();
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/\/api\/events$/);
    expect(opts.method).toBe('POST');
    expect(opts.keepalive).toBe(true);
    expect(opts.credentials).toBe('omit');
    const body = JSON.parse(String(opts.body));
    expect(body.eventType).toBe('pageview');
    expect(typeof body.eventId).toBe('string');
    expect(body.siteId).toBeTruthy();
    expect(typeof body.timestamp).toBe('number');
    expect(body.payload.href).toBe('/about?x=1'); // pathname + search
  });

  it('is fail-soft — a rejected beacon never throws', async () => {
    fetchMock.mockReturnValue(Promise.reject(new Error('network down')));
    const { getByTestId } = render(
      <MemoryRouter initialEntries={['/']}>
        <PageviewBeacon />
        <Nav />
      </MemoryRouter>,
    );
    await act(async () => {
      getByTestId('go').click();
    });
    expect(fetchMock).toHaveBeenCalledTimes(1); // fired + swallowed the rejection, no throw
  });
});
