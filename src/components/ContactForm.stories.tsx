import type { Meta, StoryObj } from '@storybook/react';
import { ContactForm } from './ContactForm';

/**
 * `ContactForm` — a cinematic, **live-validating** contact form built on React 19's
 * `useActionState` + `useFormStatus`. The glass card **fades + rises in** via
 * `@starting-style`, its hairline **warms to an OKLCH accent glow** when a field
 * is focused, and each input grows an **accent focus-glow ring** on `:focus-visible`.
 *
 * As the visitor types or blurs Name / Email / Subject / Message, each field shows
 * an inline **green ✓ (valid) / red × (invalid)** plus `aria-invalid` and a
 * reachable hint — validation is LIVE, never submit-only (WCAG 3.3.1). The submit
 * button stays disabled until every field is valid. All motion is DOUBLE-gated
 * behind `prefers-reduced-motion` AND `prefers-reduced-data`, and every color is a
 * theme token, so it's legible + on-brand on light AND dark verticals.
 *
 * The submission contract is unchanged: it keeps the native `<form>`, the field
 * `name` attributes, and the `__slug` / `__endpoint` hidden inputs the edge
 * `app.js` hijack reads to POST `/api/contact-form/{slug}`. In Storybook there's
 * no worker, so a real submit simply exercises the human-readable error path.
 */
const meta = {
  title: 'Components/ContactForm',
  component: ContactForm,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div className="max-w-2xl mx-auto">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ContactForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Standard render bound to a realistic tenant slug. Focus a field to see the
 *  accent focus-glow ring; type to watch the live ✓ / × marks appear. */
export const Default: Story = {
  args: {
    slug: 'summit-hvac',
  },
};

/**
 * Points at an explicit `endpoint`, overriding the `/api/contact-form/{slug}` default
 * — useful for a preview environment or a mock server.
 */
export const CustomEndpoint: Story = {
  args: {
    slug: 'summit-hvac',
    endpoint: 'https://example.com/mock/contact',
  },
};

/**
 * On a light vertical — the glass, accent focus-glow, and ✓/× validity tints all
 * re-derive from the theme tokens, staying WCAG-legible with zero hardcoded colors.
 */
export const OnLightTheme: Story = {
  args: { slug: 'summit-hvac' },
  decorators: [
    (Story) => (
      <div data-theme="light" className="bg-background p-6 rounded-2xl">
        <Story />
      </div>
    ),
  ],
};

/**
 * Exercises the LIVE validation affordance. Type an obviously-bad email (e.g.
 * `not-an-email`) and a single-character name, then click elsewhere to blur: the
 * red × marks appear, `aria-invalid="true"` is set, and the inline hints ("Please
 * enter a valid email", "Name must be at least 2 characters") render WITHOUT a
 * submit — proving the error is reachable live (WCAG 3.3.1). The **Send message**
 * button stays disabled until every field is valid; complete all four correctly
 * to watch each × flip to a green ✓ and the button enable.
 */
export const WithValidationErrors: Story = {
  args: { slug: 'summit-hvac' },
};
