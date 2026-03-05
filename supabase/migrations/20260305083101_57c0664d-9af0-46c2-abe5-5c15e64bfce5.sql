
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL DEFAULT 'true',
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings
CREATE POLICY "Anyone can view site settings" ON public.site_settings FOR SELECT USING (true);

-- Only staff can manage settings
CREATE POLICY "Staff can manage site settings" ON public.site_settings FOR ALL USING (is_staff(auth.uid()));

-- Insert default setting for clinic button
INSERT INTO public.site_settings (key, value) VALUES ('clinic_button_enabled', 'true');
