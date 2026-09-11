import { AccessSection } from "@/components/landing/AccessSection";
import { CustomerSection } from "@/components/landing/CustomerSection";
import { FeatureSection } from "@/components/landing/FeatureSection";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { PlatformStrip } from "@/components/landing/PlatformStrip";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

export function LandingPage() {
  return (
    <div className="site-shell">
      <SiteHeader />
      <main>
        <HeroSection />
        <PlatformStrip />
        <FeatureSection />
        <HowItWorksSection />
        <CustomerSection />
        <AccessSection />
      </main>
      <SiteFooter />
    </div>
  );
}
