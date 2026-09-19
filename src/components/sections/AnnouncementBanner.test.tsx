import { render, screen } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import { AnnouncementBanner } from "./AnnouncementBanner";

/** AnnouncementBanner must be token-safe (self-hide on a placeholder/empty message) and never render
 *  a dead CTA link (a `{token}`/`#`/empty href). */
afterEach(() => {
  try {
    localStorage.clear();
  } catch {
    /* private mode */
  }
});

describe("AnnouncementBanner — token-safe + no dead CTA", () => {
  it("renders a real message", () => {
    render(<AnnouncementBanner id="t1" message="Holiday hours this week" />);
    expect(screen.getByText("Holiday hours this week")).toBeInTheDocument();
  });

  it("self-hides when the message is a placeholder or empty", () => {
    expect(
      render(<AnnouncementBanner id="t2" message="{ANNOUNCEMENT}" />).container
        .firstChild,
    ).toBeNull();
    expect(
      render(<AnnouncementBanner id="t3" message="" />).container.firstChild,
    ).toBeNull();
  });

  it("renders a real CTA link but omits a dead/placeholder CTA (message still shows)", () => {
    const real = render(
      <AnnouncementBanner
        id="t4"
        message="Sale"
        cta={{ label: "Shop", href: "/pricing" }}
      />,
    );
    expect(real.container.querySelector('a[href="/pricing"]')).not.toBeNull();

    const dead = render(
      <AnnouncementBanner
        id="t5"
        message="Sale"
        cta={{ label: "Shop", href: "#" }}
      />,
    );
    expect(dead.container.querySelector("a")).toBeNull();
    expect(dead.container.textContent).toContain("Sale");
  });
});
