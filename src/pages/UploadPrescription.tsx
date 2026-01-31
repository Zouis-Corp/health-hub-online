import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import {
  Upload,
  FileText,
  Camera,
  X,
  CheckCircle,
  Shield,
  Clock,
  Truck,
  Phone,
  ChevronRight,
  Loader2,
  Plus,
  MapPin,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AddressForm, { AddressFormData } from "@/components/address/AddressForm";
import AddressCard from "@/components/address/AddressCard";

const MAX_ADDRESSES = 5;

const UploadPrescription = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();
  const { items, totalPrice, clearCart, hasPrescriptionItems } = useCart();
  const { toast } = useToast();
  
  // Get coupon and delivery info from cart page
  const cartState = location.state as { couponId?: string; discountAmount?: number; deliveryFee?: number } | null;
  
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Address state
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [isAddressSubmitting, setIsAddressSubmitting] = useState(false);

  // Fetch user addresses
  const { data: addresses, isLoading: addressesLoading, refetch: refetchAddresses } = useQuery({
    queryKey: ["user-addresses-checkout"],
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

  // Set default address when addresses load
  useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedAddressId) {
      const defaultAddr = addresses.find((a) => a.is_default) || addresses[0];
      setSelectedAddressId(defaultAddr.id);
    }
  }, [addresses, selectedAddressId]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const validFiles: File[] = [];
      const invalidFiles: string[] = [];
      
      Array.from(e.dataTransfer.files).forEach(file => {
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
      
      setFiles([...files, ...validFiles]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      
      setFiles([...files, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleAddAddress = async (data: AddressFormData) => {
    if (!user) return;
    
    setIsAddressSubmitting(true);
    try {
      // If setting as default, unset other defaults
      if (data.is_default) {
        await supabase
          .from("addresses")
          .update({ is_default: false })
          .eq("user_id", user.id);
      }
      
      const { data: newAddress, error } = await supabase
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
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toast({ title: "Address added successfully" });
      await refetchAddresses();
      setSelectedAddressId(newAddress.id);
      setShowAddressForm(false);
    } catch (error: any) {
      toast({ 
        title: "Error adding address", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setIsAddressSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (files.length === 0) {
      toast({
        title: "Prescription required",
        description: "Please upload your prescription to continue.",
        variant: "destructive",
      });
      return;
    }

    // Only require address if there are cart items
    if (items.length > 0 && !selectedAddressId) {
      toast({
        title: "Address required",
        description: "Please select or add a delivery address.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Two flows:
      // 1. Cart has items → Create order with items, prescription linked
      // 2. No cart items → Create prescription only, admin adds items later

      if (items.length > 0) {
        // Flow 1: Order with cart items
        // Calculate final total with coupon discount and delivery fee
        const discountAmount = cartState?.discountAmount || 0;
        const deliveryFee = cartState?.deliveryFee || 0;
        const finalTotal = totalPrice - discountAmount + deliveryFee;

        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .insert({
            user_id: user.id,
            status: "pending_rx",
            total_amount: finalTotal,
            payment_status: "pending",
            address_id: selectedAddressId,
            coupon_id: cartState?.couponId || null,
            discount_amount: discountAmount,
            delivery_fee: deliveryFee,
          })
          .select()
          .single();

        if (orderError) throw orderError;

        if (orderError) throw orderError;

        // Create order items
        const orderItems = items.map((item) => ({
          order_id: orderData.id,
          medicine_id: item.id,
          quantity: item.quantity,
          price: item.price,
        }));

        const { error: itemsError } = await supabase
          .from("order_items")
          .insert(orderItems);

        if (itemsError) throw itemsError;

        // Upload prescription files linked to order
        for (const file of files) {
          const fileExt = file.name.split(".").pop();
          const fileName = `${user.id}/${orderData.id}/${Date.now()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from("prescriptions")
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { error: prescriptionError } = await supabase
            .from("prescriptions")
            .insert({
              user_id: user.id,
              order_id: orderData.id,
              file_url: fileName,
              status: "pending",
            });

          if (prescriptionError) throw prescriptionError;
        }

        // Send notification email for prescription upload with order
        try {
          await supabase.functions.invoke('send-notification-email', {
            body: {
              type: 'rx-uploaded',
              userId: user.id,
              orderId: orderData.id,
              orderNumber: orderData.order_number,
            },
          });
        } catch (emailError) {
          console.error('Failed to send notification email:', emailError);
        }

        // Clear cart and redirect
        clearCart();
        toast({
          title: "Order placed successfully!",
          description: "Your prescription is under review. We'll notify you once approved.",
        });
      } else {
        // Flow 2: Direct prescription upload (no cart items)
        // Upload prescription files without an order - admin will add items later
        for (const file of files) {
          const fileExt = file.name.split(".").pop();
          const fileName = `${user.id}/direct/${Date.now()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from("prescriptions")
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { error: prescriptionError } = await supabase
            .from("prescriptions")
            .insert({
              user_id: user.id,
              order_id: null, // No order yet
              file_url: fileName,
              status: "pending",
            });

          if (prescriptionError) throw prescriptionError;
        }

        // Send notification email for direct prescription upload
        try {
          await supabase.functions.invoke('send-notification-email', {
            body: {
              type: 'rx-uploaded',
              userId: user.id,
            },
          });
        } catch (emailError) {
          console.error('Failed to send notification email:', emailError);
        }

        toast({
          title: "Prescription submitted!",
          description: "Our pharmacist will review your prescription and add medicines. We'll notify you once ready for payment.",
        });
      }

      navigate("/dashboard");
    } catch (error: any) {
      console.error("Submission error:", error);
      toast({
        title: "Error submitting prescription",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-[120px] sm:pt-[130px] pb-20 sm:pb-6">
        <div className="container px-3 sm:px-4 max-w-3xl">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
            <Link to="/" className="hover:text-primary">Home</Link>
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
            <Link to="/cart" className="hover:text-primary">Cart</Link>
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="text-foreground">Upload Prescription</span>
          </nav>

          {/* Page Header */}
          <div className="text-center mb-4 sm:mb-8">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground font-heading mb-1 sm:mb-2">
              Upload Your Prescription
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Upload your prescription and our pharmacists will process your order
            </p>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-8">
            <div className="flex items-center gap-2 p-2 sm:p-3 bg-card rounded-lg border border-border">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-secondary flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium">100% Secure</span>
            </div>
            <div className="flex items-center gap-2 p-2 sm:p-3 bg-card rounded-lg border border-border">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium">Quick Processing</span>
            </div>
            <div className="flex items-center gap-2 p-2 sm:p-3 bg-card rounded-lg border border-border">
              <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-secondary flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium">Fast Delivery</span>
            </div>
            <div className="flex items-center gap-2 p-2 sm:p-3 bg-card rounded-lg border border-border">
              <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium">24/7 Support</span>
            </div>
          </div>

          {/* Upload Form */}
          <div className="bg-card rounded-xl border border-border p-4 sm:p-6 shadow-card">
            {/* Upload Area */}
            <div
              className={`relative border-2 border-dashed rounded-xl p-4 sm:p-8 text-center transition-all ${
                dragActive
                  ? "border-primary bg-accent"
                  : "border-border hover:border-primary"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="space-y-2 sm:space-y-3">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-accent rounded-xl flex items-center justify-center mx-auto">
                  <Upload className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm sm:text-base">
                    Drag & drop your prescription here
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    or click to browse files
                  </p>
                </div>
                <div className="flex justify-center gap-2 sm:gap-3">
                  <Button variant="outline" size="sm" className="gap-1.5 sm:gap-2 rounded-lg text-xs sm:text-sm h-8 sm:h-9 px-2.5 sm:px-3">
                    <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Browse Images
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5 sm:gap-2 rounded-lg text-xs sm:text-sm h-8 sm:h-9 px-2.5 sm:px-3">
                    <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Take Photo
                  </Button>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Supported: JPG, PNG, WEBP (Max 2MB each)
                </p>
              </div>
            </div>

            {/* Uploaded Files */}
            {files.length > 0 && (
              <div className="mt-4 sm:mt-5 space-y-2">
                <p className="text-xs sm:text-sm font-medium text-foreground">
                  Uploaded Files ({files.length})
                </p>
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2.5 sm:p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-foreground line-clamp-1">
                          {file.name}
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 hover:bg-destructive/10 rounded-full transition-colors flex-shrink-0"
                    >
                      <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Direct Prescription Info - Show when no cart items */}
            {items.length === 0 && (
              <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <p className="text-sm text-primary font-medium mb-1">Direct Prescription Upload</p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Upload your prescription and our pharmacist will review it, add the medicines, and notify you when your order is ready for payment.
                </p>
              </div>
            )}

            {/* Delivery Address Section - Only show if cart has items */}
            {items.length > 0 && (
              <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground text-sm sm:text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Delivery Address
                  </h3>
                  {!showAddressForm && (addresses?.length || 0) < MAX_ADDRESSES && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1.5 text-xs h-8"
                      onClick={() => setShowAddressForm(true)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add New
                    </Button>
                  )}
                </div>

              {/* Add Address Form */}
              {showAddressForm && (
                <div className="border border-border rounded-lg p-4 bg-muted/30">
                  <AddressForm
                    initialData={{ name: profile?.name || "", phone: profile?.phone || "" }}
                    onSubmit={handleAddAddress}
                    onCancel={() => setShowAddressForm(false)}
                    isLoading={isAddressSubmitting}
                    submitLabel="Add Address"
                    showDefaultOption={(addresses?.length || 0) > 0}
                  />
                </div>
              )}

              {/* Address List */}
              {addressesLoading ? (
                <div className="space-y-3">
                  <div className="h-24 bg-muted animate-pulse rounded-lg" />
                </div>
              ) : addresses?.length === 0 && !showAddressForm ? (
                <div className="text-center py-8 bg-muted/30 rounded-lg border border-dashed border-border">
                  <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">No saved addresses</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="gap-1.5"
                    onClick={() => setShowAddressForm(true)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Your First Address
                  </Button>
                </div>
              ) : !showAddressForm && (
                <div className="grid gap-3">
                  {addresses?.map((address) => (
                    <AddressCard
                      key={address.id}
                      address={address}
                      isSelected={selectedAddressId === address.id}
                      onSelect={() => setSelectedAddressId(address.id)}
                      selectable
                      showActions={false}
                    />
                  ))}
                </div>
              )}
            </div>
            )}

            {/* Order Summary */}
            {items.length > 0 && (
              <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold text-foreground text-sm sm:text-base mb-2 sm:mb-3">Order Summary</h3>
                <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <span className="text-muted-foreground">{item.name} x{item.quantity}</span>
                      <span className="font-medium">₹{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2 border-t border-border font-semibold">
                    <span>Total</span>
                    <span>₹{totalPrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="mt-4 sm:mt-6">
              <Button
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2 h-10 sm:h-12 rounded-lg text-sm sm:text-base"
                disabled={isSubmitting || files.length === 0 || (items.length > 0 && !selectedAddressId)}
                onClick={handleSubmit}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                    {items.length > 0 ? "Place Order" : "Submit Prescription"}
                  </>
                )}
              </Button>
              <p className="text-[10px] sm:text-xs text-muted-foreground text-center mt-2 sm:mt-3">
                Our pharmacist will review your prescription and contact you within 2 hours.
              </p>
            </div>
          </div>

          {/* How It Works */}
          <div className="mt-6 sm:mt-10 pb-20 sm:pb-0">
            <h2 className="text-lg sm:text-xl font-bold text-foreground font-heading text-center mb-4 sm:mb-6">
              How It Works
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {[
                { step: "1", title: "Upload Prescription", desc: "Upload a clear image of your valid prescription" },
                { step: "2", title: "Pharmacist Review", desc: "Our licensed pharmacist reviews your prescription" },
                { step: "3", title: "Fast Delivery", desc: "Medicines delivered to your doorstep" },
              ].map((item) => (
                <div key={item.step} className="text-center p-4 bg-card rounded-xl border border-border">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 font-bold text-sm sm:text-base">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-foreground text-sm sm:text-base mb-1">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default UploadPrescription;
