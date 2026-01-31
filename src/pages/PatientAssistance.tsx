import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronRight,
  HeartHandshake,
  FileCheck,
  Users,
  Phone,
  CheckCircle2,
  ArrowRight,
  Pill,
  Shield,
  Clock,
  BadgePercent,
} from "lucide-react";
import papImage from "@/assets/pap.svg";

const programs = [
  {
    id: 1,
    name: "Novartis Patient Assistance Program",
    brand: "Novartis",
    medicines: ["Gleevec", "Tasigna", "Jakavi"],
    discount: "Up to 100%",
    eligibility: "Income-based criteria",
    icon: "💊",
  },
  {
    id: 2,
    name: "Roche Patient Support Program",
    brand: "Roche",
    medicines: ["Herceptin", "Avastin", "Perjeta"],
    discount: "Up to 50%",
    eligibility: "All patients eligible",
    icon: "💉",
  },
  {
    id: 3,
    name: "Pfizer RxPathways",
    brand: "Pfizer",
    medicines: ["Ibrance", "Xalkori", "Lorbrena"],
    discount: "Up to 75%",
    eligibility: "Insurance status based",
    icon: "🏥",
  },
  {
    id: 4,
    name: "Eli Lilly Cares Foundation",
    brand: "Eli Lilly",
    medicines: ["Mounjaro", "Trulicity", "Verzenio"],
    discount: "Up to 80%",
    eligibility: "Income verification required",
    icon: "💊",
  },
  {
    id: 5,
    name: "Bristol Myers Squibb Patient Assistance",
    brand: "BMS",
    medicines: ["Opdivo", "Sprycel", "Revlimid"],
    discount: "Up to 100%",
    eligibility: "Uninsured patients",
    icon: "🏥",
  },
  {
    id: 6,
    name: "AstraZeneca Access 360",
    brand: "AstraZeneca",
    medicines: ["Tagrisso", "Lynparza", "Imfinzi"],
    discount: "Up to 60%",
    eligibility: "Financial need assessment",
    icon: "💉",
  },
];

const steps = [
  {
    step: 1,
    title: "Check Eligibility",
    description: "Verify if you qualify based on income, insurance status, and medical requirements.",
    icon: FileCheck,
  },
  {
    step: 2,
    title: "Submit Application",
    description: "Complete the application form with required documents and prescription.",
    icon: Users,
  },
  {
    step: 3,
    title: "Get Approved",
    description: "Receive approval within 5-7 business days and start saving on medications.",
    icon: CheckCircle2,
  },
];

const benefits = [
  {
    title: "Significant Savings",
    description: "Save up to 100% on expensive specialty medications",
    icon: BadgePercent,
  },
  {
    title: "Expert Guidance",
    description: "Our team helps you navigate the application process",
    icon: Users,
  },
  {
    title: "Fast Processing",
    description: "Quick turnaround time for application review",
    icon: Clock,
  },
  {
    title: "Genuine Medicines",
    description: "All medications are sourced directly from manufacturers",
    icon: Shield,
  },
];

const PatientAssistance = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-[100px] sm:pt-[110px] pb-20 sm:pb-6">
        {/* Breadcrumb */}
        <div className="container py-4">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-primary">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">Patient Assistance Program</span>
          </nav>
        </div>

        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-8 md:py-12 lg:py-16">
          <div className="container">
            <div className="grid lg:grid-cols-2 gap-6 md:gap-8 items-center">
              <div className="text-center lg:text-left">
                <Badge className="mb-3 md:mb-4 bg-secondary/20 text-secondary border-secondary/30">
                  <HeartHandshake className="h-3 w-3 mr-1" />
                  Making Healthcare Affordable
                </Badge>
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground font-heading mb-3 md:mb-4">
                  Patient Assistance Program
                </h1>
                <p className="text-base md:text-lg text-muted-foreground mb-4 md:mb-6">
                  Get access to life-saving medications at significantly reduced costs or even free 
                  through manufacturer-sponsored patient assistance programs.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 w-full sm:w-auto">
                    <Phone className="h-4 w-4" />
                    <span className="text-sm md:text-base">Call: +91 98948 18002</span>
                  </Button>
                  <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto">
                    Check Eligibility
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex justify-center order-first lg:order-last">
                <img 
                  src={papImage} 
                  alt="Patient Assistance" 
                  className="w-full max-w-xs md:max-w-md"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-8 md:py-12 lg:py-16">
          <div className="container">
            <div className="text-center mb-6 md:mb-10">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground font-heading mb-2 md:mb-3">
                Why Choose Our PAP Services?
              </h2>
              <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
                We simplify the process of accessing patient assistance programs
              </p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
              {benefits.map((benefit, index) => (
                <Card key={index} className="border-border hover:shadow-lg transition-shadow">
                  <CardContent className="p-4 md:p-6 text-center">
                    <div className="w-10 h-10 md:w-14 md:h-14 mx-auto mb-3 md:mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                      <benefit.icon className="h-5 w-5 md:h-7 md:w-7 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground text-sm md:text-base mb-1 md:mb-2">{benefit.title}</h3>
                    <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 md:line-clamp-none">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-8 md:py-12 lg:py-16 bg-muted/30">
          <div className="container">
            <div className="text-center mb-6 md:mb-10">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground font-heading mb-2 md:mb-3">
                How It Works
              </h2>
              <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
                Three simple steps to access patient assistance programs
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {steps.map((step, index) => (
                <div key={step.step} className="relative">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl md:text-2xl font-bold mb-3 md:mb-4">
                      {step.step}
                    </div>
                    <h3 className="text-base md:text-lg font-semibold text-foreground mb-1.5 md:mb-2">{step.title}</h3>
                    <p className="text-muted-foreground text-sm">{step.description}</p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-[60%] w-[80%] border-t-2 border-dashed border-border" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Available Programs */}
        <section className="py-8 md:py-12 lg:py-16">
          <div className="container">
            <div className="text-center mb-6 md:mb-10">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground font-heading mb-2 md:mb-3">
                Available Assistance Programs
              </h2>
              <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
                Explore manufacturer-sponsored programs that can help reduce your medication costs
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {programs.map((program) => (
                <Card key={program.id} className="border-border hover:shadow-lg transition-all group">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-start justify-between mb-3 md:mb-4">
                      <div className="text-3xl md:text-4xl">{program.icon}</div>
                      <Badge className="bg-secondary/20 text-secondary border-0 text-xs md:text-sm">
                        {program.discount}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-foreground text-sm md:text-base mb-1 group-hover:text-primary transition-colors line-clamp-2">
                      {program.name}
                    </h3>
                    <p className="text-xs md:text-sm text-muted-foreground mb-2 md:mb-3">by {program.brand}</p>
                    <div className="space-y-1.5 md:space-y-2 mb-3 md:mb-4">
                      <div className="flex items-center gap-2 text-xs md:text-sm">
                        <Pill className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary flex-shrink-0" />
                        <span className="text-muted-foreground line-clamp-1">
                          {program.medicines.slice(0, 2).join(", ")}
                          {program.medicines.length > 2 && ` +${program.medicines.length - 2} more`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs md:text-sm">
                        <CheckCircle2 className="h-3.5 w-3.5 md:h-4 md:w-4 text-secondary flex-shrink-0" />
                        <span className="text-muted-foreground line-clamp-1">{program.eligibility}</span>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full gap-2 text-sm group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors">
                      Learn More
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-8 md:py-12 lg:py-16 bg-primary text-primary-foreground">
          <div className="container text-center px-4">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold font-heading mb-3 md:mb-4">
              Need Help with Your Application?
            </h2>
            <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-4 md:mb-6 text-sm md:text-base">
              Our dedicated team is here to guide you through the entire process. 
              Contact us today for personalized assistance.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4">
              <Button size="lg" variant="secondary" className="gap-2 w-full sm:w-auto">
                <Phone className="h-4 w-4" />
                +91 98948 18002
              </Button>
              <Link to="/upload-prescription" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 gap-2 w-full">
                  Upload Prescription
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default PatientAssistance;
