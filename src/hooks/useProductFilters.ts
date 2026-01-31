import { useState, useMemo } from "react";

export interface ProductFilters {
  search: string;
  priceMin: number | null;
  priceMax: number | null;
  prescriptionRequired: boolean | null;
  inStockOnly: boolean;
  moleculeId: string | null;
  brand: string | null;
  sortBy: "relevance" | "price-low" | "price-high" | "discount" | "name";
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  type: "medicine" | "wellness";
  salt_name: string | null;
  brand: string | null;
  price: number;
  original_price: number | null;
  prescription_required: boolean | null;
  image_url: string | null;
  stock: number | null;
}

const defaultFilters: ProductFilters = {
  search: "",
  priceMin: null,
  priceMax: null,
  prescriptionRequired: null,
  inStockOnly: false,
  moleculeId: null,
  brand: null,
  sortBy: "relevance",
};

export function useProductFilters(products: Product[] | undefined) {
  const [filters, setFilters] = useState<ProductFilters>(defaultFilters);

  const filteredProducts = useMemo(() => {
    if (!products) return [];

    let result = [...products];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.salt_name?.toLowerCase().includes(searchLower) ||
          p.brand?.toLowerCase().includes(searchLower)
      );
    }

    // Price range filter
    if (filters.priceMin !== null) {
      result = result.filter((p) => p.price >= filters.priceMin!);
    }
    if (filters.priceMax !== null) {
      result = result.filter((p) => p.price <= filters.priceMax!);
    }

    // Prescription filter
    if (filters.prescriptionRequired !== null) {
      result = result.filter(
        (p) => p.prescription_required === filters.prescriptionRequired
      );
    }

    // In-stock filter
    if (filters.inStockOnly) {
      result = result.filter((p) => (p.stock ?? 0) > 0);
    }

    // Brand filter
    if (filters.brand) {
      result = result.filter((p) => p.brand === filters.brand);
    }

    // Sort
    switch (filters.sortBy) {
      case "price-low":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        result.sort((a, b) => b.price - a.price);
        break;
      case "discount":
        result.sort((a, b) => {
          const discountA = a.original_price
            ? ((a.original_price - a.price) / a.original_price) * 100
            : 0;
          const discountB = b.original_price
            ? ((b.original_price - b.price) / b.original_price) * 100
            : 0;
          return discountB - discountA;
        });
        break;
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        // relevance - keep original order
        break;
    }

    return result;
  }, [products, filters]);

  const uniqueBrands = useMemo(() => {
    if (!products) return [];
    return [...new Set(products.map((p) => p.brand).filter(Boolean))] as string[];
  }, [products]);

  const updateFilter = <K extends keyof ProductFilters>(
    key: K,
    value: ProductFilters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.priceMin !== null) count++;
    if (filters.priceMax !== null) count++;
    if (filters.prescriptionRequired !== null) count++;
    if (filters.inStockOnly) count++;
    if (filters.moleculeId) count++;
    if (filters.brand) count++;
    return count;
  }, [filters]);

  return {
    filters,
    filteredProducts,
    uniqueBrands,
    updateFilter,
    resetFilters,
    activeFilterCount,
  };
}
