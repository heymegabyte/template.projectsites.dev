import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import { AnimatedSection } from '@/components/AnimatedSection';
import { useSEO } from '@/hooks/useSEO';
import { JsonLd } from '@/components/JsonLd';
import { Button } from '@/components/ui/button';

export default function Contact() {
  useSEO({
    title: 'Contact {BUSINESS_NAME} — {SEO_TAGLINE}',
    description: '{CONTACT_META_DESCRIPTION}',
  });

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'ContactPage',
          name: 'Contact {BUSINESS_NAME}',
        }}
      />

      <section className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          <AnimatedSection className="text-center mb-16">
            <span className="text-accent text-sm font-mono tracking-widest uppercase">
              Get in Touch
            </span>
            <h1 className="text-4xl md:text-6xl font-bold font-heading mt-4 mb-6">
              <span className="gradient-text">{'{CONTACT_HEADLINE}'}</span>
            </h1>
            <p className="text-text-subtle max-w-2xl mx-auto text-lg">
              {'{CONTACT_SUBHEADLINE}'}
            </p>
          </AnimatedSection>

          {/* Intro — reassuring, guess-ahead copy so the page is more than a form. */}
          <AnimatedSection className="mb-12">
            <p className="text-text-muted leading-relaxed max-w-3xl mx-auto text-center">
              {'{CONTACT_INTRO}'}
            </p>
          </AnimatedSection>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <AnimatedSection animation="animate-slideInLeft">
              <form className="glass rounded-2xl p-8 space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="ps-contact-name" className="block text-text-muted text-sm font-medium mb-2">
                      Name
                    </label>
                    <input
                      id="ps-contact-name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      required
                      className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-text placeholder-text-subtle focus:outline-none focus:border-[var(--color-accent)]/50 focus:ring-1 focus:ring-[var(--color-accent)]/50 transition-colors"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label htmlFor="ps-contact-email" className="block text-text-muted text-sm font-medium mb-2">
                      Email
                    </label>
                    <input
                      id="ps-contact-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-text placeholder-text-subtle focus:outline-none focus:border-[var(--color-accent)]/50 focus:ring-1 focus:ring-[var(--color-accent)]/50 transition-colors"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="ps-contact-phone" className="block text-text-muted text-sm font-medium mb-2">
                    Phone <span className="text-text-subtle font-normal">(optional)</span>
                  </label>
                  <input
                    id="ps-contact-phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-text placeholder-text-subtle focus:outline-none focus:border-[var(--color-accent)]/50 focus:ring-1 focus:ring-[var(--color-accent)]/50 transition-colors"
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <label htmlFor="ps-contact-message" className="block text-text-muted text-sm font-medium mb-2">
                    Message
                  </label>
                  <textarea
                    id="ps-contact-message"
                    name="message"
                    rows={5}
                    required
                    className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-text placeholder-text-subtle focus:outline-none focus:border-[var(--color-accent)]/50 focus:ring-1 focus:ring-[var(--color-accent)]/50 transition-colors resize-none"
                    placeholder="Tell us about your project..."
                  />
                </div>
                <Button type="submit" size="lg" className="w-full">
                  Send Message
                </Button>
              </form>
            </AnimatedSection>

            {/* Contact Info */}
            <AnimatedSection animation="animate-slideInRight">
              <div className="space-y-6">
                <div className="glass rounded-2xl p-6 flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-5 w-5 text-[var(--color-accent)]" />
                  </div>
                  <div>
                    <h3 className="text-text font-medium mb-1">Address</h3>
                    <p className="text-text-subtle text-sm">{'{BUSINESS_ADDRESS}'}</p>
                  </div>
                </div>

                <div className="glass rounded-2xl p-6 flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-text font-medium mb-1">Phone</h3>
                    <p className="text-text-subtle text-sm">{'{BUSINESS_PHONE}'}</p>
                  </div>
                </div>

                <div className="glass rounded-2xl p-6 flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-text font-medium mb-1">Email</h3>
                    <p className="text-text-subtle text-sm">{'{BUSINESS_EMAIL}'}</p>
                  </div>
                </div>

                <div className="glass rounded-2xl p-6 flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-text font-medium mb-1">Hours</h3>
                    <p className="text-text-subtle text-sm">{'{BUSINESS_HOURS}'}</p>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Supporting copy — a contact page is more than a form. Generic, true for
          every vertical, and guarantees the page ships real, reassuring content
          (never a bare form). Theme tokens only. */}
      <section className="pb-24">
        <div className="max-w-container-wide mx-auto px-6">
          <AnimatedSection className="glass rounded-2xl p-8 md:p-12 max-w-3xl mx-auto">
            <span className="text-accent text-sm font-mono tracking-widest uppercase">
              What to expect
            </span>
            <h2 className="text-2xl md:text-3xl font-bold font-heading text-text mt-3 mb-4">
              Here&rsquo;s how it works after you reach out
            </h2>
            <p className="text-text-muted leading-relaxed">
              However you get in touch &mdash; the form, a phone call, or an email &mdash; you&rsquo;ll
              always reach a real person who knows our work and genuinely wants to help. We read every
              message, answer your questions honestly, and never put you through an automated runaround
              or a high-pressure pitch. Most inquiries get a thoughtful, personal reply within one
              business day, and often much sooner. There are no silly questions and no wrong reasons to
              reach out &mdash; if we can help, we will, and if we cannot, we will happily point you in
              the right direction.
            </p>
            <ol className="grid sm:grid-cols-3 gap-6 mt-8">
              {[
                { n: '01', t: 'We listen', d: 'We read your message and route it to the right person on our team — no ticket numbers, no runaround.' },
                { n: '02', t: 'We respond', d: 'You get a clear, honest reply with answers, next steps, or a time to talk — usually within one business day.' },
                { n: '03', t: 'We follow through', d: 'From first hello to finished work, you always deal with real people who care about getting it right.' },
              ].map((s) => (
                <li key={s.n} className="relative">
                  <span aria-hidden="true" className="font-heading text-3xl font-extrabold text-[var(--color-accent)]/25">
                    {s.n}
                  </span>
                  <h3 className="font-heading text-lg font-bold text-text mt-1 mb-1.5">{s.t}</h3>
                  <p className="text-text-muted text-sm leading-relaxed">{s.d}</p>
                </li>
              ))}
            </ol>
            <p className="text-text-subtle text-sm mt-8">
              Prefer to talk right away? Call or email us directly using the details above &mdash;
              we&rsquo;re glad to help however works best for you.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Ways to reach us — reassurance paragraph + 3 routed points. Every token is
          emitted by the content pack for all 10 verticals; theme tokens only. */}
      <section className="pb-28">
        <div className="max-w-container-wide mx-auto px-6">
          <AnimatedSection className="text-center mb-10">
            <span className="text-accent text-sm font-mono tracking-widest uppercase">
              However works for you
            </span>
            <h2 className="text-2xl md:text-4xl font-bold font-heading text-text mt-3 mb-4">
              A few ways to reach us
            </h2>
            <p className="text-text-muted leading-relaxed max-w-3xl mx-auto">
              {'{CONTACT_REASSURE}'}
            </p>
          </AnimatedSection>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { title: '{CONTACT_POINT_1_TITLE}', desc: '{CONTACT_POINT_1_DESC}' },
              { title: '{CONTACT_POINT_2_TITLE}', desc: '{CONTACT_POINT_2_DESC}' },
              { title: '{CONTACT_POINT_3_TITLE}', desc: '{CONTACT_POINT_3_DESC}' },
            ].map((p, i) => (
              <AnimatedSection key={i} delay={`${i * 0.1}s`}>
                <div className="glass rounded-2xl p-8 h-full">
                  <h3 className="text-lg font-bold font-heading text-text mb-2">{p.title}</h3>
                  <p className="text-text-muted text-sm leading-relaxed">{p.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>

          <AnimatedSection className="mt-12">
            <div className="glass rounded-2xl p-8 md:p-12 max-w-3xl mx-auto text-center">
              <h3 className="text-xl md:text-2xl font-bold font-heading text-text mb-4">
                {'{CONTACT_HELP_TITLE}'}
              </h3>
              <p className="text-text-muted leading-relaxed">
                {'{CONTACT_HELP_TEXT}'}
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
