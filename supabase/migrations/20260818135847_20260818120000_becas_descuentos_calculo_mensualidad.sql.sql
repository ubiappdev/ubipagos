/*
# Becas, descuentos y calculo automatico de mensualidades

## Resumen
1. Crea la tabla `tipos_beca` para almacenar los tipos de beca con sus porcentajes de descuento.
2. Agrega columnas `becado` (boolean) y `tipo_beca_id` (FK a tipos_beca) a la tabla `alumnos`.
3. Crea funcion `calcular_mensualidad_con_beca` que calcula el monto con descuento segun la beca activa.
4. Crea trigger que calcula automaticamente `monto_con_descuento` al insertar/actualizar mensualidades.
5. Actualiza mensualidades existentes con el descuento correcto.
6. Asigna beca academica (50%) al alumno demo.
7. Agrega politicas RLS para tipos_beca.

## Nuevas tablas
- `tipos_beca`: catalogo de tipos de beca (nombre, porcentaje_descuento, activo).

## Columnas modificadas
- `alumnos.becado` (boolean, default false): indica si el alumno es becado.
- `alumnos.tipo_beca_id` (uuid, FK a tipos_beca): tipo de beca asignado.

## Funciones y triggers
- `calcular_mensualidad_con_beca(p_alumno_id, p_monto_original)`: retorna el monto con descuento aplicado.
- Trigger `trg_calcular_descuento_mensualidad`: calcula `monto_con_descuento` automaticamente al insertar o actualizar `monto_original`.

## Seguridad
- RLS en `tipos_beca`: lectura para authenticated.
- Funcion SECURITY DEFINER con search_path = public.
- Revoca UPDATE sobre `becado` y `tipo_beca_id` en `alumnos` para que los alumnos no puedan auto-asignarse becas.
*/

-- ============================================================
-- 1. Tabla tipos_beca
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tipos_beca (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre varchar(100) NOT NULL,
  porcentaje_descuento numeric(5,2) NOT NULL DEFAULT 0,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 2. Columnas en alumnos: becado y tipo_beca_id
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='alumnos' AND column_name='becado'
  ) THEN
    ALTER TABLE public.alumnos ADD COLUMN becado boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='alumnos' AND column_name='tipo_beca_id'
  ) THEN
    ALTER TABLE public.alumnos ADD COLUMN tipo_beca_id uuid REFERENCES public.tipos_beca(id);
  END IF;
END $$;

-- ============================================================
-- 3. Seed tipos de beca
-- ============================================================
INSERT INTO public.tipos_beca (nombre, porcentaje_descuento, activo) VALUES
  ('Beca Academica', 50.00, true),
  ('Beca Deportiva', 30.00, true),
  ('Beca Socioeconomica', 80.00, true),
  ('Media Beca', 50.00, true),
  ('Sin Beca', 0.00, true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Funcion calcular_mensualidad_con_beca
-- ============================================================
CREATE OR REPLACE FUNCTION public.calcular_mensualidad_con_beca(
  p_alumno_id uuid,
  p_monto_original numeric
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_porcentaje numeric := 0;
BEGIN
  SELECT tb.porcentaje_descuento INTO v_porcentaje
  FROM public.alumnos a
  JOIN public.tipos_beca tb ON tb.id = a.tipo_beca_id
  WHERE a.id = p_alumno_id
    AND a.becado = true
    AND tb.activo = true
  LIMIT 1;

  IF v_porcentaje IS NULL THEN
    v_porcentaje := 0;
  END IF;

  RETURN ROUND(p_monto_original * (1 - v_porcentaje / 100), 2);
END;
$$;

-- ============================================================
-- 5. Trigger function para calculo automatico de descuento
-- ============================================================
CREATE OR REPLACE FUNCTION public.calcular_descuento_mensualidad_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.monto_con_descuento := public.calcular_mensualidad_con_beca(NEW.alumno_id, NEW.monto_original);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_calcular_descuento_mensualidad ON public.alumnos_mensualidades;
CREATE TRIGGER trg_calcular_descuento_mensualidad
  BEFORE INSERT OR UPDATE OF monto_original ON public.alumnos_mensualidades
  FOR EACH ROW
  EXECUTE FUNCTION public.calcular_descuento_mensualidad_trigger();

-- ============================================================
-- 6. Asignar beca academica (50%) al alumno demo
-- ============================================================
UPDATE public.alumnos
SET becado = true,
    tipo_beca_id = (SELECT id FROM public.tipos_beca WHERE nombre = 'Beca Academica' LIMIT 1)
WHERE correo_electronico = 'demo@ubi.edu.bo';

-- ============================================================
-- 7. Actualizar mensualidades existentes con el descuento correcto
-- ============================================================
UPDATE public.alumnos_mensualidades m
SET monto_con_descuento = public.calcular_mensualidad_con_beca(m.alumno_id, m.monto_original);

-- ============================================================
-- 8. RLS en tipos_beca
-- ============================================================
ALTER TABLE public.tipos_beca ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_read_tipos_beca" ON public.tipos_beca;
CREATE POLICY "auth_read_tipos_beca" ON public.tipos_beca FOR SELECT
  TO authenticated USING (true);

-- ============================================================
-- 9. Proteger columnas becado y tipo_beca_id (solo admin/funcion puede modificarlas)
-- ============================================================
REVOKE UPDATE (becado, tipo_beca_id) ON public.alumnos FROM authenticated, anon;
