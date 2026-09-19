import { useSEO } from '@/hooks/useSEO';
import Breadcrumbs from '@/components/Breadcrumbs';
import { FAQ as FAQSection, CTASection, type FAQItem } from '@/components/sections';
import { brand } from '@/brand';
import { mailtoHref } from '@/lib/email';

// 11 Q&A across four categories (each token emitted by the content pack for all
// 10 verticals): 3 general + 4 "good to know" + 2 billing + 2 support. Answers run
// 40-60 words, so the FAQ page ships 500+ words of specific, guess-ahead copy.
const general: FAQItem[] = [
  { question: '{FAQ_GEN_1_Q}', answer: '{FAQ_GEN_1_A}' },
  { question: '{FAQ_GEN_2_Q}', answer: '{FAQ_GEN_2_A}' },
  { question: '{FAQ_GEN_3_Q}', answer: '{FAQ_GEN_3_A}' },
];

const more: FAQItem[] = [
  { question: '{FAQ_MORE_1_Q}', answer: '{FAQ_MORE_1_A}' },
  { question: '{FAQ_MORE_2_Q}', answer: '{FAQ_MORE_2_A}' },
  { question: '{FAQ_MORE_3_Q}', answer: '{FAQ_MORE_3_A}' },
  { question: '{FAQ_MORE_4_Q}', answer: '{FAQ_MORE_4_A}' },
  { question: '{FAQ_MORE_5_Q}', answer: '{FAQ_MORE_5_A}' },
  { question: '{FAQ_MORE_6_Q}', answer: '{FAQ_MORE_6_A}' },
];

const billing: FAQItem[] = [
  { question: '{FAQ_BILL_1_Q}', answer: '{FAQ_BILL_1_A}' },
  { question: '{FAQ_BILL_2_Q}', answer: '{FAQ_BILL_2_A}' },
];

const support: FAQItem[] = [
  { question: '{FAQ_SUP_1_Q}', answer: '{FAQ_SUP_1_A}' },
  { question: '{FAQ_SUP_2_Q}', answer: '{FAQ_SUP_2_A}' },
];

export default function FAQPage() {
  useSEO({
    title: 'FAQ {BUSINESS_NAME} — {SEO_TAGLINE}',
    description: `Answers to the most common questions about ${brand.business.name}.`,
  });

  return (
    <>
      <Breadcrumbs baseUrl={brand.business.url} />
      <FAQSection
        items={general}
        eyebrow="General"
        headline="Frequently asked questions"
        description="Can't find what you're looking for? Press ⌘+K or use the search above."
        as="h1"
      />
      <FAQSection items={more} eyebrow="Good to know" headline="A few more answers" />
      <FAQSection items={billing} eyebrow="Billing" headline="Billing & subscriptions" />
      <FAQSection items={support} eyebrow="Support" headline="Help & support" />
      <CTASection
        eyebrow="Still have questions?"
        headline="We answer email within 24 hours"
        primary={mailtoHref(brand.business.email) ? { label: 'Email us', href: mailtoHref(brand.business.email) } : { label: 'Contact us', href: '/contact' }}
        tone="quiet"
      />
    </>
  );
}
