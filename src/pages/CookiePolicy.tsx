import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const CookiePolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container px-4 py-8 md:py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">Cookie Policy</span>
        </nav>

        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8">Cookie Policy</h1>
          
          <div className="prose prose-lg max-w-none space-y-6 text-muted-foreground">
            <p className="text-lg">
              Last updated: January 2026
            </p>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">What Are Cookies?</h2>
              <p>
                Cookies are small text files that are stored on your device when you visit our website. 
                They help us provide you with a better browsing experience by remembering your preferences 
                and understanding how you use our site.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Types of Cookies We Use</h2>
              
              <h3 className="text-lg font-medium text-foreground">Essential Cookies</h3>
              <p>
                These cookies are necessary for the website to function properly. They enable core 
                functionality such as security, network management, and account access.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Authentication cookies to keep you logged in</li>
                <li>Session cookies for shopping cart functionality</li>
                <li>Security cookies to prevent fraud</li>
              </ul>

              <h3 className="text-lg font-medium text-foreground">Functional Cookies</h3>
              <p>
                These cookies enable enhanced functionality and personalization:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Remembering your preferences and settings</li>
                <li>Storing your delivery address for faster checkout</li>
                <li>Language and region preferences</li>
              </ul>

              <h3 className="text-lg font-medium text-foreground">Analytics Cookies</h3>
              <p>
                We use analytics cookies to understand how visitors interact with our website:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Tracking page views and navigation patterns</li>
                <li>Understanding which products are most popular</li>
                <li>Identifying website performance issues</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Managing Cookies</h2>
              <p>
                You can control and manage cookies in your browser settings. Please note that 
                disabling certain cookies may affect the functionality of our website.
              </p>
              <p>
                Most browsers allow you to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>View what cookies are stored and delete them individually</li>
                <li>Block third-party cookies</li>
                <li>Block cookies from specific sites</li>
                <li>Block all cookies</li>
                <li>Delete all cookies when you close your browser</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Third-Party Cookies</h2>
              <p>
                Some cookies are placed by third-party services that appear on our pages:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Payment processors for secure transactions</li>
                <li>Analytics providers to help us improve our service</li>
                <li>Social media platforms for sharing functionality</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Updates to This Policy</h2>
              <p>
                We may update this Cookie Policy from time to time. We will notify you of any 
                significant changes by posting a notice on our website.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Contact Us</h2>
              <p>
                If you have questions about our use of cookies, please contact us:
              </p>
              <p>
                Email: <a href="mailto:support@tabletkart.in" className="text-primary hover:underline">support@tabletkart.in</a><br />
                Phone: <a href="tel:+919894818002" className="text-primary hover:underline">+91 98948 18002</a>
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CookiePolicy;
