-- =====================================================
-- DROP EXISTING TABLES (in order to handle dependencies)
-- =====================================================
DROP TABLE IF EXISTS public.wishlist_items CASCADE;
DROP TABLE IF EXISTS public.cart_items CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.prescriptions CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.otp_verifications CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.addresses CASCADE;
DROP TABLE IF EXISTS public.coupons CASCADE;
DROP TABLE IF EXISTS public.delivery_fees CASCADE;
DROP TABLE IF EXISTS public.conditions CASCADE;
DROP TABLE IF EXISTS public.medicines CASCADE;

-- Drop existing enums if they exist
DROP TYPE IF EXISTS public.app_role CASCADE;
DROP TYPE IF EXISTS public.discount_type CASCADE;
DROP TYPE IF EXISTS public.order_status CASCADE;
DROP TYPE IF EXISTS public.payment_status CASCADE;
DROP TYPE IF EXISTS public.prescription_status CASCADE;

-- Drop existing sequences
DROP SEQUENCE IF EXISTS order_number_seq CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.has_role(UUID, public.app_role) CASCADE;
DROP FUNCTION IF EXISTS public.is_staff(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_expired_otps() CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- =====================================================
-- SECTION 1: CUSTOM ENUMS
-- =====================================================

CREATE TYPE public.app_role AS ENUM ('admin', 'pharmacist', 'user');
CREATE TYPE public.discount_type AS ENUM ('percentage', 'flat', 'free_delivery');
CREATE TYPE public.order_status AS ENUM ('pending_rx', 'approved', 'rejected', 'processing', 'shipped', 'delivered');
CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE public.prescription_status AS ENUM ('pending', 'approved', 'rejected');

-- =====================================================
-- SECTION 2: SEQUENCES
-- =====================================================

CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 1000;

-- =====================================================
-- SECTION 3: TABLES
-- =====================================================

-- PROFILES TABLE
CREATE TABLE public.profiles (
    id UUID NOT NULL PRIMARY KEY,
    name TEXT,
    email TEXT,
    phone TEXT,
    email_verified BOOLEAN NOT NULL DEFAULT false,
    is_blocked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- USER ROLES TABLE
CREATE TABLE public.user_roles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    role public.app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- CONDITIONS TABLE
CREATE TABLE public.conditions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- MEDICINES TABLE
CREATE TABLE public.medicines (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    brand TEXT,
    salt_name TEXT,
    dosage TEXT,
    price NUMERIC NOT NULL,
    original_price NUMERIC,
    stock INTEGER DEFAULT 0,
    image_url TEXT,
    prescription_required BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    condition_id UUID REFERENCES public.conditions(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ADDRESSES TABLE
CREATE TABLE public.addresses (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address_line_1 TEXT NOT NULL,
    address_line_2 TEXT,
    landmark TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- COUPONS TABLE
CREATE TABLE public.coupons (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    discount_type public.discount_type NOT NULL DEFAULT 'percentage',
    discount_value NUMERIC DEFAULT 0,
    minimum_order_value NUMERIC DEFAULT 0,
    maximum_discount NUMERIC,
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    end_date TIMESTAMP WITH TIME ZONE,
    usage_limit INTEGER,
    times_used INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- DELIVERY FEES TABLE
CREATE TABLE public.delivery_fees (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    state_name TEXT NOT NULL UNIQUE,
    delivery_fee NUMERIC NOT NULL DEFAULT 0,
    free_delivery_minimum NUMERIC DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ORDERS TABLE
CREATE TABLE public.orders (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_number INTEGER DEFAULT nextval('order_number_seq'),
    user_id UUID NOT NULL,
    address_id UUID REFERENCES public.addresses(id),
    status public.order_status DEFAULT 'pending_rx',
    payment_status public.payment_status DEFAULT 'pending',
    total_amount NUMERIC NOT NULL DEFAULT 0,
    discount_amount NUMERIC DEFAULT 0,
    delivery_fee NUMERIC DEFAULT 0,
    coupon_id UUID REFERENCES public.coupons(id),
    notes TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ORDER ITEMS TABLE
CREATE TABLE public.order_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id),
    medicine_id UUID REFERENCES public.medicines(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    price NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- PRESCRIPTIONS TABLE
CREATE TABLE public.prescriptions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    order_id UUID REFERENCES public.orders(id),
    file_url TEXT NOT NULL,
    status public.prescription_status DEFAULT 'pending',
    notes TEXT,
    approved_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- OTP VERIFICATIONS TABLE
CREATE TABLE public.otp_verifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- SECTION 4: ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SECTION 5: DATABASE FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin', 'pharmacist')) $$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$ BEGIN DELETE FROM public.otp_verifications WHERE expires_at < now() OR is_used = true; END; $$;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path TO 'public'
AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$ BEGIN
    INSERT INTO public.profiles (id, name, email) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), NEW.email);
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
    RETURN NEW;
END; $$;

-- =====================================================
-- SECTION 6: TRIGGERS
-- =====================================================

-- Update timestamp triggers
CREATE TRIGGER handle_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_conditions_updated_at
    BEFORE UPDATE ON public.conditions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_medicines_updated_at
    BEFORE UPDATE ON public.medicines
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_addresses_updated_at
    BEFORE UPDATE ON public.addresses
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_coupons_updated_at
    BEFORE UPDATE ON public.coupons
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_delivery_fees_updated_at
    BEFORE UPDATE ON public.delivery_fees
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_prescriptions_updated_at
    BEFORE UPDATE ON public.prescriptions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auth trigger for new users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- SECTION 7: RLS POLICIES
-- =====================================================

-- PROFILES policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Staff can view all profiles" ON public.profiles FOR SELECT USING (public.is_staff(auth.uid()));

-- USER ROLES policies
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Staff can view all roles" ON public.user_roles FOR SELECT USING (public.is_staff(auth.uid()));
CREATE POLICY "Admin can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- CONDITIONS policies (public read)
CREATE POLICY "Anyone can view active conditions" ON public.conditions FOR SELECT USING (is_active = true);
CREATE POLICY "Staff can manage conditions" ON public.conditions FOR ALL USING (public.is_staff(auth.uid()));

-- MEDICINES policies (public read)
CREATE POLICY "Anyone can view active medicines" ON public.medicines FOR SELECT USING (is_active = true);
CREATE POLICY "Staff can manage medicines" ON public.medicines FOR ALL USING (public.is_staff(auth.uid()));

-- ADDRESSES policies
CREATE POLICY "Users can view own addresses" ON public.addresses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own addresses" ON public.addresses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own addresses" ON public.addresses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own addresses" ON public.addresses FOR DELETE USING (auth.uid() = user_id);

-- COUPONS policies (public read for active)
CREATE POLICY "Anyone can view active coupons" ON public.coupons FOR SELECT USING (is_active = true);
CREATE POLICY "Staff can manage coupons" ON public.coupons FOR ALL USING (public.is_staff(auth.uid()));

-- DELIVERY FEES policies (public read)
CREATE POLICY "Anyone can view delivery fees" ON public.delivery_fees FOR SELECT USING (true);
CREATE POLICY "Staff can manage delivery fees" ON public.delivery_fees FOR ALL USING (public.is_staff(auth.uid()));

-- ORDERS policies
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pending orders" ON public.orders FOR UPDATE USING (auth.uid() = user_id AND status = 'pending_rx');
CREATE POLICY "Staff can view all orders" ON public.orders FOR SELECT USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can update orders" ON public.orders FOR UPDATE USING (public.is_staff(auth.uid()));

-- ORDER ITEMS policies
CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));
CREATE POLICY "Users can insert own order items" ON public.order_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));
CREATE POLICY "Staff can view all order items" ON public.order_items FOR SELECT USING (public.is_staff(auth.uid()));

-- PRESCRIPTIONS policies
CREATE POLICY "Users can view own prescriptions" ON public.prescriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upload prescriptions" ON public.prescriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Staff can view all prescriptions" ON public.prescriptions FOR SELECT USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can update prescriptions" ON public.prescriptions FOR UPDATE USING (public.is_staff(auth.uid()));

-- OTP VERIFICATIONS policies (only via service role)
CREATE POLICY "Service role only for OTP" ON public.otp_verifications FOR ALL USING (false);

-- =====================================================
-- SECTION 8: STORAGE BUCKETS
-- =====================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('prescriptions', 'prescriptions', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('medicine-images', 'medicine-images', true) ON CONFLICT (id) DO NOTHING;

-- Storage policies for prescriptions bucket
CREATE POLICY "Users can upload own prescriptions" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'prescriptions' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view own prescriptions" ON storage.objects FOR SELECT USING (bucket_id = 'prescriptions' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Staff can view all prescriptions" ON storage.objects FOR SELECT USING (bucket_id = 'prescriptions' AND public.is_staff(auth.uid()));

-- Storage policies for medicine-images bucket (public read)
CREATE POLICY "Anyone can view medicine images" ON storage.objects FOR SELECT USING (bucket_id = 'medicine-images');
CREATE POLICY "Staff can upload medicine images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'medicine-images' AND public.is_staff(auth.uid()));
CREATE POLICY "Staff can update medicine images" ON storage.objects FOR UPDATE USING (bucket_id = 'medicine-images' AND public.is_staff(auth.uid()));
CREATE POLICY "Staff can delete medicine images" ON storage.objects FOR DELETE USING (bucket_id = 'medicine-images' AND public.is_staff(auth.uid()));