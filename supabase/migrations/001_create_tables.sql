-- ============================================
-- FAMILY TREE APP — Database Schema
-- Multi-family, Private Access
-- ============================================
-- PETUNJUK PENGGUNAAN:
-- 1. Buka Supabase Dashboard → SQL Editor
-- 2. Salin (copy) SELURUH isi file ini
-- 3. Tempel (paste) di SQL Editor
-- 4. Klik "Run" untuk menjalankan
-- 5. Setelah selesai, lanjut ke LANGKAH STORAGE di bawah
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: families
-- Grup keluarga besar (contoh: "Keluarga Juniarto")
-- ============================================
CREATE TABLE IF NOT EXISTS public.families (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  description   TEXT,
  created_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: family_access
-- Mengatur akun mana yang boleh mengakses keluarga mana
-- role: 'admin' = bisa edit/hapus, 'editor' = bisa tambah/edit, 'viewer' = hanya lihat
-- ============================================
CREATE TABLE IF NOT EXISTS public.family_access (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id     UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  role          TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, family_id)
);

-- ============================================
-- TABLE: family_members
-- Data lengkap setiap anggota keluarga
-- ============================================
CREATE TABLE IF NOT EXISTS public.family_members (
  -- Primary key
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Keluarga mana
  family_id     UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,

  -- Informasi pribadi
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

  -- Foto — menyimpan URL publik dari Supabase Storage
  photo_url     TEXT,

  -- Lokasi (alamat + koordinat untuk peta)
  address       TEXT,
  latitude      DOUBLE PRECISION,
  longitude     DOUBLE PRECISION,

  -- Hubungan keluarga
  father_id     UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
  mother_id     UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
  spouse_id     UUID REFERENCES public.family_members(id) ON DELETE SET NULL,

  -- Nomor generasi (1 = kakek/nenek tertua, 2 = anak, 3 = cucu, dst.)
  generation    INTEGER DEFAULT 1,

  -- Metadata
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  created_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ============================================
-- INDEXES — mempercepat pencarian dan query
-- ============================================
CREATE INDEX IF NOT EXISTS idx_family_members_family   ON public.family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_family_members_father   ON public.family_members(father_id);
CREATE INDEX IF NOT EXISTS idx_family_members_mother   ON public.family_members(mother_id);
CREATE INDEX IF NOT EXISTS idx_family_members_spouse   ON public.family_members(spouse_id);
CREATE INDEX IF NOT EXISTS idx_family_members_name     ON public.family_members(full_name);
CREATE INDEX IF NOT EXISTS idx_family_members_gen      ON public.family_members(generation);
CREATE INDEX IF NOT EXISTS idx_family_members_alive    ON public.family_members(is_alive);
CREATE INDEX IF NOT EXISTS idx_family_access_user      ON public.family_access(user_id);
CREATE INDEX IF NOT EXISTS idx_family_access_family    ON public.family_access(family_id);

-- ============================================
-- UPDATED_AT TRIGGER — auto-update waktu edit
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS families_updated_at ON public.families;
CREATE TRIGGER families_updated_at
  BEFORE UPDATE ON public.families
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS family_members_updated_at ON public.family_members;
CREATE TRIGGER family_members_updated_at
  BEFORE UPDATE ON public.family_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- HELPER FUNCTION: Cek akses keluarga
-- (SECURITY DEFINER untuk menghindari loop RLS)
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

DROP POLICY IF EXISTS "Users can view families they have access to" ON public.families;
CREATE POLICY "Users can view families they have access to"
  ON public.families FOR SELECT
  USING (
    auth.role() = 'authenticated' 
    AND has_family_access(id, 'viewer')
  );

DROP POLICY IF EXISTS "Authenticated users can create families" ON public.families;
CREATE POLICY "Authenticated users can create families"
  ON public.families FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Family admins can update" ON public.families;
CREATE POLICY "Family admins can update"
  ON public.families FOR UPDATE
  USING (has_family_access(id, 'admin'))
  WITH CHECK (has_family_access(id, 'admin'));

DROP POLICY IF EXISTS "Family admins can delete" ON public.families;
CREATE POLICY "Family admins can delete"
  ON public.families FOR DELETE
  USING (has_family_access(id, 'admin'));

-- ============================================
-- ROW LEVEL SECURITY: family_access
-- ============================================
ALTER TABLE public.family_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own access" ON public.family_access;
CREATE POLICY "Users can view their own access"
  ON public.family_access FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Family admins can view all access for their families" ON public.family_access;
CREATE POLICY "Family admins can view all access for their families"
  ON public.family_access FOR SELECT
  USING (has_family_access(family_id, 'admin'));

DROP POLICY IF EXISTS "Family admins can manage access" ON public.family_access;
CREATE POLICY "Family admins can manage access"
  ON public.family_access FOR INSERT
  WITH CHECK (has_family_access(family_id, 'admin'));

DROP POLICY IF EXISTS "Family admins can update access" ON public.family_access;
CREATE POLICY "Family admins can update access"
  ON public.family_access FOR UPDATE
  USING (has_family_access(family_id, 'admin'))
  WITH CHECK (has_family_access(family_id, 'admin'));

DROP POLICY IF EXISTS "Family admins can remove access" ON public.family_access;
CREATE POLICY "Family admins can remove access"
  ON public.family_access FOR DELETE
  USING (has_family_access(family_id, 'admin'));

-- ============================================
-- ROW LEVEL SECURITY: family_members
-- ============================================
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view members of their families" ON public.family_members;
CREATE POLICY "Users can view members of their families"
  ON public.family_members FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND has_family_access(family_id, 'viewer')
  );

DROP POLICY IF EXISTS "Editors can insert members" ON public.family_members;
CREATE POLICY "Editors can insert members"
  ON public.family_members FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND has_family_access(family_id, 'editor')
  );

DROP POLICY IF EXISTS "Editors can update members" ON public.family_members;
CREATE POLICY "Editors can update members"
  ON public.family_members FOR UPDATE
  USING (has_family_access(family_id, 'editor'))
  WITH CHECK (has_family_access(family_id, 'editor'));

DROP POLICY IF EXISTS "Admins can delete members" ON public.family_members;
CREATE POLICY "Admins can delete members"
  ON public.family_members FOR DELETE
  USING (has_family_access(family_id, 'admin'));

-- ============================================
-- FUNCTION: Ambil silsilah keluarga (filter generasi)
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
-- FUNCTION: Cari anggota keluarga
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
-- AUTO-GRANT: Pembuat keluarga otomatis jadi admin
-- ============================================
CREATE OR REPLACE FUNCTION auto_grant_family_admin()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.family_access (user_id, family_id, role)
  VALUES (NEW.created_by, NEW.id, 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS grant_creator_admin ON public.families;
CREATE TRIGGER grant_creator_admin
  AFTER INSERT ON public.families
  FOR EACH ROW
  WHEN (NEW.created_by IS NOT NULL)
  EXECUTE FUNCTION auto_grant_family_admin();

-- ============================================
-- STORAGE: Buat bucket untuk foto keluarga
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'family-photos',
  'family-photos',
  true,
  5242880,  -- 5MB maks per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- ============================================
-- STORAGE POLICIES: Izinkan upload & akses foto
-- ============================================
-- Semua orang bisa melihat foto (bucket public)
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
CREATE POLICY "Public read access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'family-photos');

-- User yang login bisa upload foto
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
CREATE POLICY "Authenticated users can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'family-photos'
    AND auth.role() = 'authenticated'
  );

-- User yang login bisa update fotonya sendiri
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
CREATE POLICY "Authenticated users can update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'family-photos'
    AND auth.role() = 'authenticated'
  );

-- User yang login bisa hapus foto
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;
CREATE POLICY "Authenticated users can delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'family-photos'
    AND auth.role() = 'authenticated'
  );
