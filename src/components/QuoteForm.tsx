import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { Send, Check, AlertCircle, Upload, X, ImageIcon } from "lucide-react";
import { z } from "zod";
import { siteSlug } from "../lib/siteSlug";

/**
 * Quote-request form for service businesses (HVAC, plumbing, roofing, remodel,
 * landscaping…). Collects contact + service-address + project details AND lets
 * the customer attach photos of the job — the single biggest accelerator for an
 * accurate contractor quote.
 *
 * Uses controlled inputs + a button `onClick` submit (NOT a native form submit)
 * so the edge-injected app.js form-hijack does not intercept it and drop the
 * photos. Posts JSON to `/api/contact-form/{slug}` with the lead + up to 4
 * downsized photo data-URLs; extra fields degrade gracefully. Theme tokens only.
 */

const QuoteSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name"),
  email: z.string().trim().email("Please enter a valid email"),
  phone: z.string().trim().min(7, "Please enter a phone number"),
  address: z.string().trim().min(4, "Please enter the service address"),
  details: z.string().trim().min(10, "Please describe the work you need"),
});

const MAX_PHOTOS = 4;
const MAX_EDGE = 1280; // px — downscale big phone photos before upload

/** Downscale + JPEG-encode a photo to a compact data URL. */
function toDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      const ctx = c.getContext("2d");
      if (!ctx) return reject(new Error("no canvas"));
      ctx.drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("bad image"));
    };
    img.src = url;
  });
}

interface Props {
  slug?: string;
  endpoint?: string;
}

interface Photo {
  name: string;
  preview: string;
}

export function QuoteForm({ slug, endpoint }: Props) {
  const [fields, setFields] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    details: "",
  });
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const set =
    (k: keyof typeof fields) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setFields((f) => ({ ...f, [k]: e.target.value }));

  async function addFiles(list: FileList | null) {
    if (!list) return;
    const imgs = [...list]
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, MAX_PHOTOS - photos.length);
    const added: Photo[] = [];
    for (const f of imgs) {
      try {
        added.push({ name: f.name, preview: await toDataUrl(f) });
      } catch {
        /* skip an unreadable image */
      }
    }
    setPhotos((p) => [...p, ...added].slice(0, MAX_PHOTOS));
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    void addFiles(e.dataTransfer.files);
  }

  async function onSubmit() {
    const parsed = QuoteSchema.safeParse(fields);
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      for (const i of parsed.error.issues) fe[i.path[0] as string] = i.message;
      setErrors(fe);
      setStatus("error");
      setMessage("Please fix the highlighted fields.");
      return;
    }
    setErrors({});
    setStatus("sending");
    // Resolve to the REAL site slug (siteSlug), never the dead literal 'default' — the Worker does
    // WHERE slug=? so `/api/contact-form/default` 404s. An explicit `slug`/`endpoint` prop still wins.
    const url = endpoint ?? `/api/contact-form/${slug || siteSlug()}`;
    const body = {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      subject: "Quote request",
      message: `Service address: ${parsed.data.address}\n\nProject details: ${parsed.data.details}\n\nPhotos attached: ${photos.length}`,
      photos: photos.map((p) => p.preview),
    };
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("server");
      setStatus("success");
      setMessage(
        "Thanks! We've got your request and will get back to you with a quote within one business day.",
      );
      setFields({ name: "", email: "", phone: "", address: "", details: "" });
      setPhotos([]);
    } catch {
      setStatus("error");
      setMessage(
        "Could not send right now. Please call us or try again in a moment.",
      );
    }
  }

  const field =
    "w-full bg-surface border border-border rounded-lg px-4 py-3 text-text placeholder-text-subtle focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-colors min-h-[44px]";
  const err = (k: string) =>
    errors[k] ? " border-danger/60 ring-1 ring-danger/30" : "";

  return (
    <div className="glass rounded-2xl p-8 space-y-6">
      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="q-name"
            className="block text-text/80 text-sm font-medium mb-2"
          >
            Name <span className="text-danger">*</span>
          </label>
          <input
            id="q-name"
            value={fields.name}
            onChange={set("name")}
            autoComplete="name"
            aria-invalid={errors.name ? "true" : undefined}
            aria-describedby={errors.name ? "q-name-err" : undefined}
            className={field + err("name")}
          />
          {errors.name && (
            <p id="q-name-err" className="mt-1.5 text-xs text-danger">
              {errors.name}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="q-phone"
            className="block text-text/80 text-sm font-medium mb-2"
          >
            Phone <span className="text-danger">*</span>
          </label>
          <input
            id="q-phone"
            value={fields.phone}
            onChange={set("phone")}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            aria-invalid={errors.phone ? "true" : undefined}
            aria-describedby={errors.phone ? "q-phone-err" : undefined}
            className={field + err("phone")}
          />
          {errors.phone && (
            <p id="q-phone-err" className="mt-1.5 text-xs text-danger">
              {errors.phone}
            </p>
          )}
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="q-email"
            className="block text-text/80 text-sm font-medium mb-2"
          >
            Email <span className="text-danger">*</span>
          </label>
          <input
            id="q-email"
            value={fields.email}
            onChange={set("email")}
            type="email"
            inputMode="email"
            autoComplete="email"
            aria-invalid={errors.email ? "true" : undefined}
            aria-describedby={errors.email ? "q-email-err" : undefined}
            className={field + err("email")}
          />
          {errors.email && (
            <p id="q-email-err" className="mt-1.5 text-xs text-danger">
              {errors.email}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="q-address"
            className="block text-text/80 text-sm font-medium mb-2"
          >
            Service address <span className="text-danger">*</span>
          </label>
          <input
            id="q-address"
            value={fields.address}
            onChange={set("address")}
            autoComplete="street-address"
            aria-invalid={errors.address ? "true" : undefined}
            aria-describedby={errors.address ? "q-address-err" : undefined}
            className={field + err("address")}
          />
          {errors.address && (
            <p id="q-address-err" className="mt-1.5 text-xs text-danger">
              {errors.address}
            </p>
          )}
        </div>
      </div>
      <div>
        <label
          htmlFor="q-details"
          className="block text-text/80 text-sm font-medium mb-2"
        >
          What do you need done? <span className="text-danger">*</span>
        </label>
        <textarea
          id="q-details"
          value={fields.details}
          onChange={set("details")}
          rows={5}
          aria-invalid={errors.details ? "true" : undefined}
          aria-describedby={errors.details ? "q-details-err" : undefined}
          className={field + " resize-none" + err("details")}
          placeholder="Describe the project — what's happening, when you'd like it done, and anything we should know."
        />
        {errors.details && (
          <p id="q-details-err" className="mt-1.5 text-xs text-danger">
            {errors.details}
          </p>
        )}
      </div>

      {/* Photo upload — the contractor-quote accelerator */}
      <div>
        <label className="block text-text/80 text-sm font-medium mb-2">
          Add photos{" "}
          <span className="text-text-subtle font-normal">
            (optional — speeds up your quote)
          </span>
        </label>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) =>
            (e.key === "Enter" || e.key === " ") && inputRef.current?.click()
          }
          className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center cursor-pointer transition-colors ${dragging ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"}`}
        >
          <Upload className="h-6 w-6 text-accent" aria-hidden="true" />
          <span className="text-sm text-text-muted">
            Drag photos here, or click to browse ({photos.length}/{MAX_PHOTOS})
          </span>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => void addFiles(e.target.files)}
          />
        </div>
        {photos.length > 0 && (
          <ul className="mt-3 grid grid-cols-4 gap-3">
            {photos.map((p, i) => (
              <li
                key={i}
                className="relative aspect-square rounded-lg overflow-hidden border border-border"
              >
                <img
                  src={p.preview}
                  alt={`Attached photo ${i + 1}`}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() =>
                    setPhotos((ph) => ph.filter((_, j) => j !== i))
                  }
                  aria-label={`Remove photo ${i + 1}`}
                  className="absolute top-1 right-1 h-6 w-6 rounded-full bg-background/80 flex items-center justify-center text-text hover:text-danger"
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
        {photos.length === 0 && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-text-subtle">
            <ImageIcon size={13} aria-hidden="true" /> A few clear photos of the
            area help us quote faster and more accurately.
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => void onSubmit()}
        disabled={status === "sending"}
        className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 rounded-lg bg-accent text-[var(--color-on-accent)] font-bold hover:bg-accent-hover transition-colors min-h-[48px] disabled:opacity-60 disabled:cursor-wait"
      >
        {status === "sending" ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray="60"
                strokeDashoffset="20"
                strokeLinecap="round"
              />
            </svg>
            Sending your request…
          </>
        ) : (
          <>
            <Send size={16} aria-hidden="true" /> Request my free quote
          </>
        )}
      </button>

      {status === "success" && (
        <p
          role="status"
          className="flex items-center gap-2 text-sm text-success"
        >
          <Check size={16} aria-hidden="true" /> {message}
        </p>
      )}
      {status === "error" && message && (
        <p role="alert" className="flex items-center gap-2 text-sm text-danger">
          <AlertCircle size={16} aria-hidden="true" /> {message}
        </p>
      )}
    </div>
  );
}

export default QuoteForm;
