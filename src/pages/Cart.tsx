import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  Tag,
  Truck,
  Shield,
  ArrowRight,
  ChevronRight,
  Upload,
  Loader2,
  X,
  Check,
  CreditCard,
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  usage_limit: number | null;
  times_used: number;
}

interface DeliveryFee {
  id: string;
  state_name: string;
  delivery_fee: number;
  free_delivery_minimum: number;
}

interface Address {
  id: string;
  state: string;
}

const Cart = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { items, updateQuantity, removeItem, totalPrice, hasPrescriptionItems, totalItems, clearCart } = useCart();
  const { user } = useAuth();
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  // Fetch user addresses
  const { data: addresses } = useQuery({
    queryKey: ["user-addresses", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("addresses")
        .select("id, state, is_default")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false });
      if (error) throw error;
      return data as (Address & { is_default: boolean })[];
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
      const defaultAddr = addresses.find(a => a.is_default) || addresses[0];
      setSelectedAddressId(defaultAddr.id);
    }
  }, [addresses, selectedAddressId]);

  const selectedAddress = addresses?.find(a => a.id === selectedAddressId);
  
  // Calculate delivery fee based on selected address
  const deliveryFeeData = useMemo(() => {
    if (!selectedAddress || !deliveryFees) {
      return { fee: null, freeMinimum: 0, stateName: null, hasAddress: false };
    }
    
    const stateFee = deliveryFees.find(
      df => df.state_name.toLowerCase() === selectedAddress.state.toLowerCase()
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

  // Calculate if delivery is free (based on order value or coupon)
  const isDeliveryFree = useMemo(() => {
    // No address selected - cannot determine delivery fee
    if (!deliveryFeeData.hasAddress) {
      return false;
    }
    
    // If coupon gives free delivery
    if (appliedCoupon?.discount_type === "free_delivery") {
      return true;
    }
    
    // If minimum order value is met and free delivery is available (minimum > 0)
    if (deliveryFeeData.freeMinimum > 0 && totalPrice >= deliveryFeeData.freeMinimum) {
      return true;
    }
    
    return false;
  }, [appliedCoupon, deliveryFeeData, totalPrice]);

  const deliveryFee = isDeliveryFree ? 0 : (deliveryFeeData.fee ?? 0);

  // Calculate coupon discount
  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    
    if (appliedCoupon.discount_type === "free_delivery") {
      return 0; // Free delivery handled separately
    }
    
    if (appliedCoupon.discount_type === "flat") {
      return appliedCoupon.discount_value;
    }
    
    if (appliedCoupon.discount_type === "percentage") {
      const discount = (totalPrice * appliedCoupon.discount_value) / 100;
      if (appliedCoupon.maximum_discount) {
        return Math.min(discount, appliedCoupon.maximum_discount);
      }
      return discount;
    }
    
    return 0;
  }, [appliedCoupon, totalPrice]);

  const savings = items.reduce(
    (sum, item) => sum + ((item.originalPrice || item.price) - item.price) * item.quantity,
    0
  );
  
  const total = totalPrice - couponDiscount + deliveryFee;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast({ title: "Please enter a coupon code", variant: "destructive" });
      return;
    }

    setCouponLoading(true);
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", couponCode.toUpperCase().trim())
        .eq("is_active", true)
        .single();

      if (error || !data) {
        toast({ title: "Invalid coupon code", variant: "destructive" });
        setCouponLoading(false);
        return;
      }

      const coupon = data as Coupon;

      // Check minimum order value
      if (totalPrice < coupon.minimum_order_value) {
        toast({
          title: "Minimum order not met",
          description: `Add ₹${(coupon.minimum_order_value - totalPrice).toLocaleString()} more to use this coupon`,
          variant: "destructive",
        });
        setCouponLoading(false);
        return;
      }

      // Check usage limit
      if (coupon.usage_limit && coupon.times_used >= coupon.usage_limit) {
        toast({ title: "Coupon usage limit reached", variant: "destructive" });
        setCouponLoading(false);
        return;
      }

      setAppliedCoupon(coupon);
      setCouponCode("");
      toast({ title: "Coupon applied!", description: coupon.description || "Discount applied to your order" });
    } catch {
      toast({ title: "Failed to apply coupon", variant: "destructive" });
    }
    setCouponLoading(false);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    toast({ title: "Coupon removed" });
  };

  const initiateRazorpayPayment = async (orderId: string, amount: number) => {
    try {
      // Create Razorpay order via edge function
      const { data, error } = await supabase.functions.invoke('razorpay-payment', {
        body: {
          action: 'create-order',
          orderId: orderId,
          amount: amount,
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
        description: `Order #${orderId.slice(0, 8).toUpperCase()}`,
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
                orderId: orderId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              },
            });

            if (verifyResult.error || !verifyResult.data.success) {
              throw new Error(verifyResult.data?.error || 'Payment verification failed');
            }

            // Clear cart and redirect to dashboard
            clearCart();
            queryClient.invalidateQueries({ queryKey: ["user-orders"] });
            toast({ 
              title: "Payment Successful! 🎉", 
              description: "Your order is now being processed." 
            });
            navigate('/dashboard');
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
            setIsCheckoutLoading(false);
            toast({ 
              title: "Payment cancelled", 
              description: "You can try again anytime.",
              variant: "default" 
            });
          },
        },
      };

      const RazorpayConstructor = window.Razorpay;
      if (!RazorpayConstructor) {
        throw new Error('Razorpay SDK not loaded. Please refresh the page.');
      }

      const razorpay = new RazorpayConstructor(options);
      razorpay.open();
      setIsCheckoutLoading(false);

    } catch (error: any) {
      console.error('Payment error:', error);
      toast({ 
        title: "Payment failed", 
        description: error.message,
        variant: "destructive" 
      });
      setIsCheckoutLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (hasPrescriptionItems) {
      // Pass coupon and delivery info to prescription upload
      navigate("/upload-prescription", {
        state: {
          couponId: appliedCoupon?.id,
          discountAmount: couponDiscount,
          deliveryFee,
        },
      });
      return;
    }

    // Navigate to checkout page for non-prescription items
    navigate("/checkout", {
      state: {
        couponId: appliedCoupon?.id,
        coupon: appliedCoupon,
        couponDiscount,
      },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-[100px] sm:pt-[110px] pb-20 sm:pb-6">
        <div className="container">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link to="/" className="hover:text-primary">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">Shopping Cart</span>
          </nav>

          <h1 className="text-2xl md:text-3xl font-bold text-foreground font-heading mb-6">
            Shopping Cart{" "}
            <span className="text-muted-foreground font-normal">
              ({totalItems} items)
            </span>
          </h1>

          {items.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="h-10 w-10 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Your cart is empty
              </h2>
              <p className="text-muted-foreground mb-4">
                Looks like you haven't added any medicines yet.
              </p>
              <Link to="/conditions">
                <Button className="bg-primary hover:bg-primary/90">Browse Medicines</Button>
              </Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-3 md:space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-card rounded-xl border border-border p-3 md:p-4 shadow-card"
                  >
                    <div className="flex gap-3 md:gap-4">
                      {/* Product Image */}
                      <div className="w-16 h-16 md:w-20 md:h-20 bg-muted/50 rounded-lg flex items-center justify-center flex-shrink-0">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="max-h-full object-contain" />
                        ) : (
                          <span className="text-2xl md:text-3xl">💊</span>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="min-w-0">
                              <Link
                                to={`/medicine/${item.slug}`}
                                className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-1 text-sm md:text-base"
                              >
                                {item.name}
                              </Link>
                              {item.brand && (
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {item.brand}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="p-1 md:p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors flex-shrink-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                        </div>

                        {item.prescriptionRequired && (
                          <Badge variant="outline" className="mb-2 text-xs border-destructive/50 text-destructive">
                            Prescription Required
                          </Badge>
                        )}

                        <div className="flex items-center justify-between mt-2">
                          {/* Quantity */}
                          <div className="flex items-center border border-border rounded-lg">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="p-1.5 hover:bg-muted transition-colors"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="px-3 font-semibold text-sm">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="p-1.5 hover:bg-muted transition-colors"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Price */}
                          <div className="text-right">
                            <p className="font-bold text-foreground">
                              ₹{(item.price * item.quantity).toLocaleString()}
                            </p>
                            {item.originalPrice && item.originalPrice > item.price && (
                              <p className="text-xs text-muted-foreground line-through">
                                ₹{(item.originalPrice * item.quantity).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Prescription Notice */}
                {hasPrescriptionItems && (
                  <div className="p-4 bg-destructive/10 rounded-xl border border-destructive/30">
                    <div className="flex items-start gap-3">
                      <Upload className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-destructive">
                          Prescription Required
                        </p>
                        <p className="text-sm text-foreground mt-1">
                          Some items in your cart require a valid prescription. You'll need to upload your prescription to complete the order.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-card rounded-xl border border-border p-5 shadow-card sticky top-24">
                  <h2 className="font-semibold text-foreground mb-4">
                    Order Summary
                  </h2>

                  {/* Coupon Code */}
                  {appliedCoupon ? (
                    <div className="mb-5 p-3 bg-secondary/10 rounded-lg border border-secondary/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-secondary" />
                          <span className="font-mono font-medium text-sm">{appliedCoupon.code}</span>
                        </div>
                        <button
                          onClick={handleRemoveCoupon}
                          className="p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {appliedCoupon.description || "Coupon applied"}
                      </p>
                    </div>
                  ) : (
                    <div className="flex gap-2 mb-5">
                      <div className="relative flex-1">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Enter coupon code"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          className="pl-9 h-10 rounded-lg font-mono"
                          onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                        />
                      </div>
                      <Button 
                        variant="outline" 
                        className="rounded-lg"
                        onClick={handleApplyCoupon}
                        disabled={couponLoading}
                      >
                        {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                      </Button>
                    </div>
                  )}

                  {/* Price Breakdown */}
                  <div className="space-y-2 pb-4 border-b border-border">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">₹{totalPrice.toLocaleString()}</span>
                    </div>
                    {savings > 0 && (
                      <div className="flex justify-between text-sm text-secondary">
                        <span>You Save</span>
                        <span className="font-medium">-₹{savings.toLocaleString()}</span>
                      </div>
                    )}
                    {couponDiscount > 0 && (
                      <div className="flex justify-between text-sm text-secondary">
                        <span>Coupon Discount</span>
                        <span className="font-medium">-₹{couponDiscount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Delivery {deliveryFeeData.hasAddress && `(${selectedAddress?.state})`}
                      </span>
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

                  {/* Checkout Button */}
                  <Button 
                    className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2 h-11 rounded-lg"
                    onClick={handleCheckout}
                    disabled={isCheckoutLoading}
                  >
                    {isCheckoutLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : hasPrescriptionItems ? (
                      <>
                        <Upload className="h-5 w-5" />
                        Upload Prescription & Checkout
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5" />
                        Pay ₹{total.toLocaleString()}
                      </>
                    )}
                  </Button>

                  {!user && (
                    <p className="text-xs text-muted-foreground text-center mt-3">
                      You'll need to <Link to="/auth" className="text-primary hover:underline">sign in</Link> to checkout
                    </p>
                  )}

                  {/* Trust Badges */}
                  <div className="mt-4 pt-4 border-t border-border space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Shield className="h-4 w-4 text-secondary" />
                      <span>100% Genuine Products</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Truck className="h-4 w-4 text-primary" />
                      <span>
                        {!deliveryFeeData.hasAddress 
                          ? "Delivery fee calculated at checkout"
                          : deliveryFeeData.freeMinimum > 0 
                            ? `Free delivery on orders above ₹${deliveryFeeData.freeMinimum}`
                            : `Delivery: ₹${deliveryFeeData.fee}`
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Cart;
