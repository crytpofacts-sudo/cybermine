/*
 * CyberMine Home Page — Neon Metropolis Design
 * Assembles all sections into the complete landing page
 */
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ProtocolSection from "@/components/ProtocolSection";
import TokenomicsSection from "@/components/TokenomicsSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import TiersSection from "@/components/TiersSection";
import ReferralSection from "@/components/ReferralSection";
import BrandStorySection from "@/components/BrandStorySection";
import FAQSection from "@/components/FAQSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import ParticleBackground from "@/components/ParticleBackground";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#050510] text-white scan-line">
      <ParticleBackground />
      <Navbar />
      <main className="relative z-10">
        <HeroSection />
        <ProtocolSection />
        <BrandStorySection />
        <TokenomicsSection />
        <HowItWorksSection />
        <TiersSection />
        <ReferralSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
