import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingTrustBar } from "@/components/landing/LandingTrustBar";
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingShowcase } from "@/components/landing/LandingShowcase";
import { LandingTestimonials } from "@/components/landing/LandingTestimonials";
import { LandingHowItWorks } from "@/components/landing/LandingHowItWorks";
import { LandingPricing } from "@/components/landing/LandingPricing";
import { LandingCTA } from "@/components/landing/LandingCTA";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { WhatsAppFloating } from "@/components/landing/WhatsAppFloating";

export default function LandingPage() {
  return (
    <div className="h-full overflow-auto bg-background">
      <LandingNavbar />
      <LandingHero />
      <LandingTrustBar />
      <LandingFeatures />
      <LandingShowcase />
      <LandingTestimonials />
      <LandingHowItWorks />
      <LandingPricing />
      <LandingCTA />
      <LandingFooter />
      <WhatsAppFloating />
    </div>
  );
}
