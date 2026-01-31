import { useEffect, useState } from "react";
import { X, FileText, Thermometer, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "product_symbols_guide_shown";

interface ProductSymbolsGuideProps {
  trigger?: boolean;
}

const ProductSymbolsGuide = ({ trigger = false }: ProductSymbolsGuideProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (trigger) {
      const hasShown = sessionStorage.getItem(STORAGE_KEY);
      if (!hasShown) {
        // First mount the component
        setIsOpen(true);
        // Then trigger the animation after a brief delay
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setIsVisible(true);
          });
        });
        sessionStorage.setItem(STORAGE_KEY, "true");
      }
    }
  }, [trigger]);

  const handleClose = () => {
    setIsAnimating(true);
    setIsVisible(false);
    // Wait for animation to complete before unmounting
    setTimeout(() => {
      setIsOpen(false);
      setIsAnimating(false);
    }, 400);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ pointerEvents: isAnimating ? 'none' : 'auto' }}
    >
      {/* Backdrop with smooth fade */}
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-all duration-400 ease-out ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        style={{ transitionDuration: '400ms' }}
        onClick={handleClose}
      />
      
      {/* Modal Content with spring-like animation */}
      <div 
        className={`relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm mx-auto overflow-hidden transition-all ease-out ${
          isVisible 
            ? "opacity-100 scale-100 translate-y-0" 
            : "opacity-0 scale-90 translate-y-8"
        }`}
        style={{ 
          transitionDuration: '400ms',
          transitionTimingFunction: isVisible ? 'cubic-bezier(0.34, 1.56, 0.64, 1)' : 'cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-4 py-3 sm:px-5 sm:py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div 
              className={`flex items-center gap-2 transition-all delay-100 ${
                isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
              }`}
              style={{ transitionDuration: '400ms' }}
            >
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Info className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-bold text-foreground text-base sm:text-lg">
                Product Symbols Guide
              </h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className={`h-8 w-8 rounded-full hover:bg-muted transition-all delay-150 ${
                isVisible ? "opacity-100 rotate-0" : "opacity-0 rotate-90"
              }`}
              style={{ transitionDuration: '300ms' }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p 
            className={`text-xs sm:text-sm text-muted-foreground mt-1.5 transition-all delay-150 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            }`}
            style={{ transitionDuration: '400ms' }}
          >
            Learn what the symbols on product cards mean
          </p>
        </div>

        {/* Symbol Explanations */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* Prescription Required Symbol */}
          <div 
            className={`flex items-start gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 transition-all delay-200 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-6"
            }`}
            style={{ transitionDuration: '450ms', transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
              <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-foreground text-sm sm:text-base">
                Prescription Required
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 leading-relaxed">
                This medicine requires a valid prescription from a licensed doctor. Please upload your prescription during checkout.
              </p>
            </div>
          </div>

          {/* Temperature Controlled Symbol */}
          <div 
            className={`flex items-start gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 transition-all delay-300 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-6"
            }`}
            style={{ transitionDuration: '450ms', transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
              <Thermometer className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-foreground text-sm sm:text-base">
                Temperature Controlled
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 leading-relaxed">
                This product requires cold chain delivery. We ensure proper temperature is maintained during shipping for product efficacy.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div 
          className={`px-4 pb-4 sm:px-5 sm:pb-5 transition-all delay-350 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{ transitionDuration: '400ms' }}
        >
          <Button 
            onClick={handleClose}
            className="w-full"
            size="lg"
          >
            Got it, thanks!
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductSymbolsGuide;
