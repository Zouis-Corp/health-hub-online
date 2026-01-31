import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import HeroSection from "@/components/home/HeroSection";
import QuickActions from "@/components/home/QuickActions";
import PromoBanners from "@/components/home/PromoBanners";
import CategorySection from "@/components/home/CategorySection";
import DatabaseProductCarousel from "@/components/home/DatabaseProductCarousel";
import StatsSection from "@/components/home/StatsSection";
import ReviewsSection from "@/components/home/ReviewsSection";
import WhyChooseUs from "@/components/home/WhyChooseUs";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <QuickActions />
        <PromoBanners />
        <CategorySection />
        <DatabaseProductCarousel
          title="Prescription Medicines"
          subtitle="Specialty medicines requiring prescription - Quality assured from trusted manufacturers"
          filter="prescription"
          limit={10}
        />
        <DatabaseProductCarousel
          title="Over-the-Counter Products"
          subtitle="Health supplements & OTC medicines - No prescription needed"
          filter="otc"
          limit={10}
        />
        <StatsSection />
        <ReviewsSection />
        <WhyChooseUs />
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default Index;
