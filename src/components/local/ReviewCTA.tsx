import { Star, MessageSquare, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { cdnImageProps } from '@/lib/cdn-image';

interface ReviewCTAProps {
  placeId: string;
  businessName: string;
  qrCodeSrc?: string;
}

/**
 * `ReviewCTA` — a smart review gate: 4-5 stars route to a public Google review, 1-3 stars open
 * a private feedback form (protects the public rating while still capturing the signal). Cinematic
 * + theme-token: a `card-tactile` panel floats over a soft OKLCH accent aura, the star icon badge
 * carries an accent ring, the picker stars glow + spring on hover, and the whole card reveals on
 * scroll. Legible on light AND dark verticals — the old hardcoded `text-white`/`bg-white/5` assumed
 * a dark canvas, and the "Send Feedback" button referenced a non-existent `--color-primary` token
 * (invisible background); both fixed to real theme tokens.
 */
export default function ReviewCTA({ placeId, businessName, qrCodeSrc }: ReviewCTAProps) {
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const googleReviewUrl = `https://search.google.com/local/writereview?placeid=${placeId}`;

  // Responsive + modern-format props for the QR image if it's ever a remote CDN URL. QR codes are
  // normally local/data-URIs, so this is a safe no-op (returns { src } unchanged) in the common case.
  // Additive (falls back to src); no-op for non-CDN URLs.
  const qrImg = qrCodeSrc ? cdnImageProps(qrCodeSrc, '(max-width: 768px) 40vw, 160px') : null;

  const track = (event: string, props?: Record<string, unknown>) => {
    window.gtag?.('event', event, props);
    window.posthog?.capture(event, props);
  };

  const handleStarClick = (star: number) => {
    setRating(star);
    track('review_star_select', { rating: star, business: businessName });

    if (star >= 4) {
      track('review_click', { rating: star, destination: 'google' });
      window.open(googleReviewUrl, '_blank', 'noopener,noreferrer');
    } else {
      setShowFeedback(true);
    }
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    track('private_feedback_submit', { rating, business: businessName });
    setSubmitted(true);
  };

  return (
    <section className="py-16">
      <div className="max-w-lg mx-auto px-6 reveal-on-view">
        <div className="review-cta relative card-tactile rounded-2xl p-8 text-center overflow-hidden">
          {/* soft accent aura */}
          <div className="review-cta-aura" aria-hidden="true" />

          <div className="relative z-10">
            {!submitted ? (
              <>
                <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-[var(--color-accent)]/12 ring-1 ring-accent/30 flex items-center justify-center">
                  <Star size={28} className="text-accent" />
                </div>

                <h2 className="text-2xl font-heading font-bold text-text mb-2 text-balance">Love our service?</h2>
                <p className="text-text-muted text-sm mb-6">Your review helps others find {businessName}</p>

                {/* Star picker */}
                <div className="flex justify-center gap-2 mb-6" role="radiogroup" aria-label="Rate your experience">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const lit = star <= (hoveredStar || rating);
                    return (
                      <button
                        key={star}
                        onClick={() => handleStarClick(star)}
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(0)}
                        className="p-1 transition-transform hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 rounded motion-reduce:transition-none motion-reduce:hover:scale-100"
                        aria-label={`${star} star${star > 1 ? 's' : ''}`}
                        role="radio"
                        aria-checked={rating === star}
                      >
                        <Star
                          size={36}
                          className={lit ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_7px_rgba(250,204,21,0.5)]' : ''}
                          style={lit ? undefined : { color: 'var(--color-text-subtle)', opacity: 0.4 }}
                        />
                      </button>
                    );
                  })}
                </div>

                {/* Private feedback form */}
                {showFeedback && (
                  <form onSubmit={handleFeedbackSubmit} className="space-y-4 motion-safe:animate-[fadeIn_200ms_ease-out]">
                    <div className="flex items-center gap-2 text-text-muted text-sm mb-2">
                      <MessageSquare size={16} />
                      <span>We&apos;d love to hear how we can improve</span>
                    </div>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Tell us what happened..."
                      rows={4}
                      className="w-full card-tactile rounded-lg px-4 py-3 text-text text-sm placeholder:text-text-muted focus:outline-none focus:border-accent/50 resize-none"
                      required
                    />
                    <button
                      type="submit"
                      className="w-full bg-accent hover:bg-accent-hover text-[var(--color-on-accent)] font-semibold py-3 rounded-lg transition-all hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                    >
                      Send Feedback
                    </button>
                  </form>
                )}

                {/* QR Code */}
                {qrCodeSrc && !showFeedback && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <p className="text-text-muted text-xs mb-3">Or scan to review</p>
                    <img
                      src={qrImg?.src ?? qrCodeSrc}
                      srcSet={qrImg?.srcSet}
                      sizes={qrImg?.sizes}
                      alt="Scan to leave a review"
                      className="w-28 h-28 mx-auto rounded-lg bg-surface p-1"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                )}

                {!showFeedback && (
                  <a
                    href={googleReviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-accent hover:text-accent/80 text-sm font-medium mt-6 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 rounded"
                    onClick={() => track('review_click', { source: 'direct_link' })}
                  >
                    <ExternalLink size={14} />
                    Write a review on Google
                  </a>
                )}
              </>
            ) : (
              <div className="py-4 motion-safe:animate-[fadeIn_220ms_ease-out]">
                <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-green-500/10 ring-1 ring-green-500/30 flex items-center justify-center">
                  <MessageSquare size={28} className="text-green-400" />
                </div>
                <h3 className="text-xl font-heading font-bold text-text mb-2">Thank you!</h3>
                <p className="text-text-muted text-sm">Your feedback helps us serve you better.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
