import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductGrid from "@/components/products/ProductGrid";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ChevronRight, FlaskConical } from "lucide-react";

const MoleculesListPage = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: molecules, isLoading } = useQuery({
    queryKey: ["molecules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("molecules")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const filteredMolecules = molecules?.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group molecules by first letter
  const groupedMolecules = filteredMolecules?.reduce((acc, molecule) => {
    const letter = molecule.name[0].toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(molecule);
    return acc;
  }, {} as Record<string, typeof molecules>);

  const letters = groupedMolecules ? Object.keys(groupedMolecules).sort() : [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-[100px] sm:pt-[110px] pb-20 sm:pb-6">
        <div className="container px-3 sm:px-4 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link to="/" className="hover:text-primary">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">Molecules</span>
          </nav>

          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground font-heading mb-2">
              Browse by Molecule
            </h1>
            <p className="text-muted-foreground">
              Search by active pharmaceutical ingredients (salt names)
            </p>
          </div>

          {/* Search */}
          <div className="relative max-w-md mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search molecules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-11 rounded-lg"
            />
          </div>

          {/* Alphabet Quick Jump */}
          <div className="flex flex-wrap gap-1 mb-8">
            {letters.map((letter) => (
              <a
                key={letter}
                href={`#letter-${letter}`}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold text-sm hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                {letter}
              </a>
            ))}
          </div>

          {/* Molecules List */}
          {isLoading ? (
            <div className="space-y-6">
              {Array(5).fill(0).map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-8 w-12 mb-3" />
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {Array(4).fill(0).map((_, j) => (
                      <Skeleton key={j} className="h-16 rounded-lg" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : letters.length === 0 ? (
            <div className="text-center py-12">
              <FlaskConical className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No molecules found</p>
            </div>
          ) : (
            <div className="space-y-8">
              {letters.map((letter) => (
                <div key={letter} id={`letter-${letter}`}>
                  <h2 className="text-xl font-bold text-primary mb-4">{letter}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {groupedMolecules![letter]?.map((molecule) => (
                      <Link
                        key={molecule.id}
                        to={`/molecules/${molecule.slug}`}
                        className="p-4 bg-card border border-border rounded-xl hover:border-primary hover:shadow-md transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            <FlaskConical className="h-5 w-5 text-primary" />
                          </div>
                          <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                            {molecule.name}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

const MoleculeDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: molecule } = useQuery({
    queryKey: ["molecule", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("molecules")
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
    queryKey: ["products-by-molecule", slug],
    queryFn: async () => {
      if (!molecule) return [];

      // Fetch products linked to this molecule
      const { data: productIds, error: junctionError } = await supabase
        .from("product_molecules")
        .select("product_id")
        .eq("molecule_id", molecule.id);

      if (junctionError) throw junctionError;

      if (!productIds || productIds.length === 0) {
        // Fallback to salt_name field match
        const { data, error } = await supabase
          .from("medicines")
          .select("id, name, slug, type, salt_name, brand, price, original_price, prescription_required, image_url, stock")
          .ilike("salt_name", `%${molecule.name}%`)
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
    enabled: !!molecule,
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-[100px] sm:pt-[110px] pb-20 sm:pb-6">
        <ProductGrid
          products={products as any}
          isLoading={isLoading || !molecule}
          title={molecule?.name || "Loading..."}
          subtitle={molecule?.description || `Medicines containing ${molecule?.name || "this molecule"}`}
          breadcrumbs={[
            { label: "Home", path: "/" },
            { label: "Molecules", path: "/molecules" },
            { label: molecule?.name || "Loading..." },
          ]}
        />
      </main>
      <Footer />
    </div>
  );
};

const MoleculesPage = () => {
  const { slug } = useParams<{ slug: string }>();
  
  if (slug) {
    return <MoleculeDetailPage />;
  }
  
  return <MoleculesListPage />;
};

export default MoleculesPage;
