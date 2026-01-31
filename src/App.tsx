import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import MobileBottomNav from "@/components/layout/MobileBottomNav";

// Pages
import Index from "./pages/Index";
import Conditions from "./pages/Conditions";
import MedicineDetail from "./pages/MedicineDetail";
import UploadPrescription from "./pages/UploadPrescription";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import PatientAssistance from "./pages/PatientAssistance";
import ImportedMedicine from "./pages/ImportedMedicine";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminConditions from "./pages/admin/AdminConditions";
import AdminMedicines from "./pages/admin/AdminMedicines";
import AdminPrescriptions from "./pages/admin/AdminPrescriptions";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminDeliveryFees from "./pages/admin/AdminDeliveryFees";

const queryClient = new QueryClient();

// Layout component that conditionally shows bottom nav
import { useEffect } from "react";

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  
  return null;
};

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  
  // Hide bottom nav on admin pages
  const isAdminPage = location.pathname.startsWith('/admin');
  
  return (
    <div className="overflow-x-hidden w-full">
      <ScrollToTop />
      <div className="pb-20 md:pb-0">
        {children}
      </div>
      {!isAdminPage && <MobileBottomNav />}
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppLayout>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Index />} />
                <Route path="/conditions" element={<Conditions />} />
                <Route path="/medicine/:id" element={<MedicineDetail />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/patient-assistance" element={<PatientAssistance />} />
                <Route path="/imported-medicine" element={<ImportedMedicine />} />
                
                {/* Protected Routes - User */}
                <Route path="/upload-prescription" element={
                  <ProtectedRoute>
                    <UploadPrescription />
                  </ProtectedRoute>
                } />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={
                  <ProtectedRoute>
                    <Checkout />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                
                {/* Protected Routes - Admin/Staff */}
                <Route path="/admin" element={
                  <ProtectedRoute requireStaff>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin/conditions" element={
                  <ProtectedRoute requireAdmin>
                    <AdminConditions />
                  </ProtectedRoute>
                } />
                <Route path="/admin/medicines" element={
                  <ProtectedRoute requireAdmin>
                    <AdminMedicines />
                  </ProtectedRoute>
                } />
                <Route path="/admin/prescriptions" element={
                  <ProtectedRoute requireStaff>
                    <AdminPrescriptions />
                  </ProtectedRoute>
                } />
                <Route path="/admin/orders" element={
                  <ProtectedRoute requireStaff>
                    <AdminOrders />
                  </ProtectedRoute>
                } />
                <Route path="/admin/users" element={
                  <ProtectedRoute requireAdmin>
                    <AdminUsers />
                  </ProtectedRoute>
                } />
                <Route path="/admin/coupons" element={
                  <ProtectedRoute requireAdmin>
                    <AdminCoupons />
                  </ProtectedRoute>
                } />
                <Route path="/admin/delivery-fees" element={
                  <ProtectedRoute requireAdmin>
                    <AdminDeliveryFees />
                  </ProtectedRoute>
                } />
                
                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppLayout>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
