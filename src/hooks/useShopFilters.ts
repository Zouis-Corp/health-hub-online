import { useState, useMemo, useCallback, useTransition, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ShopFilters {
  search: string;
  conditionId: string | null;
  specialityId: string | null;
  moleculeId: string | null;
  prescriptionRequired: boolean | null;
  inStockOnly: boolean;
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

export interface FilterOption {
  id: string;
  name: string;
  slug: string;
}

const defaultFilters: ShopFilters = {
  search: "",
  conditionId: null,
  specialityId: null,
  moleculeId: null,
  prescriptionRequired: null,
  inStockOnly: false,
  brand: null,
  sortBy: "relevance",
};

export function useShopFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<ShopFilters>(defaultFilters);
  const [isPending, startTransition] = useTransition();

  // Fetch all products
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["all-shop-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medicines")
        .select("id, name, slug, type, salt_name, brand, price, original_price, prescription_required, image_url, stock")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as Product[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch conditions for dropdown
  const { data: conditions } = useQuery({
    queryKey: ["filter-conditions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conditions")
        .select("id, name, slug")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as FilterOption[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch specialities for dropdown
  const { data: specialities } = useQuery({
    queryKey: ["filter-specialities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("super_specialities")
        .select("id, name, slug")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as FilterOption[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch molecules for dropdown
  const { data: molecules } = useQuery({
    queryKey: ["filter-molecules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("molecules")
        .select("id, name, slug")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as FilterOption[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Initialize filters from URL params
  useEffect(() => {
    const conditionSlug = searchParams.get("condition");
    const specialitySlug = searchParams.get("speciality");
    const moleculeSlug = searchParams.get("molecule");
    const search = searchParams.get("search") || "";

    let newConditionId: string | null = null;
    let newSpecialityId: string | null = null;
    let newMoleculeId: string | null = null;

    if (conditionSlug && conditions) {
      const condition = conditions.find(c => c.slug === conditionSlug);
      if (condition) newConditionId = condition.id;
    }

    if (specialitySlug && specialities) {
      const speciality = specialities.find(s => s.slug === specialitySlug);
      if (speciality) newSpecialityId = speciality.id;
    }

    if (moleculeSlug && molecules) {
      const molecule = molecules.find(m => m.slug === moleculeSlug);
      if (molecule) newMoleculeId = molecule.id;
    }

    setFilters(prev => ({
      ...prev,
      search,
      conditionId: newConditionId,
      specialityId: newSpecialityId,
      moleculeId: newMoleculeId,
    }));
  }, [searchParams, conditions, specialities, molecules]);

  // Fetch product IDs for condition filter
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
    staleTime: 2 * 60 * 1000,
  });

  // Fetch product IDs for speciality filter
  const { data: specialityProductIds } = useQuery({
    queryKey: ["speciality-products", filters.specialityId],
    queryFn: async () => {
      if (!filters.specialityId) return null;
      const { data, error } = await supabase
        .from("product_specialities")
        .select("product_id")
        .eq("speciality_id", filters.specialityId);
      if (error) throw error;
      return data.map((p) => p.product_id);
    },
    enabled: !!filters.specialityId,
    staleTime: 2 * 60 * 1000,
  });

  // Fetch product IDs for molecule filter
  const { data: moleculeProductIds } = useQuery({
    queryKey: ["molecule-products", filters.moleculeId],
    queryFn: async () => {
      if (!filters.moleculeId) return null;
      const { data, error } = await supabase
        .from("product_molecules")
        .select("product_id")
        .eq("molecule_id", filters.moleculeId);
      if (error) throw error;
      return data.map((p) => p.product_id);
    },
    enabled: !!filters.moleculeId,
    staleTime: 2 * 60 * 1000,
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

    // Speciality filter
    if (filters.specialityId && specialityProductIds) {
      result = result.filter((p) => specialityProductIds.includes(p.id));
    }

    // Molecule filter
    if (filters.moleculeId && moleculeProductIds) {
      result = result.filter((p) => moleculeProductIds.includes(p.id));
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
        break;
    }

    return result;
  }, [products, filters, conditionProductIds, specialityProductIds, moleculeProductIds]);

  const uniqueBrands = useMemo(() => {
    if (!products) return [];
    return [...new Set(products.map((p) => p.brand).filter(Boolean))] as string[];
  }, [products]);

  const updateFilter = useCallback(<K extends keyof ShopFilters>(
    key: K,
    value: ShopFilters[K]
  ) => {
    startTransition(() => {
      setFilters((prev) => ({ ...prev, [key]: value }));
      
      // Update URL params for taxonomy filters
      const newParams = new URLSearchParams(searchParams);
      
      if (key === "conditionId") {
        if (value && conditions) {
          const condition = conditions.find(c => c.id === value);
          if (condition) newParams.set("condition", condition.slug);
        } else {
          newParams.delete("condition");
        }
      }
      
      if (key === "specialityId") {
        if (value && specialities) {
          const speciality = specialities.find(s => s.id === value);
          if (speciality) newParams.set("speciality", speciality.slug);
        } else {
          newParams.delete("speciality");
        }
      }
      
      if (key === "moleculeId") {
        if (value && molecules) {
          const molecule = molecules.find(m => m.id === value);
          if (molecule) newParams.set("molecule", molecule.slug);
        } else {
          newParams.delete("molecule");
        }
      }
      
      if (key === "search") {
        if (value) {
          newParams.set("search", value as string);
        } else {
          newParams.delete("search");
        }
      }
      
      setSearchParams(newParams, { replace: true });
    });
  }, [searchParams, setSearchParams, conditions, specialities, molecules]);

  const resetFilters = useCallback(() => {
    startTransition(() => {
      setFilters(defaultFilters);
      setSearchParams({}, { replace: true });
    });
  }, [setSearchParams]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.conditionId) count++;
    if (filters.specialityId) count++;
    if (filters.moleculeId) count++;
    if (filters.prescriptionRequired !== null) count++;
    if (filters.inStockOnly) count++;
    if (filters.brand) count++;
    return count;
  }, [filters]);

  // Get active filter names for display
  const activeFilterNames = useMemo(() => {
    const names: string[] = [];
    if (filters.conditionId && conditions) {
      const condition = conditions.find(c => c.id === filters.conditionId);
      if (condition) names.push(condition.name);
    }
    if (filters.specialityId && specialities) {
      const speciality = specialities.find(s => s.id === filters.specialityId);
      if (speciality) names.push(speciality.name);
    }
    if (filters.moleculeId && molecules) {
      const molecule = molecules.find(m => m.id === filters.moleculeId);
      if (molecule) names.push(molecule.name);
    }
    return names;
  }, [filters, conditions, specialities, molecules]);

  return {
    products,
    isLoading: productsLoading,
    filters,
    filteredProducts,
    uniqueBrands,
    conditions: conditions || [],
    specialities: specialities || [],
    molecules: molecules || [],
    updateFilter,
    resetFilters,
    activeFilterCount,
    activeFilterNames,
    isFiltering: isPending,
  };
}
