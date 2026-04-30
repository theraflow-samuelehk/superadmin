
-- Add booking fields to profiles
ALTER TABLE public.profiles ADD COLUMN booking_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN booking_slug text;
ALTER TABLE public.profiles ADD COLUMN salon_name text;

-- Create unique index on booking_slug (only for non-null values)
CREATE UNIQUE INDEX idx_profiles_booking_slug ON public.profiles(booking_slug) WHERE booking_slug IS NOT NULL;

-- Allow anonymous users to read profiles with booking enabled (for public booking page)
CREATE POLICY "Anyone can view booking-enabled profiles"
ON public.profiles FOR SELECT
USING (booking_enabled = true AND booking_slug IS NOT NULL);
