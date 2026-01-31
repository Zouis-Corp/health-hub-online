import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, ChevronLeft, ChevronRight, Check, Loader2 } from "lucide-react";
import { useRef } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Product {
  id: number;
  name: string;
  molecule: string;
  price: number;
  originalPrice: number;
  discount: number;
  image: string;
  prescription: boolean;
  temperatureControlled?: boolean;
}

interface ProductCarouselProps {
  title: string;
  subtitle: string;
  products: Product[];
}

const ProductCarousel = ({ title, subtitle, products }: ProductCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [addingToCart, setAddingToCart] = useState<number | null>(null);
  const [addedToCart, setAddedToCart] = useState<Set<number>>(new Set());

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleAddToCart = async (productId: number) => {
    setAddingToCart(productId);
    
    // Simulate a small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setAddingToCart(null);
    setAddedToCart(prev => new Set(prev).add(productId));

    // Reset the added state after 2 seconds
    setTimeout(() => {
      setAddedToCart(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }, 2000);
  };

  return (
    <section className="py-10 bg-background">
      <div className="container">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground font-heading">
              {title}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll("left")}
              className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:border-primary hover:text-primary hover:bg-primary/5 transition-all bg-card shadow-sm"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <Link 
              to="/conditions" 
              className="text-sm text-primary hover:text-primary/80 px-3 font-semibold transition-colors"
            >
              View all
            </Link>
            <button
              onClick={() => scroll("right")}
              className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:border-primary hover:text-primary hover:bg-primary/5 transition-all bg-card shadow-sm"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Products Scroll */}
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4"
        >
          {products.map((product) => {
            const isAdding = addingToCart === product.id;
            const isAdded = addedToCart.has(product.id);
            
            return (
              <div
                key={product.id}
                className="flex-shrink-0 w-[230px] bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg hover:border-primary/20 transition-all duration-300 group"
              >
                {/* Image Section */}
                <div className="relative p-5 bg-muted/30 h-44">
                  {/* Discount Badge */}
                  <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground text-[11px] font-semibold rounded-full px-2.5 py-0.5 shadow-sm">
                    {product.discount}% Off
                  </Badge>
                  
                  {/* Status Icons */}
                  <div className="absolute top-3 right-3 flex gap-1.5">
                    {product.prescription && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="w-6 h-6 bg-destructive text-destructive-foreground text-[10px] font-bold rounded flex items-center justify-center cursor-help shadow-sm">
                            R
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="bg-foreground text-background text-xs">
                          <p>Prescription Required</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {product.temperatureControlled && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="w-6 h-6 bg-muted-foreground text-background text-[10px] font-bold rounded flex items-center justify-center cursor-help shadow-sm">
                            H
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="bg-foreground text-background text-xs">
                          <p>Temperature Controlled</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>

                  {/* Product Image */}
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="h-24 w-24 bg-muted rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="h-16 w-16 object-contain opacity-60"
                      />
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-4">
                  <Link to={`/medicine/${product.id}`}>
                    <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-2 min-h-[2.5rem] group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                  </Link>
                  <p className="text-[11px] text-primary/80 mt-1.5 uppercase font-medium tracking-wide line-clamp-1">
                    {product.molecule}
                  </p>

                  {/* Price Section */}
                  <div className="mt-3 space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold text-foreground">
                        ₹{product.price.toLocaleString()}
                      </span>
                      <span className="text-xs text-muted-foreground line-through">
                        ₹{product.originalPrice.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-primary font-medium">
                      You Save: ₹{(product.originalPrice - product.price).toLocaleString()} ({product.discount}%)
                    </p>
                  </div>

                  {/* Add to Cart Button */}
                  <Button 
                    className={`w-full mt-4 gap-2 rounded-xl h-11 font-semibold transition-all duration-300 ${
                      isAdded 
                        ? "bg-green-500 hover:bg-green-500 text-white" 
                        : "bg-primary hover:bg-primary/90 text-primary-foreground"
                    }`}
                    disabled={isAdding}
                    onClick={() => handleAddToCart(product.id)}
                  >
                    {isAdding ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : isAdded ? (
                      <>
                        <Check className="h-4 w-4" />
                        Added!
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-4 w-4" />
                        Add to cart
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ProductCarousel;
