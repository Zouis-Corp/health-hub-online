import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ChevronRight, Phone, Mail, MessageCircle, Send, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  phone: z.string().trim().min(10, "Phone number must be at least 10 digits").max(15, "Phone number is too long"),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(1000, "Message must be less than 1000 characters"),
});

const ContactUs = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate form data
    const result = contactSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    
    toast({
      title: "Message Sent!",
      description: "We'll get back to you within 24 hours.",
    });

    // Reset form after 3 seconds
    setTimeout(() => {
      setFormData({ name: "", email: "", phone: "", message: "" });
      setIsSubmitted(false);
    }, 3000);
  };

  const contactInfo = {
    whatsapp: "+91 98765 43210",
    phone: "+91 98765 43210",
    email: "support@tabletkart.in",
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-[100px] sm:pt-[110px] pb-20 sm:pb-6">
        <div className="container px-3 sm:px-4 lg:px-8 max-w-5xl">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link to="/" className="hover:text-primary">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">Contact Us</span>
          </nav>

          {/* Page Header */}
          <div className="text-center mb-10">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground font-heading mb-2">
              Get in Touch
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Have questions about your order or need assistance? We're here to help!
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* Contact Form */}
            <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
              <h2 className="text-lg font-semibold text-foreground mb-6">Send us a Message</h2>
              
              {isSubmitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Message Sent!</h3>
                  <p className="text-muted-foreground">We'll get back to you within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium text-foreground">
                      Full Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Enter your name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`mt-1.5 ${errors.name ? "border-destructive" : ""}`}
                    />
                    {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-foreground">
                      Email Address <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`mt-1.5 ${errors.email ? "border-destructive" : ""}`}
                    />
                    {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium text-foreground">
                      Phone Number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`mt-1.5 ${errors.phone ? "border-destructive" : ""}`}
                    />
                    {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
                  </div>

                  <div>
                    <Label htmlFor="message" className="text-sm font-medium text-foreground">
                      Message <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="How can we help you?"
                      value={formData.message}
                      onChange={handleChange}
                      rows={4}
                      className={`mt-1.5 resize-none ${errors.message ? "border-destructive" : ""}`}
                    />
                    {errors.message && <p className="text-xs text-destructive mt-1">{errors.message}</p>}
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-11 rounded-lg"
                  >
                    {isSubmitting ? (
                      "Sending..."
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-foreground mb-6">Contact Information</h2>
                
                <div className="space-y-5">
                  {/* WhatsApp */}
                  <a
                    href={`https://wa.me/${contactInfo.whatsapp.replace(/\s+/g, "").replace("+", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition-colors group"
                  >
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-800">WhatsApp</p>
                      <p className="text-lg font-semibold text-green-900 group-hover:underline">
                        {contactInfo.whatsapp}
                      </p>
                    </div>
                  </a>

                  {/* Phone */}
                  <a
                    href={`tel:${contactInfo.phone.replace(/\s+/g, "")}`}
                    className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors group"
                  >
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Phone className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-800">Phone</p>
                      <p className="text-lg font-semibold text-blue-900 group-hover:underline">
                        {contactInfo.phone}
                      </p>
                    </div>
                  </a>

                  {/* Email */}
                  <a
                    href={`mailto:${contactInfo.email}`}
                    className="flex items-center gap-4 p-4 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition-colors group"
                  >
                    <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Mail className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-purple-800">Email</p>
                      <p className="text-lg font-semibold text-purple-900 group-hover:underline">
                        {contactInfo.email}
                      </p>
                    </div>
                  </a>
                </div>
              </div>

              {/* Quick Response Note */}
              <div className="bg-muted/50 border border-border rounded-2xl p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  💬 We typically respond within <span className="font-semibold text-foreground">2-4 hours</span> during business hours (9 AM - 9 PM IST)
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ContactUs;
