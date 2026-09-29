# Component Catalog

Every section component in `src/components/sections/`, with props, examples, and decision guidance.

## At a glance

| Component | Use case | Width | JSON-LD emitted |
| --- | --- | --- | --- |
| [HeroCenter](#herocenter) | Default hero, brand-forward | container-wide | — |
| [HeroSplit](#herosplit) | Hero with feature image | container-wide | — |
| [KineticHeadline](#kinetichaedline) | Scroll-driven headline | inline | — |
| [BentoGrid](#bentogrid) | Asymmetric feature grid | container-wide | — |
| [Stats](#stats) | Animated number rollup | container-wide | — |
| [LogoCloud](#logocloud) | Partner / client logos | container-wide | — |
| [Marquee](#marquee) | Generic infinite scroller | full | — |
| [ProcessSteps](#processsteps) | Numbered "how it works" | container-wide | — |
| [FeatureSplit](#featuresplit) | Image-left or image-right | container-wide | — |
| [Pricing](#pricing) | Tier table with toggle | container-wide | Product per tier |
| [Comparison](#comparison) | Feature comparison table | container-wide | — |
| [FAQ](#faq) | Disclosure accordion | container-prose | FAQPage |
| [CTASection](#ctasection) | Closer block | container-normal | — |
| [TeamGrid](#teamgrid) | Member cards | container-wide | Person[] |
| [BlogList](#bloglist) | Featured + grid posts | container-wide | — |
| [CaseStudyGrid](#casestudygrid) | Work samples with metrics | container-wide | — |
| [AnnouncementBanner](#announcementbanner) | Dismissible promo / notice bar | full | — |
| [WebGLHeroBackdrop](#webglherobackdrop) | Shader hero backdrop (decorative) | backdrop | — |
| [CinematicProcess](#cinematicprocess) | Pinned scroll-scrubbed process chapters | container-wide | — |
| [Spotlight](#spotlight) | Single dominant feature focal point | container-wide | — |
| [MetricRow](#metricrow) | Metric cards with delta chips | container-wide | — |
| [Quote](#quote) | Editorial pull-quote | container-prose | Quotation |
| [SocialProof](#socialproof) | Live-count proof chip | container-normal | — |
| [Timeline](#timeline) | Dated history milestones | container-normal | — |
| [TeamRoles](#teamroles) | Role-based team cards | container-wide | — |
| [Tabs](#tabs) | WAI-ARIA tabbed content | container-wide | — |
| [CodeBlock](#codeblock) | Code snippet with copy button | inline | — |
| [Demo](#demo) | Click-to-activate iframe embed | container-wide | — |
| [VideoEmbed](#videoembed) | Poster-first video facade | inline | — |
| [PageAudio](#pageaudio) | AI "listen to this page" player | container-wide | — |
| [Newsletter](#newsletter) | Signup panel / bar (live Worker POST) | container-normal | — |
| [LocationMap](#locationmap) | Map + hours "where to find us" band | container-wide | — |
| [Menu](#menu) | Restaurant / café food menu | container-wide | Menu |
| [ServiceMenu](#servicemenu) | Services + prices + durations | container-wide | OfferCatalog |
| [DonationTiers](#donationtiers) | Nonprofit giving tiers | container-wide | NGO + DonateAction |
| [FeaturedCollection](#featuredcollection) | Retail featured products | container-wide | ItemList |

All section components:
- Accept `eyebrow?: string`, `headline?: string`, `description?: string`, `className?: string`
- Read tokens through Tailwind utilities (never hardcode colors)
- Respect `prefers-reduced-motion`
- Reveal on scroll via `.reveal-on-view` class
- Live in `src/components/sections/`; re-export from `index.ts`

Import:

```tsx
import {
  HeroCenter, HeroSplit, KineticHeadline, WebGLHeroBackdrop,
  BentoGrid, Stats, LogoCloud, Marquee,
  ProcessSteps, CinematicProcess, FeatureSplit, Spotlight, MetricRow,
  Pricing, Comparison, FAQ, Quote, SocialProof, Timeline,
  CTASection, TeamGrid, TeamRoles, BlogList, CaseStudyGrid,
  AnnouncementBanner, Tabs, CodeBlock, Demo, VideoEmbed, PageAudio,
  Newsletter, LocationMap,
  Menu, ServiceMenu, DonationTiers, FeaturedCollection,
} from '@/components/sections';
```

---

## HeroCenter

Centered cinematic hero with floating orb backdrops, grid overlay, and `KineticHeadline` for the H1.

```tsx
<HeroCenter
  eyebrow="Family-owned since 1987"
  headline="Fresh from the oven"
  subheadline="Sourdough, pastries, and seasonal cakes baked daily in Anchorage."
  primary={{ label: 'Order online', href: '/order' }}
  secondary={{ label: 'View menu', href: '/menu' }}
  trustBadges={[
    { icon: 'star', label: '4.9 / 5 on Google' },
    { icon: 'shield', label: 'Cottage-licensed' },
    { icon: 'award', label: '"Best of Anchorage" 2024' },
  ]}
/>
```

### Props

| Prop | Type | Required | Default |
| --- | --- | --- | --- |
| `eyebrow` | string | no | — |
| `headline` | string | **yes** | — |
| `subheadline` | string | no | — |
| `primary` | `{label, href}` | no | — |
| `secondary` | `{label, href}` | no | — |
| `trustBadges` | `{icon?, label}[]` | no | — |
| `className` | string | no | — |

`icon` enum: `'star' | 'shield' | 'award'`.

---

## HeroSplit

Two-column hero: copy left, image right. Reverses on `imagePosition: 'left'`.

```tsx
<HeroSplit
  eyebrow="Boutique salon"
  headline="Color that holds. Cuts that move."
  subheadline="Independent stylists. Clean-beauty products only."
  primary={{ label: 'Book now', href: '/book' }}
  secondary={{ label: 'See gallery', href: '/gallery' }}
  image={{ src: '/hero-salon.jpg', alt: 'Stylist coloring a client at the chair' }}
  trustBadges={[{ icon: 'star', label: '4.9 / 5 Yelp' }]}
/>
```

Same props as `HeroCenter` plus required `image: { src, alt }`.

---

## KineticHeadline

Scroll-driven display headline. Variable-font weight + letter-spacing animate as the user scrolls. Falls back to a JS staggered word-reveal on browsers without `animation-timeline`.

```tsx
<KineticHeadline
  text="Build it loud"
  eyebrow="Agency"
  as="h1"
/>
```

Used internally by `HeroCenter`. Use standalone for inline hero treatments.

| Prop | Type | Default |
| --- | --- | --- |
| `text` | string | — |
| `eyebrow` | string | — |
| `as` | `'h1' \| 'h2' \| 'h3'` | `'h1'` |
| `className` | string | — |

---

## BentoGrid

Apple-WWDC asymmetric 12-column grid with subgrid alignment. First tile auto-promotes to hero cell (`span: 'lg' + tall`).

```tsx
<BentoGrid
  eyebrow="Why choose us"
  headline="Engineered for trust"
  description="Every feature designed to remove a customer-side concern."
  tiles={[
    { id: 't1', title: 'Same-day delivery',  description: 'Order by 2pm, in your hands by 6pm.', span: 'lg', tall: true, accent: true, icon: <Shield /> },
    { id: 't2', title: 'Best price match',   description: 'Find it cheaper? We refund the difference.', span: 'sm', icon: <Zap /> },
    { id: 't3', title: 'Lifetime warranty',  description: 'Defect? We replace it, no questions.',       span: 'sm', icon: <Award /> },
    { id: 't4', title: 'Free returns',       description: '30 days, prepaid label included.',           span: 'md', icon: <Users /> },
    { id: 't5', title: 'Carbon-neutral',     description: 'All shipping offset since 2022.',            span: 'md', icon: <Star /> },
  ]}
/>
```

### `BentoTile` shape

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | React key |
| `title` | string | — |
| `description` | string | optional |
| `icon` | ReactNode | optional |
| `image` | string | optional bg image |
| `imageAlt` | string | required if `image` set |
| `href` | string | makes the tile a link |
| `span` | `'sm' \| 'md' \| 'lg' \| 'xl'` | desktop span: 4/6/8/12 cols |
| `tall` | boolean | double row span |
| `accent` | boolean | gradient-bg highlight |

Mobile: all tiles collapse to single-column.

---

## Stats

Animated count-up rollup. Counts trigger on scroll-into-view; respect reduced motion.

```tsx
<Stats
  eyebrow="By the numbers"
  headline="500+ projects shipped"
  stats={[
    { value: 500, suffix: '+',  label: 'Projects shipped',  caption: 'Across 14 industries' },
    { value: 98,  suffix: '%',  label: 'Customer retention' },
    { value: 24,  suffix: '/7', label: 'Support coverage' },
    { value: 10,  suffix: 'yr', label: 'In business' },
  ]}
/>
```

| Stat field | Type | Notes |
| --- | --- | --- |
| `value` | number | The count-up target |
| `suffix` | string | `+`, `%`, `/7`, `yr` etc. |
| `label` | string | Below the number |
| `caption` | string | Optional smaller tertiary line |

---

## LogoCloud

Logo strip. Two variants: `marquee` (infinite scroll) or `grid` (responsive grid).

```tsx
<LogoCloud
  eyebrow="Trusted by"
  variant="marquee"
  logos={[
    { name: 'Acme', src: '/logos/acme.svg', href: 'https://acme.com' },
    { name: 'Globex', src: '/logos/globex.svg' },
    { name: 'Initech' },                                       // wordmark fallback if no src
  ]}
/>
```

`src` missing → renders the company name as a styled wordmark — no broken images.

---

## Marquee

Generic infinite scroller. Pauses on hover. Respects reduced motion (animation disabled).

```tsx
<Marquee
  speed="slow"               // 'slow' | 'normal' | 'fast'
  pauseOnHover
  items={['Free shipping', '30-day returns', 'Carbon-neutral'].map(s =>
    <span className="text-text font-medium px-6">{s}</span>
  )}
/>
```

---

## ProcessSteps

Numbered "how it works" cards. First step gets a large `01`, second `02`, etc.

```tsx
<ProcessSteps
  eyebrow="How it works"
  headline="Three steps to launch"
  steps={[
    { title: 'Brief',   description: '30-min discovery call to scope the work.',   icon: <MessageSquare /> },
    { title: 'Design',  description: 'Wireframes Mon, hi-fi by Fri.',              icon: <Sparkles /> },
    { title: 'Launch',  description: 'Deploy + handoff in week 4.',                icon: <Rocket /> },
  ]}
/>
```

---

## FeatureSplit

Image-left or image-right copy block.

```tsx
<FeatureSplit
  eyebrow="About us"
  headline="Family bakery, third generation"
  description="Started by my grandfather in 1987. We've kept the sourdough starter alive ever since."
  bullets={[
    'Single-origin flours from local mills',
    'Filtered water, sea salt, time',
    'No commercial yeast, no shortcuts',
  ]}
  cta={{ label: 'Visit the bakery', href: '/visit' }}
  image={{ src: '/family.jpg', alt: 'Three generations of bakers at the counter' }}
  imagePosition="right"
/>
```

Replace `image` with `visual` (any ReactNode) for custom content — a chart, demo, code block, etc.

---

## Pricing

Three-tier pricing with monthly/yearly toggle. Emits a `Product` JSON-LD node per tier.

```tsx
<Pricing
  eyebrow="Pricing"
  headline="Pay for what you use"
  description="No seat tax. No surprise renewals."
  tiers={[
    { id: 'starter', name: 'Starter', description: 'Solo founders, weekend projects.',
      monthly: 19, yearly: 180,
      features: ['1 project', '1 user', 'Email support'] },
    { id: 'pro', name: 'Pro', description: 'Growing teams.',
      monthly: 99, yearly: 950, featured: true, badge: 'Most popular',
      features: ['Unlimited projects', '10 users', 'Priority support', 'Custom domain'] },
    { id: 'ent', name: 'Enterprise', description: 'SOC2-bound orgs.',
      monthly: 499, yearly: 4790,
      features: ['Unlimited users', 'SSO', 'Dedicated support', 'SLA', 'Onboarding'] },
  ]}
/>
```

`featured: true` adds the gradient highlight + glow shadow. `badge: '...'` adds the floating sparkle chip.

`showToggle: false` hides the monthly/yearly switch (use for one-price products).

---

## Comparison

Feature comparison table. Cell values: `true` → green check, `false` → grey X, `'partial'` → amber dash, string → renders verbatim.

```tsx
<Comparison
  eyebrow="Compare"
  headline="What's included"
  columns={['Starter', 'Pro', 'Enterprise']}
  highlightColumn={1}
  rows={[
    { feature: 'Projects',          values: [true, true, true] },
    { feature: 'Team members',      values: ['1', '10', 'Unlimited'] },
    { feature: 'API access',        values: [false, 'partial', true] },
    { feature: 'Custom domain',     values: [false, true, true] },
    { feature: 'SSO + audit log',   values: [false, false, true], description: 'SAML, SCIM, audit log retention 90d' },
  ]}
/>
```

---

## FAQ

Disclosure widget. Emits `FAQPage` JSON-LD — **the highest AI-citation rate of any schema** across ChatGPT / Perplexity / Google AI Overviews.

```tsx
<FAQ
  eyebrow="Questions"
  headline="Frequently asked"
  items={[
    { question: 'How long does setup take?',
      answer: 'Most teams are live within 48 hours of signup. Enterprise deployments take 5–7 business days with white-glove onboarding.' },
    { question: 'Can I cancel anytime?',
      answer: 'Yes. Cancel from your billing page; access continues through the end of the billing period.' },
    { question: 'Do you offer refunds?',
      answer: 'We refund unused months on annual plans. Monthly plans are non-refundable but cancel without penalty.' },
  ]}
  exclusive={false}              // true = accordion (single-open), false = disclosure (multi-open)
/>
```

**Always include FAQ on content pages.** The JSON-LD significantly increases visibility in AI search results.

---

## CTASection

Closing call-to-action block. Two tones: `emphatic` (gradient bg + grain) or `quiet` (tactile card).

```tsx
<CTASection
  eyebrow="Ready?"
  headline="Let's build something worth shipping"
  description="15-minute call. Free quote within 24 hours. No sales pressure."
  primary={{ label: 'Book a call', href: '/contact' }}
  secondary={{ label: 'See pricing', href: '/pricing' }}
  tone="emphatic"
/>
```

---

## TeamGrid

Member cards. Each card emits a `Person` JSON-LD node.

```tsx
<TeamGrid
  eyebrow="Team"
  headline="The humans behind the work"
  members={[
    {
      name: 'Maria Chen', role: 'Founder & CEO',
      bio: 'Previously product at Stripe. Stanford CS.',
      photo: '/team/maria.jpg',
      links: [{ label: 'LinkedIn', href: 'https://linkedin.com/in/mariachen' }],
    },
    {
      name: 'James Park', role: 'Head of Design',
      bio: 'Ex-Apple HI team. Bay Area.',
      photo: '/team/james.jpg',
    },
  ]}
/>
```

Photo missing → initials chip in accent color.

---

## BlogList

Featured-post hero + grid of recent posts.

```tsx
<BlogList
  eyebrow="Writing"
  headline="Notes from the field"
  basePath="/blog"
  posts={[
    {
      slug: 'shipping-velocity', title: 'How we 10x'd shipping velocity',
      excerpt: 'Six weeks. Three engineers. One bet on AI-assisted code review.',
      date: '2026-05-12', author: 'Maria Chen', category: 'Engineering',
      cover: '/blog/velocity.jpg', readMinutes: 6,
    },
    // …
  ]}
/>
```

First post auto-promotes to hero card (two-col layout, larger cover).

---

## CaseStudyGrid

Portfolio of work with up-to-3 metrics per study.

```tsx
<CaseStudyGrid
  eyebrow="Work"
  headline="Selected case studies"
  basePath="/case-studies"
  studies={[
    {
      slug: 'acme-redesign', title: 'Acme — Conversion rate +34%',
      client: 'Acme Inc.', industry: 'B2B SaaS',
      summary: 'Reworked onboarding flow. Cut activation steps from 8 to 3.',
      cover: '/case/acme.jpg',
      metrics: [
        { value: '+34%', label: 'CR uplift' },
        { value: '−62%', label: 'Onboarding time' },
        { value: '4.8★', label: 'CSAT' },
      ],
    },
  ]}
/>
```

---

## AnnouncementBanner

Dismissible promo / notice bar mounted above the `Header` on every page — sale, holiday hours, launch. Dismissal persists per banner `id` (localStorage, private-mode safe). Message scrubs to hidden; the CTA renders only with a real label AND href.

```tsx
<AnnouncementBanner
  id="summer-sale-2026"
  message="Summer sale — 20% off all services through August 31"
  cta={{ label: 'Book now', href: '/book' }}
  tone="accent"                 // 'accent' | 'success' | 'warning' | 'danger' | 'info'
  dismissible
/>
```

---

## WebGLHeroBackdrop

Decorative brand-tinted animated hero backdrop — 16 hand-written GLSL fragment-shader variants (aurora, waves, mesh, and more) selected by `variant`. Purely decorative (`aria-hidden`), gated behind `prefers-reduced-motion` / `prefers-reduced-data`, and falls back to a static gradient without WebGL. Use `backdropForPreset(theme)` to pick the variant matching a brand preset.

```tsx
<div className="relative">
  <WebGLHeroBackdrop variant="aurora" />
  <HeroCenter headline="Fresh from the oven" /* … */ />
</div>
```

---

## CinematicProcess

Pinned, scroll-scrubbed "chapters" scrollytelling of the process steps (Apple/Awwwards tier). Same data shape as `ProcessSteps` — prefer this on cinematic pages, `ProcessSteps` for calm ones. Fully reduced-motion safe (renders as a static stacked list).

```tsx
<CinematicProcess
  eyebrow="How it works"
  headline="From brief to launch"
  steps={[
    { title: 'Brief',  description: '30-min discovery call to scope the work.',  icon: <MessageSquare /> },
    { title: 'Design', description: 'Wireframes Monday, hi-fi by Friday.',       icon: <Sparkles /> },
    { title: 'Launch', description: 'Deploy + handoff in week 4.',               icon: <Rocket /> },
  ]}
/>
```

---

## Spotlight

Single dominant product/feature focal point — one item commanding ~80% of the section weight. Replaces a `BentoGrid` when one thing must own the section. Variants: `split` (image beside copy, `imagePosition: 'left' | 'right'`) or `overlay` (copy floated over a full-bleed visual with a contrast scrim).

```tsx
<Spotlight
  eyebrow="Flagship"
  headline="One platform for the whole shop"
  description="Scheduling, invoicing, and inventory in a single dashboard."
  badge="New"
  features={['Same-day setup', 'Works offline', 'Free migration']}
  primary={{ label: 'Start free', href: '/signup' }}
  secondary={{ label: 'See pricing', href: '/pricing' }}
  visual={{ src: '/product-dashboard.jpg', alt: 'Dashboard overview' }}
  variant="split"
  imagePosition="right"
/>
```

`visual` also accepts any ReactNode (chart, demo, code block). Token copy/features/CTAs/images are scrubbed — a `{TOKEN}` CTA or image never renders.

---

## MetricRow

Four metric cards with directional delta chips — "before vs after" or quarter-over-quarter movement. Numbers are factual claims: only verified metrics. `goodIs` sets polarity: for error rate / latency use `goodIs: 'down'` so a downward delta reads as success green.

```tsx
<MetricRow
  eyebrow="Results"
  headline="Ninety days after switching"
  metrics={[
    { value: 34,  suffix: '%',  label: 'Conversion uplift', delta: { value: '+34% QoQ', direction: 'up' } },
    { value: 120, suffix: 'ms', label: 'p95 latency',       delta: { value: '−48%', direction: 'down', goodIs: 'down' } },
    { value: 4.9, label: 'Average rating', caption: '312 reviews' },
    { value: 12,  suffix: 'hr', label: 'Avg. turnaround' },
  ]}
/>
```

---

## Quote

Single editorial pull-quote — larger than testimonials, for the one high-impact quote that converts. Emits a `Quotation` JSON-LD node (high AI-citation surface) fed ONLY scrubbed copy — a token text self-hides the whole section, DOM and JSON-LD both.

```tsx
<Quote
  eyebrow="What clients say"
  text="The rebuild paid for itself inside a quarter."
  author="Dana Ortiz"
  role="Owner, Ortiz & Co."
  photo="/quotes/dana.jpg"
  source={{ name: 'Verified Google review', href: 'https://g.co/…' }}
/>
```

---

## SocialProof

Live-count proof chip ("342 customers active right now") with a pulsing dot. HONESTY-GUARDED: the count must be real — pass `perSecond: { min: 0, max: 0 }` (or omit) for a static verified number; never fabricate activity.

```tsx
<SocialProof
  initial={1284}
  label="orders delivered this year"
  caption="Updated nightly from our POS"
  tone="success"
/>
```

---

## Timeline

Historical timeline — vertical rail (scroll-drawn accent) or horizontal cards. Dated milestones with optional links and PRIMARY-SOURCE photos only (Wikimedia / LoC / archive material — never AI or stock beside a dated event; blank entry > faked entry). Every event field including `year` is scrubbed — a `{TIMELINE_N_YEAR}` token never reaches the `<time>` element.

```tsx
<Timeline
  eyebrow="Our history"
  headline="Four decades of service"
  orientation="vertical"        // 'vertical' | 'horizontal'
  events={[
    { year: '1987', title: 'Founded', description: 'Opened the first shop on Main St.' },
    { year: '2004', title: 'Second location', description: 'Expanded to the north side.',
      link: { href: '/about', label: 'Read the story' } },
  ]}
/>
```

---

## TeamRoles

Role-based "people behind the work" section — title + description cards with position-based icons. The credibility section for businesses that can't (or shouldn't) name individuals; use `TeamGrid` when real named people are verified.

```tsx
<TeamRoles
  eyebrow="Who does the work"
  headline="A licensed crew on every job"
  roles={[
    { title: 'Master electrician', description: 'Every job is supervised by a state-licensed master.' },
    { title: 'Dedicated estimator', description: 'One point of contact from quote to invoice.' },
  ]}
/>
```

---

## Tabs

Hand-rolled WAI-ARIA tabbed section for segmenting parallel content — audiences, plans, locations. Full keyboard support (arrow keys, Home/End); self-hides when `tabs` is empty.

```tsx
<Tabs
  eyebrow="Who it's for"
  headline="Built for your side of the counter"
  defaultTab="owners"
  tabs={[
    { id: 'owners',   label: 'Owners',   content: <p>Run the shop from your phone.</p> },
    { id: 'managers', label: 'Managers', content: <p>Schedules and payroll in one place.</p> },
  ]}
/>
```

---

## CodeBlock

Developer-audience code snippet with filename toolbar, copy button, optional line highlighting and line numbers. For docs / technical marketing pages.

```tsx
<CodeBlock
  filename="deploy.ts"
  language="ts"
  highlightLines={[3]}
  code={`import { deploy } from '@acme/sdk';\n\nawait deploy({ site: 'my-shop' });`}
/>
```

---

## Demo

Click-to-activate iframe embed for product demos, playgrounds, calculators, Storybook, Cal.com — poster first, so the heavy iframe never loads until the visitor asks for it.

```tsx
<Demo
  eyebrow="Try it"
  headline="Play with the live demo"
  src="https://demo.example.com"
  title="Interactive product demo"
  poster={{ src: '/demo-poster.jpg', alt: 'Demo dashboard preview' }}
  aspect="16 / 10"
  externalLink
/>
```

---

## VideoEmbed

Privacy + perf-friendly video: poster until click, then YouTube-nocookie / Vimeo / Loom iframe or native `<video>` for `.mp4`. `poster` is required — it prevents a ~200KB iframe preload on initial paint. Provider auto-detected from the URL.

```tsx
<VideoEmbed
  src="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  poster={{ src: '/video-poster.jpg', alt: 'Shop tour opening frame' }}
  caption="A 90-second tour of the workshop"
/>
```

---

## PageAudio

AI-native "listen to this page" — POSTs the page text to `/api/page-audio/:slug` for an AI summary spoken via TTS, with a compact player UI. Auto-extracts page copy; pass `text` for a curated read.

```tsx
<PageAudio label="Listen to this page" />
```

---

## Newsletter

Newsletter / lead-magnet signup — POSTs `{email, siteId}` to the live Worker route `/api/newsletter/subscribe` (double-opt-in). Failure keeps the typed email and shows a plain retry line; success swaps to a check-chip confirmation.

```tsx
<Newsletter
  headline="Get the monthly specials"
  description="One email a month. Unsubscribe anytime."
  badge="Free PDF · 28 pages"
  variant="inline"              // 'inline' boxed panel | 'bar' thin strip
/>
```

---

## LocationMap

"Where to find us" band: keyless Google Maps embed of the business address + weekly hours grid with a live "Open now" state. Defaults to the real `brand.business` values — props exist for Storybook/testing overrides only.

```tsx
<LocationMap />
```

---

## Menu

Categorized food/drink menu for restaurants, cafés, bars, bakeries — aligned prices, dietary-tag pills, optional item images. Emits `Menu` / `MenuSection` JSON-LD. Only real menu items — never invented dishes or prices.

```tsx
<Menu
  eyebrow="Menu"
  headline="Baked fresh daily"
  menuUrl="/menu.pdf"
  categories={[
    { name: 'Breads', items: [
      { name: 'Country sourdough', description: '48-hour ferment.', price: '$9', tags: ['Vegan'] },
      { name: 'Seeded rye',        price: '$8', tags: ['Vegan'] },
    ]},
  ]}
/>
```

---

## ServiceMenu

Categorized service + price + duration list for appointment businesses (salons, spas, barbers, trades, auto). Emits `OfferCatalog` / `Offer` JSON-LD. `bookUrl` renders a tracked booking CTA; falls back to the brand phone.

```tsx
<ServiceMenu
  eyebrow="Services"
  headline="Straightforward pricing"
  bookUrl="https://cal.com/acme/30min"
  categories={[
    { name: 'Cuts', services: [
      { name: 'Classic cut',  price: '$45',       duration: '45 min' },
      { name: 'Cut + color',  price: 'From $120', duration: '2 hr', description: 'Includes gloss.' },
    ]},
  ]}
/>
```

---

## DonationTiers

Nonprofit suggested-amount giving tiers with impact copy — cite quantitative impact claims. Emits `NGO` + `DonateAction` JSON-LD. `donateUrl` deep-links Stripe / Square; falls back to the brand phone.

```tsx
<DonationTiers
  eyebrow="Give"
  headline="Fuel the mission"
  donateUrl="https://donate.stripe.com/…"
  tiers={[
    { amount: '$25',  label: 'Supporter', impact: '$25 = 12 meals served' },
    { amount: '$100', label: 'Champion',  impact: '$100 = a week of groceries for a family' },
  ]}
/>
```

---

## FeaturedCollection

Retail featured-product grid (jewelers, bookstores, record shops, plant shops) — product cards with price + badge + link. Emits `ItemList` JSON-LD. `shopUrl` renders a tracked "Shop all" CTA below the grid.

```tsx
<FeaturedCollection
  eyebrow="New arrivals"
  headline="This week's picks"
  shopUrl="/shop"
  items={[
    { name: 'Monstera deliciosa', price: '$48', image: '/plants/monstera.jpg', href: '/shop/monstera', badge: 'Staff pick' },
    { name: 'Snake plant',        price: '$32', image: '/plants/snake.jpg',    href: '/shop/snake' },
  ]}
/>
```

---

## Adding a new section component

```tsx
// src/components/sections/MyThing.tsx
import { cn } from '@/lib/utils';

interface Props {
  eyebrow?: string;
  headline?: string;
  /* ...specific props... */
  className?: string;
}

export function MyThing({ eyebrow, headline, className }: Props) {
  return (
    <section className={cn('py-24 md:py-32 max-w-container-wide mx-auto px-6', className)}>
      {(eyebrow || headline) && (
        <div className="text-center mb-12 reveal-on-view">
          {eyebrow && <span className="text-accent text-sm font-mono tracking-widest uppercase">{eyebrow}</span>}
          {headline && <h2 className="text-3xl md:text-5xl font-bold font-heading mt-4 text-text">{headline}</h2>}
        </div>
      )}
      {/* ... */}
    </section>
  );
}

export default MyThing;
```

Then:

1. Export from `src/components/sections/index.ts`
2. Add an entry to the catalog table at the top of this file
3. Add a section in this file with props + example
4. Update `AGENTS.md` decision tree if the new component fills a gap

## Universal section conventions

Every section component follows these conventions for AI-predictable composition:

1. **Outer `<section>` element** with `py-24 md:py-32 max-w-container-wide mx-auto px-6`
2. **Optional eyebrow + headline + description** in a centered `text-center mb-12 reveal-on-view` block
3. **Main content area** below the header
4. **Reveal class** (`.reveal-on-view`) on items that should animate in on scroll
5. **All colors via Tailwind tokens** — never hex
6. **className passthrough** for caller customization
7. **Default exports + named exports** for both ESM and CJS interop

If a new component diverges from these, document why.
