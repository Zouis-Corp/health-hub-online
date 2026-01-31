import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
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
  Globe,
  Shield,
  Truck,
  FileCheck,
  BadgeCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

const countries = [
  { value: "all", label: "All Countries" },
  { value: "usa", label: "🇺🇸 USA" },
  { value: "uk", label: "🇬🇧 United Kingdom" },
  { value: "germany", label: "🇩🇪 Germany" },
  { value: "switzerland", label: "🇨🇭 Switzerland" },
  { value: "japan", label: "🇯🇵 Japan" },
];

const benefits = [
  {
    icon: Globe,
    title: "Global Sourcing",
    description: "Medicines imported from FDA/EMA approved manufacturers worldwide",
  },
  {
    icon: Shield,
    title: "Quality Assured",
    description: "Rigorous quality checks at every step of the supply chain",
  },
  {
    icon: FileCheck,
    title: "Licensed Import",
    description: "All imports comply with Indian drug import regulations",
  },
  {
    icon: Truck,
    title: "Cold Chain",
    description: "Temperature-controlled shipping for sensitive medications",
  },
];

const ImportedMedicine = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("relevance");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCountry, setSelectedCountry] = useState("all");

  const { data: medicines, isLoading } = useQuery({
    queryKey: ["imported-medicines", searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("medicines")
        .select("*")
        .eq("is_active", true);

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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-[100px] sm:pt-[110px] pb-20 sm:pb-6">
        {/* Breadcrumb */}
        <div className="container py-4">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-primary">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">Imported Medicines</span>
          </nav>
        </div>

        {/* Hero Section */}
        <section className="bg-gradient-to-r from-primary/5 via-background to-secondary/5 py-10 md:py-14">
          <div className="container">
            <div className="max-w-3xl">
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
                <Globe className="h-3 w-3 mr-1" />
                Globally Sourced
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground font-heading mb-4">
                Imported Medicines
              </h1>
              <p className="text-lg text-muted-foreground mb-6">
                Access life-saving medications from trusted international manufacturers. 
                All medicines are legally imported with proper documentation and quality certifications.
              </p>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-8 border-b border-border">
          <div className="container">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3 p-3 md:p-4 rounded-lg bg-muted/30">
                  <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground text-sm">{benefit.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Products Section */}
        <section className="py-8">
          <div className="container">
            {/* Filters Bar */}
            <div className="flex flex-col gap-3 mb-6">
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search imported medicines..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-11 rounded-lg"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger className="w-[140px] md:w-[160px] h-10 md:h-11 rounded-lg flex-shrink-0">
                    <SelectValue placeholder="Country" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border border-border">
                    {countries.map((country) => (
                      <SelectItem key={country.value} value={country.value}>
                        {country.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[140px] md:w-[160px] h-10 md:h-11 rounded-lg flex-shrink-0">
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
              Showing {sortedMedicines.length} imported products
            </p>

            {/* Products Grid */}
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                <p className="text-muted-foreground">No imported medicines found matching your criteria.</p>
              </div>
            ) : (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
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
        </section>

        {/* Info Section */}
        <section className="py-12 bg-muted/30">
          <div className="container">
            <Card className="border-border">
              <CardContent className="p-6 md:p-8">
                <h2 className="text-xl font-bold text-foreground mb-4">
                  About Imported Medicines
                </h2>
                <div className="prose prose-sm text-muted-foreground max-w-none">
                  <p>
                    We specialize in sourcing authentic, high-quality medicines from internationally 
                    recognized manufacturers. All our imported medicines are:
                  </p>
                  <ul className="grid md:grid-cols-2 gap-2 mt-4 list-none p-0">
                    <li className="flex items-center gap-2">
                      <BadgeCheck className="h-4 w-4 text-secondary" />
                      FDA/EMA approved and certified
                    </li>
                    <li className="flex items-center gap-2">
                      <BadgeCheck className="h-4 w-4 text-secondary" />
                      Legally imported with proper documentation
                    </li>
                    <li className="flex items-center gap-2">
                      <BadgeCheck className="h-4 w-4 text-secondary" />
                      Stored and shipped in controlled conditions
                    </li>
                    <li className="flex items-center gap-2">
                      <BadgeCheck className="h-4 w-4 text-secondary" />
                      Verified for authenticity before dispatch
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ImportedMedicine;
