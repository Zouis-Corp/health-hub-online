import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductGrid from "@/components/products/ProductGrid";

const ConditionsPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const conditionIdFromQuery = searchParams.get("condition");

  // Fetch condition details if viewing a specific condition via slug
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

  // Fetch all medicines (filtering handled by ProductGrid with initialConditionId)
  const { data: products, isLoading } = useQuery({
    queryKey: ["all-medicines-for-conditions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medicines")
        .select("id, name, slug, type, salt_name, brand, price, original_price, prescription_required, image_url, stock")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Determine which condition ID to use for initial filter
  const initialConditionId = conditionIdFromQuery || condition?.id || null;

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
          initialConditionId={initialConditionId}
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
