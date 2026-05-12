-- ============================================
-- FAMILY TREE APP — Database Schema
-- Multi-family, Private Access
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: families
-- Represents a family group/clan
-- ============================================
CREATE TABLE public.families (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  description   TEXT,
  created_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: family_access
-- Controls which users can access which families
-- ============================================
CREATE TABLE public.family_access (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id     UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  role          TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, family_id)
);

-- ============================================
-- TABLE: family_members
-- Core table for family tree members
-- ============================================
CREATE TABLE public.family_members (
  -- Primary key
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Family group
  family_id     UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,

  -- Personal information
  full_name     TEXT NOT NULL,
  nickname      TEXT,
  gender        TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  birth_place   TEXT,
  birth_date    DATE,
  death_date    DATE,
  is_alive      BOOLEAN DEFAULT TRUE,
  biography     TEXT,
  phone         TEXT,
  email         TEXT,

  -- Photo (Supabase Storage path)
  photo_url     TEXT,

  -- Location data
  address       TEXT,
  latitude      DOUBLE PRECISION,
  longitude     DOUBLE PRECISION,

  -- Family hierarchy
  father_id     UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
  mother_id     UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
  spouse_id     UUID REFERENCES public.family_members(id) ON DELETE SET NULL,

  -- Generation tracking (1 = oldest ancestor)
  generation    INTEGER DEFAULT 1,

  -- Metadata
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  created_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_family_members_family   ON public.family_members(family_id);
CREATE INDEX idx_family_members_father   ON public.family_members(father_id);
CREATE INDEX idx_family_members_mother   ON public.family_members(mother_id);
CREATE INDEX idx_family_members_spouse   ON public.family_members(spouse_id);
CREATE INDEX idx_family_members_name     ON public.family_members(full_name);
CREATE INDEX idx_family_members_gen      ON public.family_members(generation);
CREATE INDEX idx_family_members_alive    ON public.family_members(is_alive);
CREATE INDEX idx_family_access_user      ON public.family_access(user_id);
CREATE INDEX idx_family_access_family    ON public.family_access(family_id);

-- Full-text search index (Indonesian)
CREATE INDEX idx_family_members_search ON public.family_members 
  USING GIN (to_tsvector('indonesian', 
    coalesce(full_name, '') || ' ' || 
    coalesce(nickname, '') || ' ' || 
    coalesce(birth_place, '')
  ));

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER families_updated_at
  BEFORE UPDATE ON public.families
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER family_members_updated_at
  BEFORE UPDATE ON public.family_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- HELPER FUNCTION: Check family access
-- (SECURITY DEFINER to avoid RLS recursion)
-- ============================================
CREATE OR REPLACE FUNCTION has_family_access(check_family_id UUID, min_role TEXT DEFAULT 'viewer')
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.family_access
    WHERE user_id = auth.uid()
      AND family_id = check_family_id
      AND (
        CASE min_role
          WHEN 'viewer' THEN role IN ('viewer', 'editor', 'admin')
          WHEN 'editor' THEN role IN ('editor', 'admin')
          WHEN 'admin'  THEN role = 'admin'
          ELSE false
        END
      )
  );
END;
$$;

-- ============================================
-- ROW LEVEL SECURITY: families
-- ============================================
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view families they have access to"
  ON public.families FOR SELECT
  USING (
    auth.role() = 'authenticated' 
    AND has_family_access(id, 'viewer')
  );

CREATE POLICY "Authenticated users can create families"
  ON public.families FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Family admins can update"
  ON public.families FOR UPDATE
  USING (has_family_access(id, 'admin'))
  WITH CHECK (has_family_access(id, 'admin'));

CREATE POLICY "Family admins can delete"
  ON public.families FOR DELETE
  USING (has_family_access(id, 'admin'));

-- ============================================
-- ROW LEVEL SECURITY: family_access
-- ============================================
ALTER TABLE public.family_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own access"
  ON public.family_access FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Family admins can view all access for their families"
  ON public.family_access FOR SELECT
  USING (has_family_access(family_id, 'admin'));

CREATE POLICY "Family admins can manage access"
  ON public.family_access FOR INSERT
  WITH CHECK (has_family_access(family_id, 'admin'));

CREATE POLICY "Family admins can update access"
  ON public.family_access FOR UPDATE
  USING (has_family_access(family_id, 'admin'))
  WITH CHECK (has_family_access(family_id, 'admin'));

CREATE POLICY "Family admins can remove access"
  ON public.family_access FOR DELETE
  USING (has_family_access(family_id, 'admin'));

-- ============================================
-- ROW LEVEL SECURITY: family_members
-- ============================================
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view members of their families"
  ON public.family_members FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND has_family_access(family_id, 'viewer')
  );

CREATE POLICY "Editors can insert members"
  ON public.family_members FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND has_family_access(family_id, 'editor')
  );

CREATE POLICY "Editors can update members"
  ON public.family_members FOR UPDATE
  USING (has_family_access(family_id, 'editor'))
  WITH CHECK (has_family_access(family_id, 'editor'));

CREATE POLICY "Admins can delete members"
  ON public.family_members FOR DELETE
  USING (has_family_access(family_id, 'admin'));

-- ============================================
-- FUNCTION: Get family tree (with generation filter)
-- ============================================
CREATE OR REPLACE FUNCTION get_family_tree(
  p_family_id UUID,
  p_min_gen INTEGER DEFAULT NULL,
  p_max_gen INTEGER DEFAULT NULL
)
RETURNS SETOF public.family_members
LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.family_members
  WHERE family_id = p_family_id
    AND (p_min_gen IS NULL OR generation >= p_min_gen)
    AND (p_max_gen IS NULL OR generation <= p_max_gen)
  ORDER BY generation, birth_date;
END;
$$;

-- ============================================
-- FUNCTION: Search family members
-- ============================================
CREATE OR REPLACE FUNCTION search_family_members(
  p_family_id UUID,
  p_query TEXT
)
RETURNS SETOF public.family_members
LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.family_members
  WHERE family_id = p_family_id
    AND (
      full_name ILIKE '%' || p_query || '%'
      OR nickname ILIKE '%' || p_query || '%'
      OR birth_place ILIKE '%' || p_query || '%'
    )
  ORDER BY full_name
  LIMIT 20;
END;
$$;

-- ============================================
-- AUTO-GRANT: Creator gets admin access
-- ============================================
CREATE OR REPLACE FUNCTION auto_grant_family_admin()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.family_access (user_id, family_id, role)
  VALUES (NEW.created_by, NEW.id, 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER grant_creator_admin
  AFTER INSERT ON public.families
  FOR EACH ROW
  WHEN (NEW.created_by IS NOT NULL)
  EXECUTE FUNCTION auto_grant_family_admin();

-- ============================================
-- STORAGE BUCKET (run in Supabase Dashboard)
-- ============================================
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('family-photos', 'family-photos', true);
