import { Star, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import InlineReviewForm from "./InlineReviewForm";

// Fallback reviews for when database is empty
const fallbackReviews = [
  {
    id: "1",
    name: "Amreen Taj",
    rating: 5,
    avatar_bg: "bg-teal-500",
    review_text: "Srinidhi R helped me resolve my long-pending issue with remarkable ease and professionalism. Truly one of the best employees at TabletKart!",
    created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "2",
    name: "SVN Prasanna",
    rating: 5,
    avatar_bg: "bg-purple-500",
    review_text: "Good response from Mr. Srinidhi, delivery also made in time",
    created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "3",
    name: "Sri Hari Edlaw",
    rating: 5,
    avatar_bg: "bg-blue-500",
    review_text: "TabletKart was lightning fast to deliver my Bosutinib tablets which were required by me urgently. Hat's off to it.",
    created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "4",
    name: "Shirshendu Sarkar",
    rating: 5,
    avatar_bg: "bg-gray-400",
    review_text: "Very much satisfied with the service..absolutely genuine product with great discounts 😊😊",
    created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "5",
    name: "Aafreen Khan",
    rating: 5,
    avatar_bg: "bg-pink-500",
    review_text: "Great Experience with Niloy.. Too courteous throughout with timely delivery.. Well done 😊",
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const getTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffInDays < 1) return "Today";
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} week${diffInDays >= 14 ? 's' : ''} ago`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} month${diffInDays >= 60 ? 's' : ''} ago`;
  return `${Math.floor(diffInDays / 365)} year${diffInDays >= 730 ? 's' : ''} ago`;
};

const ReviewsSection = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null);
  const isUserInteracting = useRef(false);

  // Fetch approved reviews from database
  const { data: dbReviews } = useQuery({
    queryKey: ["approved-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    },
  });

  // Use database reviews if available, otherwise use fallback
  const reviews = dbReviews && dbReviews.length > 0 ? dbReviews : fallbackReviews;

  // Get card width based on screen size
  const getCardWidth = useCallback(() => {
    if (typeof window === 'undefined') return 280;
    if (window.innerWidth < 640) return 280; // Mobile: w-[280px]
    if (window.innerWidth < 768) return 300; // sm: w-[300px]
    if (window.innerWidth < 1024) return 320; // md: w-[320px]
    return 340; // lg: w-[340px]
  }, []);

  const scroll = useCallback((direction: "left" | "right") => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      const cardWidth = getCardWidth();
      const gap = window.innerWidth >= 768 ? 20 : 16; // gap-4 = 16px, gap-5 = 20px
      const scrollUnit = cardWidth + gap;
      const maxScroll = container.scrollWidth - container.clientWidth;
      
      if (direction === "right") {
        if (container.scrollLeft >= maxScroll - 10) {
          // Reset to beginning smoothly
          container.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          // Calculate next snap position
          const currentPosition = container.scrollLeft;
          const nextPosition = Math.ceil(currentPosition / scrollUnit) * scrollUnit + scrollUnit;
          container.scrollTo({ left: Math.min(nextPosition, maxScroll), behavior: "smooth" });
        }
      } else {
        const currentPosition = container.scrollLeft;
        const prevPosition = Math.floor(currentPosition / scrollUnit) * scrollUnit - scrollUnit;
        container.scrollTo({ left: Math.max(prevPosition, 0), behavior: "smooth" });
      }
    }
  }, [getCardWidth]);

  // Auto-scroll effect
  useEffect(() => {
    const startAutoScroll = () => {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
      }
      autoScrollRef.current = setInterval(() => {
        if (!isUserInteracting.current) {
          scroll("right");
        }
      }, 4000);
    };

    startAutoScroll();

    const container = scrollRef.current;
    
    const handleInteractionStart = () => {
      isUserInteracting.current = true;
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
      }
    };
    
    const handleInteractionEnd = () => {
      isUserInteracting.current = false;
      // Restart auto-scroll after user stops interacting
      setTimeout(() => {
        if (!isUserInteracting.current) {
          startAutoScroll();
        }
      }, 2000);
    };

    // Mouse events
    container?.addEventListener("mouseenter", handleInteractionStart);
    container?.addEventListener("mouseleave", handleInteractionEnd);
    
    // Touch events for mobile
    container?.addEventListener("touchstart", handleInteractionStart, { passive: true });
    container?.addEventListener("touchend", handleInteractionEnd, { passive: true });

    return () => {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
      }
      container?.removeEventListener("mouseenter", handleInteractionStart);
      container?.removeEventListener("mouseleave", handleInteractionEnd);
      container?.removeEventListener("touchstart", handleInteractionStart);
      container?.removeEventListener("touchend", handleInteractionEnd);
    };
  }, [scroll]);

  return (
    <section id="reviews" className="py-8 md:py-12 bg-background scroll-mt-32">
      <div className="container px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground font-heading">
              Your Reviews Fuel Us!
            </h2>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Hear from those whose lives have been positively impacted by TabletKart's services.
            </p>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={() => scroll("left")}
              className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-border flex items-center justify-center hover:border-primary hover:text-primary hover:bg-primary/5 transition-all bg-card"
            >
              <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-border flex items-center justify-center hover:border-primary hover:text-primary hover:bg-primary/5 transition-all bg-card"
            >
              <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
            </button>
          </div>
        </div>

        {/* Review Cards Carousel */}
        <div
          ref={scrollRef}
          className="flex gap-4 md:gap-5 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory"
          style={{ scrollBehavior: 'smooth' }}
        >
          {/* Left spacer for proper edge padding */}
          <div className="flex-shrink-0 w-3 sm:w-4 md:w-0" />
          
          {/* Inline Review Form as first card */}
          <div className="snap-start">
            <InlineReviewForm />
          </div>
          
          {reviews.map((review) => (
            <div
              key={review.id}
              className="flex-shrink-0 w-[280px] sm:w-[300px] md:w-[320px] lg:w-[340px] snap-start"
            >
              <div className="bg-card border border-border rounded-2xl md:rounded-3xl p-4 md:p-5 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 h-full flex flex-col">
                {/* Header with Avatar and Google Icon */}
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div className="flex items-center gap-2.5 md:gap-3">
                    <div
                      className={`w-10 h-10 md:w-12 md:h-12 ${review.avatar_bg || 'bg-primary'} rounded-xl md:rounded-2xl flex items-center justify-center text-white font-semibold text-sm md:text-base shadow-sm`}
                    >
                      {review.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-xs md:text-sm line-clamp-1">
                        {review.name}
                      </p>
                      <div className="flex items-center gap-0.5 mt-0.5">
                        {[...Array(review.rating)].map((_, i) => (
                          <Star
                            key={i}
                            className="h-3 w-3 md:h-3.5 md:w-3.5 fill-amber-400 text-amber-400"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Google Icon */}
                  <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-muted/50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3.5 h-3.5 md:w-4 md:h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </div>
                </div>

                {/* Quote Icon */}
                <div className="mb-2">
                  <svg 
                    className="w-6 h-6 md:w-7 md:h-7 text-primary/30" 
                    viewBox="0 0 24 24" 
                    fill="currentColor"
                  >
                    <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z"/>
                  </svg>
                </div>

                {/* Review Text */}
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed flex-1 line-clamp-5">
                  {review.review_text}
                </p>

                {/* Timestamp */}
                <div className="flex items-center gap-1.5 mt-3 md:mt-4 pt-3 border-t border-border">
                  <Clock className="h-3 w-3 md:h-3.5 md:w-3.5 text-muted-foreground" />
                  <span className="text-[10px] md:text-xs text-muted-foreground">
                    {getTimeAgo(review.created_at)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ReviewsSection;
