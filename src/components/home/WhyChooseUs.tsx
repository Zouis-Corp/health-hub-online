import { Factory, Plane, ShieldCheck, Percent } from "lucide-react";

const features = [
  {
    id: 1,
    title: "Directly from Manufacturers",
    icon: Factory,
  },
  {
    id: 2,
    title: "Quick Air Delivery",
    icon: Plane,
  },
  {
    id: 3,
    title: "Genuine Medicines",
    icon: ShieldCheck,
  },
  {
    id: 4,
    title: "Up-to 85% Discount",
    icon: Percent,
  },
];

const WhyChooseUs = () => {
  return (
    <section className="py-8 sm:py-10 md:py-14 bg-primary/5 pb-24 md:pb-14">
      <div className="container px-4 sm:px-6">
        <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-center text-foreground mb-6 sm:mb-8 md:mb-10 font-heading">
          Why TabletKart?
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6 max-w-5xl mx-auto">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.id}
                className="flex flex-col items-center text-center p-5 sm:p-6 md:p-8 bg-white rounded-2xl border border-primary/10 shadow-sm hover:shadow-md hover:border-primary/20 transition-all"
              >
                {/* Purple Icon Circle */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Icon className="h-7 w-7 sm:h-8 sm:w-8 text-primary" strokeWidth={1.5} />
                </div>
                
                {/* Title */}
                <p className="font-semibold text-foreground text-sm sm:text-base leading-snug">
                  {feature.title}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
