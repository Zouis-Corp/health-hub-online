import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Heart, Star, Verified } from "lucide-react";

const products = [
  {
    id: 1,
    name: "Metformin 500mg",
    brand: "USV Limited",
    price: 145,
    originalPrice: 180,
    discount: 19,
    rating: 4.8,
    reviews: 234,
    image: "💊",
    category: "Diabetes",
    inStock: true,
    prescription: true,
  },
  {
    id: 2,
    name: "Atorvastatin 10mg",
    brand: "Cipla",
    price: 210,
    originalPrice: 280,
    discount: 25,
    rating: 4.6,
    reviews: 189,
    image: "💊",
    category: "Heart Health",
    inStock: true,
    prescription: true,
  },
  {
    id: 3,
    name: "Losartan 50mg",
    brand: "Sun Pharma",
    price: 98,
    originalPrice: 125,
    discount: 22,
    rating: 4.7,
    reviews: 312,
    image: "💊",
    category: "Blood Pressure",
    inStock: true,
    prescription: true,
  },
  {
    id: 4,
    name: "Vitamin D3 60K",
    brand: "Abbott",
    price: 320,
    originalPrice: 400,
    discount: 20,
    rating: 4.9,
    reviews: 567,
    image: "💊",
    category: "Supplements",
    inStock: true,
    prescription: false,
  },
  {
    id: 5,
    name: "Pantoprazole 40mg",
    brand: "Alkem",
    price: 76,
    originalPrice: 95,
    discount: 20,
    rating: 4.5,
    reviews: 423,
    image: "💊",
    category: "Gastric",
    inStock: true,
    prescription: true,
  },
  {
    id: 6,
    name: "Azithromycin 500mg",
    brand: "Zydus",
    price: 185,
    originalPrice: 250,
    discount: 26,
    rating: 4.7,
    reviews: 298,
    image: "💊",
    category: "Antibiotics",
    inStock: false,
    prescription: true,
  },
];

const FeaturedProducts = () => {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4 mb-6 sm:mb-10">
          <div>
            <h2 className="text-xl sm:text-2xl md:text-4xl font-heading font-bold text-foreground mb-1 sm:mb-2">
              Featured Medicines
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Top-selling genuine medicines at best prices
            </p>
          </div>
          <Link to="/conditions">
            <Button variant="outline">View All Products</Button>
          </Link>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="group bg-card rounded-2xl border border-border shadow-card overflow-hidden hover:shadow-hover transition-all duration-300"
            >
              {/* Image Section */}
              <div className="relative p-6 bg-gradient-to-br from-muted/50 to-muted">
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {product.discount > 0 && (
                    <Badge className="bg-secondary text-secondary-foreground">
                      {product.discount}% OFF
                    </Badge>
                  )}
                  {product.prescription && (
                    <Badge variant="outline" className="bg-card text-xs">
                      Rx Required
                    </Badge>
                  )}
                </div>
                <button className="absolute top-4 right-4 w-9 h-9 rounded-full bg-card shadow-md flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors">
                  <Heart className="h-4 w-4" />
                </button>
                <div className="w-24 h-24 mx-auto flex items-center justify-center text-6xl">
                  {product.image}
                </div>
              </div>

              {/* Content Section */}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-xs">
                    {product.category}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Verified className="h-4 w-4 text-trust-green" />
                    <span className="text-xs text-trust-green font-medium">Genuine</span>
                  </div>
                </div>

                <Link to={`/medicine/${product.id}`}>
                  <h3 className="font-heading font-semibold text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-1">
                    {product.name}
                  </h3>
                </Link>
                <p className="text-sm text-muted-foreground mb-3">{product.brand}</p>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-premium-gold text-premium-gold" />
                    <span className="text-sm font-medium">{product.rating}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    ({product.reviews} reviews)
                  </span>
                </div>

                {/* Price */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-foreground">
                        ₹{product.price}
                      </span>
                      {product.originalPrice > product.price && (
                        <span className="text-sm text-muted-foreground line-through">
                          ₹{product.originalPrice}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={product.inStock ? "default" : "secondary"}
                    disabled={!product.inStock}
                    className="gap-2"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    {product.inStock ? "Add" : "Out of Stock"}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
