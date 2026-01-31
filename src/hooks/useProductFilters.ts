import { useState, useMemo, useCallback, useTransition } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProductFilters {
  search: string;
  conditionId: string | null;
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

export interface Condition {
  id: string;
  name: string;
  slug: string;
}

const defaultFilters: ProductFilters = {
  search: "",
  conditionId: null,
  prescriptionRequired: null,
  inStockOnly: false,
  moleculeId: null,
  brand: null,
  sortBy: "relevance",
};

export function useProductFilters(products: Product[] | undefined) {
  const [filters, setFilters] = useState<ProductFilters>(defaultFilters);
  const [isPending, startTransition] = useTransition();

  // Fetch conditions for dropdown - with stale time for caching
  const { data: conditions } = useQuery({
    queryKey: ["filter-conditions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conditions")
        .select("id, name, slug")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as Condition[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Fetch product-condition mappings when a condition is selected
  const { data: conditionProductIds } = useQuery({
    queryKey: ["condition-products", filters.conditionId],
    queryFn: async () => {
      if (!filters.conditionId) return null;
      const { data, error } = await supabase
        .from("product_conditions")
        .select("product_id")
        .eq("condition_id", filters.conditionId);
      if (error) throw error;
      return data.map((p) => p.product_id);
    },
    enabled: !!filters.conditionId,
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
  });

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

    // Condition filter
    if (filters.conditionId && conditionProductIds) {
      result = result.filter((p) => conditionProductIds.includes(p.id));
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
  }, [products, filters, conditionProductIds]);

  const uniqueBrands = useMemo(() => {
    if (!products) return [];
    return [...new Set(products.map((p) => p.brand).filter(Boolean))] as string[];
  }, [products]);

  const updateFilter = useCallback(<K extends keyof ProductFilters>(
    key: K,
    value: ProductFilters[K]
  ) => {
    // Use startTransition for non-urgent updates to prevent blocking
    startTransition(() => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    });
  }, []);

  const resetFilters = useCallback(() => {
    startTransition(() => {
      setFilters(defaultFilters);
    });
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.conditionId) count++;
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
    conditions: conditions || [],
    updateFilter,
    resetFilters,
    activeFilterCount,
    isFiltering: isPending,
  };
}
