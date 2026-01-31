import { Button } from "@/components/ui/button";
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
import { Filter, RotateCcw } from "lucide-react";
import { ShopFilters as FilterType, FilterOption } from "@/hooks/useShopFilters";

interface ShopFiltersProps {
  filters: FilterType;
  uniqueBrands: string[];
  conditions: FilterOption[];
  specialities: FilterOption[];
  molecules: FilterOption[];
  activeFilterCount: number;
  updateFilter: <K extends keyof FilterType>(key: K, value: FilterType[K]) => void;
  resetFilters: () => void;
  mobileOnly?: boolean;
}

const FilterContent = ({
  filters,
  uniqueBrands,
  conditions,
  specialities,
  molecules,
  updateFilter,
  resetFilters,
}: Omit<ShopFiltersProps, "activeFilterCount">) => (
  <div className="space-y-6">
    {/* Condition Filter */}
    <div className="space-y-3">
      <Label className="text-sm font-semibold">Condition</Label>
      <Select
        value={filters.conditionId ?? "all"}
        onValueChange={(val) => updateFilter("conditionId", val === "all" ? null : val)}
      >
        <SelectTrigger className="h-9">
          <SelectValue placeholder="All Conditions" />
        </SelectTrigger>
        <SelectContent className="bg-popover border border-border max-h-60">
          <SelectItem value="all">All Conditions</SelectItem>
          {conditions.map((condition) => (
            <SelectItem key={condition.id} value={condition.id}>
              {condition.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    {/* Speciality Filter */}
    <div className="space-y-3">
      <Label className="text-sm font-semibold">Super Speciality</Label>
      <Select
        value={filters.specialityId ?? "all"}
        onValueChange={(val) => updateFilter("specialityId", val === "all" ? null : val)}
      >
        <SelectTrigger className="h-9">
          <SelectValue placeholder="All Specialities" />
        </SelectTrigger>
        <SelectContent className="bg-popover border border-border max-h-60">
          <SelectItem value="all">All Specialities</SelectItem>
          {specialities.map((speciality) => (
            <SelectItem key={speciality.id} value={speciality.id}>
              {speciality.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    {/* Molecule Filter */}
    <div className="space-y-3">
      <Label className="text-sm font-semibold">Molecule / Salt</Label>
      <Select
        value={filters.moleculeId ?? "all"}
        onValueChange={(val) => updateFilter("moleculeId", val === "all" ? null : val)}
      >
        <SelectTrigger className="h-9">
          <SelectValue placeholder="All Molecules" />
        </SelectTrigger>
        <SelectContent className="bg-popover border border-border max-h-60">
          <SelectItem value="all">All Molecules</SelectItem>
          {molecules.map((molecule) => (
            <SelectItem key={molecule.id} value={molecule.id}>
              {molecule.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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
        <SelectContent className="bg-popover border border-border">
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
          <SelectContent className="bg-popover border border-border max-h-60">
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

const ShopFiltersComponent = ({
  filters,
  uniqueBrands,
  conditions,
  specialities,
  molecules,
  activeFilterCount,
  updateFilter,
  resetFilters,
  mobileOnly = false,
}: ShopFiltersProps) => {
  // If mobileOnly, only render the mobile filter button (for inline use)
  if (mobileOnly) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 h-10 flex-1">
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
              conditions={conditions}
              specialities={specialities}
              molecules={molecules}
              updateFilter={updateFilter}
              resetFilters={resetFilters}
            />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

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
            conditions={conditions}
            specialities={specialities}
            molecules={molecules}
            updateFilter={updateFilter}
            resetFilters={resetFilters}
          />
        </div>
      </div>
    </>
  );
};

export default ShopFiltersComponent;
