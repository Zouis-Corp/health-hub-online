import { useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Grid3X3, List, ChevronRight } from "lucide-react";
import ProductCard from "@/components/ui/ProductCard";
import ProductFilters from "./ProductFilters";
import { useProductFilters, Product } from "@/hooks/useProductFilters";

interface ProductGridProps {
  products: Product[] | undefined;
  isLoading: boolean;
  title: string;
  subtitle: string;
  breadcrumbs: { label: string; path?: string }[];
  showSearch?: boolean;
}

const ProductGrid = ({
  products,
  isLoading,
  title,
  subtitle,
  breadcrumbs,
  showSearch = true,
}: ProductGridProps) => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  const {
    filters,
    filteredProducts,
    uniqueBrands,
    conditions,
    updateFilter,
    resetFilters,
    activeFilterCount,
  } = useProductFilters(products);

  return (
    <div className="container px-3 sm:px-4 lg:px-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6 flex-wrap">
        {breadcrumbs.map((crumb, index) => (
          <span key={index} className="flex items-center gap-2">
            {index > 0 && <ChevronRight className="h-4 w-4" />}
            {crumb.path ? (
              <Link to={crumb.path} className="hover:text-primary">
                {crumb.label}
              </Link>
            ) : (
              <span className="text-foreground">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>

      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground font-heading mb-2">
          {title}
        </h1>
        <p className="text-muted-foreground">{subtitle}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters Sidebar */}
        <ProductFilters
          filters={filters}
          uniqueBrands={uniqueBrands}
          conditions={conditions}
          activeFilterCount={activeFilterCount}
          updateFilter={updateFilter}
          resetFilters={resetFilters}
        />

        {/* Main Content */}
        <div className="flex-1">
          {/* Search and Sort Bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            {showSearch && (
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={filters.search}
                  onChange={(e) => updateFilter("search", e.target.value)}
                  className="pl-12 h-11 rounded-lg"
                />
              </div>
            )}
            <div className="flex gap-2">
              <Select
                value={filters.sortBy}
                onValueChange={(val) => updateFilter("sortBy", val as any)}
              >
                <SelectTrigger className="w-[160px] h-11 rounded-lg">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-card border border-border">
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="discount">Highest Discount</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex border border-border rounded-lg overflow-hidden">
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
            Showing {filteredProducts.length} products
          </p>

          {/* Products Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
              {Array(8)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    className="bg-card rounded-xl border border-border overflow-hidden"
                  >
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
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No products found matching your criteria.
              </p>
            </div>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4"
                  : "grid grid-cols-1 gap-4"
              }
            >
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  slug={product.slug}
                  saltName={product.salt_name}
                  brand={product.brand}
                  price={product.price}
                  originalPrice={product.original_price}
                  prescriptionRequired={product.prescription_required}
                  imageUrl={product.image_url}
                  stock={product.stock}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductGrid;
