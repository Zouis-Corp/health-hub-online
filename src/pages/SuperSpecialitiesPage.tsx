import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductGrid from "@/components/products/ProductGrid";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, Heart } from "lucide-react";
import DynamicIcon from "@/components/ui/DynamicIcon";

const SpecialitiesListPage = () => {
  const { data: specialities, isLoading } = useQuery({
    queryKey: ["super-specialities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("super_specialities")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-[120px] sm:pt-[130px] pb-20 sm:pb-6">
        <div className="container px-3 sm:px-4 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link to="/" className="hover:text-primary">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">Super Specialities</span>
          </nav>

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground font-heading mb-2">
              Super Speciality Medicines
            </h1>
            <p className="text-muted-foreground">
              Specialized medicines for Oncology, Cardiology, Neurology and more
            </p>
          </div>

          {/* Specialities Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array(8).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          ) : specialities?.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No specialities found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {specialities?.map((speciality) => (
                <Link
                  key={speciality.id}
                  to={`/super-specialities/${speciality.slug}`}
                  className="p-6 bg-card border border-border rounded-xl hover:border-primary hover:shadow-lg transition-all group"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-4 group-hover:from-primary/30 group-hover:to-primary/20 transition-colors">
                      {speciality.icon ? (
                        <DynamicIcon name={speciality.icon} className="h-7 w-7 text-primary" />
                      ) : (
                        <Heart className="h-7 w-7 text-primary" />
                      )}
                    </div>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
                      {speciality.name}
                    </h3>
                    {speciality.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {speciality.description}
                      </p>
                    )}
                  </div>
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

const SpecialityDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: speciality } = useQuery({
    queryKey: ["super-speciality", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("super_specialities")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["products-by-speciality", slug],
    queryFn: async () => {
      if (!speciality) return [];

      const { data: productIds, error: junctionError } = await supabase
        .from("product_specialities")
        .select("product_id")
        .eq("speciality_id", speciality.id);

      if (junctionError) throw junctionError;

      if (!productIds || productIds.length === 0) return [];

      const ids = productIds.map((p) => p.product_id);
      const { data, error } = await supabase
        .from("medicines")
        .select("id, name, slug, type, salt_name, brand, price, original_price, prescription_required, image_url, stock")
        .in("id", ids)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!speciality,
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-[120px] sm:pt-[130px] pb-20 sm:pb-6">
        <ProductGrid
          products={products as any}
          isLoading={isLoading || !speciality}
          title={speciality?.name || "Loading..."}
          subtitle={speciality?.description || `Specialized medicines for ${speciality?.name || "this category"}`}
          breadcrumbs={[
            { label: "Home", path: "/" },
            { label: "Super Specialities", path: "/super-specialities" },
            { label: speciality?.name || "Loading..." },
          ]}
        />
      </main>
      <Footer />
    </div>
  );
};

const SuperSpecialitiesPage = () => {
  const { slug } = useParams<{ slug: string }>();
  
  if (slug) {
    return <SpecialityDetailPage />;
  }
  
  return <SpecialitiesListPage />;
};

export default SuperSpecialitiesPage;
