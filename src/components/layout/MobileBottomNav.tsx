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
        className="fixed bottom-[72px] left-2 z-40 md:hidden group"
      >
        <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg backdrop-blur-2xl bg-white/50 dark:bg-white/10 border border-white/60 dark:border-white/30 shadow-lg shadow-black/5 transition-all duration-300 hover:scale-105 hover:bg-white/70 dark:hover:bg-white/20"
          style={{ 
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)'
          }}
        >
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary/90 to-primary/60 flex items-center justify-center flex-shrink-0">
            <Calendar className="h-3 w-3 text-primary-foreground" />
          </div>
          <div className="flex flex-col pr-0.5">
            <span className="text-[8px] text-muted-foreground/80 font-medium leading-tight">Book</span>
            <span className="text-[10px] font-semibold text-foreground/90 leading-tight">Nanmai Clinic</span>
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
