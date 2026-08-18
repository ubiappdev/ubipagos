/*
# Conceptos y pagos masivos

## Resumen
1. Agrega un concepto legible a cada registro de pago.
2. Agrega una lista de mensualidades relacionadas para que un solo comprobante pueda cubrir varias cuotas.
3. Conserva los campos existentes para no perder pagos anteriores.

## Nuevas columnas en `alumnos_pagos`
- `concepto`: texto automático del arancel o de las mensualidades pagadas.
- `mensualidad_ids`: arreglo de identificadores de mensualidades incluidas en un pago masivo.

## Seguridad
- Se mantienen las políticas existentes de `alumnos_pagos`.
- No se eliminan ni modifican columnas existentes.
*/

ALTER TABLE public.alumnos_pagos
  ADD COLUMN IF NOT EXISTS concepto text,
  ADD COLUMN IF NOT EXISTS mensualidad_ids uuid[];
