import { render, within } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { CinematicProcess } from './CinematicProcess';
import { cinematicProcessEnabled } from '@/lib/featureFlags';

/**
 * Cinematic process reel (`cinematic_process` / VITE_CINEMATIC_PROCESS). Locks the flag gate + the
 * component's STRUCTURAL + fallback contract jsdom can assert: DARK by default, token-safe, and a
 * semantic `<ol>`/`<li>`/`<h3>` stack that is the READABLE fallback (the pin+scrub is CSS-only and
 * proven in a real browser by verify-cinematic-process.mjs). Mirrors DepthCascade.test.tsx.
 */
afterEach(() => vi.unstubAllEnvs());

const steps = [
  { title: 'Search your business', description: 'Find your listing in seconds.' },
  { title: 'We build it', description: 'AI assembles a gorgeous site.' },
  { title: 'You go live', description: 'Hosted, SSL, live in minutes.' },
];

describe('cinematicProcessEnabled — VITE_CINEMATIC_PROCESS gate (dark by default)', () => {
  it('is OFF unless VITE_CINEMATIC_PROCESS=1 (experimental, promote-to-enable)', () => {
    expect(cinematicProcessEnabled()).toBe(false);
    vi.stubEnv('VITE_CINEMATIC_PROCESS', '1');
    expect(cinematicProcessEnabled()).toBe(true);
  });
});

describe('CinematicProcess — structural + fallback contract', () => {
  it('renders every step as a semantic <ol>/<li> act with an <h3> title (the readable fallback)', () => {
    const { container, getByRole } = render(
      <CinematicProcess steps={steps} headline="How it works" description="Three simple steps" />,
    );
    const list = getByRole('list');
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(3);
    for (const s of steps) {
      expect(getByRole('heading', { name: s.title })).toBeTruthy();
    }
    // The act count is surfaced for the CSS view-timeline slicing + as a data hook.
    const wrapper = container.querySelector('.cine-process');
    expect(wrapper?.getAttribute('data-cine-acts')).toBe('3');
    expect((wrapper as HTMLElement | null)?.style.getPropertyValue('--cine-acts')).toBe('3');
    // Every act is fully present in the DOM (opacity is a CSS concern) → SR-legible fallback.
    expect(container.querySelectorAll('.cine-act')).toHaveLength(3);
  });

  it('drops steps whose title is still an unresolved {TOKEN}', () => {
    const { getByRole, queryByText } = render(
      <CinematicProcess
        steps={[
          { title: '{PROCESS_1_TITLE}', description: '{PROCESS_1_DESCRIPTION}' },
          { title: 'Real step', description: 'Real copy.' },
        ]}
      />,
    );
    expect(within(getByRole('list')).getAllByRole('listitem')).toHaveLength(1);
    expect(queryByText('{PROCESS_1_TITLE}')).toBeNull();
  });

  it('renders nothing when every step is an unresolved token (no empty reel)', () => {
    const { container } = render(
      <CinematicProcess steps={[{ title: '{PROCESS_1_TITLE}', description: '{X}' }]} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('marks the decorative rail aria-hidden + renders the ghost number as a data-num ::before (no contrast obligation)', () => {
    const { container } = render(<CinematicProcess steps={steps} headline="How it works" />);
    for (const el of container.querySelectorAll('.cine-hud')) {
      expect(el.getAttribute('aria-hidden')).toBe('true');
    }
    // The big ghost number is a CSS ::before(content: attr(data-num)) — never a text node.
    expect([...container.querySelectorAll('.cine-act')].map((a) => a.getAttribute('data-num'))).toEqual(['01', '02', '03']);
    expect(container.querySelector('.cine-num')).toBeNull();
  });
});
