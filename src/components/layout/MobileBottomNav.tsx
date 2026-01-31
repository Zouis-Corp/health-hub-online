import { Link, useLocation } from "react-router-dom";
import { Home, Store, Upload, ShoppingCart, User, Calendar } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { 
    name: "Home", 
    path: "/", 
    icon: Home 
  },
  { 
    name: "Shop", 
    path: "/shop", 
    icon: Store 
  },
  { 
    name: "Upload Rx", 
    path: "/upload-prescription", 
    icon: Upload,
    highlight: true 
  },
  { 
    name: "Cart", 
    path: "/cart", 
    icon: ShoppingCart,
    showBadge: true 
  },
  { 
    name: "Account", 
    path: "/auth", 
    icon: User 
  },
];

const MobileBottomNav = () => {
  const location = useLocation();
  const { totalItems } = useCart();
  const { user } = useAuth();

  // Hide bottom nav on single product pages (they have their own fixed bottom bar)
  const isProductDetailPage = location.pathname.startsWith("/medicine/");
  
  if (isProductDetailPage) {
    return null;
  }

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Floating Clinic Appointment Button - iOS Glassy Style */}
      <a
        href="https://book.tabletkart.in"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-20 left-3 z-40 md:hidden group"
      >
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl backdrop-blur-xl bg-white/70 dark:bg-black/50 border border-white/40 dark:border-white/20 shadow-lg shadow-black/10 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:bg-white/80 dark:hover:bg-black/60">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0">
            <Calendar className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground font-medium leading-tight">Book Now</span>
            <span className="text-xs font-semibold text-foreground leading-tight">Nanmai Clinic</span>
          </div>
        </div>
      </a>

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden safe-area-bottom">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            const accountPath = user ? "/dashboard" : "/auth";
            const finalPath = item.name === "Account" ? accountPath : item.path;
            
            return (
              <Link
                key={item.name}
                to={finalPath}
                className={`flex flex-col items-center justify-center flex-1 h-full relative transition-colors ${
                  item.highlight 
                    ? "text-primary" 
                    : active 
                      ? "text-primary" 
                      : "text-muted-foreground"
                }`}
              >
                {item.highlight ? (
                  <div className="absolute -top-4 w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg">
                    <Icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                ) : (
                  <div className="relative">
                    <Icon className={`h-5 w-5 ${active ? "text-primary" : ""}`} />
                    {item.showBadge && totalItems > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 h-4 w-4 flex items-center justify-center bg-secondary text-white text-[9px] font-bold rounded-full">
                        {totalItems > 9 ? "9+" : totalItems}
                      </span>
                    )}
                  </div>
                )}
                <span className={`text-[10px] font-medium mt-1 ${item.highlight ? "mt-5" : ""}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default MobileBottomNav;
