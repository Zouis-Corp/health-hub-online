import { Shield, Truck, BadgePercent, Clock, Award, Users } from "lucide-react";

const features = [
  {
    icon: BadgePercent,
    title: "Up to 85% Savings",
    description: "Get genuine medicines at the lowest prices in India",
  },
  {
    icon: Shield,
    title: "100% Genuine",
    description: "All medicines sourced from licensed distributors",
  },
  {
    icon: Truck,
    title: "Pan India Delivery",
    description: "Fast delivery to every corner of India",
  },
  {
    icon: Clock,
    title: "24/7 Support",
    description: "Round-the-clock customer assistance",
  },
];

const AboutSection = () => {
  return (
    <section className="py-10 md:py-16 bg-gradient-to-b from-background to-muted/30">
      <div className="container px-4">
        {/* Main About Content */}
        <div className="max-w-4xl mx-auto text-center mb-10 md:mb-14">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground font-heading mb-4 md:mb-6">
            India's Most Trusted Online Pharmacy
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed mb-4">
            <strong className="text-foreground">TabletKart</strong> is India's leading online pharmacy, 
            dedicated to making healthcare affordable and accessible for every Indian. We specialize in 
            providing <strong className="text-foreground">prescription medicines</strong>, 
            <strong className="text-foreground"> super speciality drugs</strong>, 
            <strong className="text-foreground"> cancer medicines</strong>, and 
            <strong className="text-foreground"> over-the-counter healthcare products</strong> at 
            discounts of up to 85% compared to retail prices.
          </p>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            As a licensed and registered pharmacy, we source all medicines directly from authorized 
            manufacturers and distributors, ensuring you receive 100% genuine products. Whether you need 
            affordable generic medicines, hard-to-find speciality drugs, or regular prescriptions, 
            TabletKart delivers quality healthcare to your doorstep across India — from metros like 
            Delhi, Mumbai, Chennai, Bangalore, Kolkata, and Hyderabad to tier-2 and tier-3 cities.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="text-center p-4 md:p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-12 h-12 md:w-14 md:h-14 mx-auto mb-3 md:mb-4 rounded-xl bg-primary/10 flex items-center justify-center">
                <feature.icon className="h-6 w-6 md:h-7 md:w-7 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground text-sm md:text-base mb-1 md:mb-2">
                {feature.title}
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="mt-10 md:mt-14 text-center">
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-sm md:text-base font-medium">50,000+ Happy Customers</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              <span className="text-sm md:text-base font-medium">Licensed Pharmacy</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="text-sm md:text-base font-medium">Secure Payments</span>
            </div>
          </div>
        </div>

        {/* SEO-Rich Content (Hidden visually but readable by search engines) */}
        <div className="sr-only">
          <h3>Buy Medicines Online in India</h3>
          <p>
            Looking to buy medicines online in India? TabletKart is your one-stop destination for 
            all pharmaceutical needs. We offer a wide range of prescription medicines, generic drugs, 
            OTC products, and super speciality medicines including cancer drugs, oncology medicines, 
            immunosuppressants, and more.
          </p>
          <h3>Why Choose TabletKart for Online Medicine Purchase?</h3>
          <ul>
            <li>Up to 85% discount on medicines</li>
            <li>100% genuine and authentic medicines</li>
            <li>Licensed online pharmacy in India</li>
            <li>Free home delivery across India</li>
            <li>Easy prescription upload</li>
            <li>Secure online payment options</li>
            <li>Temperature-controlled shipping for sensitive medicines</li>
            <li>Patient assistance programs available</li>
          </ul>
          <h3>Cities We Serve</h3>
          <p>
            TabletKart delivers medicines to all major cities in India including Mumbai, Delhi, 
            Bangalore, Chennai, Hyderabad, Kolkata, Pune, Ahmedabad, Jaipur, Lucknow, Kanpur, 
            Nagpur, Indore, Thane, Bhopal, Visakhapatnam, Patna, Vadodara, Ghaziabad, Ludhiana, 
            Agra, Nashik, Faridabad, Meerut, Rajkot, Varanasi, Srinagar, Aurangabad, Dhanbad, 
            Amritsar, Allahabad, Ranchi, Coimbatore, Jabalpur, Gwalior, Vijayawada, Jodhpur, 
            Madurai, Raipur, Kota, and many more cities and towns across India.
          </p>
          <h3>Categories of Medicines Available</h3>
          <p>
            We offer medicines across various categories: Oncology and Cancer medicines, Cardiology 
            medicines, Diabetes medicines, Neurology medicines, Gastroenterology medicines, 
            Respiratory medicines, Dermatology medicines, Orthopedic medicines, Ophthalmology 
            medicines, ENT medicines, Psychiatric medicines, Immunology medicines, Nephrology 
            medicines, Hepatology medicines, and general healthcare products.
          </p>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
