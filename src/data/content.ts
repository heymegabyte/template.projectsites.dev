import type { BlogPostSummary } from '@/components/sections/BlogList';
import type { CaseStudy } from '@/components/sections/CaseStudyCard';
import type { TeamMember } from '@/components/sections/TeamGrid';

export interface BlogPost extends BlogPostSummary {
  body: string;
}

export const posts: BlogPost[] = [
  {
    slug: 'small-things-done-well',
    title: 'The small things, done well',
    excerpt: 'Anyone can get the big things right on a good day. What earns loyalty is the care in the small things, done the same way even when no one is watching.',
    date: '2026-08-18',
    author: 'The Team',
    category: 'Our craft',
    readMinutes: 4,
    body: `Ask people why they keep coming back to a place they love, and they rarely name one grand thing. They describe a hundred small ones: the greeting that felt genuine, the detail no one else would have noticed, the way a problem got quietly made right. The big moments get the applause, but the small things, done well and done consistently, are what people actually remember.

## Care is a habit, not a mood

It is easy to do good work when you feel like it. The difference shows on the ordinary days — the slow afternoons, the end of a long week — when the temptation is to cut a corner no one would catch. We try to hold the same standard whether the room is full or empty, because the people in front of us on a quiet Tuesday deserve exactly what the busy crowd gets. Consistency is its own kind of hospitality.

## The details people feel but rarely name

Most of what makes an experience feel considered happens below the surface. A space that is clean in the corners you would not think to check. A pace that never makes you feel rushed or forgotten. A small extra that no one asked for. Individually none of these is remarkable; together they add up to the sense that you are in good hands, and that feeling is the whole thing.

## Why it is worth the trouble

Doing the small things well is slower and quietly more expensive than not bothering. It is also the most durable advantage there is, because it cannot be copied with a discount or a slogan — it has to be lived, day after day. We would rather earn your trust one small, well-kept detail at a time than win it once and let it fade. That is the standard we hold ourselves to, and we are grateful every time you notice.`,
  },
  {
    slug: 'the-people-behind-the-work',
    title: 'The people behind the work',
    excerpt: 'A place is only ever as good as the people in it. Here is a little about the hands and hearts behind what we do, and why that matters to you.',
    date: '2026-08-04',
    author: 'The Team',
    category: 'Our people',
    readMinutes: 4,
    body: `Behind every good experience is a person who cared enough to make it that way. It is tempting to talk about a business as if it runs itself, but nothing here happens without the people who show up, learn the craft, and take pride in getting it right. We think you deserve to know who they are.

## Craft is passed hand to hand

Skill is not downloaded; it is taught, slowly, by people who have done the work for years. The newest member of our team learns from the most seasoned, and in time becomes the one doing the teaching. That chain is how standards survive — not written on a wall, but carried in the habits of people who were shown the right way and chose to keep it. When you are here, you are on the receiving end of all of that accumulated care.

## Good work needs good people to stay

The best thing we can do for you is to be a place where good people want to stay. Turnover is quietly the enemy of quality: every time someone leaves, a little hard-won knowledge walks out with them. So we try to treat our team the way we hope they will treat you — with respect, fairness, and room to take pride in what they do. A team that feels valued shows it in a hundred small ways you can feel.

## Faces, not a logo

It is easy to be loyal to people; it is hard to be loyal to a logo. We would rather you remember a name and a smile than a brand. When you come in, you are not a transaction to be processed — you are a person being looked after by other people who genuinely want you to leave better than you arrived. That is the whole job, and the people who do it are the reason any of this works.`,
  },
  {
    slug: 'the-regulars-who-feel-like-family',
    title: 'The regulars who feel like family',
    excerpt: 'The people who keep coming back are the heart of any local place. Here is what our regulars have taught us about doing this well.',
    date: '2026-07-21',
    author: 'The Team',
    category: 'Community',
    readMinutes: 4,
    body: `Every local place has them — the familiar faces who turn up often enough that you know their name, their usual, and a little about their week. They are more than customers; over time they become part of the fabric of the place. We are lucky to have ours, and they have taught us most of what we know about doing this well.

## Being known is underrated

In a world that keeps getting more automated and anonymous, there is something quietly powerful about walking into a place where someone recognizes you. It is a small thing that has become rare, and rare things are valuable. We work to remember — a name, a preference, a detail from last time — not as a trick, but because paying attention is how you tell someone they matter.

## Loyalty is earned in the ordinary moments

No one becomes a regular because of a grand gesture. They become one because a place was reliably good, day after day, and treated them like a person rather than a number. The bar is not perfection; it is consistency and genuine care. Get the ordinary moments right often enough and, without any loyalty program, people simply decide this is their place.

## We do not take it for granted

Every regular is a choice made over and over again, and we never want to be the reason someone stops choosing us. So we listen when they tell us something is off, we thank them in ways that are real rather than automatic, and we try to make the place feel a little more like theirs each time. If you are one of the faces we have come to know, thank you — you are the reason we love what we do.`,
  },
  {
    slug: 'why-a-warm-welcome-matters',
    title: 'Why a warm welcome still matters most',
    excerpt: 'The first thirty seconds set the tone for everything that follows. Here is why we put so much care into how it feels to walk through the door.',
    date: '2026-07-14',
    author: 'The Team',
    category: 'Hospitality',
    readMinutes: 4,
    body: `You can tell a great deal about a place in the first thirty seconds. Not from the decor or the prices, but from how it feels to be noticed — or not — when you walk in. A genuine welcome is the simplest form of hospitality and, strangely, one of the easiest to get wrong. We put a lot of care into getting it right, because everything that follows takes its cue from that first moment.

## A welcome is attention, not a script

A memorized greeting delivered without eye contact is not a welcome; it is a formality. What actually lands is attention — the sense that a real person clocked that you arrived and is glad you did. That can be a warm hello, a nod that says "I see you, I will be right with you," or simply not making someone stand there feeling invisible. Attention costs nothing and it is felt instantly.

## Making room for everyone

A good welcome meets people where they are. The regular who wants to be known and the newcomer who wants to quietly find their footing both deserve to feel at ease, and reading which is which is part of the craft. So is patience with the person who is unsure, generosity with the one having a hard day, and warmth that does not depend on how much someone is about to spend. Everyone gets the good version.

## The tone carries all the way through

The reason we care so much about the first moment is that it sets the temperature for the whole visit. Start warm and small hiccups later feel forgivable; start cold and even a flawless experience feels transactional. We would rather you remember how a place made you feel than any single thing about it — and that feeling almost always begins at the door. So when you arrive, we mean it: welcome. We are genuinely glad you are here.`,
  },
  {
    slug: 'rooted-in-the-neighborhood',
    title: 'Rooted in the neighborhood',
    excerpt: 'A local business is part of a place, not just located in it. Here is what being rooted in this neighborhood means to us.',
    date: '2026-07-02',
    author: 'The Team',
    category: 'Community',
    readMinutes: 4,
    body: `There is a difference between a business that happens to sit on a street and one that is genuinely part of the neighborhood around it. The first could be anywhere; the second could only be here. We have always wanted to be the second kind — woven into the daily life of this place, recognizable, and ours to the people who live nearby.

## Local is a relationship, not an address

Being local is more than a pin on a map. It is knowing the rhythm of the street, recognizing the people who pass by every day, and showing up for the neighborhood in small, unglamorous ways. It is the standing hello with the shop next door, the regulars who feel like neighbors because they are, and a sense that this place belongs to the community as much as the community belongs to it.

## Supporting the people around us

A healthy local block lifts everyone on it. Where we can, we would rather source, hire, and partner close to home, because the money and goodwill that stay in a neighborhood tend to come back around. Every nearby business that thrives makes the whole street a little more alive, and a lively street is good for all of us. We are glad to be one small part of that.

## Here for the long run

Chains come and go on a spreadsheet's schedule. A rooted local business plays a longer game, because it is not just a location — it is a fixture people count on. We want to still be here years from now, a little worn in and well loved, the kind of place newcomers get pointed to and old-timers never stopped visiting. That only happens by earning our place in the neighborhood, patiently, one day at a time. Thank you for making room for us in yours.`,
  },
  {
    slug: 'the-seasons-worth-marking',
    title: 'The seasons worth marking',
    excerpt: 'The year has a rhythm, and the best local places move with it. Here is why we lean into the seasons and the small moments worth celebrating.',
    date: '2026-07-08',
    author: 'The Team',
    category: 'Seasons',
    readMinutes: 4,
    body: `The calendar is not just a way to track appointments; it is a rhythm worth living by. The best local places have always moved with the seasons — changing with the weather, marking the holidays, and finding small reasons to celebrate along the way. We try to do the same, because a place that pays attention to the moment feels alive in a way that a place stuck in one gear never does.

## Moving with the year

Each season brings its own mood, and we lean into it rather than pretend every month is the same. What feels right in the bright energy of summer is different from what comforts on a grey winter afternoon, and part of the craft is reading the room the season creates. Following that rhythm keeps things fresh for us and gives you a reason to see what has changed since last time.

## Small occasions, taken seriously

You do not need a major holiday to mark a moment. A first warm day, a local milestone, the quiet week when everyone needs a lift — these small occasions are worth noticing. Marking them, even in a small way, is how a place says it is paying attention to the same life its customers are living. It turns an ordinary visit into a little bit of an event.

## An open invitation

The nice thing about a place that moves with the seasons is that there is always a reason to return. Something is a little different than it was, tuned to right now, waiting to be discovered. So consider this a standing invitation: come see what the season has brought. Whatever time of year you find us, we will have done our best to make the moment feel like it matters — because to us, it does.`,
  },
];

export interface CaseStudyDetail extends CaseStudy {
  challenge: string;
  solution: string;
  results: { metric: string; value: string; delta: string; confidence: 'audited' | 'estimated' }[];
  year: number;
  body: string;
}

export const caseStudies: CaseStudyDetail[] = [
  {
    slug: 'latch-saas-landing',
    title: 'Latch SaaS — 4 hours from prompt to deploy',
    client: 'Latch',
    summary: 'B2B task-management platform shipped a production landing page in a single afternoon.',
    industry: 'SaaS',
    metrics: [
      { value: '4h', label: 'Build time' },
      { value: '96', label: 'Lighthouse Perf' },
      { value: '128', label: 'Month-1 leads' },
    ],
    challenge: 'Latch needed a public landing page to drive early signups. No time for a design agency (8–12 week timeline). No budget for a custom build team. They had product-market fit and needed to capitalize on it now.',
    solution: 'Cloned the template, customized _brand.json with cyan-navy palette, filled in copy (benefits, 3 pricing tiers, team bios), connected Stripe for billing + Turnstile for forms, deployed to Cloudflare Workers in one afternoon.',
    results: [
      { metric: 'Time to deploy', value: '4 hours', delta: 'vs 8–12 weeks for agency', confidence: 'audited' },
      { metric: 'Lighthouse Performance', value: '96', delta: 'target 75+', confidence: 'audited' },
      { metric: 'Lighthouse Accessibility', value: '94', delta: 'WCAG 2.2 AA', confidence: 'audited' },
      { metric: 'First-month leads', value: '128', delta: 'organic + paid search', confidence: 'estimated' },
      { metric: 'Cost', value: '$0', delta: 'free template + CF free tier', confidence: 'audited' },
    ],
    year: 2026,
    body: `Latch's founding team had built product in 8 weeks. By month 3, they needed a public homepage. An agency quoted 8–12 weeks + $25K. Too late.

We cloned the template on a Friday afternoon. Read their product docs, extracted the value proposition, wrote a 150-word hero, pulled their logo + brand colors. Filled in 15 standard pages. Connected Stripe + Resend. By 5 PM, Latch had production live on their custom domain with edge D1 and automatic deployments on every git push.

Month 1: 128 qualified leads, 23 conversions, $1.2K MRR at starter. Month 3: $8K MRR from the landing page alone. Cost: $0.`,
  },
  {
    slug: 'northern-lights-bakery',
    title: 'Northern Lights Bakery — local SEO that brought 73% more bookings',
    client: 'Northern Lights Bakery',
    summary: 'Portland bakery rebuilt with Google Maps + reservation form + LocalBusiness schema. Bookings jumped 73% in two weeks.',
    industry: 'Local business',
    metrics: [
      { value: '+73%', label: 'Booking increase' },
      { value: '12 days', label: 'Time to results' },
      { value: 'Pos 2', label: 'Google Maps rank' },
    ],
    challenge: 'A 12-year-old WordPress site. Google Maps listing showed wrong hours. The mobile site was unusable. They were losing weekend catering bookings.',
    solution: 'Rebuilt on the template with local-business defaults: embedded Google Maps with real-time hours, LocalBusiness schema, mobile-optimized reservation form via Calendly, image gallery with alt text + structured data, three SEO-targeted blog posts.',
    results: [
      { metric: 'Booking increase', value: '+73%', delta: 'Week 1 vs baseline', confidence: 'audited' },
      { metric: 'Google Maps ranking', value: 'Position 2', delta: 'from position 8', confidence: 'audited' },
      { metric: 'Organic search traffic', value: '+128%', delta: 'vs previous 30-day average', confidence: 'audited' },
      { metric: 'Mobile conversion', value: '18%', delta: 'from 3% on old WordPress', confidence: 'estimated' },
      { metric: 'Time on site', value: '2m 34s', delta: 'vs 47s on old site', confidence: 'estimated' },
    ],
    year: 2026,
    body: `Northern Lights Bakery has been operating in Portland for 12 years. The owner Jamie called us after one too many phone calls asking "Are you open Saturday?" Budget: $1500. Timeline: 4 weeks.

We rebuilt on the template in three days. Local-business customizations: Google Maps embed with real-time hours from Places API. LocalBusiness schema with every field. Mobile-first reservation form connected to Calendly. Image gallery with keyword-rich alt text. Three SEO-targeted blog posts.

By week 4, Jamie hired a part-time assistant to handle reservation overflow. That's a real hire driven by the website.`,
  },
  {
    slug: 'doe-law-wcag',
    title: 'Doe Law — WCAG 2.2 AA in one sprint',
    client: 'Doe Law',
    summary: 'NYC estate-planning firm rebuilt for accessibility. Zero axe violations. Insurance carrier approved.',
    industry: 'Legal services',
    metrics: [
      { value: 'AA', label: 'WCAG 2.2' },
      { value: '0', label: 'axe violations' },
      { value: '98', label: 'Lighthouse A11y' },
    ],
    challenge: 'Doe Law was facing potential ADA liability. Older clients struggled with the site. Screen reader testing revealed 23 violations. Insurance carrier required compliance in 30 days or coverage would drop.',
    solution: 'Rebuilt on the template with accessibility-first defaults: semantic HTML + ARIA landmarks, 4.5:1+ contrast across all text, form labels properly linked, focus rings, skip-to-main, alt text on every image, Playwright axe-core tests at 6 breakpoints. Tested with NVDA + Voiceover + keyboard-only.',
    results: [
      { metric: 'axe violations', value: '0', delta: 'vs 23 on old site', confidence: 'audited' },
      { metric: 'Lighthouse Accessibility', value: '98', delta: 'target 95+', confidence: 'audited' },
      { metric: 'WCAG 2.2 AA', value: 'Passing', delta: 'all 9 new criteria', confidence: 'audited' },
      { metric: 'ADA readiness', value: 'Approved', delta: 'insurance carrier counsel', confidence: 'audited' },
      { metric: 'Screen reader UX', value: 'Excellent', delta: 'tested NVDA + JAWS', confidence: 'audited' },
    ],
    year: 2026,
    body: `Doe Law's old Squarespace site had 23 accessibility violations. Their insurance carrier added a requirement: fix the site or lose coverage. Timeline: 30 days. Budget: $8K.

We rebuilt on the template. Every component is accessibility-first by default: semantic HTML, ARIA landmarks, 4.5:1+ contrast, focus rings visible, alt text on every image, skip-to-main link, form labels linked, no time limits, motion respects prefers-reduced-motion.

Playwright runs axe-core scans at 6 breakpoints. Manual testing with NVDA + Voiceover. Keyboard-only navigation. Result: zero axe violations, 98 Lighthouse Accessibility, insurance carrier approved.

Accessibility is a system property, not a feature. When every component is built right from the start, you don't need to retrofit.`,
  },
];

export const team: TeamMember[] = [
  {
    name: 'Sam K.',
    role: 'Principal engineer',
    bio: 'Led architecture for template.projectsites.dev from zero to production. Obsessive about INP. Former CTO of a YC SaaS. Loves TypeScript + Vite + declarative systems.',
    links: [{ label: 'GitHub', href: 'https://github.com' }],
  },
  {
    name: 'Maya P.',
    role: 'Brand director',
    bio: 'Designed the token system + color strategy. Fluent in OKLCH. Built the Tailwind config powering the theme switcher. Previously at a design-systems consultancy.',
    links: [{ label: 'Portfolio', href: 'https://behance.net' }],
  },
  {
    name: 'Jordan T.',
    role: 'Accessibility lead',
    bio: 'Spearheaded WCAG 2.2 AA compliance. Conducts manual + automated a11y audits. Mentors the team on inclusive design. Uses assistive tech to dogfood our work.',
    links: [{ label: 'LinkedIn', href: 'https://linkedin.com' }],
  },
  {
    name: 'Alex M.',
    role: 'Performance engineer',
    bio: 'Owns the performance budget (LCP ≤2.5s, INP ≤100ms, CLS ≤0.05). Debugs Core Web Vitals regressions. Writes Playwright tests for performance assertions.',
    links: [{ label: 'Speedcurve', href: 'https://speedcurve.com' }],
  },
  {
    name: 'River S.',
    role: 'AI integrations',
    bio: 'Bridges the template with Claude, Cursor, bolt.diy. Designs the JSON schema that makes the template AI-customizable. Building autonomous content generation pipelines.',
    links: [{ label: 'Twitter', href: 'https://twitter.com' }],
  },
];

export interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company: string;
}

export const testimonials: Testimonial[] = [
  { quote: 'We shipped our landing page in 4 hours. Four hours. The template handled all the boring stuff — schema, PWA, service worker, E2E tests — and we just filled in copy and color.', author: 'Jordan L.', role: 'Co-founder', company: 'Latch' },
  { quote: 'We went from 23 axe violations to zero, in one sprint. WCAG 2.2 AA, passed audit, insurance carrier approved. That would have taken months with a traditional build.', author: 'David Doe', role: 'Partner', company: 'Doe Law' },
  { quote: 'Drop a primary color into _brand.json and the entire site reskins. No CSS overrides, no component rewrites. My designer can experiment without waiting on dev.', author: 'Sarah Chen', role: 'Design director', company: 'Beacon Agency' },
  { quote: "I'm an indie hacker. The template shipped production-ready — Lighthouse 96, axe clean, animations that don't feel cheap. It's the difference between 'I built this' and 'This looks professional.'", author: 'Marcus T.', role: 'Founder', company: 'Harvest Analytics' },
  { quote: 'We rebuild 8–10 client sites per year. The template cuts our timeline by 60%. Three weeks per site dropped to one. That is 16 weeks of dev time per year redirected to custom work.', author: 'Priya M.', role: 'CEO', company: 'Bright Creative' },
];

export interface FAQ {
  question: string;
  answer: string;
}

export const faqs: FAQ[] = [
  { question: 'How does the token system work?', answer: 'The template reads a W3C DTCG file (_brand.json) at build time. You define your primary, secondary, and accent colors in OKLCH format, pick a font family, and the entire site reskins itself. Colors cascade to every component via CSS custom properties. One edit, entire site updates.' },
  { question: 'Can I add my own routes and pages?', answer: 'Yes. The template ships 15 universal pages. You can add custom routes in src/pages/ and register them in App.tsx. The entire component library is available for reuse. You can remix, override, or ignore the default pages entirely.' },
  { question: 'Is the template free?', answer: 'Yes. MIT licensed. Clone it, use it, modify it, sell sites built on it. Free. The only cost is hosting — Cloudflare Workers Free tier covers up to 100K requests/day at $0/month.' },
  { question: 'Does it work with bolt.diy, Cursor, and Claude Code?', answer: 'Yes, all three. The template is a plain React + TypeScript + Tailwind project. Because it is AI-customizable (all data in _brand.json + JSON data files), AI editors can generate sites intelligently without refactoring the core structure.' },
  { question: 'What runtime do I need?', answer: 'For development: Node 22 LTS or Bun 1.2+. For production: Cloudflare Workers (the template ships pre-configured for CF). You can also self-host on Vercel, Netlify, or any static host by running npm run build and deploying the dist/ folder.' },
  { question: 'Does it include SEO?', answer: 'Yes. Every page has canonical URLs, meta descriptions, JSON-LD (Organization, WebPage, BlogPosting, FAQPage, BreadcrumbList), OG cards (1200×630), sitemap.xml, robots.txt, and pre-configured Sentry + GA4 + PostHog analytics hooks.' },
  { question: 'Does it work with e-commerce?', answer: 'Yes. The template includes pricing pages, product cards, and payment-processing hooks. Square Web Payments SDK is the default for accepting money (donations, subscriptions, POS). Stripe Connect Express is the default for paying out (contractors, marketplace splits).' },
  { question: 'Is it accessible?', answer: 'Yes. Every component meets WCAG 2.2 AA standards out of the box. 4.5:1 color contrast, focus rings visible, semantic HTML, ARIA landmarks, form labels, skip-to-main. Playwright runs axe-core tests on every page at 6 breakpoints.' },
  { question: 'Can I deploy to a custom domain?', answer: 'Yes. Set your domain as the primary hostname in wrangler.jsonc, and the template deploys there. The canonical URL updates automatically. Redirects from the projectsites.dev subdomain are handled by the Worker.' },
  { question: 'How do I update copy, images, and brand colors?', answer: 'Three files: _brand.json (colors, fonts, business info, feature flags), src/data/content.ts (blog posts, case studies, team, testimonials, FAQs), and public/images/ (drop image files and reference by path). No database, no CMS. Everything is code.' },
];
