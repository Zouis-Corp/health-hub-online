import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductGrid from "@/components/products/ProductGrid";

const WellnessPage = () => {
  const { data: products, isLoading } = useQuery({
    queryKey: ["wellness-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medicines")
        .select("id, name, slug, type, salt_name, brand, price, original_price, prescription_required, image_url, stock")
        .eq("type", "wellness")
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
        <ProductGrid
          products={products as any}
          isLoading={isLoading}
          title="Wellness Products"
          subtitle="Supplements, vitamins & health products for your daily wellness"
          breadcrumbs={[
            { label: "Home", path: "/" },
            { label: "Wellness" },
          ]}
        />
      </main>
      <Footer />
    </div>
  );
};

export default WellnessPage;
