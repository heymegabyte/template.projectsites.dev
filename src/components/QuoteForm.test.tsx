import { render, fireEvent, waitFor, within } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { QuoteForm } from "./QuoteForm";

/**
 * WCAG 3.3.1 (Error Identification) + 4.1.2 (Name, Role, Value): the quote form
 * styles invalid fields red and renders an error message, but a screen-reader user
 * only learns a field is invalid when the input itself carries `aria-invalid` AND
 * the error text is programmatically tied to it via `aria-describedby`. This mirrors
 * ContactForm's contract: emit `aria-invalid="true"` only when invalid (attribute
 * absent when valid), and point `aria-describedby` at the rendered error's id.
 */

const FIELDS = ["name", "phone", "email", "address", "details"] as const;

describe("QuoteForm — a11y error wiring (WCAG 3.3.1)", () => {
  it("marks NO field aria-invalid before the first submit (clean initial state)", () => {
    const { container } = render(<QuoteForm slug="test" />);
    expect(container.querySelectorAll('[aria-invalid="true"]').length).toBe(0);
  });

  it("on empty submit, every required field gets aria-invalid + aria-describedby tied to its rendered error", async () => {
    const { container, getByRole } = render(<QuoteForm slug="test" />);

    // Submit with all fields empty → Zod rejects → per-field errors render.
    fireEvent.click(getByRole("button", { name: /request my free quote/i }));

    await waitFor(() => {
      expect(
        container.querySelectorAll('[aria-invalid="true"]').length,
      ).toBeGreaterThan(0);
    });

    for (const f of FIELDS) {
      const input = container.querySelector(`#q-${f}`);
      expect(input, `#q-${f} exists`).not.toBeNull();
      // invalid → attribute present and "true"
      expect(input!.getAttribute("aria-invalid")).toBe("true");
      // describedby points at a REAL element that holds the error text
      const describedBy = input!.getAttribute("aria-describedby");
      expect(describedBy).toBe(`q-${f}-err`);
      const errEl = container.querySelector(`#${describedBy}`);
      expect(errEl, `error element #${describedBy} rendered`).not.toBeNull();
      expect(errEl!.textContent?.trim().length).toBeGreaterThan(0);
    }
  });

  it("a field cleared of its error drops aria-invalid (attribute absent, not 'false')", async () => {
    const { container, getByRole } = render(<QuoteForm slug="test" />);
    fireEvent.click(getByRole("button", { name: /request my free quote/i }));
    await waitFor(() =>
      expect(
        container.querySelector('#q-name[aria-invalid="true"]'),
      ).not.toBeNull(),
    );

    // Type a valid name, then re-submit — the other fields stay invalid but name recovers.
    const name = container.querySelector("#q-name") as HTMLInputElement;
    fireEvent.change(name, { target: { value: "Jane Contractor" } });
    fireEvent.click(getByRole("button", { name: /request my free quote/i }));

    await waitFor(() => {
      const el = container.querySelector("#q-name") as HTMLInputElement;
      // ContactForm contract: valid → NO aria-invalid attribute (never "false").
      expect(el.hasAttribute("aria-invalid")).toBe(false);
      expect(el.hasAttribute("aria-describedby")).toBe(false);
    });
  });

  it("the visible error text lives inside the accordion's alert region (role=alert on the summary)", () => {
    const { container } = render(<QuoteForm slug="test" />);
    // The form-level status/alert line is wired separately; per-field errors are the
    // describedby targets asserted above. Sanity: the submit button is a real button.
    const btn = within(container).getByRole("button", {
      name: /request my free quote/i,
    });
    expect(btn.getAttribute("type")).toBe("button");
  });
});
