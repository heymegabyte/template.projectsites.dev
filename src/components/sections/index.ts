export { AnnouncementBanner } from './AnnouncementBanner';
export { BentoGrid, type BentoTile } from './BentoGrid';
export { BlogList, type BlogPostSummary } from './BlogList';
export { CaseStudyGrid, type CaseStudy } from './CaseStudyCard';
export { CodeBlock } from './CodeBlock';
export { Comparison, type ComparisonRow } from './Comparison';
export { CTASection } from './CTASection';
export { Demo } from './Demo';
export { FAQ, type FAQItem } from './FAQ';
export { FeatureSplit } from './FeatureSplit';
export { HeroCenter, HeroSplit } from './HeroVariants';
export { WebGLHeroBackdrop, backdropForPreset, type HeroBackdropVariant } from './WebGLHeroBackdrop';
export { KineticHeadline } from './KineticHeadline';
export { LocationMap } from './LocationMap';
export { LogoCloud, type Logo } from './LogoCloud';
export { Marquee } from './Marquee';
export { MetricRow, type Metric } from './MetricRow';
export { Newsletter } from './Newsletter';
export { PageAudio } from './PageAudio';
export { Pricing, type PricingTier } from './Pricing';
export { ProcessSteps, type ProcessStep } from './ProcessSteps';
export { CinematicProcess, type CinematicProcessStep } from './CinematicProcess';
export { Quote } from './Quote';
export { SocialProof } from './SocialProof';
export { Spotlight } from './Spotlight';
export { Stats, type Stat } from './Stats';
export { Tabs, type TabItem } from './Tabs';
export { TeamGrid, type TeamMember } from './TeamGrid';
export { TeamRoles, type TeamRole } from './TeamRoles';
export { Timeline, type TimelineEvent } from './Timeline';
export { VideoEmbed } from './VideoEmbed';

// Industry-specific sections — first-class, tokenized, JSON-LD-emitting building
// blocks the container orchestrator (domain-builder) imports per business type,
// instead of improvising raw markup each build. See sections/AGENTS.md § Industry.
export { Menu, type MenuCategory, type MenuEntry } from './Menu';
export { ServiceMenu, type ServiceCategory, type ServiceEntry } from './ServiceMenu';
export { DonationTiers, type DonationTier } from './DonationTiers';
export { FeaturedCollection, type CollectionItem } from './FeaturedCollection';
