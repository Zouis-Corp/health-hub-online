-- Add new columns to addresses table for Line 2 and Landmark
ALTER TABLE public.addresses 
ADD COLUMN IF NOT EXISTS address_line_2 TEXT,
ADD COLUMN IF NOT EXISTS landmark TEXT;

-- Rename address_line to address_line_1 for clarity
ALTER TABLE public.addresses 
RENAME COLUMN address_line TO address_line_1;