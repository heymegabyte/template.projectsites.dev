import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { CaseStudyGrid, type CaseStudy } from './CaseStudyCard';
import { TeamGrid, type TeamMember } from './TeamGrid';

/**
 * CODE-QUALITY SWEEP (Fire 4): the grids hardcode N tokenized slots (`{CS_3_TITLE}`,
 * `{TEAM_2_NAME}`). A business with FEWER items than the template's slots leaves the extra
 * slots unfilled — and `build_validators` only guards `{BUSINESS_*}` tokens, NOT section slots,
 * so a partial site-gen fill used to render a broken/empty card (and emit a `{TEAM_3_NAME}`
 * Person JSON-LD). The grids now drop unfilled-slot cards via the isPlaceholder firewall, but
 * keep ALL when NONE are filled (the raw template skeleton) so the dev build still renders.
 */
const token = (n: number): CaseStudy => ({
  slug: `{CS_${n}_SLUG}`,
  title: `{CS_${n}_TITLE}`,
  client: `{CS_${n}_CLIENT}`,
  summary: `{CS_${n}_SUMMARY}`,
});
const cards = (el: HTMLElement) => el.querySelectorAll('ul > li').length;

describe('CaseStudyGrid — drops unfilled {CS_N} slot cards on a partial fill', () => {
  it('renders only the filled study; drops the {CS_2_*} placeholder card', () => {
    const { container } = render(
      <MemoryRouter>
        <CaseStudyGrid
          studies={[
            { slug: 'acme', title: 'Rebranding Acme', client: 'Acme', summary: 'Real outcome copy.' },
            token(2),
          ]}
          headline="Work"
        />
      </MemoryRouter>,
    );
    expect(cards(container)).toBe(1);
    expect(container.textContent).toContain('Rebranding Acme');
    expect(container.textContent).not.toContain('{CS_2_TITLE}');
  });

  it('keeps ALL cards when NONE are filled (raw template skeleton renders in dev)', () => {
    const { container } = render(
      <MemoryRouter>
        <CaseStudyGrid studies={[token(1), token(2), token(3)]} />
      </MemoryRouter>,
    );
    expect(cards(container)).toBe(3);
  });
});

describe('TeamGrid — drops unfilled {TEAM_N} slot members on a partial fill', () => {
  it('renders only the filled member; drops the placeholder card + its Person JSON-LD', () => {
    const members: TeamMember[] = [
      { name: 'Ada Lovelace', role: 'Founder' },
      { name: '{TEAM_2_NAME}', role: '{TEAM_2_ROLE}' },
    ];
    const { container } = render(<TeamGrid members={members} />);
    expect(cards(container)).toBe(1);
    expect(container.textContent).toContain('Ada Lovelace');
    expect(container.textContent).not.toContain('{TEAM_2_NAME}');
    // the dropped member must NOT leak into Person JSON-LD either:
    const ld = container.querySelector('script[type="application/ld+json"]')?.textContent ?? '';
    expect(ld).toContain('Ada Lovelace');
    expect(ld).not.toContain('{TEAM_2_NAME}');
  });

  it('keeps ALL members when NONE are filled (template skeleton)', () => {
    const members: TeamMember[] = [
      { name: '{TEAM_1_NAME}', role: '{TEAM_1_ROLE}' },
      { name: '{TEAM_2_NAME}', role: '{TEAM_2_ROLE}' },
    ];
    const { container } = render(<TeamGrid members={members} />);
    expect(cards(container)).toBe(2);
  });
});
