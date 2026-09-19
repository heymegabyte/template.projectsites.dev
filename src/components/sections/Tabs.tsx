import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { scrubText } from "@/lib/placeholders";

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
  icon?: ReactNode;
}

interface Props {
  tabs: TabItem[];
  eyebrow?: string;
  headline?: string;
  description?: string;
  /** Tab to open by default. Defaults to first. */
  defaultTab?: string;
  className?: string;
}

/**
 * Tabbed content section. Accessible tab pattern (ARIA roles + keyboard nav).
 *
 * Uses lightweight in-component state instead of Radix Tabs to keep bundle
 * size minimal. Supports left/right arrow nav and Home/End jumps per WAI-ARIA.
 */
export function Tabs({
  tabs,
  eyebrow,
  headline,
  description,
  defaultTab,
  className,
}: Props) {
  const [active, setActive] = useState(defaultTab ?? tabs?.[0]?.id);

  function onKeyDown(e: React.KeyboardEvent, idx: number) {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const next = tabs[(idx + 1) % tabs.length];
      setActive(next.id);
      document.getElementById(`tab-${next.id}`)?.focus();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const next = tabs[(idx - 1 + tabs.length) % tabs.length];
      setActive(next.id);
      document.getElementById(`tab-${next.id}`)?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(tabs[0].id);
      document.getElementById(`tab-${tabs[0].id}`)?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      const last = tabs[tabs.length - 1];
      setActive(last.id);
      document.getElementById(`tab-${last.id}`)?.focus();
    }
  }

  // Self-hide when there are no tabs (an empty tablist + no panels is a broken, keyboard-trapping
  // shell). Hooks above run unconditionally, so this early return is Rules-of-Hooks-safe.
  if (!tabs || tabs.length === 0) return null;

  return (
    <section
      className={cn(
        "py-24 md:py-32 max-w-container-wide mx-auto px-6",
        className,
      )}
    >
      {(eyebrow || headline) && (
        <div className="text-center mb-12 reveal-on-view">
          {eyebrow && (
            <span className="text-accent text-sm font-mono tracking-widest uppercase">
              {eyebrow}
            </span>
          )}
          {headline && (
            <h2 className="text-3xl md:text-5xl font-bold font-heading mt-4 mb-4 text-text">
              {headline}
            </h2>
          )}
          {description && (
            <p className="text-text-muted max-w-2xl mx-auto">{description}</p>
          )}
        </div>
      )}

      <div className="card-tactile overflow-hidden">
        <div
          role="tablist"
          className="flex flex-wrap gap-1 p-2 border-b border-border bg-surface-elevated"
          aria-label={headline ?? "Tabbed sections"}
        >
          {tabs.map((tab, i) => {
            const selected = tab.id === active;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                role="tab"
                aria-selected={selected}
                aria-controls={`panel-${tab.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(tab.id)}
                onKeyDown={(e) => onKeyDown(e, i)}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-colors min-h-[44px]",
                  selected
                    ? "bg-accent text-[var(--color-on-accent)]"
                    : "text-text-muted hover:text-text hover:bg-surface",
                )}
              >
                {tab.icon}
                {scrubText(tab.label)}
              </button>
            );
          })}
        </div>

        {tabs.map((tab) => (
          <div
            key={tab.id}
            id={`panel-${tab.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${tab.id}`}
            hidden={tab.id !== active}
            className="p-6 md:p-10"
          >
            {tab.content}
          </div>
        ))}
      </div>
    </section>
  );
}

export default Tabs;
