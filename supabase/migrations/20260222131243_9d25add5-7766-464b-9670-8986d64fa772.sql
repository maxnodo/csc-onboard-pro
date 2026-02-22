
-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE public.user_status AS ENUM (
  'pending_verification',
  'onboarding_started',
  'under_review',
  'approved_documentation',
  'expired_documentation',
  'rejected',
  'rejected_presencial',
  'active_final'
);

CREATE TYPE public.user_category AS ENUM (
  'distribuidor',
  'constructor',
  'emprendedor',
  'alcaldia'
);

CREATE TYPE public.app_role AS ENUM ('user', 'admin', 'approver', 'superadmin');

CREATE TYPE public.document_status AS ENUM (
  'pending',
  'uploaded',
  'under_review',
  'approved',
  'rejected'
);

-- ============================================
-- SEDES TABLE
-- ============================================
CREATE TABLE public.sedes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  estado_ubicacion TEXT NOT NULL,
  activa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sedes ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view sedes
CREATE POLICY "Anyone can view sedes" ON public.sedes FOR SELECT TO authenticated USING (true);

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  email TEXT,
  status public.user_status NOT NULL DEFAULT 'pending_verification',
  category public.user_category,
  onboarding_step INTEGER NOT NULL DEFAULT 0,
  sede_id UUID REFERENCES public.sedes(id),
  approved_documentation_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USER ROLES TABLE (separate from profiles)
-- ============================================
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SEDE ADMIN AUTHORIZATION (many-to-many)
-- ============================================
CREATE TABLE public.sede_admin_authorization (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sede_id UUID NOT NULL REFERENCES public.sedes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(admin_user_id, sede_id)
);

ALTER TABLE public.sede_admin_authorization ENABLE ROW LEVEL SECURITY;

-- ============================================
-- DOCUMENTS TABLE
-- ============================================
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_url TEXT,
  file_name TEXT,
  status public.document_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  category public.user_category NOT NULL,
  multiple BOOLEAN NOT NULL DEFAULT false,
  conditional BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- ============================================
-- FORM DATA TABLE
-- ============================================
CREATE TABLE public.form_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  form_data JSONB NOT NULL DEFAULT '{}',
  category public.user_category NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.form_data ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SEDE CHANGE HISTORY
-- ============================================
CREATE TABLE public.sede_change_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  sede_anterior_id UUID REFERENCES public.sedes(id),
  nueva_sede_id UUID NOT NULL REFERENCES public.sedes(id),
  motivo TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sede_change_history ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTIONS (SECURITY DEFINER)
-- ============================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'superadmin');
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_above()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'approver')
    OR public.has_role(auth.uid(), 'superadmin');
$$;

CREATE OR REPLACE FUNCTION public.is_admin_for_sede(_sede_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_superadmin() OR EXISTS (
    SELECT 1 FROM public.sede_admin_authorization
    WHERE admin_user_id = auth.uid() AND sede_id = _sede_id
  );
$$;

-- ============================================
-- RLS POLICIES
-- ============================================

-- PROFILES
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin_or_above());

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin_or_above());

-- USER ROLES
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_superadmin());

CREATE POLICY "Superadmin manages roles" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.is_superadmin());

CREATE POLICY "Superadmin updates roles" ON public.user_roles FOR UPDATE TO authenticated
  USING (public.is_superadmin());

CREATE POLICY "Superadmin deletes roles" ON public.user_roles FOR DELETE TO authenticated
  USING (public.is_superadmin());

-- SEDE ADMIN AUTHORIZATION
CREATE POLICY "View own authorizations" ON public.sede_admin_authorization FOR SELECT TO authenticated
  USING (admin_user_id = auth.uid() OR public.is_superadmin());

CREATE POLICY "Superadmin manages authorizations" ON public.sede_admin_authorization FOR INSERT TO authenticated
  WITH CHECK (public.is_superadmin());

CREATE POLICY "Superadmin deletes authorizations" ON public.sede_admin_authorization FOR DELETE TO authenticated
  USING (public.is_superadmin());

-- DOCUMENTS
CREATE POLICY "Users can view own documents" ON public.documents FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin_or_above());

CREATE POLICY "Users can insert own documents" ON public.documents FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own documents" ON public.documents FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin_or_above());

-- FORM DATA
CREATE POLICY "Users can view own form data" ON public.form_data FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin_or_above());

CREATE POLICY "Users can insert own form data" ON public.form_data FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own form data" ON public.form_data FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin_or_above());

-- SEDE CHANGE HISTORY
CREATE POLICY "View sede change history" ON public.sede_change_history FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin_or_above());

CREATE POLICY "Admins insert sede changes" ON public.sede_change_history FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_above());

-- ============================================
-- TRIGGER: auto-create profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, status)
  VALUES (NEW.id, NEW.email, 'pending_verification');

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- TRIGGER: update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_form_data_updated_at BEFORE UPDATE ON public.form_data FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- STORAGE BUCKET
-- ============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

CREATE POLICY "Users can upload own documents" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own documents" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'documents' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin_or_above()));

CREATE POLICY "Users can update own documents" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================
-- SEED DATA: 10 Sedes
-- ============================================
INSERT INTO public.sedes (nombre, estado_ubicacion) VALUES
  ('CSC Planta Pertigalete', 'Estado Anzoátegui'),
  ('CSC Planta Guayana', 'Estado Bolívar'),
  ('CSC Planta Maracaibo', 'Estado Zulia'),
  ('CSC Planta San Sebastián', 'Estado Aragua'),
  ('CSC Planta Tinaquillo', 'Estado Cojedes'),
  ('CSC Planta Barquisimeto', 'Estado Lara'),
  ('CSC Planta El Vigía', 'Estado Mérida'),
  ('CSC Planta Valencia', 'Estado Carabobo'),
  ('CSC Planta Barcelona', 'Estado Anzoátegui'),
  ('CSC Planta Puerto Ordaz', 'Estado Bolívar');
