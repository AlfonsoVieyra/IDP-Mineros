-- Habilitar extensión UUID si no existe (normalmente ya está)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================
-- CONFIGURACIÓN DE STORAGE BUCKET "avatars"
-- =========================================================================

-- 1. Insertar el bucket si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars', 
    'avatars', 
    true, -- Es público para que las imágenes de perfil se vean sin problemas
    5242880, -- Límite de 5MB por imagen
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE 
SET public = true, 
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];


-- =========================================================================
-- POLÍTICAS RLS PARA EL BUCKET "avatars"
-- =========================================================================

-- Asegurarnos de que el RLS está activado en objects (Supabase lo hace por defecto)
-- (Removido ALTER TABLE para evitar error 42501)

-- Política 1: Cualquiera puede ver/descargar los avatares (porque el bucket es público)
CREATE POLICY "Avatars son publicos" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

-- Política 2: Usuarios autenticados (entrenadores) pueden subir (INSERT) avatares
CREATE POLICY "Entrenadores pueden subir avatares" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (
    bucket_id = 'avatars' 
    AND (auth.role() = 'authenticated')
);

-- Política 3: Usuarios autenticados pueden actualizar/reemplazar (UPDATE) sus avatares
CREATE POLICY "Entrenadores pueden actualizar avatares" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (
    bucket_id = 'avatars' 
    AND (auth.role() = 'authenticated')
);

-- Política 4: Usuarios autenticados pueden eliminar (DELETE) avatares
CREATE POLICY "Entrenadores pueden borrar avatares" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (
    bucket_id = 'avatars' 
    AND (auth.role() = 'authenticated')
);
