import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Check, Loader2, Heart, Pill, Thermometer, FileText } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  saltName?: string | null;
  brand?: string | null;
  price: number;
  originalPrice?: number | null;
  prescriptionRequired?: boolean | null;
  imageUrl?: string | null;
  stock?: number | null;
  temperatureControlled?: boolean;
  className?: string;
}

const ProductCard = ({
  id,
  name,
  slug,
  saltName,
  brand,
  price,
  originalPrice,
  prescriptionRequired,
  imageUrl,
  stock = 10,
  temperatureControlled = true,
  className = "",
}: ProductCardProps) => {
  const { addItem } = useCart();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
  const savings = originalPrice ? originalPrice - price : 0;
  const inStock = (stock ?? 0) > 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsAdding(true);
    await new Promise(resolve => setTimeout(resolve, 400));
    
    addItem({
      id,
      name,
      brand: brand || "",
      price,
      originalPrice: originalPrice || undefined,
      prescriptionRequired: prescriptionRequired || false,
      imageUrl: imageUrl || undefined,
      slug,
    });
    
    setIsAdding(false);
    setIsAdded(true);

    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
    toast({
      title: isWishlisted ? "Removed from wishlist" : "Added to wishlist",
      description: `${name} has been ${isWishlisted ? "removed from" : "added to"} your wishlist.`,
    });
  };

  return (
    <div
      className={`group relative bg-card rounded-2xl border border-border overflow-visible ${className}`}
    >
      {/* Top Section - Image Area */}
      <div className="relative bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/30 dark:via-teal-950/30 dark:to-cyan-950/30 p-4 sm:p-5 rounded-t-2xl overflow-visible">
        {/* Badges Row */}
        <div className="absolute top-2 sm:top-3 left-2 sm:left-3 right-2 sm:right-3 flex items-start justify-between z-10">
          {/* Left - Discount */}
          <div className="flex flex-col gap-1.5">
            {discount > 0 && (
              <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[8px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-md shadow-md border-0">
                {discount}% OFF
              </Badge>
            )}
          </div>

          {/* Right - Status Badges */}
          <div className="flex items-center gap-1">
            {prescriptionRequired && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-5 h-5 sm:w-8 sm:h-8 bg-gradient-to-br from-red-500 to-rose-600 rounded-md sm:rounded-lg flex items-center justify-center shadow-md cursor-help">
                    <FileText className="h-2.5 w-2.5 sm:h-4 sm:w-4 text-white" />
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
            {temperatureControlled && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-5 h-5 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-md sm:rounded-lg flex items-center justify-center shadow-md cursor-help">
                    <Thermometer className="h-2.5 w-2.5 sm:h-4 sm:w-4 text-white" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left" className="bg-foreground text-background text-xs font-medium z-50">
                  <div className="flex items-center gap-1.5">
                    <Thermometer className="h-3 w-3" />
                    Temperature Controlled
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleWishlist}
          className={`absolute bottom-3 right-3 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-300 z-10 ${
            isWishlisted 
              ? "bg-red-500 text-white shadow-lg" 
              : "bg-white/80 backdrop-blur-sm text-muted-foreground hover:bg-white hover:text-red-500 shadow-md"
          }`}
        >
          <Heart className={`h-4 w-4 sm:h-5 sm:w-5 ${isWishlisted ? "fill-current" : ""}`} />
        </button>

        {/* Product Image */}
        <Link to={`/medicine/${slug}`} className="block">
          <div className="aspect-square flex items-center justify-center pt-6 pb-2">
            {imageUrl ? (
              <img 
                src={imageUrl} 
                alt={name}
                className="max-h-full max-w-full w-auto h-auto object-contain"
              />
            ) : (
              <div className="h-20 w-20 sm:h-24 sm:w-24 bg-white/60 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-inner">
                <Pill className="h-10 w-10 sm:h-12 sm:w-12 text-primary/40" />
              </div>
            )}
          </div>
        </Link>
      </div>

      {/* Content Section */}
      <div className="p-3 sm:p-4">
        {/* Brand */}
        {brand && (
          <p className="text-[10px] sm:text-xs text-primary font-semibold uppercase tracking-wider mb-0.5">
            {brand}
          </p>
        )}

        {/* Product Name */}
        <Link to={`/medicine/${slug}`}>
          <h3 className="font-bold text-foreground text-sm sm:text-base leading-tight line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem]">
            {name}
          </h3>
        </Link>

        {/* Salt/Molecule */}
        {saltName && (
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 line-clamp-1">
            {saltName}
          </p>
        )}

        {/* Price Section */}
        <div className="mt-2 sm:mt-3">
          <div className="flex items-end justify-between gap-2">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-sm sm:text-base font-semibold text-foreground">
                  ₹{price.toLocaleString()}
                </span>
                {originalPrice && (
                  <span className="text-[9px] sm:text-[10px] text-muted-foreground line-through">
                    ₹{originalPrice.toLocaleString()}
                  </span>
                )}
              </div>
              {savings > 0 && (
                <p className="hidden sm:block text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  You save ₹{savings.toLocaleString()}
                </p>
              )}
            </div>
            {!inStock && (
              <Badge variant="secondary" className="text-[10px] bg-muted text-muted-foreground">
                Out of Stock
              </Badge>
            )}
          </div>
        </div>

        {/* Add to Cart Button */}
        <Button 
          onClick={handleAddToCart}
          disabled={!inStock || isAdding}
          className={`w-full mt-3 gap-1.5 rounded-lg h-9 sm:h-10 font-semibold text-xs sm:text-sm transition-all duration-300 shadow-sm hover:shadow-md ${
            isAdded 
              ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-500 text-white border-0" 
              : "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground border-0"
          }`}
        >
          {isAdding ? (
            <>
              <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
              Adding...
            </>
          ) : isAdded ? (
            <>
              <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Added to Cart
            </>
          ) : inStock ? (
            <>
              <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Add to Cart
            </>
          ) : (
            "Out of Stock"
          )}
        </Button>
      </div>
    </div>
  );
};

export default ProductCard;
