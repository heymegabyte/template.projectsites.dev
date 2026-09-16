import { useEffect, useState, type ChangeEvent, type FocusEvent } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Send, Check, AlertCircle, X } from 'lucide-react';
import { z } from 'zod';

/**
 * Contact form using React 19's `useActionState` + `useFormStatus` (ideas #51-58),
 * upgraded to a **cinematic, live-validating** surface.
 *
 *   - useActionState consolidates pending / error / success state in one hook
 *   - useFormStatus inside the submit button gets `pending` without prop drilling
 *   - on success, an effect clears the CONTROLLED field state (React 19's native
 *     `<form action>` reset only clears UNCONTROLLED fields, never `value=`-bound ones)
 *   - Zod validates input before POST (BE parity — same shape as the server guard)
 *   - LIVE per-field validity: as the visitor types/blurs, each field shows an
 *     inline green check (valid) / red × (invalid) + `aria-invalid`, so the error
 *     is reachable WITHOUT waiting for a submit (WCAG 3.3.1). Submit is gated on
 *     overall validity, but the affordance is live, never submit-only.
 *
 * Cinematic layer (fully component-scoped, `.pst-` class prefix so it never
 * collides): the card translates + fades in via `@starting-style`, wears a glass
 * hairline that warms to an OKLCH accent glow, and inputs get an accent
 * focus-glow ring on `:focus-visible`. Every transition is DOUBLE-gated behind
 * `prefers-reduced-motion: no-preference` AND `prefers-reduced-data: no-preference`
 * — reduced-motion / Save-Data users get the fully-legible static base state.
 * Colors are theme tokens + `--color-accent` only (light + dark safe).
 *
 * The submission contract is UNCHANGED: the native `<form>` + its field `name`
 * attributes + the `__slug` / `__endpoint` hidden inputs are exactly as before,
 * so the edge-injected app.js form-hijack that POSTs to `/api/contact-form/{slug}`
 * still works. The live affordances only wrap the existing fields.
 *
 * Drop into any `Contact.tsx`-style page. Posts to `/api/contact/{slug}` by
 * default; override via the `endpoint` prop.
 */

const ContactSchema = z.object({
  name:    z.string().trim().min(2, 'Name must be at least 2 characters'),
  email:   z.string().trim().email('Please enter a valid email'),
  phone:   z.string().trim().optional(),
  message: z.string().trim().min(10, 'Message must be at least 10 characters'),
});

type FieldName = keyof z.infer<typeof ContactSchema>;

/* ── Pure validity helpers (BE-parity thresholds mirror ContactSchema). ──────
   Each returns `true` when the trimmed value satisfies the field rule. Kept
   pure (same input → same output, no side-effects) so they're trivially
   unit-testable and reusable. */

/** True when `v` trimmed is at least `min` characters. */
export function isMinLength(v: string, min: number): boolean {
  return v.trim().length >= min;
}

/** True when `v` is a plausible email (trimmed, RFC-ish, no whitespace). */
export function isValidEmail(v: string): boolean {
  const t = v.trim();
  // Pragmatic single-@ check: local + domain + TLD, no spaces. Matches Zod's
  // `.email()` intent for the live affordance; the server re-validates on POST.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
}

/** True when `v` is empty (phone is OPTIONAL) OR has at least 7 digits — the live
 *  affordance never blocks submit on a blank phone. Matches the app.js/edge delivery
 *  contract, which carries `phone` (not the dropped `subject`). */
export function isValidPhone(v: string): boolean {
  const t = v.trim();
  return t === '' || t.replace(/\D/g, '').length >= 7;
}

/** Live validity for a single field, mirroring the Zod thresholds above. */
export function isFieldValid(name: FieldName, value: string): boolean {
  switch (name) {
    case 'name':
      return isMinLength(value, 2);
    case 'email':
      return isValidEmail(value);
    case 'phone':
      return isValidPhone(value);
    case 'message':
      return isMinLength(value, 10);
    default:
      return false;
  }
}

/** The inline hint shown while a touched field is still invalid. */
const HINTS: Record<FieldName, string> = {
  name:    'Name must be at least 2 characters',
  email:   'Please enter a valid email',
  phone:   'Enter a valid phone number',
  message: 'Message must be at least 10 characters',
};

type ContactState =
  | { status: 'idle' }
  | { status: 'success'; message: string }
  | { status: 'error'; fieldErrors?: Partial<Record<FieldName, string>>; message: string };

interface Props {
  endpoint?: string;
  slug?: string;
}

async function submit(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const endpoint =
    (formData.get('__endpoint') as string) ?? `/api/contact/${formData.get('__slug') ?? 'default'}`;

  const parsed = ContactSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[issue.path[0] as string] = issue.message;
    }
    return { status: 'error', fieldErrors, message: 'Please fix the highlighted fields.' };
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: 'Server error' }));
      return { status: 'error', message: data.error ?? 'Could not send. Please try again.' };
    }
    return { status: 'success', message: "Thanks. We'll reply within 24 hours." };
  } catch (err) {
    return {
      status: 'error',
      message: err instanceof Error ? err.message : 'Network error. Please retry.',
    };
  }
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="pst-cf-submit inline-flex items-center justify-center gap-2 w-full px-6 py-3 rounded-lg bg-accent text-[color:var(--color-on-accent)] font-bold min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? (
        <>
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeDashoffset="20" strokeLinecap="round" />
          </svg>
          Sending…
        </>
      ) : (
        <>
          <Send size={16} aria-hidden="true" />
          Send message
        </>
      )}
    </button>
  );
}

export function ContactForm({ endpoint, slug = 'default' }: Props) {
  const [state, formAction] = useActionState<ContactState, FormData>(submit, { status: 'idle' });

  // Live-validation state: the current value + whether the visitor has interacted.
  const [values, setValues] = useState<Record<FieldName, string>>({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [touched, setTouched] = useState<Record<FieldName, boolean>>({
    name: false,
    email: false,
    phone: false,
    message: false,
  });

  // React 19's `<form action>` resets UNCONTROLLED fields on success — but these inputs are
  // CONTROLLED (`value={values[...]}`), which the native reset CANNOT clear. Without this, the
  // visitor's just-sent name/email/message linger in the fields next to the "Thanks…" message,
  // reading as "did it actually send? should I resend?" — friction on the primary conversion
  // surface. On a successful send, clear the controlled values + touched state so the form returns
  // to a clean slate (the success message stays). Keyed on `state.status` so it fires once per send.
  useEffect(() => {
    if (state.status === 'success') {
      setValues({ name: '', email: '', phone: '', message: '' });
      setTouched({ name: false, email: false, phone: false, message: false });
    }
    // Key on the `state` OBJECT (useActionState returns a fresh object per action completion),
    // so a SECOND successful send — where `state.status` stays 'success' — still re-clears.
  }, [state]);

  const onFieldChange = (name: FieldName) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [name]: e.target.value }));
  const onFieldBlur = (name: FieldName) => (_e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setTouched((t) => ({ ...t, [name]: true }));

  const allValid = (Object.keys(values) as FieldName[]).every((n) => isFieldValid(n, values[n]));

  return (
    <form
      action={formAction}
      className="pst-cf glass rounded-2xl p-8 space-y-6"
      noValidate
      aria-busy={state.status === 'idle' ? undefined : false}
    >
      {/* Contract-critical hidden inputs — DO NOT rename/remove: app.js reads these. */}
      <input type="hidden" name="__slug" value={slug} />
      {endpoint && <input type="hidden" name="__endpoint" value={endpoint} />}

      <div className="grid sm:grid-cols-2 gap-6">
        <Field
          label="Name" name="name" type="text" autoComplete="name" required
          state={state} value={values.name} touched={touched.name}
          onChange={onFieldChange('name')} onBlur={onFieldBlur('name')}
        />
        <Field
          label="Email" name="email" type="email" autoComplete="email" inputMode="email" required
          state={state} value={values.email} touched={touched.email}
          onChange={onFieldChange('email')} onBlur={onFieldBlur('email')}
        />
      </div>
      <Field
        label="Phone (optional)" name="phone" type="tel" autoComplete="tel" inputMode="tel"
        state={state} value={values.phone} touched={touched.phone}
        onChange={onFieldChange('phone')} onBlur={onFieldBlur('phone')}
      />
      <Field
        label="Message" name="message" type="textarea" rows={5} required
        state={state} value={values.message} touched={touched.message}
        onChange={onFieldChange('message')} onBlur={onFieldBlur('message')}
      />

      <SubmitButton disabled={!allValid} />

      {state.status === 'success' && (
        <p role="status" className="flex items-center gap-2 text-sm text-success">
          <Check size={16} aria-hidden="true" /> {state.message}
        </p>
      )}
      {state.status === 'error' && (
        <p role="alert" className="flex items-center gap-2 text-sm text-danger">
          <AlertCircle size={16} aria-hidden="true" /> {state.message}
        </p>
      )}
    </form>
  );
}

interface FieldProps {
  label: string;
  name: FieldName;
  type?: 'text' | 'email' | 'tel' | 'textarea';
  autoComplete?: string;
  inputMode?: 'text' | 'email' | 'tel' | 'numeric';
  rows?: number;
  required?: boolean;
  state: ContactState;
  value: string;
  touched: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur: (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

function Field({
  label, name, type = 'text', autoComplete, inputMode, rows, required,
  state, value, touched, onChange, onBlur,
}: FieldProps) {
  const id = `cf-${name}`;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  // Server-side error from the last submit (persists until the field is edited).
  const serverError = state.status === 'error' ? state.fieldErrors?.[name] : undefined;

  // Live validity — only "graded" once the visitor has typed something OR blurred.
  const hasInput = value.length > 0;
  const graded = touched || hasInput;
  const valid = isFieldValid(name, value);
  const showValid = graded && valid;
  const showInvalid = graded && !valid;
  const liveHint = showInvalid ? HINTS[name] : undefined;

  // `aria-invalid` reflects the current live/last-submit state.
  const ariaInvalid = showInvalid || Boolean(serverError);
  // Point `aria-describedby` at whichever message is currently rendered.
  const describedBy =
    [liveHint ? hintId : null, serverError ? errorId : null].filter(Boolean).join(' ') || undefined;

  const baseClass =
    'pst-cf-input w-full bg-surface border border-border rounded-lg px-4 py-3 text-text placeholder-text-subtle min-h-[48px]';
  // A little right padding so the ✓ / × mark never overlaps the caret/text.
  const withMarkPad = graded ? ' pr-11' : '';
  const dataValid = graded ? String(valid) : undefined;

  const commonProps = {
    id,
    name,
    value,
    onChange,
    onBlur,
    required,
    'aria-invalid': ariaInvalid ? ('true' as const) : undefined,
    'aria-describedby': describedBy,
    'data-valid': dataValid,
  };

  return (
    <div>
      <label htmlFor={id} className="pst-cf-label flex items-center gap-1 text-text/80 font-medium mb-2">
        {label}
        {required && (
          <span aria-hidden="true" className="text-danger">
            *
          </span>
        )}
        {required && <span className="sr-only">required</span>}
      </label>

      <div className="relative">
        {type === 'textarea' ? (
          <textarea
            {...commonProps}
            rows={rows ?? 4}
            className={`${baseClass}${withMarkPad} resize-none`}
          />
        ) : (
          <input
            {...commonProps}
            type={type}
            autoComplete={autoComplete}
            inputMode={inputMode}
            className={`${baseClass}${withMarkPad}`}
          />
        )}

        {/* Live validity mark — green ✓ / red ×. `aria-hidden` because the text
            hint below (role=alert) already announces the state to AT. Positioned
            top for textarea (so it hugs the first line), centered for inputs. */}
        {showValid && (
          <span
            aria-hidden="true"
            className={`pst-cf-mark absolute right-3.5 text-success ${type === 'textarea' ? 'top-3.5' : 'top-1/2 -translate-y-1/2'}`}
          >
            <Check size={18} strokeWidth={2.5} />
          </span>
        )}
        {showInvalid && (
          <span
            aria-hidden="true"
            className={`pst-cf-mark absolute right-3.5 text-danger ${type === 'textarea' ? 'top-3.5' : 'top-1/2 -translate-y-1/2'}`}
          >
            <X size={18} strokeWidth={2.5} />
          </span>
        )}
      </div>

      {/* Live hint (while touched + invalid) — reachable without a submit. */}
      {liveHint && (
        <p id={hintId} role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs text-danger">
          <AlertCircle size={13} aria-hidden="true" /> {liveHint}
        </p>
      )}
      {/* Server error from the last submit attempt. */}
      {serverError && !liveHint && (
        <p id={errorId} role="alert" className="mt-1.5 text-xs text-danger">
          {serverError}
        </p>
      )}
    </div>
  );
}

export default ContactForm;
