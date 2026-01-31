-- Create a sequence for order numbers starting at 1000
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START WITH 1000;

-- Add order_number column to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS order_number INTEGER UNIQUE DEFAULT nextval('public.order_number_seq');

-- Add rejection_reason column to orders table for storing rejection reasons
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Update existing orders to have sequential order numbers if they don't have one
UPDATE public.orders 
SET order_number = nextval('public.order_number_seq')
WHERE order_number IS NULL;