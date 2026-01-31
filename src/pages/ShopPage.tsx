import { useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Grid3X3, List, ChevronRight, ChevronLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/ui/ProductCard";
import ShopFilters from "@/components/shop/ShopFilters";
import { useShopFilters } from "@/hooks/useShopFilters";
import usePagination from "@/hooks/usePagination";

const ITEMS_PER_PAGE = 12;

const ShopPage = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  const {
    isLoading,
    filters,
    filteredProducts,
    uniqueBrands,
    conditions,
    specialities,
    molecules,
    updateFilter,
    resetFilters,
    activeFilterCount,
    activeFilterNames,
    isFiltering,
  } = useShopFilters();

  const {
    paginatedData: paginatedProducts,
    currentPage,
    totalPages,
    totalItems,
    setCurrentPage,
  } = usePagination({ data: filteredProducts, initialPageSize: ITEMS_PER_PAGE });

  // Generate page title based on active filters
  const pageTitle = activeFilterNames.length > 0 
    ? activeFilterNames.join(" • ") 
    : "All Medicines";

  const pageSubtitle = activeFilterNames.length > 0
    ? `Showing medicines filtered by ${activeFilterNames.join(", ")}`
    : "Browse our complete catalog of medicines and wellness products";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-[100px] sm:pt-[110px] pb-20 sm:pb-6">
        <div className="container px-3 sm:px-4 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6 flex-wrap">
            <Link to="/" className="hover:text-primary">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">Shop</span>
            {activeFilterNames.map((name, i) => (
              <span key={name} className="flex items-center gap-2">
                <ChevronRight className="h-4 w-4" />
                <span className="text-foreground">{name}</span>
              </span>
            ))}
          </nav>

          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground font-heading mb-2">
              {pageTitle}
            </h1>
            <p className="text-muted-foreground">{pageSubtitle}</p>
          </div>

          {/* Active Filters Tags */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {activeFilterNames.map((name) => (
                <Badge key={name} variant="secondary" className="gap-1 py-1 px-3">
                  {name}
                  <X className="h-3 w-3 cursor-pointer" onClick={resetFilters} />
                </Badge>
              ))}
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Filters Sidebar */}
            <ShopFilters
              filters={filters}
              uniqueBrands={uniqueBrands}
              conditions={conditions}
              specialities={specialities}
              molecules={molecules}
              activeFilterCount={activeFilterCount}
              updateFilter={updateFilter}
              resetFilters={resetFilters}
            />

            {/* Main Content */}
            <div className="flex-1">
              {/* Search and Sort Bar */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
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
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">
                    Showing {paginatedProducts.length} of {totalItems} products
                  </p>
                  {isFiltering && (
                    <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
                {totalPages > 1 && (
                  <p className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </p>
                )}
              </div>

              {/* Products Grid */}
              {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
                  {Array(ITEMS_PER_PAGE)
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
              ) : paginatedProducts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    No products found matching your criteria.
                  </p>
                  <Button variant="outline" onClick={resetFilters}>
                    Reset Filters
                  </Button>
                </div>
              ) : (
                <>
                  <div
                    className={
                      viewMode === "grid"
                        ? "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4"
                        : "grid grid-cols-1 gap-4"
                    }
                  >
                    {paginatedProducts.map((product) => (
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

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      
                      <div className="flex gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum: number;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                              className="w-10"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ShopPage;
