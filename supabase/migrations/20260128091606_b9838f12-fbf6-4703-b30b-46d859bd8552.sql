-- =============================================
-- PHASE 1: CREATE ENUM TYPES
-- =============================================

-- Role types for users
CREATE TYPE public.app_role AS ENUM ('admin', 'pharmacist', 'user');

-- Order status enum
CREATE TYPE public.order_status AS ENUM ('pending_rx', 'approved', 'rejected', 'processing', 'shipped', 'delivered');

-- Prescription status enum
CREATE TYPE public.prescription_status AS ENUM ('pending', 'approved', 'rejected');

-- Payment status enum
CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');

-- =============================================
-- PHASE 2: CREATE TABLES
-- =============================================

-- Profiles table (linked to auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    phone TEXT,
    is_blocked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User roles table (separate for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role public.app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, role)
);

-- Conditions table (medical conditions)
CREATE TABLE public.conditions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medicines table
CREATE TABLE public.medicines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    condition_id UUID REFERENCES public.conditions(id) ON DELETE SET NULL,
    salt_name TEXT,
    brand TEXT,
    dosage TEXT,
    prescription_required BOOLEAN DEFAULT FALSE,
    price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2),
    stock INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    image_url TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Addresses table
CREATE TABLE public.addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address_line TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status public.order_status DEFAULT 'pending_rx',
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    payment_status public.payment_status DEFAULT 'pending',
    address_id UUID REFERENCES public.addresses(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items table
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    medicine_id UUID REFERENCES public.medicines(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prescriptions table
CREATE TABLE public.prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    status public.prescription_status DEFAULT 'pending',
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- PHASE 3: SECURITY DEFINER FUNCTION FOR ROLE CHECK
-- =============================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- Function to check if user is admin or pharmacist
CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role IN ('admin', 'pharmacist')
    )
$$;

-- =============================================
-- PHASE 4: CREATE TRIGGERS FOR UPDATED_AT
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER conditions_updated_at
    BEFORE UPDATE ON public.conditions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER medicines_updated_at
    BEFORE UPDATE ON public.medicines
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER addresses_updated_at
    BEFORE UPDATE ON public.addresses
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER prescriptions_updated_at
    BEFORE UPDATE ON public.prescriptions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- PHASE 5: AUTO-CREATE PROFILE ON USER SIGNUP
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email));
    
    -- Assign default 'user' role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- PHASE 6: ENABLE RLS ON ALL TABLES
-- =============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PHASE 7: RLS POLICIES
-- =============================================

-- PROFILES POLICIES
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- USER_ROLES POLICIES
CREATE POLICY "Users can view own roles"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
    ON public.user_roles FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- CONDITIONS POLICIES (Public read, admin write)
CREATE POLICY "Anyone can view active conditions"
    ON public.conditions FOR SELECT
    USING (is_active = TRUE);

CREATE POLICY "Admins can view all conditions"
    ON public.conditions FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage conditions"
    ON public.conditions FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- MEDICINES POLICIES (Public read, admin write)
CREATE POLICY "Anyone can view active medicines"
    ON public.medicines FOR SELECT
    USING (is_active = TRUE);

CREATE POLICY "Admins can view all medicines"
    ON public.medicines FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage medicines"
    ON public.medicines FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- ADDRESSES POLICIES
CREATE POLICY "Users can view own addresses"
    ON public.addresses FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can create own addresses"
    ON public.addresses FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own addresses"
    ON public.addresses FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete own addresses"
    ON public.addresses FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Staff can view all addresses"
    ON public.addresses FOR SELECT
    TO authenticated
    USING (public.is_staff(auth.uid()));

-- ORDERS POLICIES
CREATE POLICY "Users can view own orders"
    ON public.orders FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can create own orders"
    ON public.orders FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Staff can view all orders"
    ON public.orders FOR SELECT
    TO authenticated
    USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update orders"
    ON public.orders FOR UPDATE
    TO authenticated
    USING (public.is_staff(auth.uid()));

-- ORDER_ITEMS POLICIES
CREATE POLICY "Users can view own order items"
    ON public.order_items FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id
            AND orders.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create order items for own orders"
    ON public.order_items FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id
            AND orders.user_id = auth.uid()
        )
    );

CREATE POLICY "Staff can view all order items"
    ON public.order_items FOR SELECT
    TO authenticated
    USING (public.is_staff(auth.uid()));

-- PRESCRIPTIONS POLICIES
CREATE POLICY "Users can view own prescriptions"
    ON public.prescriptions FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can upload prescriptions"
    ON public.prescriptions FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Staff can view all prescriptions"
    ON public.prescriptions FOR SELECT
    TO authenticated
    USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update prescriptions"
    ON public.prescriptions FOR UPDATE
    TO authenticated
    USING (public.is_staff(auth.uid()));

-- =============================================
-- PHASE 8: CREATE STORAGE BUCKETS
-- =============================================

-- Create prescriptions bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('prescriptions', 'prescriptions', FALSE);

-- Create medicine-images bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('medicine-images', 'medicine-images', TRUE);

-- Storage policies for prescriptions bucket
CREATE POLICY "Users can upload own prescriptions"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'prescriptions' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can view own prescriptions"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'prescriptions' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Staff can view all prescriptions"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'prescriptions' 
        AND public.is_staff(auth.uid())
    );

-- Storage policies for medicine-images bucket
CREATE POLICY "Anyone can view medicine images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'medicine-images');

CREATE POLICY "Admins can upload medicine images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'medicine-images' 
        AND public.has_role(auth.uid(), 'admin')
    );

CREATE POLICY "Admins can update medicine images"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'medicine-images' 
        AND public.has_role(auth.uid(), 'admin')
    );

CREATE POLICY "Admins can delete medicine images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'medicine-images' 
        AND public.has_role(auth.uid(), 'admin')
    );

-- =============================================
-- PHASE 9: SEED INITIAL CONDITIONS DATA
-- =============================================

INSERT INTO public.conditions (name, slug, description, icon, is_active) VALUES
('Cancer', 'cancer', 'Medications for cancer treatment and management', '🎗️', TRUE),
('Kidney Disease', 'kidney-disease', 'Medications for kidney disease treatment', '🫘', TRUE),
('Heart Disease', 'heart-disease', 'Medications for cardiovascular health', '❤️', TRUE),
('Diabetes', 'diabetes', 'Medications for diabetes management', '💉', TRUE),
('Liver Disease', 'liver-disease', 'Medications for liver conditions', '🫀', TRUE),
('Neurological', 'neurological', 'Medications for neurological conditions', '🧠', TRUE),
('Respiratory', 'respiratory', 'Medications for respiratory conditions', '🫁', TRUE),
('Autoimmune', 'autoimmune', 'Medications for autoimmune disorders', '🛡️', TRUE);