/*
# Buzon de mensajes, OCR data, storage buckets, and RLS policies

## Resumen
1. Crea la tabla `buzon_mensajes` para el buzon de comunicados a alumnos.
2. Agrega columna `ocr_data` (jsonb) a `alumnos_pagos` para guardar el resultado del OCR+IA.
3. Crea bucket de Storage para comprobantes de pago.
4. Establece politicas RLS owner-scoped en todas las tablas relevantes.

## Nuevas tablas y columnas
- `buzon_mensajes`: comunicados dirigidos a alumnos (titulo, cuerpo, tipo, leido).
- `alumnos_pagos.ocr_data` (jsonb): resultado del analisis OCR+IA del comprobante.

## Cambios de seguridad (RLS)
- Politicas owner-scoped en `alumnos`, `alumnos_pagos`, `alumnos_mensualidades`, `buzon_mensajes`.
- Politicas de lectura en tablas de referencia (`carreras`, `aranceles_conceptos`, etc.).
- Politicas de Storage para que cada alumno solo gestione sus propios comprobantes.
*/

-- ============================================================
-- 1. Tabla buzon_mensajes
-- ============================================================
CREATE TABLE IF NOT EXISTS public.buzon_mensajes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id uuid REFERENCES public.alumnos(id) ON DELETE CASCADE,
  titulo varchar(200) NOT NULL,
  cuerpo text NOT NULL,
  tipo varchar(30) NOT NULL DEFAULT 'PAGO',
  leido boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.buzon_mensajes ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. Columna ocr_data en alumnos_pagos
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='alumnos_pagos' AND column_name='ocr_data'
  ) THEN
    ALTER TABLE public.alumnos_pagos ADD COLUMN ocr_data jsonb;
  END IF;
END $$;

-- ============================================================
-- 3. RLS Policies - tablas de referencia (lectura para autenticados)
-- ============================================================
DROP POLICY IF EXISTS "auth_read_carreras" ON public.carreras;
CREATE POLICY "auth_read_carreras" ON public.carreras FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_read_aranceles" ON public.aranceles_conceptos;
CREATE POLICY "auth_read_aranceles" ON public.aranceles_conceptos FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_read_cursos" ON public.cursos;
CREATE POLICY "auth_read_cursos" ON public.cursos FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_read_turnos" ON public.turnos;
CREATE POLICY "auth_read_turnos" ON public.turnos FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_read_own_perfil" ON public.perfiles;
CREATE POLICY "auth_read_own_perfil" ON public.perfiles FOR SELECT
  TO authenticated USING (auth.uid() = auth_id);

-- ============================================================
-- 4. RLS Policies - alumnos (owner-scoped via perfiles.auth_id)
-- ============================================================
DROP POLICY IF EXISTS "auth_select_own_alumno" ON public.alumnos;
CREATE POLICY "auth_select_own_alumno" ON public.alumnos FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.perfiles p WHERE p.id = alumnos.perfil_id AND p.auth_id = auth.uid())
  );

DROP POLICY IF EXISTS "auth_update_own_alumno" ON public.alumnos;
CREATE POLICY "auth_update_own_alumno" ON public.alumnos FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.perfiles p WHERE p.id = alumnos.perfil_id AND p.auth_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.perfiles p WHERE p.id = alumnos.perfil_id AND p.auth_id = auth.uid())
  );

-- ============================================================
-- 5. RLS Policies - alumnos_mensualidades (owner-scoped)
-- ============================================================
DROP POLICY IF EXISTS "auth_select_own_mensualidades" ON public.alumnos_mensualidades;
CREATE POLICY "auth_select_own_mensualidades" ON public.alumnos_mensualidades FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.alumnos a JOIN public.perfiles p ON p.id = a.perfil_id
     WHERE a.id = alumnos_mensualidades.alumno_id AND p.auth_id = auth.uid())
  );

-- ============================================================
-- 6. RLS Policies - alumnos_pagos (owner-scoped)
-- ============================================================
DROP POLICY IF EXISTS "auth_select_own_pagos" ON public.alumnos_pagos;
CREATE POLICY "auth_select_own_pagos" ON public.alumnos_pagos FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.alumnos a JOIN public.perfiles p ON p.id = a.perfil_id
     WHERE a.id = alumnos_pagos.alumno_id AND p.auth_id = auth.uid())
  );

DROP POLICY IF EXISTS "auth_insert_own_pagos" ON public.alumnos_pagos;
CREATE POLICY "auth_insert_own_pagos" ON public.alumnos_pagos FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.alumnos a JOIN public.perfiles p ON p.id = a.perfil_id
     WHERE a.id = alumnos_pagos.alumno_id AND p.auth_id = auth.uid())
  );

DROP POLICY IF EXISTS "auth_update_own_pagos" ON public.alumnos_pagos;
CREATE POLICY "auth_update_own_pagos" ON public.alumnos_pagos FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.alumnos a JOIN public.perfiles p ON p.id = a.perfil_id
     WHERE a.id = alumnos_pagos.alumno_id AND p.auth_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.alumnos a JOIN public.perfiles p ON p.id = a.perfil_id
     WHERE a.id = alumnos_pagos.alumno_id AND p.auth_id = auth.uid())
  );

-- ============================================================
-- 7. RLS Policies - buzon_mensajes (owner-scoped)
-- ============================================================
DROP POLICY IF EXISTS "auth_select_own_buzon" ON public.buzon_mensajes;
CREATE POLICY "auth_select_own_buzon" ON public.buzon_mensajes FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.alumnos a JOIN public.perfiles p ON p.id = a.perfil_id
     WHERE a.id = buzon_mensajes.alumno_id AND p.auth_id = auth.uid())
  );

DROP POLICY IF EXISTS "auth_update_own_buzon" ON public.buzon_mensajes;
CREATE POLICY "auth_update_own_buzon" ON public.buzon_mensajes FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.alumnos a JOIN public.perfiles p ON p.id = a.perfil_id
     WHERE a.id = buzon_mensajes.alumno_id AND p.auth_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.alumnos a JOIN public.perfiles p ON p.id = a.perfil_id
     WHERE a.id = buzon_mensajes.alumno_id AND p.auth_id = auth.uid())
  );

-- ============================================================
-- 8. Storage bucket for comprobantes
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('comprobantes', 'comprobantes', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "auth_read_own_comprobantes" ON storage.objects;
CREATE POLICY "auth_read_own_comprobantes" ON storage.objects FOR SELECT
  TO authenticated USING (
    bucket_id = 'comprobantes'
    AND EXISTS (
      SELECT 1 FROM public.alumnos a
      JOIN public.perfiles p ON p.id = a.perfil_id
      WHERE p.auth_id = auth.uid()
      AND (storage.foldername(name))[1] = a.id::text
    )
  );

DROP POLICY IF EXISTS "auth_insert_own_comprobantes" ON storage.objects;
CREATE POLICY "auth_insert_own_comprobantes" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (
    bucket_id = 'comprobantes'
    AND EXISTS (
      SELECT 1 FROM public.alumnos a
      JOIN public.perfiles p ON p.id = a.perfil_id
      WHERE p.auth_id = auth.uid()
      AND (storage.foldername(name))[1] = a.id::text
    )
  );

-- ============================================================
-- 9. Funcion para vincular auth_id al perfil al registrarse
-- ============================================================
CREATE OR REPLACE FUNCTION public.vincular_perfil_auth(p_correo text, p_auth_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.perfiles
  SET auth_id = p_auth_id
  WHERE correo = p_correo;
END;
$$;

GRANT EXECUTE ON FUNCTION public.vincular_perfil_auth(text, uuid) TO authenticated;
