import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "Rajesh Kumar",
    location: "Mumbai, Maharashtra",
    rating: 5,
    text: "TabletKart has been a lifesaver for my mother's cancer medication. Genuine products, timely delivery, and the support team is incredibly helpful.",
    date: "2 weeks ago",
  },
  {
    id: 2,
    name: "Priya Sharma",
    location: "Delhi",
    rating: 5,
    text: "I've been ordering my diabetes medicines from TabletKart for over a year now. The prices are competitive and I never have to worry about authenticity.",
    date: "1 month ago",
  },
  {
    id: 3,
    name: "Anand Patel",
    location: "Ahmedabad, Gujarat",
    rating: 5,
    text: "The prescription upload feature is so convenient. I just upload and they take care of everything. Highly recommended for specialty medicines.",
    date: "3 weeks ago",
  },
];

const Testimonials = () => {
  return (
    <section className="py-16 bg-background">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
            What Our Customers Say
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust TabletKart for their healthcare needs.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="p-6 bg-card rounded-2xl border border-border shadow-card hover:shadow-hover transition-all duration-300"
            >
              {/* Quote Icon */}
              <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center mb-4">
                <Quote className="h-5 w-5 text-primary" />
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-premium-gold text-premium-gold" />
                ))}
              </div>

              {/* Text */}
              <p className="text-foreground mb-6 leading-relaxed">
                "{testimonial.text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <div className="w-10 h-10 bg-gradient-hero rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center p-6 bg-card rounded-2xl border border-border">
            <p className="text-3xl md:text-4xl font-heading font-bold text-primary mb-1">50K+</p>
            <p className="text-sm text-muted-foreground">Happy Customers</p>
          </div>
          <div className="text-center p-6 bg-card rounded-2xl border border-border">
            <p className="text-3xl md:text-4xl font-heading font-bold text-trust-green mb-1">10K+</p>
            <p className="text-sm text-muted-foreground">Products</p>
          </div>
          <div className="text-center p-6 bg-card rounded-2xl border border-border">
            <p className="text-3xl md:text-4xl font-heading font-bold text-medical-blue mb-1">500+</p>
            <p className="text-sm text-muted-foreground">Cities Served</p>
          </div>
          <div className="text-center p-6 bg-card rounded-2xl border border-border">
            <p className="text-3xl md:text-4xl font-heading font-bold text-secondary mb-1">4.8★</p>
            <p className="text-sm text-muted-foreground">Average Rating</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
