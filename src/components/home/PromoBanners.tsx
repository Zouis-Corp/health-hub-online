import { Button } from "@/components/ui/button";
import { Calendar, Stethoscope } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import doctorBg from "@/assets/doctor-background.png";

const PromoBanners = () => {
  const { data: bookingUrl } = useQuery({
    queryKey: ["site-settings", "booking_url"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "booking_url")
        .maybeSingle();
      return data?.value || "https://book.tabletkart.in";
    },
  });

  const url = bookingUrl || "https://book.tabletkart.in";
  return (
    <section className="py-6 bg-background">
      <div className="container">
        <div 
          className="relative overflow-hidden rounded-2xl min-h-[420px] sm:min-h-[380px] md:min-h-[380px] flex items-end sm:items-center"
          style={{
            backgroundImage: `url(${doctorBg})`,
            backgroundSize: 'cover',
          }}
        >
          {/* Background position: right on mobile to show doctor on right side, top right on tablet/desktop */}
          <style>{`
            @media (max-width: 639px) {
              .promo-banner-bg {
                background-position: top right -60px !important;
              }
            }
            @media (min-width: 640px) {
              .promo-banner-bg {
                background-position: top right !important;
              }
            }
          `}</style>
          <div 
            className="promo-banner-bg absolute inset-0"
            style={{
              backgroundImage: `url(${doctorBg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'top right',
            }}
          />
          
          {/* Gradient overlay for text readability - only on mobile, starts from bottom 60% */}
          <div className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-[#76418d] via-[#76418d]/90 to-transparent sm:hidden" />
          
          {/* Content */}
          <div className="relative z-10 p-4 sm:p-6 md:p-10 text-left w-full sm:max-w-md md:max-w-xl">
            <div className="flex items-center gap-2 mb-2 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Stethoscope className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
            <h3 className="text-xl sm:text-2xl md:text-4xl font-bold text-white mb-2 sm:mb-3">
              Book an Appointment
            </h3>
            <p className="text-white/90 text-sm sm:text-base md:text-lg mb-4 sm:mb-6 max-w-[200px] sm:max-w-sm md:max-w-md">
              Connect with our healthcare experts for personalized medical consultations and guidance.
            </p>
            <div className="flex flex-row gap-2 sm:gap-3">
              <Button 
                asChild
                size="sm"
                className="bg-white text-primary hover:bg-white/90 rounded-lg font-semibold px-3 sm:px-6 text-xs sm:text-sm"
              >
                <a href={url} target="_blank" rel="noopener noreferrer">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Book Now
                </a>
              </Button>
              <Button 
                asChild
                size="sm"
                variant="outline" 
                className="border-white text-white hover:bg-white/10 rounded-lg font-semibold px-3 sm:px-6 text-xs sm:text-sm"
              >
                <a href={url} target="_blank" rel="noopener noreferrer">
                  View Services
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PromoBanners;
