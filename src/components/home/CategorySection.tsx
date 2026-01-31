import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import DynamicIcon from "@/components/ui/DynamicIcon";

interface Condition {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

const CategorySection = () => {
  const { data: conditions, isLoading } = useQuery({
    queryKey: ["home-conditions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conditions")
        .select("id, name, slug, icon")
        .eq("is_active", true)
        .order("name")
        .limit(12);
      if (error) throw error;
      return data as Condition[];
    },
  });

  return (
    <section className="py-6 sm:py-8 bg-background">
      <div className="container">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-base sm:text-xl md:text-2xl font-bold text-foreground font-heading">
            Shop by Conditions
          </h2>
          <Link 
            to="/conditions" 
            className="text-sm text-primary hover:underline font-medium"
          >
            View All
          </Link>
        </div>

        {/* Conditions Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {isLoading ? (
            Array(12).fill(0).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 sm:gap-3">
                <Skeleton className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-2xl" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))
          ) : (
            conditions?.map((condition) => (
              <Link
                key={condition.id}
                to={`/conditions/${condition.slug}`}
                className="flex flex-col items-center gap-2 sm:gap-3 group"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-muted/50 rounded-2xl flex items-center justify-center group-hover:scale-105 group-hover:bg-primary/10 transition-all border border-border/50 shadow-sm">
                  {condition.icon ? (
                    <DynamicIcon 
                      name={condition.icon} 
                      className="h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 text-primary" 
                      strokeWidth={1.5} 
                    />
                  ) : (
                    <DynamicIcon 
                      name="Pill" 
                      className="h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 text-primary" 
                      strokeWidth={1.5} 
                    />
                  )}
                </div>
                <p className="text-[10px] sm:text-xs md:text-sm font-medium text-foreground text-center leading-tight line-clamp-2">
                  {condition.name}
                </p>
              </Link>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
