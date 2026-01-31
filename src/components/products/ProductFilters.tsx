import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Filter, X, RotateCcw } from "lucide-react";
import { ProductFilters as FilterType } from "@/hooks/useProductFilters";

interface ProductFiltersProps {
  filters: FilterType;
  uniqueBrands: string[];
  activeFilterCount: number;
  updateFilter: <K extends keyof FilterType>(key: K, value: FilterType[K]) => void;
  resetFilters: () => void;
}

const FilterContent = ({
  filters,
  uniqueBrands,
  updateFilter,
  resetFilters,
}: Omit<ProductFiltersProps, "activeFilterCount">) => (
  <div className="space-y-6">
    {/* Price Range */}
    <div className="space-y-3">
      <Label className="text-sm font-semibold">Price Range</Label>
      <div className="flex gap-2">
        <Input
          type="number"
          placeholder="Min"
          value={filters.priceMin ?? ""}
          onChange={(e) =>
            updateFilter("priceMin", e.target.value ? Number(e.target.value) : null)
          }
          className="h-9"
        />
        <span className="text-muted-foreground self-center">-</span>
        <Input
          type="number"
          placeholder="Max"
          value={filters.priceMax ?? ""}
          onChange={(e) =>
            updateFilter("priceMax", e.target.value ? Number(e.target.value) : null)
          }
          className="h-9"
        />
      </div>
    </div>

    {/* Prescription Filter */}
    <div className="space-y-3">
      <Label className="text-sm font-semibold">Prescription</Label>
      <Select
        value={
          filters.prescriptionRequired === null
            ? "all"
            : filters.prescriptionRequired
            ? "required"
            : "not-required"
        }
        onValueChange={(val) =>
          updateFilter(
            "prescriptionRequired",
            val === "all" ? null : val === "required"
          )
        }
      >
        <SelectTrigger className="h-9">
          <SelectValue placeholder="All" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Products</SelectItem>
          <SelectItem value="required">Prescription Required</SelectItem>
          <SelectItem value="not-required">No Prescription</SelectItem>
        </SelectContent>
      </Select>
    </div>

    {/* Brand Filter */}
    {uniqueBrands.length > 0 && (
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Brand</Label>
        <Select
          value={filters.brand ?? "all"}
          onValueChange={(val) => updateFilter("brand", val === "all" ? null : val)}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="All Brands" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Brands</SelectItem>
            {uniqueBrands.map((brand) => (
              <SelectItem key={brand} value={brand}>
                {brand}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )}

    {/* In Stock Toggle */}
    <div className="flex items-center justify-between">
      <Label className="text-sm font-semibold">In Stock Only</Label>
      <Switch
        checked={filters.inStockOnly}
        onCheckedChange={(checked) => updateFilter("inStockOnly", checked)}
      />
    </div>

    {/* Reset Button */}
    <Button
      variant="outline"
      className="w-full gap-2"
      onClick={resetFilters}
    >
      <RotateCcw className="h-4 w-4" />
      Reset Filters
    </Button>
  </div>
);

const ProductFiltersComponent = ({
  filters,
  uniqueBrands,
  activeFilterCount,
  updateFilter,
  resetFilters,
}: ProductFiltersProps) => {
  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        <div className="bg-card rounded-xl border border-border p-4 sticky top-24">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </h3>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </div>
          <FilterContent
            filters={filters}
            uniqueBrands={uniqueBrands}
            updateFilter={updateFilter}
            resetFilters={resetFilters}
          />
        </div>
      </div>

      {/* Mobile Filter Sheet */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px]">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <FilterContent
                filters={filters}
                uniqueBrands={uniqueBrands}
                updateFilter={updateFilter}
                resetFilters={resetFilters}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};

export default ProductFiltersComponent;
