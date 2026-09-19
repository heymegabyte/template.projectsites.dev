import { useState, type FormEvent } from "react";
import { Mail, Check, AlertCircle, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { siteSlug } from "@/lib/siteSlug";

interface Props {
  endpoint?: string;
  /** Site id/slug the Worker attributes the subscriber to. Defaults to the current site's slug. */
  siteId?: string;
  headline?: string;
  description?: string;
  /** Lead-magnet badge ("Free PDF · 28 pages") above the headline. */
  badge?: string;
  className?: string;
  /** Display variant. `inline` is the default boxed section; `bar` is a thin full-width strip. */
  variant?: "inline" | "bar";
}

type Status = "idle" | "submitting" | "success" | "error";

/**
 * Newsletter / lead-magnet signup section.
 *
 * POSTs `{ email, siteId }` to `endpoint` (default `/api/newsletter/subscribe`, the
 * live Worker route — NOT `/api/newsletter`, which has no handler and 404s). `siteId`
 * defaults to the current site's slug (via {@link siteSlug}); the Worker resolves it
 * against `sites.slug`/`id`. Native double-opt-in — the Worker sends the confirm email.
 *
 * The component shows a "Check your inbox" success message; on any failure it shows a
 * plain, reassuring line (never a raw fetch error) and KEEPS the typed email for retry.
 *
 * Cinematic layer (all decorative + motion-gated behind `prefers-reduced-motion`):
 * a **glass + grain** panel with a drifting OKLCH accent **gradient wash**, a
 * `@starting-style` **entrance** + `reveal-on-view` scroll reveal, a polished
 * input that lifts its border to accent on focus with a visible focus ring, and
 * a success state that swaps to an accent **check chip** confirmation. Theme
 * tokens only — legible on light + dark verticals. The form stays fully
 * accessible (label, `aria-*`, `role="status"` / `role="alert"`).
 */
export function Newsletter({
  endpoint = "/api/newsletter/subscribe",
  siteId,
  headline = "Stay in the loop",
  description = "Monthly insights. No spam. Unsubscribe anytime.",
  badge,
  variant = "inline",
  className,
}: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const submitting = status === "submitting";
  const succeeded = status === "success";

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email || submitting) return;
    setStatus("submitting");
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // The Worker's /api/newsletter/subscribe REQUIRES siteId (resolved against sites.slug/id).
        body: JSON.stringify({ email, siteId: siteId || siteSlug() }),
      });
      if (!res.ok) throw new Error("subscribe_failed");
      setStatus("success");
      setMessage("Subscribed. Check your inbox to confirm.");
      setEmail("");
    } catch {
      // Never leak a raw fetch error to a visitor — a plain, reassuring next step. Keep the
      // typed email (only success clears it) so they retry without re-typing.
      setStatus("error");
      setMessage(
        "Couldn’t subscribe just now — please check your email and try again.",
      );
    }
  }

  return (
    <section
      className={cn(
        variant === "bar"
          ? "py-8"
          : "py-20 md:py-24 max-w-container-normal mx-auto px-6",
        className,
      )}
    >
      <div
        className={cn(
          "newsletter-panel grain relative overflow-hidden glass rounded-2xl p-8 md:p-12 reveal-on-view",
          variant === "bar" && "rounded-none p-6",
        )}
      >
        {/* Drifting OKLCH accent wash — decorative, sits behind the content. */}
        <span
          aria-hidden="true"
          className="newsletter-wash pointer-events-none absolute inset-0 -z-[1]"
        />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div
            className="md:max-w-md newsletter-enter"
            style={{ ["--enter-i" as string]: 0 }}
          >
            {badge && (
              <span className="inline-block text-accent text-xs font-mono tracking-widest uppercase mb-3 px-3 py-1 rounded-full border border-accent/20 bg-accent/5">
                {badge}
              </span>
            )}
            <h2 className="text-2xl md:text-3xl font-bold font-heading text-text mb-2">
              {headline}
            </h2>
            <p className="text-text-muted text-sm md:text-base">
              {description}
            </p>
          </div>

          <form
            onSubmit={onSubmit}
            className="newsletter-enter flex flex-col sm:flex-row gap-3 md:flex-1 md:max-w-md"
            style={{ ["--enter-i" as string]: 1 }}
            noValidate
          >
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <div className="newsletter-field relative flex-1">
              <Mail
                size={18}
                aria-hidden="true"
                className="newsletter-field__icon absolute left-4 top-1/2 -translate-y-1/2 text-text-subtle transition-colors"
              />
              <input
                id="newsletter-email"
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={submitting}
                aria-describedby={
                  status === "error" ? "newsletter-error" : undefined
                }
                className="newsletter-input w-full pl-11 pr-4 py-3 rounded-lg bg-surface border border-border text-text placeholder:text-text-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent transition-all min-h-[44px]"
              />
            </div>
            <button
              type="submit"
              disabled={submitting || !email}
              className="newsletter-submit group inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-[var(--color-on-accent)] font-bold px-6 py-3 rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-glow disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 disabled:hover:shadow-none min-h-[44px]"
            >
              {submitting ? (
                <>
                  <Loader2
                    size={16}
                    aria-hidden="true"
                    className="animate-spin"
                  />{" "}
                  Subscribing…
                </>
              ) : (
                <>
                  Subscribe
                  <Send
                    size={16}
                    aria-hidden="true"
                    className="transition-transform duration-base group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </>
              )}
            </button>
          </form>
        </div>

        {succeeded && (
          <p
            className="newsletter-note mt-4 inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-4 py-2 text-sm font-medium text-text"
            role="status"
          >
            <Check size={16} aria-hidden="true" className="text-accent" />{" "}
            {message}
          </p>
        )}
        {status === "error" && (
          <p
            id="newsletter-error"
            className="newsletter-note mt-4 inline-flex items-center gap-2 rounded-full border border-danger/30 bg-danger/10 px-4 py-2 text-sm font-medium text-danger"
            role="alert"
          >
            <AlertCircle size={16} aria-hidden="true" /> {message}
          </p>
        )}
      </div>
    </section>
  );
}

export default Newsletter;
