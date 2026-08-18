import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  flowType: 'pkce',
  },
});

export type Alumno = {
  id: string;
  numero_registro: number;
  ci: string;
  expedido: string;
  nombres: string;
  apellidos: string;
  carrera_id: string;
  curso_id: string;
  turno_id: string;
  correo_electronico: string | null;
  telefono: string | null;
  estado_financiero: string | null;
  estado: string | null;
  becado: boolean;
  tipo_beca_id: string | null;
};

export type Carrera = {
  id: string;
  codigo: string;
  carrera: string;
  nivel: string;
  anos: number;
};

export type Curso = {
  id: string;
  codigo_curso: string;
  nombre_curso: string;
  orden: number;
};

export type TipoBeca = {
  id: string;
  nombre: string;
  porcentaje_descuento: number;
  activo: boolean;
};

export type Mensualidad = {
  id: string;
  alumno_id: string;
  gestion_anio: number;
  nro_cuota: number;
  mes_referencia: string;
  monto_original: number;
  monto_con_descuento: number;
  estado: string;
  fecha_vencimiento: string | null;
};

export type Arancel = {
  id: string;
  codigo: string;
  concepto: string;
  categoria: string;
  monto: number;
  activo: boolean;
};

export type Pago = {
  id: string;
  alumno_id: string;
  arancel_id: string | null;
  mensualidad_id: string | null;
  monto_pagado: number;
  canal_pago: string;
  numero_transaccion: string | null;
  fecha_pago: string;
  comprobante_url: string | null;
  concepto: string | null;
  mensualidad_ids: string[] | null;
  estado_conciliacion: string;
  observacion: string | null;
  ocr_data: Record<string, unknown> | null;
  created_at: string;
};

export type BuzonMensaje = {
  id: string;
  alumno_id: string;
  titulo: string;
  cuerpo: string;
  tipo: string;
  leido: boolean;
  created_at: string;
};
