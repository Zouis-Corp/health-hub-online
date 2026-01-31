import statsBanner from "@/assets/stats-banner.png";

const StatsSection = () => {
  return (
    <section className="w-full overflow-hidden">
      <img 
        src={statsBanner} 
        alt="How we have served you so far - 4K+ Cities Covered, 3L+ Orders Delivered, 100+ Diseases Medicine, ₹75Cr+ Rupees Saved" 
        className="w-full h-auto object-contain"
        style={{ maxWidth: '100%' }}
      />
    </section>
  );
};

export default StatsSection;
