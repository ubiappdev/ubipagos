import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// 🛡️ TRUCO PARA WEBCONTAINERS: Parchear navigator.locks para evitar el error de bloqueo
if (typeof window !== 'undefined' && window.navigator && window.navigator.locks) {
  try {
    const originalRequest = window.navigator.locks.request;
    window.navigator.locks.request = async (name: string, ...args: any[]) => {
      const callback = args.length > 1 ? args[1] : args[0];
      if (typeof callback === 'function') {
        return await callback({ name, mode: 'exclusive' });
      }
      return originalRequest ? originalRequest.apply(window.navigator.locks, args as any) : undefined;
    };
  } catch (e) {
    console.warn('No se pudo parchear navigator.locks:', e);
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});

// --- DEFINICIONES DE TIPOS ---

export type Alumno = {
  id: string;
  perfil_id?: string;
  numero_registro: number;
  ci: string;
  expedido: string;
  nombres: string;
  apellidos: string;
  carrera: string | null;       // <--- Campo de texto plano
  curso: string | null;         // <--- Campo de texto plano
  turno: string | null;         // <--- Campo de texto plano
  correo_electronico: string | null;
  telefono: string | null;
  estado_financiero: string | null;
  estado: string | null;
  becado: boolean;
  tipo_beca_id: string | null;
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