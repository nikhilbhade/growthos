import { accessRequestHref } from "@/content/landing";
import { GoogleSignInButton } from "@/components/ui/GoogleSignInButton";
import { SectionEyebrow } from "@/components/ui/SectionEyebrow";
import { AnalyticsPreview } from "@/components/landing/AnalyticsPreview";

export function HeroSection() {
  return (
    <section className="hero-section">
      <div className="hero-copy">
        <SectionEyebrow>Built for multi-location restaurants</SectionEyebrow>
        <h1>Every growth decision, <em>grounded in what happened.</em></h1>
        <p className="hero-intro">GradientOS brings paid media, delivery marketplaces, and restaurant outcomes into one decision system, so teams can see the signal, understand the trade-off, and move with confidence.</p>
        <div className="hero-actions">
          <a className="button button-primary" href={accessRequestHref}>Request access <span>→</span></a>
          <GoogleSignInButton />
        </div>
        <p className="hero-note">Already a customer? Sign in securely to open your GradientOS workspace.</p>
      </div>
      <AnalyticsPreview />
    </section>
  );
}
