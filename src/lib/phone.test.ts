import { describe, it, expect } from "vitest";
import { telDigits, telHref } from "./phone";

/**
 * Click-to-call integrity — a `tel:` control must dial a real number or not exist. Locks the
 * shared guard the 4 weak consumers (StickyActionBar / Footer / ExitIntentOffer / ServiceMenu)
 * now route through: a dialable `tel:` for a real phone, '' for anything else (so no dead button).
 */
describe('telDigits — dialable core, or "" when not a real 7+ digit phone', () => {
  it("keeps + and digits for real numbers", () => {
    expect(telDigits("(415) 555-0123")).toBe("4155550123");
    expect(telDigits("+1 (415) 555-0123")).toBe("+14155550123");
    expect(telDigits("415.555.0123")).toBe("4155550123");
    expect(telDigits("555-1234")).toBe("5551234"); // 7 digits = the local minimum
  });

  it('returns "" for the dead-control cases', () => {
    expect(telDigits("Call for hours")).toBe(""); // 0 digits
    expect(telDigits("555-CALL")).toBe(""); // 3 digits < 7
    expect(telDigits("{BUSINESS_PHONE}")).toBe(""); // unfilled token
    expect(telDigits("")).toBe("");
    expect(telDigits(undefined)).toBe("");
    expect(telDigits("123456")).toBe(""); // 6 digits < 7
  });
});

describe('telHref — a tel: url for a real phone, else "" (gate the Call control on it)', () => {
  it("prefixes tel: for a dialable number", () => {
    expect(telHref("(415) 555-0123")).toBe("tel:4155550123");
    expect(telHref("+1 415 555 0123")).toBe("tel:+14155550123");
  });

  it('returns "" so the caller renders NO dead Call control', () => {
    expect(telHref("n/a")).toBe("");
    expect(telHref("{PHONE}")).toBe("");
    expect(telHref(undefined)).toBe("");
    // The exact regression these routes fixed: a truthy-but-digitless phone must NOT yield "tel:".
    expect(telHref("Call for hours")).not.toBe("tel:");
    expect(telHref("Call for hours")).toBe("");
  });
});
