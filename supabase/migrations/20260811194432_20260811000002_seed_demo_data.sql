/*
# Seed data: carreras, cursos, turnos, aranceles, alumno demo, mensualidades, pagos y buzon

## Resumen
Inserta datos semilla para que la app funcione end-to-end:
1. Carreras, cursos, turnos y aranceles de referencia.
2. Perfil del alumno demo (vinculado al auth user creado previamente).
3. Alumno demo con sus mensualidades 2026 (Enero-Julio).
4. Pagos historicos aprobados (Enero-Mayo), un pago pendiente (Junio) y un rechazado.
5. Mensajes del buzon para el alumno demo.

## Datos del alumno demo
- Correo: demo@ubi.edu.bo
- Contrasena: Demo1234!
- Auth ID: bd8f36e5-98ac-48db-aaf9-44f021bf9e14
*/

-- ============================================================
-- 1. Carreras, cursos, turnos
-- ============================================================
INSERT INTO public.carreras (codigo, carrera, nivel, anos) VALUES
  ('SIS', 'Ingenieria de Sistemas', 'LICENCIATURA', 5),
  ('ADM', 'Administracion de Empresas', 'LICENCIATURA', 5),
  ('CON', 'Contaduria Publica', 'LICENCIATURA', 5),
  ('DER', 'Derecho', 'LICENCIATURA', 5),
  ('ARQ', 'Arquitectura', 'LICENCIATURA', 5)
ON CONFLICT DO NOTHING;

INSERT INTO public.cursos (codigo_curso, nombre_curso, orden) VALUES
  ('CUR-2026-1', 'Primer Curso 2026', 1),
  ('CUR-2026-2', 'Segundo Curso 2026', 2),
  ('CUR-2026-3', 'Tercer Curso 2026', 3)
ON CONFLICT DO NOTHING;

INSERT INTO public.turnos (codigo, nombre_turno) VALUES
  ('M', 'Matutino'),
  ('V', 'Vespertino'),
  ('N', 'Nocturno')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 2. Aranceles conceptos
-- ============================================================
INSERT INTO public.aranceles_conceptos (codigo, concepto, categoria, monto, activo) VALUES
  ('MAT-SEM', 'Matricula Semestral', 'MATRICULA', 350, true),
  ('CERT-NOT', 'Certificado de Notas', 'CERTIFICADO', 100, true),
  ('TRAM-GRAD', 'Tramite de Graduacion', 'GRADUACION', 1200, true),
  ('CART-REC', 'Carta de Recomendacion', 'CERTIFICADO', 80, true),
  ('CERT-EGRE', 'Certificado de Egreso', 'CERTIFICADO', 450, true),
  ('REP-CARNET', 'Reposicion de Carnet', 'ADMINISTRATIVO', 60, true),
  ('CONST-EST', 'Constancia de Estudios', 'CERTIFICADO', 50, true),
  ('SEG-INT', 'Seguro Integral Estudiantil', 'SEGURO', 120, true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 3. Perfil + Alumno demo
-- ============================================================
INSERT INTO public.perfiles (auth_id, correo, nombres, apellidos, tipo_usuario, rol, activo)
VALUES (
  'bd8f36e5-98ac-48db-aaf9-44f021bf9e14',
  'demo@ubi.edu.bo',
  'Carlos Eduardo',
  'Flores Mamani',
  'ALUMNO',
  NULL,
  true
)
ON CONFLICT (correo) DO NOTHING;

DO $$
DECLARE
  v_perfil_id uuid;
  v_carrera_id uuid;
  v_curso_id uuid;
  v_turno_id uuid;
  v_alumno_id uuid;
BEGIN
  SELECT id INTO v_perfil_id FROM public.perfiles WHERE correo = 'demo@ubi.edu.bo' LIMIT 1;
  SELECT id INTO v_carrera_id FROM public.carreras WHERE codigo = 'SIS' LIMIT 1;
  SELECT id INTO v_curso_id FROM public.cursos WHERE codigo_curso = 'CUR-2026-2' LIMIT 1;
  SELECT id INTO v_turno_id FROM public.turnos WHERE codigo = 'M' LIMIT 1;

  IF v_perfil_id IS NOT NULL THEN
    INSERT INTO public.alumnos (
      perfil_id, numero_registro, ci, expedido, nombres, apellidos,
      carrera_id, curso_id, turno_id, correo_electronico, telefono,
      estado_financiero, estado
    ) VALUES (
      v_perfil_id, 4821, '78945612', 'LP', 'Carlos Eduardo', 'Flores Mamani',
      v_carrera_id, v_curso_id, v_turno_id, 'demo@ubi.edu.bo', '+591 72345678',
      'PENDIENTE', 'ACTIVO'
    ) ON CONFLICT DO NOTHING;

    SELECT id INTO v_alumno_id FROM public.alumnos WHERE perfil_id = v_perfil_id LIMIT 1;

    IF v_alumno_id IS NOT NULL THEN
      -- Mensualidades 2026
      INSERT INTO public.alumnos_mensualidades
        (alumno_id, gestion_anio, nro_cuota, mes_referencia, monto_original, monto_con_descuento, estado, fecha_vencimiento)
      VALUES
        (v_alumno_id, 2026, 1, 'Enero', 500, 500, 'PAGADO', '2026-01-15'),
        (v_alumno_id, 2026, 2, 'Febrero', 500, 500, 'PAGADO', '2026-02-15'),
        (v_alumno_id, 2026, 3, 'Marzo', 500, 500, 'PAGADO', '2026-03-15'),
        (v_alumno_id, 2026, 4, 'Abril', 500, 500, 'PAGADO', '2026-04-15'),
        (v_alumno_id, 2026, 5, 'Mayo', 500, 500, 'PAGADO', '2026-05-15'),
        (v_alumno_id, 2026, 6, 'Junio', 500, 500, 'PENDIENTE', '2026-06-15'),
        (v_alumno_id, 2026, 7, 'Julio', 500, 500, 'PENDIENTE', '2026-07-15')
      ON CONFLICT DO NOTHING;

      -- Pagos historicos aprobados (Enero a Mayo)
      INSERT INTO public.alumnos_pagos (alumno_id, mensualidad_id, monto_pagado, canal_pago, numero_transaccion, fecha_pago, estado_conciliacion)
      SELECT v_alumno_id, m.id, m.monto_con_descuento, 'QR', '#8470321', '2026-01-02 10:00:00-04:00', 'APROBADO'
      FROM public.alumnos_mensualidades m WHERE m.alumno_id = v_alumno_id AND m.mes_referencia = 'Enero'
      ON CONFLICT DO NOTHING;

      INSERT INTO public.alumnos_pagos (alumno_id, mensualidad_id, monto_pagado, canal_pago, numero_transaccion, fecha_pago, estado_conciliacion)
      SELECT v_alumno_id, m.id, m.monto_con_descuento, 'QR', '#8471900', '2026-02-03 10:00:00-04:00', 'APROBADO'
      FROM public.alumnos_mensualidades m WHERE m.alumno_id = v_alumno_id AND m.mes_referencia = 'Febrero'
      ON CONFLICT DO NOTHING;

      INSERT INTO public.alumnos_pagos (alumno_id, mensualidad_id, monto_pagado, canal_pago, numero_transaccion, fecha_pago, estado_conciliacion)
      SELECT v_alumno_id, m.id, m.monto_con_descuento, 'QR', '#8472100', '2026-03-02 10:00:00-04:00', 'APROBADO'
      FROM public.alumnos_mensualidades m WHERE m.alumno_id = v_alumno_id AND m.mes_referencia = 'Marzo'
      ON CONFLICT DO NOTHING;

      INSERT INTO public.alumnos_pagos (alumno_id, mensualidad_id, monto_pagado, canal_pago, numero_transaccion, fecha_pago, estado_conciliacion)
      SELECT v_alumno_id, m.id, m.monto_con_descuento, 'EFECTIVO', '#8469714', '2026-04-15 10:00:00-04:00', 'APROBADO'
      FROM public.alumnos_mensualidades m WHERE m.alumno_id = v_alumno_id AND m.mes_referencia = 'Abril'
      ON CONFLICT DO NOTHING;

      INSERT INTO public.alumnos_pagos (alumno_id, mensualidad_id, monto_pagado, canal_pago, numero_transaccion, fecha_pago, estado_conciliacion)
      SELECT v_alumno_id, m.id, m.monto_con_descuento, 'QR', '#8468900', '2026-05-02 10:00:00-04:00', 'APROBADO'
      FROM public.alumnos_mensualidades m WHERE m.alumno_id = v_alumno_id AND m.mes_referencia = 'Mayo'
      ON CONFLICT DO NOTHING;

      -- Pago pendiente de Junio
      INSERT INTO public.alumnos_pagos (alumno_id, mensualidad_id, monto_pagado, canal_pago, numero_transaccion, fecha_pago, estado_conciliacion)
      SELECT v_alumno_id, m.id, m.monto_con_descuento, 'DEPOSITO', '#8468011', '2026-06-10 10:00:00-04:00', 'PENDIENTE'
      FROM public.alumnos_mensualidades m WHERE m.alumno_id = v_alumno_id AND m.mes_referencia = 'Junio'
      ON CONFLICT DO NOTHING;

      -- Pago rechazado
      INSERT INTO public.alumnos_pagos (alumno_id, monto_pagado, canal_pago, numero_transaccion, fecha_pago, estado_conciliacion, observacion)
      VALUES (v_alumno_id, 500, 'QR', '#8467500', '2026-03-01 10:00:00-04:00', 'RECHAZADO', 'Numero de transaccion duplicado')
      ON CONFLICT DO NOTHING;

      -- Pago de arancel aprobado (Certificado de Notas)
      INSERT INTO public.alumnos_pagos (alumno_id, arancel_id, monto_pagado, canal_pago, numero_transaccion, fecha_pago, estado_conciliacion)
      SELECT v_alumno_id, a.id, a.monto, 'DEPOSITO', '#8471988', '2026-05-28 10:00:00-04:00', 'APROBADO'
      FROM public.aranceles_conceptos a WHERE a.codigo = 'CERT-NOT'
      ON CONFLICT DO NOTHING;

      -- Mensajes del buzon
      INSERT INTO public.buzon_mensajes (alumno_id, titulo, cuerpo, tipo, leido, created_at)
      VALUES
        (v_alumno_id, 'Recordatorio: Mensualidad de Julio',
         'Estimado Carlos, le recordamos que la mensualidad de Julio con vencimiento el 15 de Julio debe ser cancelada. Realice su pago a traves de la app para evitar recargos.',
         'PAGO', false, now() - interval '2 days'),
        (v_alumno_id, 'Pago de Junio en verificacion',
         'Su pago de la mensualidad de Junio por Bs 500 se encuentra en proceso de verificacion. Le notificaremos una vez aprobado.',
         'PAGO', false, now() - interval '5 days'),
        (v_alumno_id, 'Nuevo arancel: Seguro Integral Estudiantil',
         'Se informa a todos los estudiantes que el Seguro Integral Estudiantil (Bs 120) es obligatorio para el segundo semestre 2026. Puede pagarlo desde la app.',
         'ARANCEL', true, now() - interval '10 days'),
        (v_alumno_id, 'Bienvenido al Portal Financiero UBI',
         'Bienvenido al sistema de pagos de la Universidad Boliviana de Informatica. Desde esta app podra pagar mensualidades, aranceles y recibir comunicados.',
         'BIENVENIDA', true, now() - interval '30 days')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
END $$;
