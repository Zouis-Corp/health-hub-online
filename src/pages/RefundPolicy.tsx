import { Link } from "react-router-dom";
import { ChevronRight, AlertTriangle } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const RefundPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-[120px] sm:pt-[130px] pb-20 sm:pb-6">
        <div className="container px-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">Refund Policy</span>
        </nav>

        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8">Refund Policy</h1>
          
          <Alert className="mb-8 border-destructive/50 bg-destructive/10">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <AlertTitle className="text-destructive font-semibold">No Return & No Refund Policy</AlertTitle>
            <AlertDescription className="text-destructive/80">
              Due to the nature of pharmaceutical products and health regulations, we do not accept returns 
              or provide refunds on medicines and healthcare products once delivered.
            </AlertDescription>
          </Alert>
          
          <div className="prose prose-lg max-w-none space-y-6 text-muted-foreground">
            <p className="text-lg">
              Last updated: January 2026
            </p>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Why No Returns?</h2>
              <p>
                As per pharmaceutical regulations and to ensure the safety and efficacy of medicines:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Medicines cannot be resold once sold to a customer</li>
                <li>We cannot verify the storage conditions of returned products</li>
                <li>Product integrity cannot be guaranteed after leaving our custody</li>
                <li>This policy protects all customers from receiving potentially compromised products</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Exceptions</h2>
              <p>
                We may consider exceptions in the following cases:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Damaged Products:</strong> If you receive damaged or broken products, 
                  report within 24 hours of delivery with photographic evidence</li>
                <li><strong>Wrong Products:</strong> If you receive incorrect items, contact us 
                  immediately for replacement</li>
                <li><strong>Expired Products:</strong> If you receive products past their expiry date, 
                  we will arrange a replacement</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">How to Report Issues</h2>
              <p>
                If you face any of the above exceptions, please:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Contact us within 24 hours of receiving your order</li>
                <li>Provide your order number and description of the issue</li>
                <li>Share clear photographs of the product and packaging</li>
                <li>Do not consume or use the product if reporting damage or wrong delivery</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Order Cancellation</h2>
              <p>
                You may cancel your order before it is shipped. Once the order is dispatched, 
                cancellation is not possible.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Cancellation requests must be made through our support channels</li>
                <li>Full refund will be processed for successfully cancelled orders</li>
                <li>Refunds are processed within 5-7 business days to the original payment method</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Contact Us</h2>
              <p>
                For any queries regarding our refund policy, please contact:
              </p>
              <p>
                Email: <a href="mailto:support@tabletkart.in" className="text-primary hover:underline">support@tabletkart.in</a><br />
                Phone: <a href="tel:+919894818002" className="text-primary hover:underline">+91 98948 18002</a><br />
                WhatsApp: <a href="https://wa.me/919894818002" className="text-primary hover:underline">+91 98948 18002</a>
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

export default RefundPolicy;
