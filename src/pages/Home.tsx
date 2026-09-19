import { Shield, Zap, Users, Target, Award, Star, Rocket, Sparkles, MessageSquare, Phone, Mail, MapPin, Clock } from 'lucide-react';
import { JsonLd } from '@/components/JsonLd';
import { SafeSection } from '@/components/SafeSection';
import { ContactForm } from '@/components/ContactForm';
import { TrustBar } from '@/components/TrustBar';
import { useSEO } from '@/hooks/useSEO';
import { brand, featureOn } from '@/brand';
import { buildSiteJsonLd, parseAddress, parseHours, type BusinessClass } from '@/lib/businessSchema';
import { GalleryGrid } from '@/components/local';
import { hasRealImage, cityFromAddress } from '@/lib/placeholders';
import { cinematicProcessEnabled, kineticMarqueeEnabled, scrollStackEnabled } from '@/lib/featureFlags';
import KineticMarquee from '@/components/KineticMarquee';

import {
  HeroSplit,
  backdropForPreset,
  BentoGrid,
  Stats,
  FeatureSplit,
  ProcessSteps,
  CinematicProcess,
  Pricing,
  FAQ,
  LogoCloud,
  LocationMap,
  PageAudio,
  CTASection,
  TeamRoles,
  Menu,
  ServiceMenu,
  DonationTiers,
  FeaturedCollection,
  type BentoTile,
  type Stat,
  type PricingTier,
  type FAQItem,
  type ProcessStep,
  type Logo,
  type TeamRole,
  type MenuCategory,
  type ServiceCategory,
  type DonationTier,
  type CollectionItem,
} from '@/components/sections';

const bentoTiles: BentoTile[] = [
  { id: 't1', title: '{FEATURE_1_TITLE}', description: '{FEATURE_1_DESCRIPTION}', icon: <Shield size={24} />, image: '{FEATURE_1_IMAGE_URL}', imageAlt: '', span: 'lg', tall: true, accent: true },
  { id: 't2', title: '{FEATURE_2_TITLE}', description: '{FEATURE_2_DESCRIPTION}', icon: <Zap size={24} />, image: '{FEATURE_2_IMAGE_URL}', imageAlt: '', span: 'sm' },
  { id: 't3', title: '{FEATURE_3_TITLE}', description: '{FEATURE_3_DESCRIPTION}', icon: <Users size={24} />, image: '{FEATURE_3_IMAGE_URL}', imageAlt: '', span: 'sm' },
  { id: 't4', title: '{FEATURE_4_TITLE}', description: '{FEATURE_4_DESCRIPTION}', icon: <Target size={24} />, image: '{FEATURE_4_IMAGE_URL}', imageAlt: '', span: 'sm' },
  { id: 't5', title: '{FEATURE_5_TITLE}', description: '{FEATURE_5_DESCRIPTION}', icon: <Award size={24} />, image: '{FEATURE_5_IMAGE_URL}', imageAlt: '', span: 'md' },
  { id: 't6', title: '{FEATURE_6_TITLE}', description: '{FEATURE_6_DESCRIPTION}', icon: <Star size={24} />, image: '{FEATURE_6_IMAGE_URL}', imageAlt: '', span: 'md' },
];

const stats: Stat[] = [
  { value: 500,  suffix: '+', label: '{STAT_1_LABEL}', caption: '{STAT_1_CAPTION}' },
  { value: 98,   suffix: '%', label: '{STAT_2_LABEL}', caption: '{STAT_2_CAPTION}' },
  { value: 24,   suffix: '/7', label: '{STAT_3_LABEL}', caption: '{STAT_3_CAPTION}' },
  { value: 10,   suffix: 'yr',label: '{STAT_4_LABEL}', caption: '{STAT_4_CAPTION}' },
];

const process: ProcessStep[] = [
  { title: '{PROCESS_1_TITLE}', description: '{PROCESS_1_DESCRIPTION}', icon: <MessageSquare size={20} /> },
  { title: '{PROCESS_2_TITLE}', description: '{PROCESS_2_DESCRIPTION}', icon: <Sparkles size={20} /> },
  { title: '{PROCESS_3_TITLE}', description: '{PROCESS_3_DESCRIPTION}', icon: <Rocket size={20} /> },
  { title: '{PROCESS_4_TITLE}', description: '{PROCESS_4_DESCRIPTION}', icon: <Award size={20} /> },
];

// ── Industry-specific section data (token-gated, self-hiding) ──────────────────
// All four ship in every Home. Each renders `null` until the generation step fills
// its tokens for the matching vertical — Menu→food, ServiceMenu→appointments,
// DonationTiers→nonprofit, FeaturedCollection→retail — so only the relevant
// section(s) appear and the rest stay hidden. The container's domain-builder fills
// these from _research.json (menu_items / services / donation / products) for the
// business type; unfilled tokens are scrubbed to null. (Hours + live open-now render
// in LocationMap from the freeform `hours` token — not a separate section.)
const menuCategories: MenuCategory[] = [
  { name: '{MENU_CAT_1_NAME}', items: [
    { name: '{MENU_CAT_1_ITEM_1_NAME}', description: '{MENU_CAT_1_ITEM_1_DESC}', price: '{MENU_CAT_1_ITEM_1_PRICE}' },
    { name: '{MENU_CAT_1_ITEM_2_NAME}', description: '{MENU_CAT_1_ITEM_2_DESC}', price: '{MENU_CAT_1_ITEM_2_PRICE}' },
    { name: '{MENU_CAT_1_ITEM_3_NAME}', description: '{MENU_CAT_1_ITEM_3_DESC}', price: '{MENU_CAT_1_ITEM_3_PRICE}' },
  ] },
  { name: '{MENU_CAT_2_NAME}', items: [
    { name: '{MENU_CAT_2_ITEM_1_NAME}', description: '{MENU_CAT_2_ITEM_1_DESC}', price: '{MENU_CAT_2_ITEM_1_PRICE}' },
    { name: '{MENU_CAT_2_ITEM_2_NAME}', description: '{MENU_CAT_2_ITEM_2_DESC}', price: '{MENU_CAT_2_ITEM_2_PRICE}' },
    { name: '{MENU_CAT_2_ITEM_3_NAME}', description: '{MENU_CAT_2_ITEM_3_DESC}', price: '{MENU_CAT_2_ITEM_3_PRICE}' },
  ] },
];

const serviceCategories: ServiceCategory[] = [
  { name: '{SERVICE_CAT_1_NAME}', services: [
    { name: '{SERVICE_1_NAME}', description: '{SERVICE_1_DESC}', price: '{SERVICE_1_PRICE}', duration: '{SERVICE_1_DURATION}' },
    { name: '{SERVICE_2_NAME}', description: '{SERVICE_2_DESC}', price: '{SERVICE_2_PRICE}', duration: '{SERVICE_2_DURATION}' },
    { name: '{SERVICE_3_NAME}', description: '{SERVICE_3_DESC}', price: '{SERVICE_3_PRICE}', duration: '{SERVICE_3_DURATION}' },
  ] },
  { name: '{SERVICE_CAT_2_NAME}', services: [
    { name: '{SERVICE_4_NAME}', description: '{SERVICE_4_DESC}', price: '{SERVICE_4_PRICE}', duration: '{SERVICE_4_DURATION}' },
    { name: '{SERVICE_5_NAME}', description: '{SERVICE_5_DESC}', price: '{SERVICE_5_PRICE}', duration: '{SERVICE_5_DURATION}' },
  ] },
];

const donationTiers: DonationTier[] = [
  { amount: '{DONATION_1_AMOUNT}', label: '{DONATION_1_LABEL}', impact: '{DONATION_1_IMPACT}' },
  { amount: '{DONATION_2_AMOUNT}', label: '{DONATION_2_LABEL}', impact: '{DONATION_2_IMPACT}' },
  { amount: '{DONATION_3_AMOUNT}', label: '{DONATION_3_LABEL}', impact: '{DONATION_3_IMPACT}' },
  { amount: '{DONATION_4_AMOUNT}', label: '{DONATION_4_LABEL}', impact: '{DONATION_4_IMPACT}' },
];

const collectionItems: CollectionItem[] = [
  { name: '{PRODUCT_1_NAME}', price: '{PRODUCT_1_PRICE}', image: '{PRODUCT_1_IMAGE_URL}', href: '{PRODUCT_1_URL}', badge: '{PRODUCT_1_BADGE}' },
  { name: '{PRODUCT_2_NAME}', price: '{PRODUCT_2_PRICE}', image: '{PRODUCT_2_IMAGE_URL}', href: '{PRODUCT_2_URL}', badge: '{PRODUCT_2_BADGE}' },
  { name: '{PRODUCT_3_NAME}', price: '{PRODUCT_3_PRICE}', image: '{PRODUCT_3_IMAGE_URL}', href: '{PRODUCT_3_URL}', badge: '{PRODUCT_3_BADGE}' },
  { name: '{PRODUCT_4_NAME}', price: '{PRODUCT_4_PRICE}', image: '{PRODUCT_4_IMAGE_URL}', href: '{PRODUCT_4_URL}', badge: '{PRODUCT_4_BADGE}' },
];

// Home photo gallery (masonry + lightbox). Placeholder srcs are filtered out at
// render so the section self-hides when a build has no gallery images.
const galleryImages = [
  { src: '{GALLERY_1_IMAGE_URL}', alt: '{GALLERY_1_IMAGE_ALT}' },
  { src: '{GALLERY_2_IMAGE_URL}', alt: '{GALLERY_2_IMAGE_ALT}' },
  { src: '{GALLERY_3_IMAGE_URL}', alt: '{GALLERY_3_IMAGE_ALT}' },
  { src: '{GALLERY_4_IMAGE_URL}', alt: '{GALLERY_4_IMAGE_ALT}' },
  { src: '{GALLERY_5_IMAGE_URL}', alt: '{GALLERY_5_IMAGE_ALT}' },
  { src: '{GALLERY_6_IMAGE_URL}', alt: '{GALLERY_6_IMAGE_ALT}' },
  { src: '{GALLERY_7_IMAGE_URL}', alt: '{GALLERY_7_IMAGE_ALT}' },
  { src: '{GALLERY_8_IMAGE_URL}', alt: '{GALLERY_8_IMAGE_ALT}' },
];

const tiers: PricingTier[] = [
  { id: 'starter',    name: '{TIER_1_NAME}',    description: '{TIER_1_DESC}', monthly: 49,  yearly: 470,  features: ['{TIER_1_F1}', '{TIER_1_F2}', '{TIER_1_F3}'] },
  { id: 'pro',        name: '{TIER_2_NAME}',    description: '{TIER_2_DESC}', monthly: 149, yearly: 1430, features: ['{TIER_2_F1}', '{TIER_2_F2}', '{TIER_2_F3}', '{TIER_2_F4}'], featured: true, badge: 'Most Popular' },
  { id: 'enterprise', name: '{TIER_3_NAME}',    description: '{TIER_3_DESC}', monthly: 499, yearly: 4790, features: ['{TIER_3_F1}', '{TIER_3_F2}', '{TIER_3_F3}', '{TIER_3_F4}', '{TIER_3_F5}'] },
];

const faqs: FAQItem[] = [
  { question: '{FAQ_1_Q}', answer: '{FAQ_1_A}' },
  { question: '{FAQ_2_Q}', answer: '{FAQ_2_A}' },
  { question: '{FAQ_3_Q}', answer: '{FAQ_3_A}' },
  { question: '{FAQ_4_Q}', answer: '{FAQ_4_A}' },
  // FAQ_5 densifies the homepage (+~60 words) + enriches FAQPage JSON-LD (GEO). The FAQ
  // component drops any row whose token is unresolved, so pre-FAQ_5 builds still render 4.
  { question: '{FAQ_5_Q}', answer: '{FAQ_5_A}' },
];

const logos: Logo[] = [
  { name: '{LOGO_1_NAME}' }, { name: '{LOGO_2_NAME}' }, { name: '{LOGO_3_NAME}' },
  { name: '{LOGO_4_NAME}' }, { name: '{LOGO_5_NAME}' }, { name: '{LOGO_6_NAME}' },
];

// Meet-the-team band — ROLE-based, never named people (generation must never fabricate
// staff). Each role is a content-pack token pair; <TeamRoles> filters any still-`{TOKEN}`
// entry and self-hides if none survive, so a bare template never prints an empty section.
const teamRoles: TeamRole[] = [
  { title: '{TEAM_ROLE_1_TITLE}', description: '{TEAM_ROLE_1_DESC}' },
  { title: '{TEAM_ROLE_2_TITLE}', description: '{TEAM_ROLE_2_DESC}' },
  { title: '{TEAM_ROLE_3_TITLE}', description: '{TEAM_ROLE_3_DESC}' },
];

/**
 * Homepage lead-capture + NAP block — the conversion + local-SEO floor every
 * generated site now ships by default.
 *
 * @remarks
 * Root-cause fix (journey 2026-08-22 — site scored 3/10, "zero conversion /
 * local-SEO scaffolding: no NAP, no phone/tel:/mailto:, forms=0, hero CTA had
 * no target"). The template already owned a working `<ContactForm>` (Zod-
 * validated, React 19 `useActionState`, POSTs to `/api/contact-form/{slug}`) and a
 * NAP-aware `<Footer>`, but the DEFAULT `Home` rendered NEITHER — so a naive
 * generation that only touched the hero shipped a page with no lead form, no
 * click-to-call, and no machine-readable local-business signal on the homepage.
 *
 * This section is 100% additive and self-healing, mirroring the placeholder-
 * scrub / brand self-heal patterns already in the template:
 *   - The lead FORM always renders — a working `/contact`-target conversion
 *     surface exists on the homepage even before any customization.
 *   - Each NAP row (`tel:`, `mailto:`, maps address, hours) renders ONLY when
 *     `brand.business` carries real, non-placeholder data (`brand.ts` `pick()`
 *     already rejects empty + `{TOKEN}`-shaped leaves), so a bare template never
 *     prints an empty "Call " row.
 *   - The visible NAP carries schema.org LocalBusiness microdata
 *     (`itemProp="telephone" | "email" | "address"`) so the homepage emits a
 *     machine-readable local-business signal in the rendered DOM regardless of
 *     the JSON-LD `businessClass`.
 *
 * Wrapped by the caller in `<SafeSection>` so a crash here fails soft.
 */
function HomeContact() {
  const { name, phone, email, address, hours } = brand.business;
  // Per-vertical contact headline (was a hardcoded "Request your free estimate" — a
  // local-service phrase wrong for realty/medical/legal/etc.). Reuses the pack's existing
  // on-brand CONTACT_HEADLINE (real-estate "Let's find your place", medical "We're here
  // whenever you need us", …). Quoted-literal token keeps the local build valid; the
  // container fills it — and it self-heals from the safety net if ever unfilled.
  const contactHeadline = '{CONTACT_HEADLINE}';
  const telHref = phone ? `tel:${phone.replace(/[^+\d]/g, '')}` : '';
  const mapHref = address
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`
    : '';
  const hasNap = Boolean(phone || email || address || hours);

  return (
    <section id="contact" className="relative py-24 border-t border-border">
      <div className="max-w-container-wide mx-auto px-6">
        <div className="text-center mb-14">
          <span className="text-accent text-sm font-mono tracking-widest uppercase">Get in touch</span>
          <h2 className="mt-4 text-4xl md:text-5xl font-extrabold font-heading tracking-[-0.02em]">
            <span className="gradient-text">{contactHeadline}</span>
          </h2>
          <p className="mt-4 text-text-muted max-w-2xl mx-auto text-lg">
            Tell us what you need and {name} will get back to you within one business day.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 items-start">
          {/* Working, Zod-validated lead form — the homepage conversion surface. */}
          <ContactForm />

          {/* NAP: click-to-call, email, directions, hours — with LocalBusiness microdata. */}
          <address
            className="not-italic space-y-4"
            itemScope
            itemType="https://schema.org/LocalBusiness"
          >
            <meta itemProp="name" content={name} />
            {hasNap ? (
              <>
                {phone && (
                  <a
                    href={telHref}
                    className="glass rounded-2xl p-6 flex items-center gap-4 hover:border-accent/40 transition-colors"
                    aria-label={`Call ${name} at ${phone}`}
                  >
                    <span className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                      <Phone className="h-5 w-5 text-accent" aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block text-text font-medium">Call us</span>
                      <span className="block text-text-muted text-sm" itemProp="telephone">{phone}</span>
                    </span>
                  </a>
                )}
                {email && (
                  <a
                    href={`mailto:${email}`}
                    className="glass rounded-2xl p-6 flex items-center gap-4 hover:border-accent/40 transition-colors"
                    aria-label={`Email ${name} at ${email}`}
                  >
                    <span className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                      <Mail className="h-5 w-5 text-accent" aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block text-text font-medium">Email us</span>
                      <span className="block text-text-muted text-sm break-all" itemProp="email">{email}</span>
                    </span>
                  </a>
                )}
                {address && (
                  <a
                    href={mapHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass rounded-2xl p-6 flex items-start gap-4 hover:border-accent/40 transition-colors"
                    aria-label={`Get directions to ${address}`}
                  >
                    <span className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                      <MapPin className="h-5 w-5 text-accent" aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block text-text font-medium">Visit us</span>
                      <span className="block text-text-muted text-sm" itemProp="address">{address}</span>
                    </span>
                  </a>
                )}
                {hours && (
                  <div className="glass rounded-2xl p-6 flex items-start gap-4">
                    <span className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                      <Clock className="h-5 w-5 text-accent" aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block text-text font-medium">Hours</span>
                      <span className="block text-text-muted text-sm" itemProp="openingHours">{hours}</span>
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="glass rounded-2xl p-6 text-text-muted text-sm">
                Prefer to talk it through? Use the form and we&rsquo;ll reach out with next steps.
              </div>
            )}
          </address>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  // Prefer a real business tagline; else the per-vertical SEO tagline token
  // (content-pack-filled at build) so the <title> + hero eyebrow are always
  // specific + ~50-60 chars instead of the generic default. Suffix the em-dash
  // only when a tagline exists (avoids a trailing "Name — ").
  const seoTagline = brand.business.tagline || '{SEO_TAGLINE}';
  // A real 120-156 char meta description. The orchestrator often leaves
  // business.description as the bare name (too short + no keywords), so fall
  // back to the per-vertical {SEO_DESCRIPTION} token (content-pack-filled at
  // build) whenever the provided description is missing or shorter than a real
  // sentence. Keeps every homepage's <meta description> in the SEO sweet spot.
  const seoDescription =
    brand.business.description && brand.business.description.trim().length >= 80
      ? brand.business.description
      : '{SEO_DESCRIPTION}';
  // Local-SEO title padding: when the "{Name} — {Tagline}" base is short (< 48),
  // append the city so the <title> lands in the 50-60 sweet spot AND carries the
  // "{business} in {city}" local keyword the SEO doctrine wants. Reuses the proven
  // address→city idiom from TrustBar; guarded so it only helps (city present, no
  // 60-char overflow) and never rewrites a long title or a build with no address.
  const baseTitle = seoTagline
    ? `${brand.business.name} — ${seoTagline}`
    : brand.business.name;
  // Robust city (AL-736): the old `.split(',').slice(-2,-1)[0]` grabbed the ZIP from the
  // verbose OSM display_name → shipped "Commander's Palace … | 70130" in the homepage <title>.
  const seoCity = cityFromAddress(brand.business.address);
  const seoTitle =
    seoCity && baseTitle.length < 48 && `${baseTitle} | ${seoCity}`.length <= 60
      ? `${baseTitle} | ${seoCity}`
      : baseTitle;
  useSEO({
    title: seoTitle,
    description: seoDescription,
  });

  // Vertical-aware secondary CTA — mirrors the Header/Footer/CommandPalette logic
  // so the "second action" always points at a page this vertical actually has.
  // A medical/legal/nonprofit site has no /pricing (SaaS tiers would misrepresent
  // it), so linking "See pricing" → /pricing sent visitors to a fabricated tier
  // table (and an indexed dead page). Pricing verticals → pricing; quote verticals
  // → quote; everyone else → services.
  const ctaSecondary = featureOn('pricing')
    ? { label: 'See pricing', href: '/pricing' }
    : featureOn('quote')
      ? { label: 'Get a quote', href: '/quote' }
      : { label: 'View our services', href: '/services' };

  return (
    <>
      <JsonLd
        data={buildSiteJsonLd({
          name: brand.business.name,
          description: seoDescription,
          url: brand.business.url,
          businessClass: (brand.business.businessClass || 'organization') as BusinessClass,
          email: brand.business.email,
          phone: brand.business.phone,
          // Parse the free-text address string → structured PostalAddress so the
          // LocalBusiness JSON-LD carries NAP + Google's local pack can key on it.
          address: parseAddress(brand.business.address),
          // Real social profiles → schema.org `sameAs` (the knowledge-panel entity links).
          // brand.social is a Record of unwrapped URL strings; drop the empty slots.
          sameAs: Object.values(brand.social).filter(
            (v): v is string => typeof v === 'string' && v.trim().length > 0,
          ),
          // Parse the free-text hours string → schema.org OpeningHoursSpecification so the
          // local pack / knowledge panel shows real hours ([] when unparseable → omitted).
          openingHours: parseHours(brand.business.hours),
        })}
      />

      {/*
        Every section is wrapped in <SafeSection> so a render crash in one
        AI-customized section (e.g. `Cannot read properties of undefined
        (reading 'primary')`, an empty `services[0]` lookup, a missing brand
        token) fails soft — that section vanishes while the hero, NAP, every
        sibling section, the header/footer landmarks, and the pre-rendered SEO
        head all keep painting. Never let one bad section blank the whole page.
      */}
      {featureOn('hero') && (
        <SafeSection name="hero">
          <HeroSplit
            eyebrow={seoTagline}
            headline="{HERO_HEADLINE}"
            subheadline="{HERO_SUBHEADLINE}"
            primary={{ label: '{HERO_CTA}', href: featureOn('quote') ? '/quote' : '/contact' }}
            secondary={{ label: '{HERO_SECONDARY_CTA}', href: '/services' }}
            image={{ src: '{HERO_IMAGE_URL}', alt: '{HERO_IMAGE_ALT}' }}
            webglBackdrop={backdropForPreset(brand.themeStyle)}
            trustBadges={[
              { icon: 'star',   label: '{TRUST_BADGE_1}' },
              { icon: 'shield', label: '{TRUST_BADGE_2}' },
              { icon: 'award',  label: '{TRUST_BADGE_3}' },
            ]}
          />
        </SafeSection>
      )}

      {/* Full-width trust strip directly under the hero — wordless credibility above
          the fold. Vertical-aware, promise-based, never fabricated numbers. */}
      <SafeSection name="trustbar">
        <TrustBar />
      </SafeSection>

      {/*
        AI-native "Listen to this page" — a Web Speech API player that reads the
        page's <main> text aloud on demand (zero backend/deps/keys). Placed high,
        right under the hero, so every generated home page ships an accessible,
        AI-native audio surface. Self-hides (renders null) when the browser lacks
        speechSynthesis; wrapped in SafeSection like every sibling so it fails soft.
      */}
      <SafeSection name="page-audio">
        <PageAudio />
      </SafeSection>

      {featureOn('logoCloud') && (
        <SafeSection name="logoCloud">
          <LogoCloud logos={logos} eyebrow="Trusted by" />
        </SafeSection>
      )}

      {featureOn('bento') && (
        <SafeSection name="bento">
          <BentoGrid
            eyebrow="Why choose us"
            headline="{FEATURES_HEADLINE}"
            description="{FEATURES_SUBHEADLINE}"
            tiles={bentoTiles}
          />
        </SafeSection>
      )}

      {featureOn('stats') && (
        <SafeSection name="stats">
          <Stats stats={stats} eyebrow="By the numbers" headline="{STATS_HEADLINE}" />
        </SafeSection>
      )}

      <SafeSection name="about">
        <FeatureSplit
          eyebrow="About"
          headline="{ABOUT_HEADLINE}"
          description="{ABOUT_DESCRIPTION}"
          bullets={['{ABOUT_BULLET_1}', '{ABOUT_BULLET_2}', '{ABOUT_BULLET_3}']}
          cta={{ label: 'Learn more', href: '/about' }}
          image={{ src: '{ABOUT_IMAGE_URL}', alt: '{ABOUT_IMAGE_ALT}' }}
        />
      </SafeSection>

      {/*
        Meet-the-team — a role-based credibility band (never fabricated named staff).
        Self-hides when its role tokens are unfilled, so it only appears once real
        per-vertical role copy is present. Placed after About (who we are) and before
        the gallery (our work): who we are → our people → our work.
      */}
      <SafeSection name="team">
        <TeamRoles
          roles={teamRoles}
          eyebrow="Our team"
          headline="{TEAM_HEADLINE}"
          intro="{TEAM_INTRO}"
        />
      </SafeSection>

      {galleryImages.filter((g) => hasRealImage(g.src)).length > 0 && (
        <SafeSection name="gallery">
          <GalleryGrid
            images={galleryImages.filter((g) => hasRealImage(g.src))}
            heading="{GALLERY_HEADLINE}"
          />
        </SafeSection>
      )}

      {/* Industry-specific sections — each self-hides (renders null) until the
          matching vertical's tokens are filled (see the data arrays above), so all
          four ship in every Home and only the relevant one(s) appear. Order per the
          domain-builder brief: content sections between the story/gallery and the
          process/pricing/CTA. (Hours live in LocationMap below, not here.) */}
      <SafeSection name="menu">
        <Menu categories={menuCategories} headline="{MENU_HEADLINE}" description="{MENU_SUBHEADLINE}" menuUrl="{MENU_URL}" />
      </SafeSection>

      <SafeSection name="services">
        <ServiceMenu
          categories={serviceCategories}
          headline="{SERVICES_HEADLINE}"
          description="{SERVICES_SUBHEADLINE}"
          bookUrl="{BOOK_URL}"
        />
      </SafeSection>

      {kineticMarqueeEnabled() && (
        <SafeSection name="kineticMarquee">
          <KineticMarquee words={bentoTiles.map((t) => t.title)} />
        </SafeSection>
      )}

      <SafeSection name="collection">
        <FeaturedCollection
          items={collectionItems}
          headline="{COLLECTION_HEADLINE}"
          description="{COLLECTION_SUBHEADLINE}"
          shopUrl="{SHOP_URL}"
        />
      </SafeSection>

      <SafeSection name="donate">
        <DonationTiers
          tiers={donationTiers}
          donateUrl="{DONATE_URL}"
          headline="{DONATE_HEADLINE}"
          description="{DONATE_SUBHEADLINE}"
        />
      </SafeSection>

      {featureOn('process') && (
        <SafeSection name="process">
          {cinematicProcessEnabled() ? (
            <CinematicProcess
              steps={process}
              headline="{PROCESS_HEADLINE}"
              description="{PROCESS_SUBHEADLINE}"
            />
          ) : (
            <ProcessSteps
              steps={process}
              headline="{PROCESS_HEADLINE}"
              description="{PROCESS_SUBHEADLINE}"
              stack={scrollStackEnabled()}
            />
          )}
        </SafeSection>
      )}

      {featureOn('pricing') && (
        <SafeSection name="pricing">
          <Pricing
            tiers={tiers}
            headline="{PRICING_HEADLINE}"
            description="{PRICING_SUBHEADLINE}"
          />
        </SafeSection>
      )}

      {featureOn('faq') && (
        <SafeSection name="faq">
          <FAQ
            items={faqs}
            headline="{FAQ_HEADLINE}"
            description="{FAQ_SUBHEADLINE}"
          />
        </SafeSection>
      )}

      {featureOn('cta') && (
        <SafeSection name="cta">
          <CTASection
            eyebrow="Ready?"
            headline="{CTA_HEADLINE}"
            description="{CTA_DESCRIPTION}"
            primary={{ label: '{CTA_BUTTON}', href: '/contact' }}
            secondary={ctaSecondary}
          />
        </SafeSection>
      )}

      {/*
        Conversion + local-SEO floor — a working lead form + click-to-call NAP
        with LocalBusiness microdata, on the homepage by default. Not feature-
        gated: every generated site must ship a way to convert + a machine-
        readable local-business signal even if only the hero was customized.
      */}
      {/*
        Where-to-find-us — a real, keyless, address-driven map + service-area line +
        directions. Self-hides when the business has no real address (online-only /
        bare template). Placed before the contact form so a visitor sees the location
        then converts. No JSON-LD (HomeContact's NAP already carries LocalBusiness).
      */}
      <SafeSection name="location">
        <LocationMap />
      </SafeSection>

      <SafeSection name="contact">
        <HomeContact />
      </SafeSection>
    </>
  );
}
