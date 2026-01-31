import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductGrid from "@/components/products/ProductGrid";

const AllMedicinesPage = () => {
  const { data: products, isLoading } = useQuery({
    queryKey: ["all-medicines"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medicines")
        .select("id, name, slug, type, salt_name, brand, price, original_price, prescription_required, image_url, stock")
        .eq("type", "medicine")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-[100px] sm:pt-[110px] pb-20 sm:pb-6">
        <ProductGrid
          products={products as any}
          isLoading={isLoading}
          title="All Medicines"
          subtitle="View our complete medicine catalog - Quality assured from trusted manufacturers"
          breadcrumbs={[
            { label: "Home", path: "/" },
            { label: "Medicines" },
          ]}
        />
      </main>
      <Footer />
    </div>
  );
};

export default AllMedicinesPage;
