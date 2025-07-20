import CTASection from "./cta-section";
import FeaturesSection from "./features-section";
import HeroSection from "./hero-section";

export default function HomeView() {
  return (
    <div className="relative mx-auto flex w-full max-w-7xl flex-col overflow-hidden">
      <HeroSection />
      <FeaturesSection />
      <CTASection />
    </div>
  );
}
