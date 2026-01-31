-- Create coupon discount type enum
CREATE TYPE public.discount_type AS ENUM ('percentage', 'flat', 'free_delivery');

-- Create coupons table
CREATE TABLE public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    discount_type discount_type NOT NULL DEFAULT 'percentage',
    discount_value NUMERIC DEFAULT 0,
    minimum_order_value NUMERIC DEFAULT 0,
    maximum_discount NUMERIC DEFAULT NULL,
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    end_date TIMESTAMP WITH TIME ZONE,
    usage_limit INTEGER DEFAULT NULL,
    times_used INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create delivery_fees table for state-based delivery charges
CREATE TABLE public.delivery_fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state_name TEXT NOT NULL UNIQUE,
    delivery_fee NUMERIC NOT NULL DEFAULT 0,
    free_delivery_minimum NUMERIC DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_fees ENABLE ROW LEVEL SECURITY;

-- Coupons policies
CREATE POLICY "Admins can manage coupons"
ON public.coupons FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active coupons"
ON public.coupons FOR SELECT
USING (is_active = true AND (end_date IS NULL OR end_date > now()));

-- Delivery fees policies
CREATE POLICY "Admins can manage delivery fees"
ON public.delivery_fees FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active delivery fees"
ON public.delivery_fees FOR SELECT
USING (is_active = true);

-- Add triggers for updated_at
CREATE TRIGGER update_coupons_updated_at
BEFORE UPDATE ON public.coupons
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_delivery_fees_updated_at
BEFORE UPDATE ON public.delivery_fees
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Add coupon_id and delivery_fee to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES public.coupons(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC DEFAULT 0;

-- Insert default delivery fees for Indian states
INSERT INTO public.delivery_fees (state_name, delivery_fee, free_delivery_minimum) VALUES
('Andhra Pradesh', 50, 500),
('Arunachal Pradesh', 100, 1000),
('Assam', 80, 800),
('Bihar', 60, 500),
('Chhattisgarh', 60, 500),
('Goa', 50, 500),
('Gujarat', 50, 500),
('Haryana', 40, 400),
('Himachal Pradesh', 70, 700),
('Jharkhand', 60, 500),
('Karnataka', 50, 500),
('Kerala', 60, 600),
('Madhya Pradesh', 50, 500),
('Maharashtra', 40, 400),
('Manipur', 100, 1000),
('Meghalaya', 100, 1000),
('Mizoram', 100, 1000),
('Nagaland', 100, 1000),
('Odisha', 60, 600),
('Punjab', 50, 500),
('Rajasthan', 50, 500),
('Sikkim', 80, 800),
('Tamil Nadu', 50, 500),
('Telangana', 50, 500),
('Tripura', 90, 900),
('Uttar Pradesh', 40, 400),
('Uttarakhand', 60, 600),
('West Bengal', 50, 500),
('Delhi', 30, 300),
('Chandigarh', 40, 400),
('Puducherry', 60, 600),
('Jammu and Kashmir', 80, 800),
('Ladakh', 120, 1200);