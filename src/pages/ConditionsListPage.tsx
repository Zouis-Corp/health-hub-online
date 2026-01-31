import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ChevronRight, Stethoscope } from "lucide-react";
import DynamicIcon from "@/components/ui/DynamicIcon";

const ConditionsListPage = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: conditions, isLoading } = useQuery({
    queryKey: ["all-conditions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conditions")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const filteredConditions = conditions?.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-[120px] sm:pt-[130px] pb-20 sm:pb-6">
        <div className="container px-3 sm:px-4 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link to="/" className="hover:text-primary">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">Conditions</span>
          </nav>

          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground font-heading mb-2">
              Browse by Condition
            </h1>
            <p className="text-muted-foreground">
              Find medicines for your specific health needs
            </p>
          </div>

          {/* Search */}
          <div className="relative max-w-md mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search conditions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-11 rounded-lg"
            />
          </div>

          {/* Conditions Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array(10).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))}
            </div>
          ) : filteredConditions?.length === 0 ? (
            <div className="text-center py-12">
              <Stethoscope className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No conditions found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredConditions?.map((condition) => (
                <Link
                  key={condition.id}
                  to={`/conditions/${condition.slug}`}
                  className="p-4 bg-card border border-border rounded-xl hover:border-primary hover:shadow-lg transition-all group flex flex-col items-center text-center"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-3 group-hover:from-primary/30 group-hover:to-primary/20 transition-colors">
                    {condition.icon ? (
                      <DynamicIcon name={condition.icon} className="h-6 w-6 text-primary" />
                    ) : (
                      <Stethoscope className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  <h3 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {condition.name}
                  </h3>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ConditionsListPage;
