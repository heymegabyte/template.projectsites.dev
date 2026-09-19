import { render } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { TeamGrid } from "./TeamGrid";

/**
 * TeamGrid must NEVER ship fabricated people (build-breaking per CLAUDE.md). Locks: a leaked
 * role/bio/photo token never renders (scrub + hasRealImage → monogram, not a 404 <img>), and an
 * all-placeholder team self-hides in PROD instead of shipping fake-named cards to real visitors.
 */
afterEach(() => vi.unstubAllEnvs());

describe("TeamGrid — no fabricated / placeholder people", () => {
  it("a real member with leaked {ROLE}/{BIO}/{PHOTO} tokens → tokens scrubbed, monogram not a broken img", () => {
    const { container } = render(
      <TeamGrid
        members={[
          {
            name: "Jane Rivera",
            role: "{TEAM_1_ROLE}",
            bio: "{TEAM_1_BIO}",
            photo: "{TEAM_1_PHOTO}",
          },
        ]}
      />,
    );
    expect(container.textContent).toContain("Jane Rivera");
    expect(container.textContent).not.toContain("{TEAM_1_ROLE}");
    expect(container.textContent).not.toContain("{TEAM_1_BIO}");
    expect(container.querySelector("img")).toBeNull(); // token photo → monogram fallback, no 404 img
    expect(container.textContent).toContain("JR"); // monogram initials
  });

  it("an empty members list self-hides (return null)", () => {
    expect(render(<TeamGrid members={[]} />).container.firstChild).toBeNull();
  });

  it("an all-placeholder team self-hides in PROD (no fabricated-named cards)", () => {
    vi.stubEnv("DEV", false);
    const { container } = render(
      <TeamGrid members={[{ name: "{TEAM_1_NAME}", role: "{TEAM_1_ROLE}" }]} />,
    );
    expect(container.firstChild).toBeNull();
  });
});
