/*
# Configuracion de QR para pagos

## Resumen
1. Crea el bucket publico `configuracion-pagos` para guardar el QR vigente de cobros.
2. El archivo estable `qr-pago.jpeg` puede reemplazarse desde Storage sin cambiar la aplicacion.
3. Permite lectura publica del QR, pero no permite que los usuarios modifiquen el archivo desde el navegador.

## Nuevos recursos
- Bucket `configuracion-pagos`: contiene el QR visible en el flujo de Pago QR.
- Objeto esperado `qr-pago.jpeg`: imagen reemplazable del QR de cobro.

## Seguridad
- El QR es intencionalmente publico porque debe poder escanearse antes de iniciar sesion bancaria.
- La escritura queda reservada para el propietario del proyecto mediante Storage y no se habilita para anon ni authenticated.
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('configuracion-pagos', 'configuracion-pagos', true, 5242880, ARRAY['image/jpeg', 'image/png']::text[])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png']::text[];

DROP POLICY IF EXISTS "public_read_payment_configuration" ON storage.objects;
CREATE POLICY "public_read_payment_configuration"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'configuracion-pagos');
