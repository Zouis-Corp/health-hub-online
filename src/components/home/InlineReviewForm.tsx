import { useState } from "react";
import { Star, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const avatarColors = [
  "bg-teal-500",
  "bg-purple-500",
  "bg-blue-500",
  "bg-pink-500",
  "bg-orange-500",
  "bg-green-500",
  "bg-red-500",
  "bg-indigo-500",
];

const InlineReviewForm = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    review: "",
  });

  // Pre-fill name when user is logged in
  const displayName = formData.name || profile?.name || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to write a review",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    const nameToSubmit = formData.name.trim() || profile?.name || "";
    
    if (!nameToSubmit || !formData.review.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in your name and review",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const randomColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];
      
      const { error } = await supabase.from("reviews").insert({
        user_id: user.id,
        name: nameToSubmit,
        location: formData.location.trim() || null,
        rating,
        review_text: formData.review.trim(),
        avatar_bg: randomColor,
      });

      if (error) throw error;

      toast({
        title: "Review Submitted!",
        description: "Your review has been submitted for approval. Thank you!",
      });
      setFormData({ name: "", location: "", review: "" });
      setRating(5);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-shrink-0 w-[280px] sm:w-[300px] md:w-[320px] lg:w-[340px]">
      <div className="bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-dashed border-primary/30 rounded-2xl md:rounded-3xl p-4 md:p-5 h-full flex flex-col">
        <h3 className="font-semibold text-foreground text-sm md:text-base mb-3">
          Share Your Experience
        </h3>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 flex-1">
          {/* Rating */}
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-0.5 transition-transform hover:scale-110"
              >
                <Star
                  className={`h-5 w-5 md:h-6 md:w-6 transition-colors ${
                    star <= (hoverRating || rating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground/40"
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Name */}
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder={displayName || "Your name *"}
            maxLength={100}
            className="h-9 text-xs md:text-sm bg-background/80"
          />

          {/* Location */}
          <Input
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="Location (optional)"
            maxLength={100}
            className="h-9 text-xs md:text-sm bg-background/80"
          />

          {/* Review */}
          <Textarea
            value={formData.review}
            onChange={(e) => setFormData({ ...formData, review: e.target.value })}
            placeholder="Write your review... *"
            rows={3}
            maxLength={1000}
            className="text-xs md:text-sm bg-background/80 resize-none flex-1 min-h-[80px]"
          />

          <Button 
            type="submit" 
            disabled={isSubmitting}
            size="sm"
            className="w-full gap-2 mt-auto"
          >
            <Send className="h-3.5 w-3.5" />
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default InlineReviewForm;
