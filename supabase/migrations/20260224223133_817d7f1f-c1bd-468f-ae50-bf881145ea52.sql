
-- Add business_slug to profiles for public booking page lookup
ALTER TABLE public.profiles ADD COLUMN business_slug text UNIQUE;

-- Create index for fast slug lookup
CREATE INDEX idx_profiles_business_slug ON public.profiles(business_slug);

-- Allow anonymous users to read profiles by slug (for public booking page)
CREATE POLICY "Anyone can read profiles by slug"
ON public.profiles
FOR SELECT
USING (business_slug IS NOT NULL);

-- Auto-generate slug from business_name on profile creation/update
CREATE OR REPLACE FUNCTION public.generate_business_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  IF NEW.business_name IS NOT NULL AND (OLD IS NULL OR OLD.business_name IS DISTINCT FROM NEW.business_name OR OLD.business_slug IS NULL) THEN
    base_slug := lower(regexp_replace(trim(NEW.business_name), '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := trim(both '-' from base_slug);
    final_slug := base_slug;
    LOOP
      IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE business_slug = final_slug AND id != NEW.id) THEN
        EXIT;
      END IF;
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;
    NEW.business_slug := final_slug;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER generate_slug_on_profile
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.generate_business_slug();

-- Update existing profiles to generate slugs
UPDATE public.profiles SET business_slug = NULL WHERE business_slug IS NULL;
