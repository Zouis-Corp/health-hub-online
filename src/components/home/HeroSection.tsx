import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Search, Pill } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  price: number;
  brand: string | null;
  image_url: string | null;
}

const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  // Real-time search functionality
  useEffect(() => {
    const searchProducts = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      const { data, error } = await supabase
        .from("medicines")
        .select("id, name, slug, price, brand, image_url")
        .or(`name.ilike.%${searchQuery}%,salt_name.ilike.%${searchQuery}%,brand.ilike.%${searchQuery}%`)
        .eq("is_active", true)
        .limit(6);

      if (!error && data) {
        setSearchResults(data);
      }
      setIsSearching(false);
    };

    const debounceTimer = setTimeout(searchProducts, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/conditions?search=${encodeURIComponent(searchQuery)}`);
      setShowDropdown(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <section className="relative bg-hero-gradient pt-[120px] sm:pt-[135px] md:pt-[150px] lg:pt-[170px] pb-8 sm:pb-12 md:pb-16 lg:pb-20 z-20">
      <div className="container relative px-4">
        <div className="max-w-3xl mx-auto text-center">
          {/* Headline */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 md:mb-4 font-heading leading-tight">
            Search Medicines, Or Molecules.
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-6 md:mb-8">
            Save Up To 85% On Super Speciality Medicine
          </p>

          {/* Search Bar */}
          <div 
            className="relative z-30"
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setTimeout(() => setShowDropdown(false), 200);
              }
            }}
          >
            <div className="bg-card rounded-xl md:rounded-full shadow-card p-2 flex flex-col md:flex-row items-stretch md:items-center gap-2">
              {/* Search Input */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search Medicines..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  onKeyDown={handleKeyDown}
                  className="w-full h-10 sm:h-12 pl-10 sm:pl-12 pr-3 sm:pr-4 rounded-lg md:rounded-full border-0 bg-transparent focus:outline-none focus:ring-0 text-sm sm:text-base text-foreground placeholder:text-muted-foreground"
                />
              </div>

              {/* Search Button */}
              <Button 
                onClick={handleSearch}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg md:rounded-full px-6 sm:px-8 h-10 sm:h-12 text-sm sm:text-base font-semibold"
              >
                Search
              </Button>
            </div>

            {/* Search Results Dropdown */}
            {showDropdown && searchQuery.length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                {isSearching ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    Searching...
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="p-2">
                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                      Found {searchResults.length} product{searchResults.length !== 1 ? "s" : ""}
                    </div>
                    {searchResults.map((product) => (
                      <Link
                        key={product.id}
                        to={`/medicine/${product.slug}`}
                        onClick={() => {
                          setShowDropdown(false);
                          setSearchQuery("");
                        }}
                        className="flex gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left"
                      >
                        <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="w-10 h-10 object-contain" />
                          ) : (
                            <Pill className="h-5 w-5 text-primary/50" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground line-clamp-1">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.brand || "Generic"}</p>
                          <p className="text-sm font-bold text-primary">₹{product.price}</p>
                        </div>
                      </Link>
                    ))}
                    <Link
                      to={`/conditions?search=${encodeURIComponent(searchQuery)}`}
                      onClick={() => {
                        setShowDropdown(false);
                        setSearchQuery("");
                      }}
                      className="block text-center py-2 mt-1 border-t border-border text-sm font-semibold text-primary hover:bg-muted rounded-b-lg"
                    >
                      View all results →
                    </Link>
                  </div>
                ) : (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    No products found for "{searchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
