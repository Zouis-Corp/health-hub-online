import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ShoppingCart,
  Heart,
  Shield,
  Truck,
  Minus,
  Plus,
  ChevronRight,
  ChevronLeft,
  Package,
  Share2,
  Check,
  Star,
  Clock,
  BadgeCheck,
  FileText,
  Thermometer,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";

interface Medicine {
  id: string;
  name: string;
  slug: string;
  salt_name: string | null;
  brand: string | null;
  dosage: string | null;
  price: number;
  original_price: number | null;
  prescription_required: boolean;
  stock: number;
  image_url: string | null;
  description: string | null;
  condition_id: string | null;
}

const MedicineDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const { addItem } = useCart();
  const { toast } = useToast();

  const { data: medicine, isLoading } = useQuery({
    queryKey: ["medicine", id],
    queryFn: async () => {
      let { data, error } = await supabase
        .from("medicines")
        .select("*")
        .eq("slug", id)
        .eq("is_active", true)
        .maybeSingle();

      if (!data && id) {
        const result = await supabase
          .from("medicines")
          .select("*")
          .eq("id", id)
          .eq("is_active", true)
          .maybeSingle();
        data = result.data;
        error = result.error;
      }

      if (error) throw error;
      return data as Medicine | null;
    },
    enabled: !!id,
  });

  const { data: relatedMedicines } = useQuery({
    queryKey: ["related-medicines", medicine?.condition_id],
    queryFn: async () => {
      if (!medicine?.condition_id) return [];
      const { data, error } = await supabase
        .from("medicines")
        .select("id, name, slug, salt_name, price, original_price, image_url")
        .eq("condition_id", medicine.condition_id)
        .eq("is_active", true)
        .neq("id", medicine.id)
        .limit(6);
      if (error) throw error;
      return data;
    },
    enabled: !!medicine?.condition_id,
  });

  const handleAddToCart = () => {
    if (!medicine) return;
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: medicine.id,
        name: medicine.name,
        brand: medicine.brand || "",
        price: medicine.price,
        originalPrice: medicine.original_price || undefined,
        prescriptionRequired: medicine.prescription_required,
        imageUrl: medicine.image_url || undefined,
        slug: medicine.slug,
      });
    }
  };

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    toast({
      title: isWishlisted ? "Removed from wishlist" : "Added to wishlist",
      description: isWishlisted 
        ? `${medicine?.name} has been removed from your wishlist.`
        : `${medicine?.name} has been added to your wishlist.`,
    });
  };

  const handleShare = async () => {
    const shareData = {
      title: medicine?.name || "TabletKart Medicine",
      text: `Check out ${medicine?.name} at TabletKart - ₹${medicine?.price}`,
      url: window.location.href,
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied!",
          description: "Product link has been copied to clipboard.",
        });
      }
    } catch (error) {
      // User cancelled or error
      console.log("Share failed:", error);
    }
  };

  const getDiscount = (price: number, originalPrice: number | null) => {
    if (!originalPrice) return 0;
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-[88px] sm:pt-[96px] pb-24 md:pb-6">
          <div className="container px-0 md:px-4">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <Skeleton className="aspect-square md:rounded-2xl" />
              <div className="p-4 space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!medicine) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-[88px] sm:pt-[96px] pb-6">
          <div className="container text-center py-12">
            <h1 className="text-2xl font-bold text-foreground mb-4">Medicine Not Found</h1>
            <p className="text-muted-foreground mb-6">The medicine you're looking for doesn't exist or has been removed.</p>
            <Link to="/conditions">
              <Button>Browse Medicines</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const discount = getDiscount(medicine.price, medicine.original_price);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-[100px] sm:pt-[110px] pb-24 md:pb-6">
        {/* Mobile View - Flipkart Style */}
        <div className="md:hidden">
          {/* Image Section with Actions */}
          <div className="relative bg-muted/30">
            {/* Back & Action Buttons */}
            <div className="absolute top-3 left-3 right-3 z-10 flex justify-between">
              <Link to="/conditions" className="w-8 h-8 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm">
                <ChevronLeft className="h-5 w-5 text-foreground" />
              </Link>
              <div className="flex gap-2">
                <button 
                  onClick={handleShare}
                  className="w-8 h-8 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm"
                >
                  <Share2 className="h-4 w-4 text-foreground" />
                </button>
                <button 
                  onClick={handleWishlist}
                  className={`w-8 h-8 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm ${
                    isWishlisted ? 'bg-destructive text-white' : 'bg-background/80'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>

            {/* Badges */}
            <div className="absolute top-14 left-3 right-3 z-10 flex items-start justify-between">
              {/* Left - Discount */}
              <div className="flex flex-col gap-1.5">
                {discount > 0 && (
                  <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold px-2 py-0.5 rounded-md shadow-md border-0">
                    {discount}% OFF
                  </Badge>
                )}
              </div>

              {/* Right - Status Badges */}
              <div className="flex items-center gap-1.5">
                {medicine.prescription_required && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-rose-600 rounded-lg flex items-center justify-center shadow-md cursor-help">
                        <FileText className="h-4 w-4 text-white" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="bg-foreground text-background text-xs font-medium z-50">
                      <div className="flex items-center gap-1.5">
                        <FileText className="h-3 w-3" />
                        Prescription Required
                      </div>
                    </TooltipContent>
                  </Tooltip>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md cursor-help">
                      <Thermometer className="h-4 w-4 text-white" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="bg-foreground text-background text-xs font-medium z-50">
                    <div className="flex items-center gap-1.5">
                      <Thermometer className="h-3 w-3" />
                      Temperature Controlled
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Product Image */}
            <div className="aspect-square flex items-center justify-center p-8">
              {medicine.image_url ? (
                <img src={medicine.image_url} alt={medicine.name} className="max-h-[80%] max-w-[80%] object-contain" />
              ) : (
                <span className="text-[120px]">💊</span>
              )}
            </div>
          </div>

          {/* Product Info Card */}
          <div className="bg-card -mt-3 rounded-t-3xl relative z-10 border-t border-border">
            <div className="p-4 space-y-3">
              {/* Brand */}
              {medicine.brand && (
                <p className="text-xs text-primary font-medium uppercase tracking-wide">
                  {medicine.brand}
                </p>
              )}

              {/* Title */}
              <h1 className="text-lg font-bold text-foreground leading-tight">
                {medicine.name}
              </h1>

              {/* Salt/Composition */}
              {medicine.salt_name && (
                <p className="text-sm text-muted-foreground">
                  {medicine.salt_name}
                </p>
              )}

              {/* Rating - Simulated */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-0.5 rounded text-xs font-semibold">
                  <span>4.2</span>
                  <Star className="h-3 w-3 fill-current" />
                </div>
                <span className="text-xs text-muted-foreground">1,234 ratings</span>
              </div>

              {/* Price Section */}
              <div className="flex items-baseline gap-2 pt-2">
                <span className="text-2xl font-bold text-foreground">
                  ₹{medicine.price.toLocaleString()}
                </span>
                {medicine.original_price && (
                  <>
                    <span className="text-sm text-muted-foreground line-through">
                      ₹{medicine.original_price.toLocaleString()}
                    </span>
                    <span className="text-sm text-secondary font-semibold">
                      {discount}% off
                    </span>
                  </>
                )}
              </div>

              {/* Tax info */}
              <p className="text-xs text-muted-foreground">
                Inclusive of all taxes
              </p>
            </div>

            {/* Divider */}
            <div className="h-2 bg-muted/50" />

            {/* Delivery & Offers */}
            <div className="p-4 space-y-3">
              {/* Stock Status */}
              <div className="flex items-center gap-2">
                {medicine.stock > 0 ? (
                  <>
                    <Check className="h-4 w-4 text-secondary" />
                    <span className="text-sm text-secondary font-medium">In Stock</span>
                  </>
                ) : (
                  <>
                    <span className="text-sm text-destructive font-medium">Out of Stock</span>
                  </>
                )}
              </div>

              {/* Delivery Info */}
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <Truck className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Free Delivery</p>
                  <p className="text-xs text-muted-foreground">Delivery within 3-5 business days</p>
                </div>
              </div>

              {/* Highlights */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-lg">
                  <Shield className="h-4 w-4 text-secondary" />
                  <span className="text-xs font-medium">100% Genuine</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-lg">
                  <BadgeCheck className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium">Quality Assured</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-lg">
                  <Package className="h-4 w-4 text-secondary" />
                  <span className="text-xs font-medium">Secure Packaging</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-lg">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium">Fast Processing</span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-2 bg-muted/50" />

            {/* Prescription Warning */}
            {medicine.prescription_required && (
              <>
                <div className="p-4">
                  <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                    <p className="text-sm text-destructive font-medium">
                      ⚠️ This medicine requires a valid prescription. Upload during checkout.
                    </p>
                  </div>
                </div>
                <div className="h-2 bg-muted/50" />
              </>
            )}

            {/* Description */}
            <div className="p-4">
              <h3 className="text-sm font-semibold text-foreground mb-2">Product Details</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {medicine.description || `${medicine.name} is a medication used for treating specific health conditions. Please consult your doctor or pharmacist for detailed information.`}
              </p>

              {/* Specs */}
              <div className="mt-4 space-y-2">
                {medicine.dosage && (
                  <div className="flex justify-between py-2 border-b border-border text-sm">
                    <span className="text-muted-foreground">Dosage</span>
                    <span className="font-medium">{medicine.dosage}</span>
                  </div>
                )}
                {medicine.brand && (
                  <div className="flex justify-between py-2 border-b border-border text-sm">
                    <span className="text-muted-foreground">Manufacturer</span>
                    <span className="font-medium">{medicine.brand}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 text-sm">
                  <span className="text-muted-foreground">Rx Required</span>
                  <span className="font-medium">{medicine.prescription_required ? "Yes" : "No"}</span>
                </div>
              </div>
            </div>

            {/* Related Products */}
            {relatedMedicines && relatedMedicines.length > 0 && (
              <>
                <div className="h-2 bg-muted/50" />
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Similar Products</h3>
                  <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                    {relatedMedicines.map((item) => {
                      const itemDiscount = getDiscount(item.price, item.original_price);
                      return (
                        <Link
                          key={item.id}
                          to={`/medicine/${item.slug}`}
                          className="flex-shrink-0 w-32 bg-muted/30 rounded-lg overflow-hidden border border-border"
                        >
                          <div className="aspect-square bg-muted/50 flex items-center justify-center p-2 relative">
                            {itemDiscount > 0 && (
                              <Badge className="absolute top-1 left-1 bg-secondary text-secondary-foreground text-[10px] px-1 py-0">
                                {itemDiscount}%
                              </Badge>
                            )}
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.name} className="max-h-full object-contain" />
                            ) : (
                              <span className="text-3xl">💊</span>
                            )}
                          </div>
                          <div className="p-2">
                            <p className="text-xs font-medium text-foreground line-clamp-2 leading-tight">
                              {item.name}
                            </p>
                            <p className="text-sm font-bold text-foreground mt-1">
                              ₹{item.price.toLocaleString()}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Fixed Bottom Bar */}
          <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-3 flex gap-3 z-50">
            {/* Quantity Selector */}
            <div className="flex items-center border border-border rounded-lg bg-muted/50">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2.5 hover:bg-muted transition-colors"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="px-3 font-semibold text-sm">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(medicine.stock, quantity + 1))}
                className="p-2.5 hover:bg-muted transition-colors"
                disabled={quantity >= medicine.stock}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Add to Cart Button */}
            <Button 
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground gap-2 h-11 rounded-lg font-semibold"
              onClick={handleAddToCart}
              disabled={medicine.stock <= 0}
            >
              <ShoppingCart className="h-4 w-4" />
              {medicine.stock > 0 ? "Add to Cart" : "Out of Stock"}
            </Button>
          </div>
        </div>

        {/* Desktop View - Original Layout */}
        <div className="hidden md:block">
          <div className="container">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
              <Link to="/" className="hover:text-primary">Home</Link>
              <ChevronRight className="h-4 w-4" />
              <Link to="/conditions" className="hover:text-primary">Medicines</Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground line-clamp-1">{medicine.name}</span>
            </nav>

            {/* Product Section */}
            <div className="grid lg:grid-cols-2 gap-8 mb-10">
              {/* Image Section */}
              <div>
                <div className="aspect-square bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/30 dark:via-teal-950/30 dark:to-cyan-950/30 rounded-2xl flex items-center justify-center border border-border relative">
                  {/* Badges Row */}
                  <div className="absolute top-4 left-4 right-4 flex items-start justify-between z-10">
                    {/* Left - Discount */}
                    <div className="flex flex-col gap-1.5">
                      {discount > 0 && (
                        <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold px-2.5 py-1 rounded-md shadow-md border-0">
                          {discount}% OFF
                        </Badge>
                      )}
                    </div>

                    {/* Right - Status Badges */}
                    <div className="flex items-center gap-2">
                      {medicine.prescription_required && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-lg flex items-center justify-center shadow-md cursor-help">
                              <FileText className="h-5 w-5 text-white" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="bg-foreground text-background text-xs font-medium z-50">
                            <div className="flex items-center gap-1.5">
                              <FileText className="h-3 w-3" />
                              Prescription Required
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md cursor-help">
                            <Thermometer className="h-5 w-5 text-white" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="bg-foreground text-background text-xs font-medium z-50">
                          <div className="flex items-center gap-1.5">
                            <Thermometer className="h-3 w-3" />
                            Temperature Controlled
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                  {medicine.image_url ? (
                    <img src={medicine.image_url} alt={medicine.name} className="max-h-[80%] object-contain" />
                  ) : (
                    <span className="text-[150px]">💊</span>
                  )}
                </div>
              </div>

              {/* Details Section */}
              <div className="space-y-5">
                {/* Title */}
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground font-heading mb-1">
                    {medicine.name}
                  </h1>
                  {medicine.salt_name && (
                    <p className="text-primary font-medium uppercase text-sm">
                      {medicine.salt_name}
                    </p>
                  )}
                  {medicine.brand && (
                    <p className="text-muted-foreground text-sm mt-1">
                      By {medicine.brand}
                    </p>
                  )}
                  {medicine.dosage && (
                    <p className="text-muted-foreground text-sm">
                      Dosage: {medicine.dosage}
                    </p>
                  )}
                </div>

                {/* Price */}
                <div className="p-4 bg-muted/50 rounded-xl">
                  <div className="flex items-baseline gap-3 mb-1">
                    <span className="text-3xl font-bold text-foreground">
                      ₹{medicine.price.toLocaleString()}
                    </span>
                    {medicine.original_price && (
                      <span className="text-lg text-muted-foreground line-through">
                        ₹{medicine.original_price.toLocaleString()}
                      </span>
                    )}
                  </div>
                  {discount > 0 && medicine.original_price && (
                    <p className="text-secondary font-medium text-sm">
                      You Save: ₹{(medicine.original_price - medicine.price).toLocaleString()} ({discount}%)
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Inclusive of all taxes
                  </p>
                </div>

                {/* Stock Status */}
                <div>
                  {medicine.stock > 0 ? (
                    <Badge className="bg-secondary/20 text-secondary border-0">
                      In Stock ({medicine.stock} available)
                    </Badge>
                  ) : (
                    <Badge variant="destructive">Out of Stock</Badge>
                  )}
                </div>

                {/* Quantity */}
                <div className="flex items-center gap-4">
                  <p className="text-sm font-medium">Quantity:</p>
                  <div className="flex items-center border border-border rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-2 hover:bg-muted transition-colors"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="px-4 font-semibold">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(medicine.stock, quantity + 1))}
                      className="p-2 hover:bg-muted transition-colors"
                      disabled={quantity >= medicine.stock}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button 
                    className="flex-1 bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2 h-12 rounded-lg"
                    onClick={handleAddToCart}
                    disabled={medicine.stock <= 0}
                  >
                    <ShoppingCart className="h-5 w-5" />
                    {medicine.stock > 0 ? "Add to Cart" : "Out of Stock"}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className={`h-12 w-12 rounded-lg flex-shrink-0 ${isWishlisted ? 'bg-destructive/10 border-destructive text-destructive' : ''}`}
                    onClick={handleWishlist}
                  >
                    <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-12 w-12 rounded-lg flex-shrink-0"
                    onClick={handleShare}
                  >
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>

                {/* Prescription Warning */}
                {medicine.prescription_required && (
                  <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                    <p className="text-sm text-destructive font-medium">
                      ⚠️ This medicine requires a valid prescription. You'll need to upload your prescription during checkout.
                    </p>
                  </div>
                )}

                {/* Trust Badges */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border">
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="h-5 w-5 text-secondary" />
                    <span>100% Genuine</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Truck className="h-5 w-5 text-primary" />
                    <span>Free Delivery</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Details Tabs */}
            <Tabs defaultValue="description" className="mb-10">
              <TabsList className="w-full justify-start h-auto p-1 bg-muted rounded-lg">
                <TabsTrigger value="description" className="rounded-md px-4 py-2">
                  Description
                </TabsTrigger>
                <TabsTrigger value="details" className="rounded-md px-4 py-2">
                  Details
                </TabsTrigger>
              </TabsList>
              <div className="mt-4 p-5 bg-card rounded-xl border border-border">
                <TabsContent value="description" className="mt-0">
                  <p className="text-foreground leading-relaxed">
                    {medicine.description || `${medicine.name} is a medication used for treating specific health conditions. Please consult your doctor or pharmacist for detailed information about usage, dosage, and precautions.`}
                  </p>
                </TabsContent>
                <TabsContent value="details" className="mt-0">
                  <div className="grid gap-3 text-sm">
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Medicine Name</span>
                      <span className="font-medium">{medicine.name}</span>
                    </div>
                    {medicine.salt_name && (
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="text-muted-foreground">Salt/Composition</span>
                        <span className="font-medium">{medicine.salt_name}</span>
                      </div>
                    )}
                    {medicine.brand && (
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="text-muted-foreground">Brand</span>
                        <span className="font-medium">{medicine.brand}</span>
                      </div>
                    )}
                    {medicine.dosage && (
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="text-muted-foreground">Dosage</span>
                        <span className="font-medium">{medicine.dosage}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">Prescription Required</span>
                      <span className="font-medium">{medicine.prescription_required ? "Yes" : "No"}</span>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>

            {/* Related Products */}
            {relatedMedicines && relatedMedicines.length > 0 && (
              <div className="pb-6">
                <h2 className="text-xl font-bold text-foreground font-heading mb-4">
                  Related Products
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {relatedMedicines.map((item) => {
                    const itemDiscount = getDiscount(item.price, item.original_price);
                    return (
                      <Link
                        key={item.id}
                        to={`/medicine/${item.slug}`}
                        className="group bg-card rounded-xl border border-border overflow-hidden hover:shadow-card-hover transition-all"
                      >
                        <div className="aspect-square bg-muted/50 flex items-center justify-center relative">
                          {itemDiscount > 0 && (
                            <Badge className="absolute top-2 left-2 bg-secondary text-secondary-foreground text-xs">
                              {itemDiscount}% Off
                            </Badge>
                          )}
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.name} className="max-h-[70%] object-contain" />
                          ) : (
                            <span className="text-5xl">💊</span>
                          )}
                        </div>
                        <div className="p-3">
                          <h3 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors line-clamp-1">
                            {item.name}
                          </h3>
                          <p className="text-xs text-primary uppercase line-clamp-1">{item.salt_name}</p>
                          <p className="text-base font-bold text-foreground mt-1">
                            ₹{item.price.toLocaleString()}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MedicineDetail;
