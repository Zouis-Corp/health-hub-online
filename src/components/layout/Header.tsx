import { useState, useEffect } from "react";
import AnnouncementBar from "./AnnouncementBar";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  ShoppingCart, 
  User, 
  Menu, 
  X, 
  Search,
  Upload,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  Stethoscope,
  FlaskConical,
  Pill,
  Heart,
  ListTree,
  LucideIcon,
  Package,
  MapPin,
  Home,
  FileText,
  Phone,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";

const shopItems = [
  { 
    name: "By Condition", 
    path: "/conditions", 
    icon: Stethoscope,
    description: "Browse medicines by health conditions" 
  },
  { 
    name: "By Super Speciality", 
    path: "/super-specialities", 
    icon: Heart,
    description: "Oncology, Cardiology, Neurology & more" 
  },
  { 
    name: "By Molecules", 
    path: "/molecules", 
    icon: FlaskConical,
    description: "Search by active pharmaceutical ingredients" 
  },
  { 
    name: "All Medicines", 
    path: "/medicines", 
    icon: Pill,
    description: "View our complete medicine catalog" 
  },
  { 
    name: "Wellness", 
    path: "/wellness", 
    icon: ListTree,
    description: "Supplements, vitamins & health products" 
  },
];

const navLinks: { name: string; path: string; icon: LucideIcon }[] = [
  { name: "Home", path: "/", icon: Home },
  { name: "Order by Prescription", path: "/upload-prescription", icon: FileText },
  { name: "Contact Us", path: "/contact", icon: Phone },
];

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  price: number;
  brand: string | null;
  image_url: string | null;
}

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showShopDropdown, setShowShopDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, isStaff, signOut } = useAuth();
  const { totalItems, totalPrice } = useCart();

  const handleSignOut = async () => {
    await signOut();
    setShowUserDropdown(false);
    navigate("/");
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

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

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setShowMobileSearch(false);
  }, [location.pathname]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full bg-card shadow-sm">
      {/* Announcement Bar */}
      <AnnouncementBar />
      
      {/* Main Header */}
      <div className="border-b border-border">
        <div className="container py-2.5 md:py-3 px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between gap-2 md:gap-4">
            
            {/* Mobile: Menu & Logo */}
            <div className="flex items-center gap-2 lg:hidden">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-1.5 hover:bg-muted rounded-lg transition-colors"
              >
                <Menu className="h-5 w-5 text-foreground" />
              </button>
              <Link to="/" className="flex items-center">
                <svg width="26" height="26" viewBox="0 0 32 32" fill="none" className="text-primary">
                  <path d="M16 4C9.373 4 4 9.373 4 16s5.373 12 12 12 12-5.373 12-12S22.627 4 16 4z" fill="currentColor" opacity="0.2"/>
                  <path d="M12 16h8M16 12v8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
                <span className="text-base font-bold ml-1">
                  <span className="text-primary">tablet</span>
                  <span className="text-secondary">kart</span>
                </span>
              </Link>
            </div>

            {/* Desktop Logo */}
            <Link to="/" className="hidden lg:flex items-center gap-1 flex-shrink-0">
              <div className="flex items-center">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-primary">
                  <path d="M16 4C9.373 4 4 9.373 4 16s5.373 12 12 12 12-5.373 12-12S22.627 4 16 4z" fill="currentColor" opacity="0.2"/>
                  <path d="M12 16h8M16 12v8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
                <span className="text-xl font-bold ml-1">
                  <span className="text-primary">tablet</span>
                  <span className="text-secondary">kart</span>
                  <span className="text-primary">.in</span>
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {/* Shop Dropdown */}
              <div 
                className="relative"
                onMouseEnter={() => setShowShopDropdown(true)}
                onMouseLeave={() => setShowShopDropdown(false)}
              >
                <Link 
                  to="/shop"
                  className="flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary transition-colors px-3 py-2"
                >
                  <Pill className="h-4 w-4" />
                  Shop
                  <ChevronDown className="h-3.5 w-3.5" />
                </Link>
                
                {showShopDropdown && (
                  <div className="absolute top-full left-0 pt-2 z-50">
                    <div className="w-[380px] p-3 bg-card border border-border rounded-xl shadow-lg">
                      <div className="grid gap-1">
                        {shopItems.map((item) => (
                          <Link
                            key={item.path}
                            to={item.path}
                            className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted transition-colors group"
                            onClick={() => setShowShopDropdown(false)}
                          >
                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                              <item.icon className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                                {item.name}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {item.description}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {navLinks.filter(l => l.path !== "/").map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-1.5 text-sm font-medium transition-colors px-3 py-2 ${
                    isActive(link.path) ? "text-primary" : "text-foreground hover:text-primary"
                  }`}
                >
                  <link.icon className="h-4 w-4" />
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1.5 md:gap-2">
              
              {/* Search - Desktop */}
              <div 
                className="hidden md:block relative"
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setTimeout(() => setShowSearchDropdown(false), 200);
                  }
                }}
              >
                <div className={`flex items-center gap-2 border rounded-full px-3 py-1.5 transition-all duration-200 ${
                  showSearchDropdown 
                    ? "bg-card border-primary shadow-md w-[280px]" 
                    : "bg-muted/30 border-border w-[200px] hover:bg-card hover:border-primary/50"
                }`}>
                  <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search medicines..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSearchDropdown(true);
                    }}
                    onFocus={() => setShowSearchDropdown(true)}
                    className="w-full bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                {/* Search Results Dropdown */}
                {showSearchDropdown && searchQuery.length >= 2 && (
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
                              setShowSearchDropdown(false);
                              setSearchQuery("");
                            }}
                            className="flex gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
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
                          to={`/conditions?search=${searchQuery}`}
                          onClick={() => {
                            setShowSearchDropdown(false);
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

              {/* Search Icon - Mobile */}
              <button 
                onClick={() => setShowMobileSearch(true)}
                className="md:hidden w-8 h-8 bg-muted rounded-full flex items-center justify-center hover:bg-muted/80 transition-colors"
              >
                <Search className="h-4 w-4 text-muted-foreground" />
              </button>

              {/* Upload Rx - Desktop */}
              <Link to="/upload-prescription" className="hidden sm:block">
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 rounded-full h-9 px-4 text-xs font-semibold">
                  <Upload className="h-3.5 w-3.5" />
                  <span className="hidden lg:inline">Upload Rx</span>
                  <span className="lg:hidden">Rx</span>
                </Button>
              </Link>

              {/* Cart Button - Desktop */}
              <Link to="/cart" className="hidden sm:block">
                <div className="relative flex items-center bg-accent hover:scale-[1.02] transition-transform rounded-full pl-1.5 pr-3 py-1 gap-2 cursor-pointer">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <ShoppingCart className="h-[18px] w-[18px] text-primary" strokeWidth={2.5} />
                  </div>
                  <span className="text-sm font-bold text-primary">
                    ₹{totalPrice.toLocaleString()}
                  </span>
                  {totalItems > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary text-primary-foreground text-[11px] font-bold rounded-full flex items-center justify-center shadow-md">
                      {totalItems > 9 ? "9+" : totalItems}
                    </span>
                  )}
                </div>
              </Link>

              {/* Cart Button - Mobile */}
              <Link to="/cart" className="sm:hidden">
                <div className="relative flex items-center bg-accent rounded-full pl-1.5 pr-3.5 py-1 gap-1.5 cursor-pointer">
                  <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <ShoppingCart className="h-3.5 w-3.5 text-primary" strokeWidth={2.5} />
                  </div>
                  <span className="text-xs font-bold text-primary">
                    ₹{totalPrice.toLocaleString()}
                  </span>
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-0.5 bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm">
                      {totalItems > 9 ? "9+" : totalItems}
                    </span>
                  )}
                </div>
              </Link>

              {/* User Account - Desktop only */}
              <div 
                className="relative hidden sm:block"
                onMouseEnter={() => setShowUserDropdown(true)}
                onMouseLeave={() => setShowUserDropdown(false)}
              >
                {user ? (
                  <button className="flex items-center gap-1.5 p-1.5 rounded-full hover:bg-muted transition-colors">
                    {/* Colorful 3D-style profile icon */}
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-md">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white drop-shadow-sm">
                        <circle cx="12" cy="8" r="4" fill="currentColor"/>
                        <path d="M4 20c0-4 4-6 8-6s8 2 8 6" fill="currentColor" opacity="0.9"/>
                      </svg>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                ) : (
                  <Link to="/auth">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-200 via-gray-200 to-slate-300 flex items-center justify-center hover:from-slate-300 hover:to-gray-400 transition-all cursor-pointer shadow-sm">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-slate-600">
                        <circle cx="12" cy="8" r="4" fill="currentColor"/>
                        <path d="M4 20c0-4 4-6 8-6s8 2 8 6" fill="currentColor" opacity="0.8"/>
                      </svg>
                    </div>
                  </Link>
                )}

                {/* User Dropdown */}
                {user && showUserDropdown && (
                  <div className="absolute top-full right-0 pt-2 z-50">
                    <div className="w-56 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                      <div className="p-3 border-b border-border bg-muted/30">
                        <p className="text-xs text-muted-foreground">Signed in as</p>
                        <p className="text-sm font-medium text-foreground truncate">
                          {profile?.name || user.email}
                        </p>
                      </div>
                      <div className="p-1.5">
                        <Link
                          to="/dashboard"
                          onClick={() => setShowUserDropdown(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors"
                        >
                          <User className="h-4 w-4 text-muted-foreground" />
                          Profile
                        </Link>
                        <Link
                          to="/dashboard?tab=orders"
                          onClick={() => setShowUserDropdown(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors"
                        >
                          <Package className="h-4 w-4 text-muted-foreground" />
                          Orders
                        </Link>
                        <Link
                          to="/dashboard?tab=addresses"
                          onClick={() => setShowUserDropdown(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors"
                        >
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          Addresses
                        </Link>
                        {isStaff && (
                          <Link
                            to="/admin"
                            onClick={() => setShowUserDropdown(false)}
                            className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors"
                          >
                            <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                            Admin Panel
                          </Link>
                        )}
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMenuOpen && (
        <>
          {/* Backdrop - below announcement bar */}
          <div 
            onClick={() => setIsMenuOpen(false)}
            className="fixed inset-0 top-[40px] bg-black/40 z-40 lg:hidden"
          />
          
          {/* Drawer - starts below announcement bar */}
          <div className="fixed top-[40px] left-0 bottom-0 w-72 bg-card z-50 shadow-xl lg:hidden animate-slide-in-right overflow-y-auto">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <Link to="/" onClick={() => setIsMenuOpen(false)} className="flex items-center">
                <svg width="28" height="28" viewBox="0 0 32 32" fill="none" className="text-primary">
                  <path d="M16 4C9.373 4 4 9.373 4 16s5.373 12 12 12 12-5.373 12-12S22.627 4 16 4z" fill="currentColor" opacity="0.2"/>
                  <path d="M12 16h8M16 12v8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
                <span className="text-lg font-bold ml-1">
                  <span className="text-primary">tablet</span>
                  <span className="text-secondary">kart</span>
                </span>
              </Link>
              <button onClick={() => setIsMenuOpen(false)} className="p-1.5 hover:bg-muted rounded-lg">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            
            <div className="p-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive(link.path) 
                      ? "bg-primary/10 text-primary font-semibold border-l-3 border-primary" 
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <link.icon className="h-5 w-5" />
                  {link.name}
                </Link>
              ))}

              {/* Shop Section */}
              <div className="pt-4">
                <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Shop
                </p>
                {shopItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-foreground hover:bg-muted transition-colors"
                  >
                    <item.icon className="h-5 w-5 text-primary" />
                    {item.name}
                  </Link>
                ))}
              </div>

              {/* Upload Rx */}
              <div className="pt-4">
                <Link
                  to="/upload-prescription"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold"
                >
                  <Upload className="h-5 w-5" />
                  Upload Prescription
                </Link>
              </div>

              {/* User Section */}
              {user && (
                <div className="pt-4 border-t border-border mt-4">
                  <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Account
                  </p>
                  <Link
                    to="/dashboard"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-foreground hover:bg-muted transition-colors"
                  >
                    <User className="h-5 w-5" />
                    My Profile
                  </Link>
                  <Link
                    to="/dashboard?tab=orders"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-foreground hover:bg-muted transition-colors"
                  >
                    <Package className="h-5 w-5" />
                    My Orders
                  </Link>
                  {isStaff && (
                    <Link
                      to="/admin"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-foreground hover:bg-muted transition-colors"
                    >
                      <LayoutDashboard className="h-5 w-5" />
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    Sign Out
                  </button>
                </div>
              )}

              {!user && (
                <div className="pt-4 border-t border-border mt-4">
                  <Link
                    to="/auth"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-muted text-foreground font-medium"
                  >
                    <User className="h-5 w-5" />
                    Sign In / Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Mobile Search Overlay */}
      {showMobileSearch && (
        <div className="fixed inset-0 bg-card z-50 lg:hidden">
          <div className="p-4 border-b border-border flex items-center gap-3">
            <button 
              onClick={() => { setShowMobileSearch(false); setSearchQuery(""); setSearchResults([]); }}
              className="p-1.5 hover:bg-muted rounded-lg"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
            <div className="flex-1 flex items-center gap-2 bg-muted rounded-full px-4 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search medicines..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="flex-1 bg-transparent border-none outline-none text-sm text-foreground"
              />
            </div>
          </div>
          
          <div className="p-4 overflow-y-auto h-[calc(100vh-72px)]">
            {searchQuery.length < 2 ? (
              <p className="text-center text-muted-foreground text-sm py-8">
                Type at least 2 characters to search
              </p>
            ) : isSearching ? (
              <p className="text-center text-muted-foreground text-sm py-8">
                Searching...
              </p>
            ) : searchResults.length > 0 ? (
              <>
                <p className="text-xs font-medium text-muted-foreground mb-3">
                  Found {searchResults.length} product{searchResults.length !== 1 ? "s" : ""}
                </p>
                {searchResults.map((product) => (
                  <Link
                    key={product.id}
                    to={`/medicine/${product.slug}`}
                    onClick={() => { setShowMobileSearch(false); setSearchQuery(""); }}
                    className="flex gap-3 p-3 rounded-xl border border-border mb-2 hover:bg-muted transition-colors"
                  >
                    <div className="w-16 h-16 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-12 h-12 object-contain" />
                      ) : (
                        <Pill className="h-6 w-6 text-primary/50" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground line-clamp-2">{product.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{product.brand || "Generic"}</p>
                      <p className="text-base font-bold text-primary mt-1">₹{product.price}</p>
                    </div>
                  </Link>
                ))}
                <Link
                  to={`/conditions?search=${searchQuery}`}
                  onClick={() => { setShowMobileSearch(false); setSearchQuery(""); }}
                  className="block text-center py-3 mt-4 bg-primary text-primary-foreground rounded-xl font-semibold"
                >
                  View all results →
                </Link>
              </>
            ) : (
              <p className="text-center text-muted-foreground text-sm py-8">
                No products found for "{searchQuery}"
              </p>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;