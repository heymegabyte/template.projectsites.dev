import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { GoogleMapEmbed } from "./GoogleMapEmbed";

/**
 * GoogleMapEmbed renders a Maps iframe for a query. On placeholder data it must render NOTHING —
 * an empty / unfilled-{token} query would ship a broken `q=` embed and a "Map: {TOKEN}" iframe
 * title (a WCAG 4.1.2 leak). The titled, guarded map on deployed sites is LocationMap's own iframe.
 */
describe("GoogleMapEmbed", () => {
  it("a real query → an iframe with a non-empty title + q= src", () => {
    const { container } = render(
      <GoogleMapEmbed query="Franklin Barbecue, Austin TX" />,
    );
    const f = container.querySelector("iframe") as HTMLIFrameElement;
    expect(f).not.toBeNull();
    expect(f.getAttribute("title")).toBe("Map: Franklin Barbecue, Austin TX");
    expect(f.getAttribute("src")).toContain(
      `q=${encodeURIComponent("Franklin Barbecue, Austin TX")}`,
    );
  });

  it("renders NOTHING for an unfilled {token} or empty query (no broken embed, no title leak)", () => {
    expect(
      render(<GoogleMapEmbed query="{ADDRESS}" />).container.firstChild,
    ).toBeNull();
    expect(render(<GoogleMapEmbed query="" />).container.firstChild).toBeNull();
    expect(
      render(<GoogleMapEmbed query="  " />).container.firstChild,
    ).toBeNull();
  });
});
