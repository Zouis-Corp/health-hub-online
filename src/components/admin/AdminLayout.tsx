import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Pill, 
  FileText, 
  ShoppingBag, 
  Users, 
  Heart,
  LogOut,
  ChevronLeft,
  Menu,
  X,
  Ticket,
  Truck,
  FlaskConical,
  Stethoscope
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

const AdminLayout = ({ children, title, description }: AdminLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut, isAdmin, isPharmacist } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Pharmacists can only access Prescriptions, Orders, and Dashboard
  // Admins have access to everything
  const navItems = [
    { name: "Dashboard", path: "/admin", icon: LayoutDashboard },
    ...(isAdmin ? [{ name: "Conditions", path: "/admin/conditions", icon: Stethoscope }] : []),
    ...(isAdmin ? [{ name: "Medicines", path: "/admin/medicines", icon: Pill }] : []),
    ...(isAdmin ? [{ name: "Molecules", path: "/admin/molecules", icon: FlaskConical }] : []),
    ...(isAdmin ? [{ name: "Super Specialities", path: "/admin/super-specialities", icon: Heart }] : []),
    { name: "Prescriptions", path: "/admin/prescriptions", icon: FileText },
    { name: "Orders", path: "/admin/orders", icon: ShoppingBag },
    ...(isAdmin ? [{ name: "Users", path: "/admin/users", icon: Users }] : []),
    ...(isAdmin ? [{ name: "Coupons", path: "/admin/coupons", icon: Ticket }] : []),
    ...(isAdmin ? [{ name: "Delivery Fees", path: "/admin/delivery-fees", icon: Truck }] : []),
  ];

  const userRoleLabel = isAdmin ? "Administrator" : isPharmacist ? "Pharmacist" : "Staff";

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 bg-card border-b border-border">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <Link to="/" className="flex items-center gap-1">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" className="text-primary">
              <path d="M16 4C9.373 4 4 9.373 4 16s5.373 12 12 12 12-5.373 12-12S22.627 4 16 4z" fill="currentColor" opacity="0.2"/>
              <path d="M12 16h8M16 12v8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            <span className="text-lg font-bold">
              <span className="text-primary">tablet</span>
              <span className="text-secondary">kart</span>
            </span>
          </Link>
          <div className="w-10" />
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={cn(
          "fixed inset-y-0 left-0 z-[60] w-64 bg-card border-r border-border transition-transform lg:translate-x-0 lg:static lg:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-6 border-b border-border hidden lg:block">
              <Link to="/" className="flex items-center gap-2">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-primary">
                  <path d="M16 4C9.373 4 4 9.373 4 16s5.373 12 12 12 12-5.373 12-12S22.627 4 16 4z" fill="currentColor" opacity="0.2"/>
                  <path d="M12 16h8M16 12v8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
                <div>
                  <span className="text-xl font-bold">
                    <span className="text-primary">tablet</span>
                    <span className="text-secondary">kart</span>
                  </span>
                  <p className="text-xs text-muted-foreground">Admin Panel</p>
                </div>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                      isActive 
                        ? "bg-primary text-primary-foreground" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-border space-y-2">
              <Link to="/">
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <ChevronLeft className="h-4 w-4" />
                  Back to Store
                </Button>
              </Link>
              <div className="px-4 py-2">
                <p className="text-sm font-medium truncate">{profile?.name || "Staff"}</p>
                <p className="text-xs text-muted-foreground">{userRoleLabel}</p>
              </div>
              <Button variant="ghost" className="w-full justify-start gap-2 text-destructive hover:text-destructive" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </aside>

        {/* Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-[55] lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-h-screen">
          <div className="p-4 lg:p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-foreground">{title}</h1>
              {description && <p className="text-muted-foreground mt-1">{description}</p>}
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
