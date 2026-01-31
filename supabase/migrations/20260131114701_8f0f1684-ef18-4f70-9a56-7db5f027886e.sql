-- Create product type enum
CREATE TYPE product_type AS ENUM ('medicine', 'wellness');

-- Add type column to medicines table (we'll keep using medicines as the products table)
ALTER TABLE public.medicines 
ADD COLUMN type product_type NOT NULL DEFAULT 'medicine';

-- Create molecules table (for salt names)
CREATE TABLE public.molecules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create super_specialities table
CREATE TABLE public.super_specialities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create product_conditions junction table (many-to-many)
CREATE TABLE public.product_conditions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.medicines(id) ON DELETE CASCADE,
  condition_id UUID NOT NULL REFERENCES public.conditions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(product_id, condition_id)
);

-- Create product_molecules junction table (many-to-many)
CREATE TABLE public.product_molecules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.medicines(id) ON DELETE CASCADE,
  molecule_id UUID NOT NULL REFERENCES public.molecules(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(product_id, molecule_id)
);

-- Create product_specialities junction table (many-to-many)
CREATE TABLE public.product_specialities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.medicines(id) ON DELETE CASCADE,
  speciality_id UUID NOT NULL REFERENCES public.super_specialities(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(product_id, speciality_id)
);

-- Enable RLS on all new tables
ALTER TABLE public.molecules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.super_specialities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_molecules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_specialities ENABLE ROW LEVEL SECURITY;

-- Policies for molecules
CREATE POLICY "Anyone can view active molecules" ON public.molecules
  FOR SELECT USING (is_active = true);

CREATE POLICY "Staff can manage molecules" ON public.molecules
  FOR ALL USING (is_staff(auth.uid()));

-- Policies for super_specialities
CREATE POLICY "Anyone can view active super_specialities" ON public.super_specialities
  FOR SELECT USING (is_active = true);

CREATE POLICY "Staff can manage super_specialities" ON public.super_specialities
  FOR ALL USING (is_staff(auth.uid()));

-- Policies for junction tables (read for everyone, write for staff)
CREATE POLICY "Anyone can view product_conditions" ON public.product_conditions
  FOR SELECT USING (true);

CREATE POLICY "Staff can manage product_conditions" ON public.product_conditions
  FOR ALL USING (is_staff(auth.uid()));

CREATE POLICY "Anyone can view product_molecules" ON public.product_molecules
  FOR SELECT USING (true);

CREATE POLICY "Staff can manage product_molecules" ON public.product_molecules
  FOR ALL USING (is_staff(auth.uid()));

CREATE POLICY "Anyone can view product_specialities" ON public.product_specialities
  FOR SELECT USING (true);

CREATE POLICY "Staff can manage product_specialities" ON public.product_specialities
  FOR ALL USING (is_staff(auth.uid()));

-- Add triggers for updated_at
CREATE TRIGGER update_molecules_updated_at
  BEFORE UPDATE ON public.molecules
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_super_specialities_updated_at
  BEFORE UPDATE ON public.super_specialities
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for better query performance
CREATE INDEX idx_product_conditions_product ON public.product_conditions(product_id);
CREATE INDEX idx_product_conditions_condition ON public.product_conditions(condition_id);
CREATE INDEX idx_product_molecules_product ON public.product_molecules(product_id);
CREATE INDEX idx_product_molecules_molecule ON public.product_molecules(molecule_id);
CREATE INDEX idx_product_specialities_product ON public.product_specialities(product_id);
CREATE INDEX idx_product_specialities_speciality ON public.product_specialities(speciality_id);
CREATE INDEX idx_medicines_type ON public.medicines(type);
CREATE INDEX idx_molecules_slug ON public.molecules(slug);
CREATE INDEX idx_super_specialities_slug ON public.super_specialities(slug);