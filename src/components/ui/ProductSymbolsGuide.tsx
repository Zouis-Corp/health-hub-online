import { useEffect, useState } from "react";
import { X, FileText, Thermometer, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "product_symbols_guide_shown";

interface ProductSymbolsGuideProps {
  trigger?: boolean;
}

const ProductSymbolsGuide = ({ trigger = false }: ProductSymbolsGuideProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (trigger) {
      // Check if already shown in this session
      const hasShown = sessionStorage.getItem(STORAGE_KEY);
      if (!hasShown) {
        setIsOpen(true);
        sessionStorage.setItem(STORAGE_KEY, "true");
      }
    }
  }, [trigger]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${
        isClosing ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isClosing ? "opacity-0" : "opacity-100"
        }`}
        onClick={handleClose}
      />
      
      {/* Modal Content */}
      <div 
        className={`relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm mx-auto overflow-hidden transition-all duration-300 ${
          isClosing ? "scale-95 opacity-0" : "scale-100 opacity-100"
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-4 py-3 sm:px-5 sm:py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
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
              className="h-8 w-8 rounded-full hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1.5">
            Learn what the symbols on product cards mean
          </p>
        </div>

        {/* Symbol Explanations */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* Prescription Required Symbol */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50">
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
          <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50">
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
        <div className="px-4 pb-4 sm:px-5 sm:pb-5">
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
