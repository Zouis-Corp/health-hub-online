import { Button } from "@/components/ui/button";
import { Upload, ArrowRight, Shield, Clock, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

const PrescriptionBanner = () => {
  return (
    <section className="py-16 bg-background">
      <div className="container">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-8 md:p-12">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
          </div>

          <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
            {/* Content */}
            <div className="text-primary-foreground">
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
                Upload Your Prescription
              </h2>
              <p className="text-primary-foreground/80 text-lg mb-6">
                Simply upload your prescription and our expert pharmacists will process your order with genuine medicines delivered to your doorstep.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm">Quick Processing</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  <span className="text-sm">100% Genuine</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <span className="text-sm">Same Day Dispatch</span>
                </div>
              </div>

              <Link to="/upload-prescription">
                <Button variant="premium" size="xl" className="group">
                  <Upload className="h-5 w-5" />
                  Upload Prescription Now
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

            {/* Visual */}
            <div className="hidden md:flex justify-center">
              <div className="relative">
                <div className="w-64 h-80 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 flex flex-col items-center justify-center">
                  <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                    <Upload className="h-10 w-10 text-primary-foreground" />
                  </div>
                  <p className="text-primary-foreground font-medium text-center mb-2">
                    Drop your prescription here
                  </p>
                  <p className="text-primary-foreground/70 text-sm text-center">
                    JPG, PNG, PDF up to 5MB
                  </p>
                </div>
                
                {/* Floating elements */}
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-white rounded-xl shadow-xl flex items-center justify-center animate-float">
                  <span className="text-2xl">📋</span>
                </div>
                <div className="absolute -bottom-4 -left-4 w-14 h-14 bg-premium-gold rounded-xl shadow-xl flex items-center justify-center animate-float" style={{ animationDelay: "1s" }}>
                  <span className="text-xl">✓</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PrescriptionBanner;
