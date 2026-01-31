import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Facebook, 
  Instagram, 
  Twitter, 
  Youtube, 
  Linkedin,
  MessageCircle
} from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-background border-t border-border pb-20 md:pb-0">
      {/* Main Footer */}
      <div className="container py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Company */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Company</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <a href="/#reviews" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Testimonials
                </a>
              </li>
            </ul>
          </div>

          {/* Speciality Medicine */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Speciality Medicine</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/shop?speciality=oncology" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Anti Cancer
                </Link>
              </li>
              <li>
                <Link to="/shop?speciality=hematology" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Blood Disorder
                </Link>
              </li>
              <li>
                <Link to="/shop?speciality=nephrology" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Kidney Disease
                </Link>
              </li>
              <li>
                <Link to="/shop?speciality=cardiology" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Heart Disorder
                </Link>
              </li>
              <li>
                <Link to="/shop?speciality=orthopedics" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Osteoporosis
                </Link>
              </li>
              <li>
                <Link to="/shop?condition=hiv-aids" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  HIV/AIDS
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Contact</h4>
            <ul className="space-y-3">
              <li>
                <a href="mailto:support@tabletkart.in" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  support@tabletkart.in
                </a>
              </li>
              <li>
                <a href="tel:+919894818002" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  +91 98948 18002
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Legal</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Terms And Conditions
                </Link>
              </li>
              <li>
                <Link to="/refund" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border">
        <div className="container py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Newsletter */}
            <div className="flex w-full md:w-auto justify-center md:justify-start">
              <div className="flex bg-purple-100 rounded-full p-1.5 w-full max-w-md md:w-auto">
                <Input
                  type="email"
                  placeholder="Enter email for Newsletter"
                  className="border-0 bg-transparent focus-visible:ring-0 rounded-full px-4 min-w-[200px] md:min-w-[250px] text-sm text-foreground placeholder:text-muted-foreground placeholder:text-xs"
                />
                <Button className="bg-primary hover:bg-primary/90 rounded-full px-6 md:px-8 font-semibold shadow-md">
                  Submit
                </Button>
              </div>
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-3">
              <a href="#" className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Copyright & Payment */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground">
              © 2026 TabletKart Technologies Pvt Ltd.
            </p>
            <div className="flex items-center gap-2 flex-wrap justify-center">
              {/* American Express */}
              <div className="h-8 w-12 rounded-md overflow-hidden shadow-sm">
                <svg viewBox="0 0 750 471" className="h-full w-full">
                  <rect fill="#016FD0" width="750" height="471" rx="20"/>
                  <path d="M632.24 227.91V208.7h-51.24v68.15h51.24v-19.21h-29.23v-8.31h28.52v-17.77h-28.52v-3.65h29.23zm-80.44 48.94h-26.24l-21.13-33.55v33.55H474v-68.15h26.77l20.99 33.29v-33.29h30.44v68.15zm-109.59 0h-57.46v-68.15h57.46v19.21h-34.42v6.81h33.55v17.77h-33.55v5.15h34.42v19.21zm-77.89 0h-25.02l-17.22-24.15-17.48 24.15h-24.76l29.43-35.86-28.57-32.29h25.43l16.68 23.08 16.53-23.08h24.36l-28.21 33.48 29.03 34.67h-.2zM309.4 247.12h-22.47v29.73h-22.73v-68.15h51.24c18.41 0 28.27 10.38 28.27 25.09 0 10.98-6.01 19.54-17.61 22.73l20.99 20.32h-26.77l-11.02-29.72h.1zm5.85-17.14c0-5.71-3.4-8.75-10.92-8.75h-17.4v17.77h17.4c7.52 0 10.92-3.31 10.92-9.02zm-164.31-21.28l-36.8 68.15h24.13l6.14-12.26h37.39l6.21 12.26h24.89l-36.99-68.15h-25.02.05zm4.91 40.1l10.49-20.65 10.52 20.65h-21.01z" fill="#FFF"/>
                </svg>
              </div>
              {/* Mastercard */}
              <div className="h-8 w-12 bg-white border border-gray-200 rounded-md overflow-hidden shadow-sm flex items-center justify-center">
                <svg viewBox="0 0 152 100" className="h-6 w-10">
                  <rect width="152" height="100" fill="white"/>
                  <circle cx="50" cy="50" r="35" fill="#EB001B"/>
                  <circle cx="102" cy="50" r="35" fill="#F79E1B"/>
                  <path d="M76 22.5a35 35 0 000 55 35 35 0 000-55z" fill="#FF5F00"/>
                </svg>
              </div>
              {/* Visa */}
              <div className="h-8 w-12 bg-white border border-gray-200 rounded-md overflow-hidden shadow-sm flex items-center justify-center">
                <svg viewBox="0 0 750 471" className="h-5 w-10">
                  <path d="M278.2 334.2l33.4-186h53.4l-33.4 186zm146.6-181.3c-10.5-4-27-8.4-47.6-8.4-52.4 0-89.4 26.3-89.7 64-0.3 27.9 26.4 43.4 46.5 52.7 20.7 9.5 27.6 15.6 27.5 24.1-0.1 13-16.5 18.9-31.7 18.9-21.2 0-32.5-2.9-49.9-10.2l-6.8-3.1-7.4 43c12.4 5.4 35.3 10.1 59.1 10.3 55.8 0 92-26 92.4-66.2 0.2-22.1-13.9-38.9-44.6-52.7-18.6-9-30-15-29.9-24.1 0-8.1 9.6-16.8 30.5-16.8 17.4-0.3 30 3.5 39.8 7.5l4.8 2.3 7.2-41.3m131.8-4.7h-41c-12.7 0-22.2 3.5-27.8 16.2l-78.8 177.5h55.7s9.1-23.9 11.2-29.1h68.1c1.6 6.8 6.5 29.1 6.5 29.1h49.2l-42.9-193.7zm-65.5 125c4.4-11.2 21.2-54.3 21.2-54.3-0.3 0.5 4.4-11.3 7.1-18.6l3.6 16.8s10.2 46.3 12.3 56.1h-44.2zm-262.9-125l-52 132.4-5.5-27c-9.6-30.8-39.6-64.2-73.2-80.9l47.5 169.4h56.1l83.4-193.9h-56.3" fill="#1A1F71"/>
                  <path d="M131.9 148h-85.5l-0.6 3.6c66.5 16 110.5 54.7 128.8 101.2l-18.6-89.1c-3.2-12.2-12.5-15.4-24.1-15.7" fill="#F9A533"/>
                </svg>
              </div>
              {/* RuPay */}
              <div className="h-8 w-12 bg-white border border-gray-200 rounded-md overflow-hidden shadow-sm flex items-center justify-center">
                <svg viewBox="0 0 100 60" className="h-5 w-9">
                  <rect fill="#FFF" width="100" height="60"/>
                  <path d="M10 15h18c8 0 12 4 12 12s-4 12-12 12h-10v12h-8V15zm8 17h9c3 0 5-2 5-5s-2-5-5-5h-9v10z" fill="#097A44"/>
                  <text x="45" y="38" fontSize="16" fontWeight="bold" fill="#F37021">u</text>
                  <path d="M62 15h18c8 0 12 4 12 12 0 6-3 10-8 11l10 13h-10l-9-12h-5v12h-8V15zm8 17h9c3 0 5-2 5-5s-2-5-5-5h-9v10z" fill="#097A44"/>
                </svg>
              </div>
              {/* Net Banking */}
              <div className="h-8 w-12 bg-gradient-to-br from-teal-500 to-teal-700 rounded-md overflow-hidden shadow-sm flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="white">
                  <path d="M12 2L2 7v2h20V7L12 2zm0 2.5L18 7H6l6-2.5zM4 10v8h2v-8H4zm5 0v8h2v-8H9zm5 0v8h2v-8h-2zm5 0v8h2v-8h-2zM2 19v2h20v-2H2z"/>
                </svg>
              </div>
              {/* COD */}
              <div className="h-8 w-12 bg-gradient-to-br from-amber-400 to-amber-500 rounded-md overflow-hidden shadow-sm flex items-center justify-center">
                <span className="text-[9px] font-bold text-slate-800">COD</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp FAB */}
      <a
        href="https://wa.me/919894818002"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 w-12 h-12 md:w-14 md:h-14 bg-green-500 rounded-full shadow-lg flex items-center justify-center text-white hover:bg-green-600 transition-colors z-40"
      >
        <svg 
          className="h-6 w-6 md:h-7 md:w-7" 
          viewBox="0 0 24 24" 
          fill="currentColor"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>
    </footer>
  );
};

export default Footer;
