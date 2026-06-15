import { Nav } from "@/components/navigation/Nav";
import { Hero } from "@/components/hero/Hero";
import { Features } from "@/components/features/Features";
import { DashboardPreview } from "@/components/dashboard/DashboardPreview";
import { Testimonials } from "@/components/testimonials/Testimonials";
import { Pricing } from "@/components/pricing/Pricing";
import { FinalCTA } from "@/components/cta/FinalCTA";
import { Footer } from "@/components/footer/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Nav />
      <Hero />
      <DashboardPreview />
      <section id="features">
        <Features />
      </section>
      <Testimonials />
      <Pricing />
      <FinalCTA />
      <Footer />
    </main>
  );
}
