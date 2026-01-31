import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ChevronRight,
  Loader2,
  Plus,
  CreditCard,
  MapPin,
  Phone,
  Truck,
  Shield,
  Package,
  Check,
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AddressCard from "@/components/address/AddressCard";
import AddressForm, { AddressFormData } from "@/components/address/AddressForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

declare global {
  interface Window {
    Razorpay: any;
  }
}

type DiscountType = "percentage" | "flat" | "free_delivery";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number;
  minimum_order_value: number;
  maximum_discount: number | null;
}

interface DeliveryFee {
  id: string;
  state_name: string;
  delivery_fee: number;
  free_delivery_minimum: number;
}

interface Address {
  id: string;
  name: string;
  phone: string;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state: string;
  pincode: string;
  landmark: string | null;
  is_default: boolean | null;
}

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { items, totalPrice, clearCart } = useCart();
  const { user, profile, refreshProfile } = useAuth();

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [isAddressLoading, setIsAddressLoading] = useState(false);

  // Get coupon data from navigation state (passed from Cart)
  const cartState = location.state as {
    couponId?: string;
    coupon?: Coupon;
    couponDiscount?: number;
  } | null;

  const appliedCoupon = cartState?.coupon || null;
  const couponDiscount = cartState?.couponDiscount || 0;

  // Redirect to cart if empty
  useEffect(() => {
    if (items.length === 0) {
      navigate("/cart");
    }
  }, [items.length, navigate]);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate("/auth", { state: { from: "/checkout" } });
    }
  }, [user, navigate]);

  // Set phone from profile
  useEffect(() => {
    if (profile?.phone) {
      setPhoneNumber(profile.phone);
    }
  }, [profile]);

  // Fetch user addresses
  const { data: addresses, isLoading: addressesLoading } = useQuery({
    queryKey: ["user-addresses-full", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false });
      if (error) throw error;
      return data as Address[];
    },
    enabled: !!user,
  });

  // Fetch delivery fees
  const { data: deliveryFees } = useQuery({
    queryKey: ["delivery-fees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delivery_fees")
        .select("*")
        .eq("is_active", true);
      if (error) throw error;
      return data as DeliveryFee[];
    },
  });

  // Auto-select default address
  useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedAddressId) {
      const defaultAddr = addresses.find((a) => a.is_default) || addresses[0];
      setSelectedAddressId(defaultAddr.id);
    }
  }, [addresses, selectedAddressId]);

  const selectedAddress = addresses?.find((a) => a.id === selectedAddressId);

  // Calculate delivery fee based on selected address
  const deliveryFeeData = useMemo(() => {
    if (!selectedAddress || !deliveryFees) {
      return { fee: null, freeMinimum: 0, stateName: null, hasAddress: false };
    }

    const stateFee = deliveryFees.find(
      (df) => df.state_name.toLowerCase() === selectedAddress.state.toLowerCase()
    );

    if (stateFee) {
      return {
        fee: stateFee.delivery_fee,
        freeMinimum: stateFee.free_delivery_minimum,
        stateName: stateFee.state_name,
        hasAddress: true,
      };
    }

    // State not found in delivery fees, use default
    return { fee: 50, freeMinimum: 0, stateName: selectedAddress.state, hasAddress: true };
  }, [selectedAddress, deliveryFees]);

  // Calculate if delivery is free
  const isDeliveryFree = useMemo(() => {
    if (!deliveryFeeData.hasAddress) return false;
    if (appliedCoupon?.discount_type === "free_delivery") return true;
    if (deliveryFeeData.freeMinimum > 0 && totalPrice >= deliveryFeeData.freeMinimum) return true;
    return false;
  }, [appliedCoupon, deliveryFeeData, totalPrice]);

  const deliveryFee = isDeliveryFree ? 0 : (deliveryFeeData.fee ?? 0);
  const total = totalPrice - couponDiscount + deliveryFee;

  // Add address mutation
  const addAddressMutation = useMutation({
    mutationFn: async (data: AddressFormData) => {
      if (!user) throw new Error("Not authenticated");
      
      // If setting as default, unset other defaults
      if (data.is_default) {
        await supabase
          .from("addresses")
          .update({ is_default: false })
          .eq("user_id", user.id);
      }

      const { data: newAddress, error } = await supabase
        .from("addresses")
        .insert([{
          name: data.name,
          phone: data.phone,
          address_line_1: data.address_line_1,
          address_line_2: data.address_line_2 || null,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          landmark: data.landmark || null,
          is_default: data.is_default || false,
          user_id: user.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return newAddress;
    },
    onSuccess: (newAddress) => {
      queryClient.invalidateQueries({ queryKey: ["user-addresses-full"] });
      setSelectedAddressId(newAddress.id);
      setShowAddressForm(false);
      toast({ title: "Address added successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to add address", description: error.message, variant: "destructive" });
    },
  });

  // Update phone mutation
  const updatePhoneMutation = useMutation({
    mutationFn: async (phone: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("profiles")
        .update({ phone })
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      refreshProfile();
    },
  });

  const validatePhone = (phone: string) => {
    if (!phone.trim()) {
      return "Phone number is required";
    }
    if (!/^[6-9]\d{9}$/.test(phone)) {
      return "Enter a valid 10-digit mobile number";
    }
    return "";
  };

  const initiateRazorpayPayment = async (orderId: string, amount: number) => {
    try {
      const { data, error } = await supabase.functions.invoke("razorpay-payment", {
        body: {
          action: "create-order",
          orderId: orderId,
          amount: amount,
        },
      });

      if (error || !data.success) {
        throw new Error(data?.error || "Failed to create payment order");
      }

      const options = {
        key: data.razorpayKeyId,
        amount: data.amount,
        currency: data.currency,
        name: "TabletKart",
        description: `Order #${orderId.slice(0, 8).toUpperCase()}`,
        order_id: data.razorpayOrderId,
        prefill: {
          ...data.prefill,
          contact: phoneNumber,
        },
        theme: {
          color: "#7C3AED",
        },
        handler: async (response: any) => {
          try {
            const verifyResult = await supabase.functions.invoke("razorpay-payment", {
              body: {
                action: "verify-payment",
                orderId: orderId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              },
            });

            if (verifyResult.error || !verifyResult.data.success) {
              throw new Error(verifyResult.data?.error || "Payment verification failed");
            }

            clearCart();
            queryClient.invalidateQueries({ queryKey: ["user-orders"] });
            toast({
              title: "Payment Successful! 🎉",
              description: "Your order is now being processed.",
            });
            navigate("/dashboard");
          } catch (verifyError: any) {
            toast({
              title: "Payment verification failed",
              description: verifyError.message,
              variant: "destructive",
            });
          }
        },
        modal: {
          ondismiss: () => {
            setIsCheckoutLoading(false);
            toast({
              title: "Payment cancelled",
              description: "You can try again anytime.",
            });
          },
        },
      };

      const RazorpayConstructor = window.Razorpay;
      if (!RazorpayConstructor) {
        throw new Error("Razorpay SDK not loaded. Please refresh the page.");
      }

      const razorpay = new RazorpayConstructor(options);
      razorpay.open();
      setIsCheckoutLoading(false);
    } catch (error: any) {
      console.error("Payment error:", error);
      toast({
        title: "Payment failed",
        description: error.message,
        variant: "destructive",
      });
      setIsCheckoutLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    // Validate phone
    const phoneValidation = validatePhone(phoneNumber);
    if (phoneValidation) {
      setPhoneError(phoneValidation);
      return;
    }
    setPhoneError("");

    // Validate address
    if (!selectedAddressId) {
      toast({
        title: "Please select a delivery address",
        variant: "destructive",
      });
      return;
    }

    setIsCheckoutLoading(true);

    try {
      // Update phone in profile if changed
      if (phoneNumber !== profile?.phone) {
        await updatePhoneMutation.mutateAsync(phoneNumber);
      }

      // Create order with "approved" status (no prescription needed for these items)
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user!.id,
          status: "approved",
          total_amount: total,
          payment_status: "pending",
          address_id: selectedAddressId,
          coupon_id: appliedCoupon?.id || null,
          discount_amount: couponDiscount,
          delivery_fee: deliveryFee,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: orderData.id,
        medicine_id: item.id,
        quantity: item.quantity,
        price: item.price,
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);

      if (itemsError) throw itemsError;

      // Initiate Razorpay payment
      await initiateRazorpayPayment(orderData.id, total);
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast({
        title: "Checkout failed",
        description: error.message,
        variant: "destructive",
      });
      setIsCheckoutLoading(false);
    }
  };

  if (!user || items.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-[100px] sm:pt-[110px] pb-20 sm:pb-6">
        <div className="container max-w-5xl">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link to="/" className="hover:text-primary">
              Home
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link to="/cart" className="hover:text-primary">
              Cart
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">Checkout</span>
          </nav>

          <h1 className="text-2xl md:text-3xl font-bold text-foreground font-heading mb-6">
            Checkout
          </h1>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Address & Phone */}
            <div className="lg:col-span-2 space-y-6">
              {/* Phone Number */}
              <div className="bg-card rounded-xl border border-border p-5 shadow-card">
                <div className="flex items-center gap-2 mb-4">
                  <Phone className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold text-foreground">Contact Number</h2>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm">
                    Mobile Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter 10-digit mobile number"
                    value={phoneNumber}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setPhoneNumber(val);
                      if (phoneError) setPhoneError("");
                    }}
                    className="max-w-xs"
                  />
                  {phoneError && (
                    <p className="text-xs text-destructive">{phoneError}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    We'll send order updates to this number
                  </p>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="bg-card rounded-xl border border-border p-5 shadow-card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <h2 className="font-semibold text-foreground">Delivery Address</h2>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddressForm(true)}
                    className="gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Add New
                  </Button>
                </div>

                {addressesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : addresses && addresses.length > 0 ? (
                  <div className="grid gap-3">
                    {addresses.map((address) => (
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
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <MapPin className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No saved addresses</p>
                    <Button
                      variant="link"
                      onClick={() => setShowAddressForm(true)}
                      className="mt-2"
                    >
                      Add your first address
                    </Button>
                  </div>
                )}

                {/* Shipping Rate Display */}
                {selectedAddress && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center gap-2 text-sm">
                      <Truck className="h-4 w-4 text-primary" />
                      <span className="text-muted-foreground">
                        Shipping to <strong>{selectedAddress.state}</strong>:
                      </span>
                      {isDeliveryFree ? (
                        <span className="text-secondary font-medium">FREE</span>
                      ) : (
                        <span className="font-medium">₹{deliveryFee}</span>
                      )}
                    </div>
                    {deliveryFeeData.freeMinimum > 0 && !isDeliveryFree && (
                      <p className="text-xs text-muted-foreground mt-1 ml-6">
                        Free delivery on orders above ₹{deliveryFeeData.freeMinimum}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-xl border border-border p-5 shadow-card sticky top-24">
                <h2 className="font-semibold text-foreground mb-4">Order Summary</h2>

                {/* Items */}
                <div className="space-y-3 pb-4 border-b border-border max-h-48 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-muted/50 rounded-lg flex items-center justify-center flex-shrink-0">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="max-h-full object-contain"
                          />
                        ) : (
                          <Package className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground line-clamp-1">
                          {item.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <p className="text-sm font-medium">
                        ₹{(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Price Breakdown */}
                <div className="space-y-2 py-4 border-b border-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">₹{totalPrice.toLocaleString()}</span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-sm text-secondary">
                      <span>Discount</span>
                      <span className="font-medium">-₹{couponDiscount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery</span>
                    <span className="font-medium">
                      {!deliveryFeeData.hasAddress ? (
                        <span className="text-muted-foreground italic">Select address</span>
                      ) : isDeliveryFree ? (
                        <span className="text-secondary">FREE</span>
                      ) : (
                        `₹${deliveryFee}`
                      )}
                    </span>
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between py-4">
                  <span className="font-semibold">Total</span>
                  <span className="text-xl font-bold text-foreground">
                    ₹{total.toLocaleString()}
                  </span>
                </div>

                {/* Place Order Button */}
                <Button
                  className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2 h-12 rounded-lg"
                  onClick={handlePlaceOrder}
                  disabled={isCheckoutLoading || !selectedAddressId}
                >
                  {isCheckoutLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5" />
                      Pay ₹{total.toLocaleString()}
                    </>
                  )}
                </Button>

                {/* Trust Badges */}
                <div className="mt-4 pt-4 border-t border-border space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Shield className="h-4 w-4 text-secondary" />
                    <span>100% Secure Payment</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="h-4 w-4 text-secondary" />
                    <span>Genuine Products Guaranteed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* Add Address Dialog */}
      <Dialog open={showAddressForm} onOpenChange={setShowAddressForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Address</DialogTitle>
          </DialogHeader>
          <AddressForm
            onSubmit={async (data) => {
              setIsAddressLoading(true);
              try {
                await addAddressMutation.mutateAsync(data);
              } finally {
                setIsAddressLoading(false);
              }
            }}
            onCancel={() => setShowAddressForm(false)}
            isLoading={isAddressLoading}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Checkout;
