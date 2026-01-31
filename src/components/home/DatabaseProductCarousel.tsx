import { useRef } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import ProductCard from "@/components/ui/ProductCard";

interface Medicine {
  id: string;
  name: string;
  slug: string;
  salt_name: string | null;
  brand: string | null;
  price: number;
  original_price: number | null;
  prescription_required: boolean | null;
  image_url: string | null;
  stock: number | null;
}

interface DatabaseProductCarouselProps {
  title: string;
  subtitle: string;
  filter?: "prescription" | "otc" | "all";
  limit?: number;
}

const DatabaseProductCarousel = ({ 
  title, 
  subtitle, 
  filter = "all",
  limit = 10 
}: DatabaseProductCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: medicines, isLoading } = useQuery({
    queryKey: ["home-medicines", filter, limit],
    queryFn: async () => {
      let query = supabase
        .from("medicines")
        .select("id, name, slug, salt_name, brand, price, original_price, prescription_required, image_url, stock")
        .eq("is_active", true);

      if (filter === "prescription") {
        query = query.eq("prescription_required", true);
      } else if (filter === "otc") {
        query = query.eq("prescription_required", false);
      }

      const { data, error } = await query.order("name").limit(limit);
      if (error) throw error;
      return data as Medicine[];
    },
  });

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (isLoading) {
    return (
      <section className="py-6 sm:py-10 bg-background">
        <div className="container px-3 sm:px-4">
          <div className="mb-4 sm:mb-6">
            <Skeleton className="h-6 sm:h-7 w-48 sm:w-72 mb-2" />
            <Skeleton className="h-4 w-64 sm:w-96" />
          </div>
          {/* Mobile Grid Skeleton */}
          <div className="grid grid-cols-2 gap-2.5 md:hidden">
            {Array(10).fill(0).map((_, i) => (
              <div key={i} className="bg-card rounded-xl border border-border overflow-hidden">
                <Skeleton className="h-32 w-full" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-9 w-full rounded-lg" />
                </div>
              </div>
            ))}
          </div>
          {/* Desktop Skeleton */}
          <div className="hidden md:flex gap-5 overflow-hidden">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[230px] bg-card rounded-2xl border border-border overflow-hidden">
                <Skeleton className="h-44 w-full" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-6 w-1/2" />
                  <Skeleton className="h-11 w-full rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!medicines || medicines.length === 0) {
    return null;
  }

  return (
    <section className="py-5 sm:py-8 md:py-10 bg-background">
      <div className="container px-3 sm:px-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3 sm:mb-6">
          <div>
            <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-foreground font-heading">
              {title}
            </h2>
            <p className="text-[11px] sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 line-clamp-1">{subtitle}</p>
          </div>
          {/* Desktop Navigation Controls */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => scroll("left")}
              className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:border-primary hover:text-primary hover:bg-primary/5 transition-all bg-card shadow-sm"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <Link 
              to="/conditions" 
              className="text-sm text-primary hover:text-primary/80 px-3 font-semibold transition-colors"
            >
              View all
            </Link>
            <button
              onClick={() => scroll("right")}
              className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:border-primary hover:text-primary hover:bg-primary/5 transition-all bg-card shadow-sm"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Mobile: 2 Column Grid (5 rows = 10 items) */}
        <div className="grid grid-cols-2 gap-2.5 md:hidden">
          {medicines.slice(0, 10).map((medicine) => (
            <ProductCard
              key={medicine.id}
              id={medicine.id}
              name={medicine.name}
              slug={medicine.slug}
              saltName={medicine.salt_name}
              brand={medicine.brand}
              price={medicine.price}
              originalPrice={medicine.original_price}
              prescriptionRequired={medicine.prescription_required}
              imageUrl={medicine.image_url}
              stock={medicine.stock}
              className="w-full"
            />
          ))}
        </div>

        {/* Mobile: View All Button */}
        <div className="mt-4 md:hidden">
          <Link 
            to="/conditions" 
            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-primary/10 hover:bg-primary/15 text-primary font-semibold text-sm rounded-xl transition-colors border border-primary/20"
          >
            View All Products
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Desktop: Horizontal Scroll */}
        <div className="hidden md:block">
          <div
            ref={scrollRef}
            className="flex gap-5 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4"
          >
            {medicines.map((medicine) => (
              <ProductCard
                key={medicine.id}
                id={medicine.id}
                name={medicine.name}
                slug={medicine.slug}
                saltName={medicine.salt_name}
                brand={medicine.brand}
                price={medicine.price}
                originalPrice={medicine.original_price}
                prescriptionRequired={medicine.prescription_required}
                imageUrl={medicine.image_url}
                stock={medicine.stock}
                className="flex-shrink-0 w-[260px]"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default DatabaseProductCarousel;
