import { CtaFooter } from "../components/landing/CtaFooter";
import { Features } from "../components/landing/Features";
import { Hero } from "../components/landing/Hero";
import { HowItWorks } from "../components/landing/HowItWorks";
import { Navbar } from "../components/landing/Navbar";
import { Pricing } from "../components/landing/Pricing";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Pricing />
      </main>
      <CtaFooter />
    </div>
  );
}
