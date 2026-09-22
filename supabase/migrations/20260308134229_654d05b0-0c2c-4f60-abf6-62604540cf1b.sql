
-- ============================================================
-- FIX: Recreate all policies as PERMISSIVE (default type)
-- The previous policies were RESTRICTIVE (denying all access)
-- ============================================================

-- ── profiles ────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ── bookings ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can manage own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Public can insert bookings" ON public.bookings;

CREATE POLICY "Users can manage own bookings"
  ON public.bookings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can insert bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (true);

-- ── clients ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can manage own clients" ON public.clients;

CREATE POLICY "Users can manage own clients"
  ON public.clients FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── invoices ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can manage own invoices" ON public.invoices;

CREATE POLICY "Users can manage own invoices"
  ON public.invoices FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── invoice_items ────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can manage own invoice items" ON public.invoice_items;

CREATE POLICY "Users can manage own invoice items"
  ON public.invoice_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = invoice_items.invoice_id
        AND invoices.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = invoice_items.invoice_id
        AND invoices.user_id = auth.uid()
    )
  );

-- ── team_members ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can manage own team" ON public.team_members;

CREATE POLICY "Users can manage own team"
  ON public.team_members FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Restore missing database triggers ────────────────────────
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_profile_business_name_change ON public.profiles;
DROP TRIGGER IF EXISTS set_updated_at_bookings ON public.bookings;
DROP TRIGGER IF EXISTS set_updated_at_clients ON public.clients;
DROP TRIGGER IF EXISTS set_updated_at_invoices ON public.invoices;
DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
DROP TRIGGER IF EXISTS set_updated_at_team_members ON public.team_members;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_profile_business_name_change
  BEFORE INSERT OR UPDATE OF business_name ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.generate_business_slug();

CREATE TRIGGER set_updated_at_bookings
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_clients
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_invoices
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_team_members
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
