import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { Newsletter } from "./Newsletter";

/**
 * Newsletter (the wired sections/ component) — a primary conversion surface. Locks two
 * contracts that shipped broken:
 *   1. It POSTs to `/api/newsletter/subscribe` (the live Worker route) with BOTH `email`
 *      AND the required `siteId`. REGRESSION: the old default posted `{email}` to
 *      `/api/newsletter` — a route with NO handler (404), and even the right route 400s
 *      without `siteId`. Every real subscribe silently failed.
 *   2. A failure shows plain, reassuring copy (never a raw fetch error) and KEEPS the typed
 *      email so the visitor retries without re-typing.
 */

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Newsletter — posts to the REAL subscribe endpoint with the required siteId", () => {
  it("fill → subscribe → one POST to /api/newsletter/subscribe with { email, siteId } + success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ data: { subscribed: true } }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
      ),
    );
    render(<Newsletter siteId="vitos-salon" />);
    const email = screen.getByLabelText(/email address/i) as HTMLInputElement;
    fireEvent.change(email, { target: { value: "jane@example.com" } });

    const submit = screen.getByRole("button", { name: /subscribe/i });
    await waitFor(() => expect(submit).not.toBeDisabled());
    fireEvent.click(submit);

    await waitFor(() => expect(screen.getByRole("status")).toBeInTheDocument());
    expect(screen.getByRole("status").textContent).toMatch(/check your inbox/i);

    expect(fetch).toHaveBeenCalledTimes(1);
    const mock = fetch as unknown as ReturnType<typeof vi.fn>;
    // REGRESSION: must be the real route, NOT the handler-less `/api/newsletter`.
    expect(mock.mock.calls[0][0]).toBe("/api/newsletter/subscribe");
    const body = JSON.parse(
      (mock.mock.calls[0][1] as RequestInit).body as string,
    );
    expect(body).toEqual({ email: "jane@example.com", siteId: "vitos-salon" }); // siteId REQUIRED by the Worker
    expect(email).toHaveValue(""); // success clears the field
  });
});

describe("Newsletter — a failure shows friendly copy, never raw error jargon", () => {
  it("a rejected fetch shows a plain retry message + keeps the email for retry", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("Failed to fetch");
      }),
    );
    render(<Newsletter siteId="vitos-salon" />);
    const email = screen.getByLabelText(/email address/i) as HTMLInputElement;
    fireEvent.change(email, { target: { value: "jane@example.com" } });

    const submit = screen.getByRole("button", { name: /subscribe/i });
    await waitFor(() => expect(submit).not.toBeDisabled());
    fireEvent.click(submit);

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toMatch(/try again/i); // friendly, guides the visitor
    expect(alert.textContent).not.toMatch(/failed to fetch/i); // never leaks raw Error.message
    expect(email).toHaveValue("jane@example.com"); // kept — retry without re-typing
  });
});
