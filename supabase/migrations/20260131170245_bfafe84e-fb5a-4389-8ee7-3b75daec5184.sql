-- Create reviews table for user-submitted reviews
CREATE TABLE public.reviews (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    location TEXT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT NOT NULL,
    avatar_bg TEXT DEFAULT 'bg-primary',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Users can view their own reviews
CREATE POLICY "Users can view own reviews"
ON public.reviews
FOR SELECT
USING (auth.uid() = user_id);

-- Anyone can view approved reviews (for homepage)
CREATE POLICY "Anyone can view approved reviews"
ON public.reviews
FOR SELECT
USING (status = 'approved');

-- Authenticated users can submit reviews
CREATE POLICY "Users can submit reviews"
ON public.reviews
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending reviews
CREATE POLICY "Users can update own pending reviews"
ON public.reviews
FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending');

-- Users can delete their own pending reviews
CREATE POLICY "Users can delete own pending reviews"
ON public.reviews
FOR DELETE
USING (auth.uid() = user_id AND status = 'pending');

-- Staff can view all reviews
CREATE POLICY "Staff can view all reviews"
ON public.reviews
FOR SELECT
USING (is_staff(auth.uid()));

-- Staff can update reviews (approve/reject)
CREATE POLICY "Staff can update reviews"
ON public.reviews
FOR UPDATE
USING (is_staff(auth.uid()));

-- Staff can delete reviews
CREATE POLICY "Staff can delete reviews"
ON public.reviews
FOR DELETE
USING (is_staff(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();