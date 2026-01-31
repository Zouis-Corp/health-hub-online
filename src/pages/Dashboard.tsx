import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  User,
  Package,
  FileText,
  Heart,
  MapPin,
  LogOut,
  ChevronRight,
  Eye,
  RefreshCw,
  Download,
  Printer,
  Clock,
  CheckCircle,
  Truck,
  Edit,
  Loader2,
  XCircle,
  CreditCard,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  ExternalLink,
  Image,
  Upload,
  X,
  Camera,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AddressForm, { AddressFormData } from "@/components/address/AddressForm";
import AddressCard from "@/components/address/AddressCard";

const MAX_ADDRESSES = 5;

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("orders");
  const [editProfile, setEditProfile] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderDetailOpen, setOrderDetailOpen] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<string[]>([]);
  const [profileForm, setProfileForm] = useState({
    name: profile?.name || "",
    phone: profile?.phone || "",
  });
  
  // Address management state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [isAddressSubmitting, setIsAddressSubmitting] = useState(false);

  // Prescription view state
  const [prescriptionDialogOpen, setPrescriptionDialogOpen] = useState(false);
  const [selectedPrescriptionUrl, setSelectedPrescriptionUrl] = useState<string | null>(null);

  // Re-upload prescription state
  const [reuploadDialogOpen, setReuploadDialogOpen] = useState(false);
  const [orderToReupload, setOrderToReupload] = useState<any>(null);
  const [reuploadFiles, setReuploadFiles] = useState<File[]>([]);
  const [isReuploadSubmitting, setIsReuploadSubmitting] = useState(false);

  // Fetch orders with prescriptions and address
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["user-orders"],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(id, quantity, price, medicines(name)), prescriptions(id, file_url, status), addresses(name, phone, address_line_1, address_line_2, city, state, pincode)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch prescriptions
  const { data: prescriptions, isLoading: prescriptionsLoading } = useQuery({
    queryKey: ["user-prescriptions"],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("prescriptions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch addresses
  const { data: addresses, isLoading: addressesLoading } = useQuery({
    queryKey: ["user-addresses"],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { name: string; phone: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("profiles")
        .update(data)
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Profile updated successfully" });
      refreshProfile();
      setEditProfile(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error updating profile", description: error.message, variant: "destructive" });
    },
  });

  // Address mutations
  const createAddressMutation = useMutation({
    mutationFn: async (data: AddressFormData) => {
      if (!user) throw new Error("Not authenticated");
      
      // Check limit
      if ((addresses?.length || 0) >= MAX_ADDRESSES) {
        throw new Error(`Maximum ${MAX_ADDRESSES} addresses allowed`);
      }
      
      // If setting as default, unset other defaults
      if (data.is_default) {
        await supabase
          .from("addresses")
          .update({ is_default: false })
          .eq("user_id", user.id);
      }
      
      const { error } = await supabase
        .from("addresses")
        .insert({
          user_id: user.id,
          name: data.name,
          phone: data.phone,
          address_line_1: data.address_line_1,
          address_line_2: data.address_line_2 || null,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          landmark: data.landmark || null,
          is_default: data.is_default || false,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Address added successfully" });
      queryClient.invalidateQueries({ queryKey: ["user-addresses"] });
      setShowAddressForm(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error adding address", description: error.message, variant: "destructive" });
    },
  });

  const updateAddressMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AddressFormData }) => {
      if (!user) throw new Error("Not authenticated");
      
      // If setting as default, unset other defaults
      if (data.is_default) {
        await supabase
          .from("addresses")
          .update({ is_default: false })
          .eq("user_id", user.id);
      }
      
      const { error } = await supabase
        .from("addresses")
        .update({
          name: data.name,
          phone: data.phone,
          address_line_1: data.address_line_1,
          address_line_2: data.address_line_2 || null,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          landmark: data.landmark || null,
          is_default: data.is_default || false,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Address updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["user-addresses"] });
      setEditingAddress(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error updating address", description: error.message, variant: "destructive" });
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("addresses")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Address deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["user-addresses"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error deleting address", description: error.message, variant: "destructive" });
    },
  });

  const setDefaultAddressMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Not authenticated");
      
      // Unset all defaults first
      await supabase
        .from("addresses")
        .update({ is_default: false })
        .eq("user_id", user.id);
      
      // Set new default
      const { error } = await supabase
        .from("addresses")
        .update({ is_default: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Default address updated" });
      queryClient.invalidateQueries({ queryKey: ["user-addresses"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error setting default", description: error.message, variant: "destructive" });
    },
  });

  const handleAddressSubmit = async (data: AddressFormData) => {
    setIsAddressSubmitting(true);
    try {
      if (editingAddress) {
        await updateAddressMutation.mutateAsync({ id: editingAddress.id, data });
      } else {
        await createAddressMutation.mutateAsync(data);
      }
    } finally {
      setIsAddressSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  // Razorpay payment integration
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);

  const initiateRazorpayPayment = async (order: any) => {
    setIsPaymentLoading(true);
    
    try {
      // Create Razorpay order
      const { data, error } = await supabase.functions.invoke('razorpay-payment', {
        body: {
          action: 'create-order',
          orderId: order.id,
          amount: order.total_amount,
        },
      });

      if (error || !data.success) {
        throw new Error(data?.error || 'Failed to create payment order');
      }

      // Open Razorpay checkout
      const options = {
        key: data.razorpayKeyId,
        amount: data.amount,
        currency: data.currency,
        name: 'TabletKart',
        description: `Order #${order.id.slice(0, 8).toUpperCase()}`,
        order_id: data.razorpayOrderId,
        prefill: data.prefill,
        theme: {
          color: '#7C3AED',
        },
        handler: async (response: any) => {
          // Verify payment
          try {
            const verifyResult = await supabase.functions.invoke('razorpay-payment', {
              body: {
                action: 'verify-payment',
                orderId: order.id,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              },
            });

            if (verifyResult.error || !verifyResult.data.success) {
              throw new Error(verifyResult.data?.error || 'Payment verification failed');
            }

            queryClient.invalidateQueries({ queryKey: ["user-orders"] });
            toast({ 
              title: "Payment Successful! 🎉", 
              description: "Your order is now being processed." 
            });
            setOrderDetailOpen(false);
          } catch (verifyError: any) {
            toast({ 
              title: "Payment verification failed", 
              description: verifyError.message,
              variant: "destructive" 
            });
          }
        },
        modal: {
          ondismiss: () => {
            setIsPaymentLoading(false);
            toast({ 
              title: "Payment cancelled", 
              description: "You can try again anytime.",
              variant: "default" 
            });
          },
        },
      };

      // Use window.Razorpay
      const RazorpayConstructor = (window as any).Razorpay;
      if (!RazorpayConstructor) {
        throw new Error('Razorpay SDK not loaded. Please refresh the page.');
      }

      const razorpay = new RazorpayConstructor(options);
      razorpay.open();
      setIsPaymentLoading(false);

    } catch (error: any) {
      console.error('Payment error:', error);
      toast({ 
        title: "Payment failed", 
        description: error.message,
        variant: "destructive" 
      });
      setIsPaymentLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { className: string; icon: React.ReactNode }> = {
      pending_rx: { className: "bg-yellow-100 text-yellow-800", icon: <Clock className="h-3 w-3" /> },
      pending: { className: "bg-yellow-100 text-yellow-800", icon: <Clock className="h-3 w-3" /> },
      approved: { className: "bg-green-100 text-green-800", icon: <CheckCircle className="h-3 w-3" /> },
      rejected: { className: "bg-red-100 text-red-800", icon: <XCircle className="h-3 w-3" /> },
      processing: { className: "bg-purple-100 text-purple-800", icon: <Package className="h-3 w-3" /> },
      shipped: { className: "bg-orange-100 text-orange-800", icon: <Truck className="h-3 w-3" /> },
      delivered: { className: "bg-emerald-100 text-emerald-800", icon: <CheckCircle className="h-3 w-3" /> },
    };
    const config = statusMap[status] || { className: "bg-gray-100 text-gray-800", icon: null };
    return (
      <Badge className={config.className}>
        {config.icon}
        <span className="ml-1 capitalize">{status.replace("_", " ")}</span>
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      paid: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      refunded: "bg-gray-100 text-gray-800",
    };
    return (
      <Badge className={statusMap[status] || "bg-gray-100 text-gray-800"}>
        {status === "paid" && <CheckCircle className="h-3 w-3 mr-1" />}
        {status === "pending" && <Clock className="h-3 w-3 mr-1" />}
        <span className="capitalize">{status}</span>
      </Badge>
    );
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const formatOrderNumber = (orderNumber: number | null | undefined) => {
    return orderNumber ? `#${orderNumber}` : "N/A";
  };

  // Print e-receipt function
  const printReceipt = (order: any) => {
    const orderItems = order.order_items || [];
    const subtotal = orderItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    const deliveryFee = order.delivery_fee || 0;
    const discount = order.discount_amount || 0;
    const address = order.addresses;

    const receiptContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>TabletKart - Receipt ${formatOrderNumber(order.order_number)}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 400px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px dashed #ccc; padding-bottom: 15px; }
          .logo { font-size: 24px; font-weight: bold; }
          .logo .tablet { color: #7C3AED; }
          .logo .kart { color: #22C55E; }
          .order-info { margin-bottom: 15px; }
          .order-info p { font-size: 12px; color: #666; margin: 3px 0; }
          .order-number { font-size: 16px; font-weight: bold; color: #333 !important; }
          .items { border-top: 1px solid #eee; border-bottom: 1px solid #eee; padding: 15px 0; margin: 15px 0; }
          .item { display: flex; justify-content: space-between; margin: 8px 0; font-size: 13px; }
          .item-name { flex: 1; }
          .item-qty { color: #666; margin-left: 10px; }
          .item-price { font-weight: 500; min-width: 70px; text-align: right; }
          .totals { margin: 15px 0; }
          .total-row { display: flex; justify-content: space-between; margin: 5px 0; font-size: 13px; }
          .total-row.discount { color: #22C55E; }
          .total-row.grand-total { font-weight: bold; font-size: 16px; border-top: 1px solid #ccc; padding-top: 10px; margin-top: 10px; }
          .address { margin-top: 15px; padding-top: 15px; border-top: 1px dashed #ccc; font-size: 12px; }
          .address-title { font-weight: bold; margin-bottom: 5px; }
          .footer { text-align: center; margin-top: 20px; padding-top: 15px; border-top: 2px dashed #ccc; font-size: 11px; color: #666; }
          .status { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 11px; text-transform: capitalize; }
          .status-paid { background: #dcfce7; color: #16a34a; }
          .status-pending { background: #fef3c7; color: #d97706; }
          @media print { body { padding: 10px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo"><span class="tablet">tablet</span><span class="kart">kart</span>.in</div>
          <p style="font-size: 12px; color: #666; margin-top: 5px;">E-Receipt</p>
        </div>
        
        <div class="order-info">
          <p class="order-number">Order ${formatOrderNumber(order.order_number)}</p>
          <p>Date: ${format(new Date(order.created_at), "MMM d, yyyy h:mm a")}</p>
          <p>Status: <span class="status ${order.payment_status === 'paid' ? 'status-paid' : 'status-pending'}">${order.payment_status}</span></p>
        </div>

        <div class="items">
          ${orderItems.map((item: any) => `
            <div class="item">
              <span class="item-name">${item.medicines?.name || 'Medicine'}</span>
              <span class="item-qty">x${item.quantity}</span>
              <span class="item-price">₹${(item.price * item.quantity).toLocaleString()}</span>
            </div>
          `).join('')}
        </div>

        <div class="totals">
          <div class="total-row">
            <span>Subtotal</span>
            <span>₹${subtotal.toLocaleString()}</span>
          </div>
          ${deliveryFee > 0 ? `
            <div class="total-row">
              <span>Delivery Fee</span>
              <span>₹${deliveryFee.toLocaleString()}</span>
            </div>
          ` : `
            <div class="total-row" style="color: #22C55E;">
              <span>Delivery</span>
              <span>FREE</span>
            </div>
          `}
          ${discount > 0 ? `
            <div class="total-row discount">
              <span>Discount</span>
              <span>-₹${discount.toLocaleString()}</span>
            </div>
          ` : ''}
          <div class="total-row grand-total">
            <span>Total</span>
            <span>₹${order.total_amount.toLocaleString()}</span>
          </div>
        </div>

        ${address ? `
          <div class="address">
            <p class="address-title">Delivery Address</p>
            <p>${address.name}</p>
            <p>${address.address_line_1}${address.address_line_2 ? ', ' + address.address_line_2 : ''}</p>
            <p>${address.city}, ${address.state} - ${address.pincode}</p>
            <p>Phone: ${address.phone}</p>
          </div>
        ` : ''}

        <div class="footer">
          <p>Thank you for shopping with TabletKart!</p>
          <p style="margin-top: 5px;">For support: +91 98948 18002</p>
          <p style="margin-top: 5px;">www.tabletkart.in</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=450,height=600');
    if (printWindow) {
      printWindow.document.write(receiptContent);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const viewPrescription = async (fileUrl: string) => {
    try {
      const { data } = await supabase.storage
        .from("prescriptions")
        .createSignedUrl(fileUrl, 3600);
      if (data?.signedUrl) {
        setSelectedPrescriptionUrl(data.signedUrl);
        setPrescriptionDialogOpen(true);
      }
    } catch (error) {
      toast({ title: "Error loading prescription", variant: "destructive" });
    }
  };

  // Re-upload prescription handlers
  const handleReuploadFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const validFiles: File[] = [];
      const invalidFiles: string[] = [];
      
      Array.from(e.target.files).forEach(file => {
        if (!file.type.startsWith("image/")) {
          invalidFiles.push(`${file.name} (only images allowed)`);
        } else if (file.size > 2 * 1024 * 1024) {
          invalidFiles.push(`${file.name} (exceeds 2MB limit)`);
        } else {
          validFiles.push(file);
        }
      });
      
      if (invalidFiles.length > 0) {
        toast({
          title: "Some files were not added",
          description: invalidFiles.join(", "),
          variant: "destructive",
        });
      }
      
      setReuploadFiles([...reuploadFiles, ...validFiles]);
    }
  };

  const removeReuploadFile = (index: number) => {
    setReuploadFiles(reuploadFiles.filter((_, i) => i !== index));
  };

  const handleReuploadPrescription = async () => {
    if (!user || !orderToReupload || reuploadFiles.length === 0) return;
    
    setIsReuploadSubmitting(true);
    try {
      // Delete old prescriptions for this order
      await supabase
        .from("prescriptions")
        .delete()
        .eq("order_id", orderToReupload.id);

      // Upload new prescription files
      for (const file of reuploadFiles) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}/${orderToReupload.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("prescriptions")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Create prescription record
        const { error: prescriptionError } = await supabase
          .from("prescriptions")
          .insert({
            user_id: user.id,
            order_id: orderToReupload.id,
            file_url: fileName,
            status: "pending",
          });

        if (prescriptionError) throw prescriptionError;
      }

      // Update order status back to pending_rx
      const { error: orderError } = await supabase
        .from("orders")
        .update({ status: "pending_rx", rejection_reason: null })
        .eq("id", orderToReupload.id);

      if (orderError) throw orderError;

      // Send notification email
      try {
        await supabase.functions.invoke('send-notification-email', {
          body: {
            type: 'rx-uploaded',
            userId: user.id,
            orderId: orderToReupload.id,
            orderNumber: orderToReupload.order_number,
          },
        });
      } catch (emailError) {
        console.error('Failed to send notification email:', emailError);
      }

      queryClient.invalidateQueries({ queryKey: ["user-orders"] });
      toast({
        title: "Prescription uploaded successfully!",
        description: "Your prescription is under review. We'll notify you once approved.",
      });
      setReuploadDialogOpen(false);
      setOrderToReupload(null);
      setReuploadFiles([]);
    } catch (error: any) {
      console.error("Re-upload error:", error);
      toast({
        title: "Error uploading prescription",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsReuploadSubmitting(false);
    }
  };

  const openReuploadDialog = (order: any) => {
    setOrderToReupload(order);
    setReuploadFiles([]);
    setReuploadDialogOpen(true);
  };

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-[100px] sm:pt-[110px] pb-20 sm:pb-6">
        <div className="container">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link to="/" className="hover:text-primary">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">My Account</span>
          </nav>

          <div className="grid lg:grid-cols-4 gap-4 md:gap-6">
            {/* Sidebar - Horizontal scroll on mobile */}
            <div className="lg:col-span-1">
              {/* Mobile Tab Grid - All visible */}
              <div className="lg:hidden mb-4">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "orders", icon: Package, label: "Orders" },
                    { id: "prescriptions", icon: FileText, label: "Rx" },
                    { id: "addresses", icon: MapPin, label: "Address" },
                    { id: "wishlist", icon: Heart, label: "Wishlist" },
                    { id: "profile", icon: User, label: "Profile" },
                    { id: "logout", icon: LogOut, label: "Logout", isLogout: true },
                  ].map((item) => {
                    const Icon = item.icon;
                    if (item.isLogout) {
                      return (
                        <button 
                          key={item.id}
                          onClick={handleSignOut}
                          className="flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl text-xs font-medium bg-card border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Icon className="h-4 w-4" />
                          {item.label}
                        </button>
                      );
                    }
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                          activeTab === item.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-card border border-border text-foreground hover:border-primary"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Desktop Sidebar */}
              <div className="hidden lg:block bg-card rounded-xl border border-border p-5 shadow-card">
                {/* User Info */}
                <div className="flex items-center gap-3 mb-5 pb-5 border-b border-border">
                  <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-lg font-bold">
                    {getInitials(profile?.name)}
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground">
                      {profile?.name || "User"}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {profile?.phone || user.email}
                    </p>
                  </div>
                </div>

                {/* Navigation */}
                <nav className="space-y-1">
                  {[
                    { id: "orders", icon: Package, label: "My Orders" },
                    { id: "prescriptions", icon: FileText, label: "Prescriptions" },
                    { id: "addresses", icon: MapPin, label: "Addresses" },
                    { id: "wishlist", icon: Heart, label: "Wishlist" },
                    { id: "profile", icon: User, label: "Profile" },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors ${
                          activeTab === item.id
                            ? "bg-accent text-primary"
                            : "text-foreground hover:bg-muted"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="font-medium text-sm">{item.label}</span>
                      </button>
                    );
                  })}
                  <button 
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="font-medium text-sm">Logout</span>
                  </button>
                </nav>
              </div>
            </div>

            {/* Content */}
            <div className="lg:col-span-3">
              {/* Orders Tab */}
              {activeTab === "orders" && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-foreground font-heading">
                    My Orders
                  </h2>
                  {ordersLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-32 w-full" />
                      ))}
                    </div>
                  ) : orders?.length === 0 ? (
                    <div className="text-center py-12 bg-card rounded-xl border border-border">
                      <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">No orders yet</p>
                      <Link to="/conditions">
                        <Button>Start Shopping</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orders?.map((order) => {
                        const isExpanded = expandedOrders.includes(order.id);
                        const canPay = order.status === "approved" && order.payment_status !== "paid";
                        const orderItems = order.order_items || [];
                        
                        return (
                          <div
                            key={order.id}
                            className={`bg-card rounded-xl border shadow-card overflow-hidden ${
                              canPay ? "border-primary" : "border-border"
                            }`}
                          >
                            {/* Order Header */}
                            <div className="p-4">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                                <div>
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <p className="font-bold text-primary font-mono text-base">
                                      {formatOrderNumber(order.order_number)}
                                    </p>
                                    {getStatusBadge(order.status)}
                                    {getPaymentStatusBadge(order.payment_status)}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    Placed on {format(new Date(order.created_at), "MMM d, yyyy")}
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {canPay && (
                                    <Button 
                                      size="sm" 
                                      className="gap-1.5 rounded-lg text-xs"
                                      onClick={() => {
                                        setSelectedOrder(order);
                                        setOrderDetailOpen(true);
                                      }}
                                    >
                                      <CreditCard className="h-3.5 w-3.5" />
                                      Pay Now
                                    </Button>
                                  )}
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="gap-1.5 rounded-lg text-xs"
                                    onClick={() => toggleOrderExpand(order.id)}
                                  >
                                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                    {isExpanded ? "Hide" : "Details"}
                                  </Button>
                                  {order.prescriptions && order.prescriptions.length > 0 && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="gap-1.5 rounded-lg text-xs"
                                      onClick={() => viewPrescription(order.prescriptions[0].file_url)}
                                    >
                                      <FileText className="h-3.5 w-3.5" />
                                      View Rx
                                    </Button>
                                  )}
                                  {order.payment_status === "paid" && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="gap-1.5 rounded-lg text-xs"
                                      onClick={() => printReceipt(order)}
                                    >
                                      <Printer className="h-3.5 w-3.5" />
                                      E-Receipt
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {/* Status Message for approved orders */}
                              {canPay && (
                                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-3">
                                  <p className="text-sm text-primary font-medium flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4" />
                                    Your prescription has been approved! Complete payment to proceed.
                                  </p>
                                </div>
                              )}

                              {/* Order Summary */}
                              <div className="flex items-center justify-between pt-3 border-t border-border">
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                  {orderItems.length} item(s)
                                </p>
                                <p className="font-bold text-foreground text-lg">
                                  ₹{order.total_amount.toLocaleString()}
                                </p>
                              </div>
                            </div>

                            {/* Expanded Items */}
                            {isExpanded && (
                              <div className="border-t border-border bg-muted/30 p-4">
                                {/* Order Items */}
                                {orderItems.length > 0 && (
                                  <>
                                    <p className="text-sm font-medium mb-3 flex items-center gap-2">
                                      <ShoppingBag className="h-4 w-4" />
                                      Order Items
                                    </p>
                                    <div className="space-y-2 mb-4">
                                      {orderItems.map((item: any, index: number) => (
                                        <div key={index} className="flex items-center justify-between bg-card rounded-lg p-3 border border-border">
                                          <div>
                                            <p className="font-medium text-sm">{item.medicines?.name || "Medicine"}</p>
                                            <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                                          </div>
                                          <p className="font-semibold">₹{(item.price * item.quantity).toLocaleString()}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </>
                                )}

                                {/* Price Breakdown */}
                                <div className="bg-card rounded-lg p-4 border border-border space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>₹{orderItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0).toLocaleString()}</span>
                                  </div>
                                  
                                  {(order.delivery_fee || 0) > 0 ? (
                                    <div className="flex justify-between text-sm">
                                      <span className="text-muted-foreground">Delivery Fee</span>
                                      <span>₹{(order.delivery_fee || 0).toLocaleString()}</span>
                                    </div>
                                  ) : (
                                    <div className="flex justify-between text-sm text-green-600">
                                      <span>Delivery</span>
                                      <span>FREE</span>
                                    </div>
                                  )}
                                  
                                  {(order.discount_amount || 0) > 0 && (
                                    <div className="flex justify-between text-sm text-green-600">
                                      <span>Discount</span>
                                      <span>-₹{(order.discount_amount || 0).toLocaleString()}</span>
                                    </div>
                                  )}
                                  
                                  <div className="flex justify-between items-center pt-2 border-t border-border">
                                    <span className="font-semibold">Total</span>
                                    <span className="font-bold text-lg text-primary">₹{order.total_amount.toLocaleString()}</span>
                                  </div>
                                </div>

                                {/* Delivery Address */}
                                {order.addresses && (
                                  <div className="mt-4 bg-card rounded-lg p-4 border border-border">
                                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                                      <MapPin className="h-4 w-4" />
                                      Delivery Address
                                    </p>
                                    <div className="text-sm text-muted-foreground">
                                      <p className="font-medium text-foreground">{order.addresses.name}</p>
                                      <p>{order.addresses.address_line_1}</p>
                                      {order.addresses.address_line_2 && <p>{order.addresses.address_line_2}</p>}
                                      <p>{order.addresses.city}, {order.addresses.state} - {order.addresses.pincode}</p>
                                      <p className="mt-1">Phone: {order.addresses.phone}</p>
                                    </div>
                                  </div>
                                )}

                              </div>
                            )}

                            {/* Pending Rx Message */}
                            {order.status === "pending_rx" && (
                              <div className="border-t border-border bg-yellow-50 p-3">
                                <p className="text-sm text-yellow-800 flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  Waiting for prescription review. We'll notify you once approved.
                                </p>
                              </div>
                            )}

                            {/* Rejected Message with Reason and Re-upload */}
                            {order.status === "rejected" && (
                              <div className="border-t border-border bg-destructive/10 p-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-sm text-destructive font-medium flex items-center gap-2 mb-1">
                                      <XCircle className="h-4 w-4" />
                                      Order Rejected
                                    </p>
                                    {order.rejection_reason && (
                                      <p className="text-sm text-destructive/80 ml-6">
                                        Reason: {order.rejection_reason}
                                      </p>
                                    )}
                                  </div>
                                  {/* Only show re-upload button if less than 2 prescription attempts */}
                                  {(!order.prescriptions || order.prescriptions.length < 2) && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="gap-1.5 text-xs flex-shrink-0 border-primary text-primary hover:bg-primary/10"
                                      onClick={() => openReuploadDialog(order)}
                                    >
                                      <Upload className="h-3.5 w-3.5" />
                                      Re-upload Rx
                                    </Button>
                                  )}
                                </div>
                                {order.prescriptions && order.prescriptions.length >= 2 && (
                                  <p className="text-xs text-muted-foreground mt-2">
                                    Maximum re-upload attempts reached. Please contact support for assistance.
                                  </p>
                                )}
                              </div>
                            )}

                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Prescriptions Tab */}
              {activeTab === "prescriptions" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-foreground font-heading">
                      My Prescriptions
                    </h2>
                    <Link to="/upload-prescription">
                      <Button className="bg-primary hover:bg-primary/90 rounded-lg">Upload New</Button>
                    </Link>
                  </div>
                  {prescriptionsLoading ? (
                    <div className="space-y-3">
                      {[1, 2].map((i) => (
                        <Skeleton key={i} className="h-24 w-full" />
                      ))}
                    </div>
                  ) : prescriptions?.length === 0 ? (
                    <div className="text-center py-12 bg-card rounded-xl border border-border">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">No prescriptions uploaded</p>
                      <Link to="/upload-prescription">
                        <Button>Upload Prescription</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {prescriptions?.map((rx) => (
                        <div
                          key={rx.id}
                          className="bg-card rounded-xl border border-border p-4 shadow-card"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-foreground font-mono text-sm">
                                  RX-{rx.id.slice(0, 6).toUpperCase()}
                                </p>
                                {getStatusBadge(rx.status)}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Uploaded on {format(new Date(rx.created_at), "MMM d, yyyy")}
                              </p>
                            </div>
                            <Button variant="outline" size="sm" className="gap-1.5 rounded-lg text-xs">
                              <Download className="h-3.5 w-3.5" />
                              View
                            </Button>
                          </div>
                          {rx.notes && (
                            <div className="pt-3 border-t border-border">
                              <p className="text-sm text-muted-foreground">
                                Notes: {rx.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Addresses Tab */}
              {activeTab === "addresses" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-foreground font-heading">
                        Saved Addresses
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {addresses?.length || 0} of {MAX_ADDRESSES} addresses
                      </p>
                    </div>
                    {(addresses?.length || 0) < MAX_ADDRESSES && !showAddressForm && !editingAddress && (
                      <Button 
                        className="bg-primary hover:bg-primary/90 rounded-lg gap-2"
                        onClick={() => setShowAddressForm(true)}
                      >
                        <Plus className="h-4 w-4" />
                        Add New
                      </Button>
                    )}
                  </div>
                  
                  {/* Add/Edit Address Form */}
                  {(showAddressForm || editingAddress) && (
                    <div className="bg-card rounded-xl border border-border p-4 sm:p-5 shadow-card">
                      <h3 className="font-semibold text-foreground mb-4">
                        {editingAddress ? "Edit Address" : "Add New Address"}
                      </h3>
                      <AddressForm
                        initialData={editingAddress || undefined}
                        onSubmit={handleAddressSubmit}
                        onCancel={() => {
                          setShowAddressForm(false);
                          setEditingAddress(null);
                        }}
                        isLoading={isAddressSubmitting}
                        submitLabel={editingAddress ? "Update Address" : "Save Address"}
                      />
                    </div>
                  )}
                  
                  {addressesLoading ? (
                    <div className="grid md:grid-cols-2 gap-4">
                      {[1, 2].map((i) => (
                        <Skeleton key={i} className="h-40 w-full" />
                      ))}
                    </div>
                  ) : addresses?.length === 0 && !showAddressForm ? (
                    <div className="text-center py-12 bg-card rounded-xl border border-border">
                      <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">No addresses saved</p>
                      <Button 
                        className="bg-primary hover:bg-primary/90 rounded-lg gap-2"
                        onClick={() => setShowAddressForm(true)}
                      >
                        <Plus className="h-4 w-4" />
                        Add Your First Address
                      </Button>
                    </div>
                  ) : !showAddressForm && !editingAddress && (
                    <div className="grid md:grid-cols-2 gap-4">
                      {addresses?.map((address) => (
                        <AddressCard
                          key={address.id}
                          address={address}
                          onEdit={() => setEditingAddress(address)}
                          onDelete={() => deleteAddressMutation.mutate(address.id)}
                          onSetDefault={() => setDefaultAddressMutation.mutate(address.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Profile Tab */}
              {activeTab === "profile" && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-foreground font-heading">
                    Profile Settings
                  </h2>
                  <div className="bg-card rounded-xl border border-border p-5 shadow-card">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="profile-name">Full Name</Label>
                        <Input 
                          id="profile-name"
                          value={profileForm.name}
                          onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                          className="h-10 rounded-lg" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="profile-phone">Mobile Number</Label>
                        <Input 
                          id="profile-phone"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                          className="h-10 rounded-lg" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="profile-email">Email Address</Label>
                        <Input 
                          id="profile-email"
                          value={user.email || ""} 
                          disabled
                          className="h-10 rounded-lg bg-muted" 
                        />
                      </div>
                    </div>
                    <div className="mt-5 pt-5 border-t border-border">
                      <Button 
                        className="bg-primary hover:bg-primary/90 rounded-lg"
                        onClick={() => updateProfileMutation.mutate(profileForm)}
                        disabled={updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Wishlist Tab */}
              {activeTab === "wishlist" && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-foreground font-heading">
                    My Wishlist
                  </h2>
                  <div className="text-center py-12 bg-card rounded-xl border border-border">
                    <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      Your wishlist is empty
                    </p>
                    <Link to="/conditions">
                      <Button variant="outline" className="rounded-lg">Browse Medicines</Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* Payment Confirmation Dialog */}
      <Dialog open={orderDetailOpen} onOpenChange={setOrderDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Complete Payment
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-muted-foreground">Order ID</span>
                  <span className="font-mono font-medium">#{selectedOrder.id.slice(0, 8).toUpperCase()}</span>
                </div>
                <div className="border-t border-border pt-3">
                  <p className="font-medium mb-2">Items:</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedOrder.order_items?.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.medicines?.name} x{item.quantity}</span>
                        <span>₹{(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-t border-border mt-3 pt-3 flex justify-between items-center">
                  <span className="font-bold">Total Amount</span>
                  <span className="text-xl font-bold text-primary">₹{selectedOrder.total_amount.toLocaleString()}</span>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Your prescription has been verified by our pharmacist
                </p>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setOrderDetailOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1 gap-2"
                  onClick={() => initiateRazorpayPayment(selectedOrder)}
                  disabled={isPaymentLoading}
                >
                  {isPaymentLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4" />
                  )}
                  Pay ₹{selectedOrder.total_amount.toLocaleString()}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Secure payment powered by Razorpay
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Prescription Dialog */}
      <Dialog open={prescriptionDialogOpen} onOpenChange={setPrescriptionDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Prescription Image</DialogTitle>
          </DialogHeader>
          {selectedPrescriptionUrl && (
            <div className="flex items-center justify-center overflow-auto max-h-[70vh]">
              <img
                src={selectedPrescriptionUrl}
                alt="Prescription"
                className="max-w-full h-auto rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Re-upload Prescription Dialog */}
      <Dialog open={reuploadDialogOpen} onOpenChange={(open) => {
        setReuploadDialogOpen(open);
        if (!open) {
          setOrderToReupload(null);
          setReuploadFiles([]);
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Re-upload Prescription
            </DialogTitle>
          </DialogHeader>
          {orderToReupload && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm">
                  <span className="text-muted-foreground">Order:</span>{" "}
                  <span className="font-bold text-primary">{formatOrderNumber(orderToReupload.order_number)}</span>
                </p>
                {orderToReupload.rejection_reason && (
                  <p className="text-sm mt-1">
                    <span className="text-muted-foreground">Previous rejection:</span>{" "}
                    <span className="text-destructive">{orderToReupload.rejection_reason}</span>
                  </p>
                )}
              </div>

              {/* Upload Area */}
              <div className="relative border-2 border-dashed rounded-xl p-6 text-center transition-all border-border hover:border-primary">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleReuploadFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center mx-auto">
                    <Camera className="h-6 w-6 text-primary" />
                  </div>
                  <p className="font-semibold text-foreground text-sm">
                    Click to upload or drag & drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Images only, max 2MB each
                  </p>
                </div>
              </div>

              {/* Uploaded Files */}
              {reuploadFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    Files ({reuploadFiles.length})
                  </p>
                  {reuploadFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2.5 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground line-clamp-1">
                            {file.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeReuploadFile(index)}
                        className="p-1 hover:bg-destructive/10 rounded-full transition-colors flex-shrink-0"
                      >
                        <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setReuploadDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1 gap-2"
                  onClick={handleReuploadPrescription}
                  disabled={reuploadFiles.length === 0 || isReuploadSubmitting}
                >
                  {isReuploadSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Submit for Review
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
