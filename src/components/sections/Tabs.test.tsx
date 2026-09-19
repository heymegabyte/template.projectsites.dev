import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Tabs } from "./Tabs";

/**
 * Tabs must self-hide on empty input (an empty tablist + no panels is a broken shell) and never
 * leak an unresolved `{TAB_N_LABEL}` token into a tab button.
 */
describe("Tabs", () => {
  it("self-hides when there are no tabs (return null)", () => {
    expect(render(<Tabs tabs={[]} />).container.firstChild).toBeNull();
  });

  it("scrubs a placeholder tab label (no {TOKEN} leak) while still rendering the panel", () => {
    const { container } = render(
      <Tabs
        tabs={[{ id: "a", label: "{TAB_1_LABEL}", content: <p>Panel body</p> }]}
      />,
    );
    expect(container.textContent).not.toContain("{TAB_1_LABEL}");
    expect(container.textContent).toContain("Panel body");
  });

  it("renders a real tab with the ARIA tab pattern", () => {
    render(
      <Tabs tabs={[{ id: "over", label: "Overview", content: <p>Body</p> }]} />,
    );
    const tab = screen.getByRole("tab", { name: /overview/i });
    expect(tab).not.toBeNull();
    expect(tab.getAttribute("aria-selected")).toBe("true");
  });
});
