import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Timeline } from "./Timeline";

/**
 * Timeline renders in two orientations; both must be token-safe (scrub at source). A leaked
 * `{TIMELINE_N_TITLE}` / `{..._DESCRIPTION}` must never render; the real `year` still shows.
 */
describe("Timeline — token-safe in both orientations", () => {
  for (const orientation of ["vertical", "horizontal"] as const) {
    it(`${orientation}: a placeholder title/description is scrubbed, year stays`, () => {
      const { container } = render(
        <Timeline
          orientation={orientation}
          events={[
            {
              year: "2021",
              title: "{TIMELINE_1_TITLE}",
              description: "{TIMELINE_1_DESC}",
            },
          ]}
        />,
      );
      expect(container.textContent).toContain("2021");
      expect(container.textContent).not.toContain("{TIMELINE_1_TITLE}");
      expect(container.textContent).not.toContain("{TIMELINE_1_DESC}");
    });
  }

  it("renders real title + description", () => {
    const { container } = render(
      <Timeline
        events={[
          {
            year: "2018",
            title: "Founded",
            description: "Opened our first shop.",
          },
        ]}
      />,
    );
    expect(container.textContent).toContain("Founded");
    expect(container.textContent).toContain("Opened our first shop.");
  });
});
