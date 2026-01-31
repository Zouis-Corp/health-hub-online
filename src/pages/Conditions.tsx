import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import DynamicIcon from "@/components/ui/DynamicIcon";
import ProductCard from "@/components/ui/ProductCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Grid3X3,
  List,
  ChevronRight,
  Filter,
} from "lucide-react";

interface Condition {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

interface Medicine {
  id: string;
  name: string;
  slug: string;
  salt_name: string | null;
  brand: string | null;
  price: number;
  original_price: number | null;
  prescription_required: boolean;
  stock: number;
  image_url: string | null;
  condition_id: string | null;
}

const Conditions = () => {
  const [selectedCondition, setSelectedCondition] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("relevance");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { data: conditions, isLoading: conditionsLoading } = useQuery({
    queryKey: ["conditions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conditions")
        .select("id, name, slug, icon")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as Condition[];
    },
  });

  const { data: medicines, isLoading: medicinesLoading } = useQuery({
    queryKey: ["medicines", selectedCondition, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("medicines")
        .select("*")
        .eq("is_active", true);
      
      if (selectedCondition !== "all") {
        query = query.eq("condition_id", selectedCondition);
      }

      if (searchQuery) {
        query = query.ilike("name", `%${searchQuery}%`);
      }

      const { data, error } = await query.order("name");
      if (error) throw error;
      return data as Medicine[];
    },
  });

  const sortedMedicines = medicines ? [...medicines].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      case "discount":
        const discountA = a.original_price ? ((a.original_price - a.price) / a.original_price) * 100 : 0;
        const discountB = b.original_price ? ((b.original_price - b.price) / b.original_price) * 100 : 0;
        return discountB - discountA;
      default:
        return 0;
    }
  }) : [];

  const isLoading = conditionsLoading || medicinesLoading;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-[100px] sm:pt-[110px] pb-20 sm:pb-6">
        <div className="container px-3 sm:px-4 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link to="/" className="hover:text-primary">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">Super Speciality</span>
          </nav>

          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground font-heading mb-2">
              Super Speciality Medicines
            </h1>
            <p className="text-muted-foreground">
              Find specialty medicines for your specific health needs
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar Filters - Desktop */}
            <div className="hidden lg:block w-64 flex-shrink-0">
              <div className="bg-card rounded-xl border border-border p-4 sticky top-24">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filter by Condition
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedCondition("all")}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedCondition === "all"
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    All Conditions
                  </button>
                  {conditionsLoading ? (
                    Array(5).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-9 w-full" />
                    ))
                  ) : (
                    conditions?.map((condition) => (
                      <button
                        key={condition.id}
                        onClick={() => setSelectedCondition(condition.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                          selectedCondition === condition.id
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground hover:bg-muted"
                        }`}
                      >
                        {condition.icon && (
                          <DynamicIcon name={condition.icon} className="h-4 w-4 flex-shrink-0" />
                        )}
                        {condition.name}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              {/* Mobile Condition Pills */}
              <div className="lg:hidden mb-4 overflow-x-auto scrollbar-hide -mx-4 px-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedCondition("all")}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedCondition === "all"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card border border-border text-foreground hover:border-primary"
                    }`}
                  >
                    All
                  </button>
                  {conditions?.map((condition) => (
                    <button
                      key={condition.id}
                      onClick={() => setSelectedCondition(condition.id)}
                      className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                        selectedCondition === condition.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-card border border-border text-foreground hover:border-primary"
                      }`}
                    >
                      {condition.icon && (
                        <DynamicIcon name={condition.icon} className="h-3.5 w-3.5" />
                      )}
                      {condition.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search and Sort Bar */}
              <div className="flex flex-col gap-3 mb-6">
                <div className="relative w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search medicines..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-11 rounded-lg"
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[140px] sm:w-[160px] h-10 sm:h-11 rounded-lg flex-shrink-0">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border border-border">
                      <SelectItem value="relevance">Relevance</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="discount">Highest Discount</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex border border-border rounded-lg overflow-hidden flex-shrink-0">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2.5 ${
                        viewMode === "grid"
                          ? "bg-primary text-primary-foreground"
                          : "bg-card text-foreground hover:bg-muted"
                      }`}
                    >
                      <Grid3X3 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2.5 ${
                        viewMode === "list"
                          ? "bg-primary text-primary-foreground"
                          : "bg-card text-foreground hover:bg-muted"
                      }`}
                    >
                      <List className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Results Count */}
              <p className="text-sm text-muted-foreground mb-4">
                Showing {sortedMedicines.length} products
              </p>

              {/* Products Grid */}
              {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
                  {Array(8).fill(0).map((_, i) => (
                    <div key={i} className="bg-card rounded-xl border border-border overflow-hidden">
                      <Skeleton className="h-36 w-full" />
                      <div className="p-3 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                        <Skeleton className="h-6 w-1/3" />
                        <Skeleton className="h-9 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : sortedMedicines.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No medicines found matching your criteria.</p>
                </div>
              ) : (
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4"
                      : "grid grid-cols-1 gap-4"
                  }
                >
                  {sortedMedicines.map((medicine) => (
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
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Conditions;
