import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const TermsConditions = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-[120px] sm:pt-[130px] pb-20 sm:pb-6">
        <div className="container px-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">Terms and Conditions</span>
        </nav>

        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8">Terms and Conditions</h1>
          
          <div className="prose prose-lg max-w-none space-y-6 text-muted-foreground">
            <p className="text-lg">
              Last updated: January 2026
            </p>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">1. Business Information</h2>
              <p>
                TabletKart is a trade name operated by <strong>Nanmai Pharmacy B</strong>. All references to 
                "TabletKart," "we," "us," or "our" in these Terms and Conditions refer to Nanmai Pharmacy B.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">2. Acceptance of Terms</h2>
              <p>
                By accessing and using TabletKart's website and services, you agree to be bound by these 
                Terms and Conditions. If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">3. Prescription Requirements</h2>
              <p>
                Certain medicines require a valid prescription from a licensed medical practitioner. 
                You must upload a valid prescription before ordering prescription medicines. Our licensed 
                pharmacists will verify all prescriptions before processing orders.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Prescriptions must be from licensed medical practitioners</li>
                <li>Prescriptions must be legible and include all required information</li>
                <li>We reserve the right to reject invalid or suspicious prescriptions</li>
                <li>Prescription medicines will not be dispensed without valid prescriptions</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">4. Orders and Payment</h2>
              <p>
                All orders are subject to availability and confirmation. We reserve the right to refuse 
                or cancel orders for any reason, including pricing errors or suspected fraud.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Prices are subject to change without notice</li>
                <li>Payment must be completed before order processing</li>
                <li>We accept multiple payment methods including cards, UPI, and net banking</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">5. Delivery</h2>
              <p>
                We strive to deliver your orders within the estimated timeframe. However, delivery times 
                may vary based on location, product availability, and other factors beyond our control.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">5. User Responsibilities</h2>
              <p>You agree to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide accurate and complete information</li>
                <li>Use medicines only as prescribed by your doctor</li>
                <li>Not resell or distribute purchased medicines</li>
                <li>Keep your account credentials secure</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">6. Limitation of Liability</h2>
              <p>
                TabletKart is not liable for any indirect, incidental, or consequential damages arising 
                from the use of our services. Our liability is limited to the amount paid for the specific 
                order in question.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">7. Contact Us</h2>
              <p>
                For questions about these Terms and Conditions, contact us at:
              </p>
              <p>
                Email: <a href="mailto:support@tabletkart.in" className="text-primary hover:underline">support@tabletkart.in</a><br />
                Phone: <a href="tel:+919894818002" className="text-primary hover:underline">+91 98948 18002</a>
              </p>
            </section>
          </div>
        </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermsConditions;
