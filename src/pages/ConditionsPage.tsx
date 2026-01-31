import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductGrid from "@/components/products/ProductGrid";

const ConditionsPage = () => {
  const { slug } = useParams<{ slug: string }>();

  // Fetch condition details if viewing a specific condition
  const { data: condition } = useQuery({
    queryKey: ["condition", slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from("conditions")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  // Fetch products for this condition via junction table
  const { data: products, isLoading } = useQuery({
    queryKey: ["products-by-condition", slug],
    queryFn: async () => {
      if (!slug || !condition) {
        // Fetch all products if no specific condition
        const { data, error } = await supabase
          .from("medicines")
          .select("id, name, slug, type, salt_name, brand, price, original_price, prescription_required, image_url, stock")
          .eq("is_active", true)
          .order("name");
        if (error) throw error;
        return data;
      }

      // Fetch products linked to this condition
      const { data: productIds, error: junctionError } = await supabase
        .from("product_conditions")
        .select("product_id")
        .eq("condition_id", condition.id);

      if (junctionError) throw junctionError;

      if (!productIds || productIds.length === 0) {
        // Fallback to old condition_id field
        const { data, error } = await supabase
          .from("medicines")
          .select("id, name, slug, type, salt_name, brand, price, original_price, prescription_required, image_url, stock")
          .eq("condition_id", condition.id)
          .eq("is_active", true)
          .order("name");
        if (error) throw error;
        return data;
      }

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
    enabled: !slug || !!condition,
  });

  const title = condition?.name || "Browse by Condition";
  const subtitle = condition?.description || "Find medicines for your specific health needs";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-[100px] sm:pt-[110px] pb-20 sm:pb-6">
        <ProductGrid
          products={products as any}
          isLoading={isLoading}
          title={title}
          subtitle={subtitle}
          breadcrumbs={[
            { label: "Home", path: "/" },
            { label: "Conditions", path: "/conditions" },
            ...(condition ? [{ label: condition.name }] : []),
          ]}
        />
      </main>
      <Footer />
    </div>
  );
};

export default ConditionsPage;
