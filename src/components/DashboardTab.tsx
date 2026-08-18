import { useState, useEffect, useCallback } from 'react';
import {
  User,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronRight,
  BookOpen,
  FileText,
  GraduationCap,
  Award,
  ScrollText,
  CreditCard,
  ShieldCheck,
  Loader2,
  CheckSquare,
  Square,
  Layers,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import type { Mensualidad, Arancel } from '../lib/supabase';

const iconMap: Record<string, React.ElementType> = {
  BookOpen,
  FileText,
  GraduationCap,
  Award,
  ScrollText,
  CreditCard,
};

interface DashboardTabProps {
  onPayMensualidad: (id: string) => void;
  onPayMensualidades: (ids: string[]) => void;
  onPayArancel: (id: string) => void;
}

export default function DashboardTab({ onPayMensualidad, onPayMensualidades, onPayArancel }: DashboardTabProps) {
  const { alumno } = useAuth();
  const [mensualidades, setMensualidades] = useState<Mensualidad[]>([]);
  const [aranceles, setAranceles] = useState<Arancel[]>([]);
  const [pagosPorConfirmar, setPagosPorConfirmar] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!alumno) return;
    setLoading(true);
    const [mensRes, aranRes, pagosRes] = await Promise.all([
      supabase
        .from('alumnos_mensualidades')
        .select('*')
        .eq('alumno_id', alumno.id)
        .order('nro_cuota', { ascending: true }),
      supabase
        .from('aranceles_conceptos')
        .select('*')
        .eq('activo', true)
        .order('categoria', { ascending: true }),
      supabase
        .from('alumnos_pagos')
        .select('mensualidad_id, arancel_id, estado_conciliacion')
        .eq('alumno_id', alumno.id)
        .eq('estado_conciliacion', 'PENDIENTE'),
    ]);
    setMensualidades(mensRes.data ?? []);
    const pending = new Set<string>();
    (pagosRes.data ?? []).forEach((pago) => {
      if (pago.mensualidad_id) pending.add(`mensualidad:${pago.mensualidad_id}`);
      if (pago.arancel_id) pending.add(`arancel:${pago.arancel_id}`);
    });
    setPagosPorConfirmar(pending);
    const sortedAranceles = [...(aranRes.data ?? [])].sort((a, b) => {
      if (a.categoria === 'MATRICULA' && b.categoria !== 'MATRICULA') return -1;
      if (a.categoria !== 'MATRICULA' && b.categoria === 'MATRICULA') return 1;
      return a.categoria.localeCompare(b.categoria);
    });
    setAranceles(sortedAranceles);
    setLoading(false);
  }, [alumno]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Loader2 size={28} className="text-[#0A2463] animate-spin" />
      </div>
    );
  }

  const pendientes = mensualidades.filter((m) => m.estado === 'PENDIENTE');
  const totalDeuda = pendientes.reduce((s, m) => s + Number(m.monto_con_descuento), 0);
  const alDia = pendientes.length === 0;

  const toggleSelect = (id: string) => {
    if (pagosPorConfirmar.has(`mensualidad:${id}`)) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedMensualidades = pendientes.filter((m) => selectedIds.has(m.id));
  const selectedTotal = selectedMensualidades.reduce((s, m) => s + Number(m.monto_con_descuento), 0);
  const allSelected = pendientes.length > 0 && pendientes.every((m) => selectedIds.has(m.id) || pagosPorConfirmar.has(`mensualidad:${m.id}`));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendientes.filter((m) => !pagosPorConfirmar.has(`mensualidad:${m.id}`)).map((m) => m.id)));
    }
  };

  const fullName = alumno ? `${alumno.nombres} ${alumno.apellidos}` : '';
  const carreraName = alumno?.carrera?.carrera ?? '';
  const gestion = `Gestion ${new Date().getFullYear()}`;

  const getDaysLeft = (fecha: string | null) => {
    if (!fecha) return 0;
    const due = new Date(fecha);
    const now = new Date();
    return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* Student Card */}
      <div className="mx-4 mt-4 bg-gradient-to-br from-[#0A2463] to-[#1E4DB7] rounded-2xl p-5 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 border-2 border-white/30">
            <User size={26} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white/70 text-xs font-medium uppercase tracking-wide">Estudiante</p>
            <h2 className="text-white font-bold text-base leading-tight mt-0.5">{fullName}</h2>
            <p className="text-blue-200 text-xs mt-1">{carreraName}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="bg-white/15 text-white/90 text-xs px-2.5 py-1 rounded-full font-mono">{gestion}</span>
              <span className="bg-white/15 text-white/90 text-xs px-2.5 py-1 rounded-full font-mono">
                CI: {alumno?.ci} {alumno?.expedido}
              </span>
              {alumno?.becado && (
                <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2.5 py-1 rounded-full font-semibold">
                  Becado {alumno?.tipo_beca?.porcentaje_descuento}% desc
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between">
          <div>
            <p className="text-white/60 text-xs">Estado Financiero</p>
            <div className="flex items-center gap-1.5 mt-1">
              {alDia ? (
                <>
                  <CheckCircle2 size={15} className="text-emerald-400" />
                  <span className="text-emerald-400 font-semibold text-sm">Al dia</span>
                </>
              ) : (
                <>
                  <AlertCircle size={15} className="text-red-400" />
                  <span className="text-red-400 font-semibold text-sm">Pendiente de pago</span>
                </>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-white/60 text-xs">Deuda total</p>
            <p className="text-white font-bold text-lg">Bs {totalDeuda.toLocaleString('es-BO')}</p>
          </div>
        </div>
      </div>

      {/* Active Debts */}
      <div className="mx-4">
        <h3 className="text-[#0A2463] font-bold text-sm mb-3 uppercase tracking-wide">Mensualidades Pendientes</h3>
        {pendientes.length === 0 ? (
          <div className="bg-emerald-50 rounded-2xl p-5 flex items-center gap-3">
            <ShieldCheck size={24} className="text-emerald-500 flex-shrink-0" />
            <div>
              <p className="text-emerald-700 font-semibold text-sm">No tienes mensualidades pendientes</p>
              <p className="text-emerald-600 text-xs mt-0.5">Todas tus mensualidades estan al dia</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-[#0A2463] text-xs font-semibold hover:text-[#1E4DB7] transition-colors"
              >
                {allSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                {allSelected ? 'Quitar seleccion' : 'Seleccionar todas'}
              </button>
              {selectedIds.size > 0 && (
                <span className="text-gray-400 text-xs">{selectedIds.size} seleccionada(s)</span>
              )}
            </div>
            <div className="flex flex-col gap-3">
              {pendientes.map((debt) => {
                const daysLeft = getDaysLeft(debt.fecha_vencimiento);
                const isOverdue = daysLeft < 0;
                const isUrgent = daysLeft >= 0 && daysLeft <= 5;
                const isSelected = selectedIds.has(debt.id);
                const isPending = pagosPorConfirmar.has(`mensualidad:${debt.id}`);
                return (
                  <div
                    key={debt.id}
                    className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 ${
                      isOverdue ? 'border-red-500' : isUrgent ? 'border-amber-400' : 'border-blue-400'
                    } ${isSelected ? 'ring-2 ring-[#0A2463]/30' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 flex-1">
                        <button
                          onClick={() => toggleSelect(debt.id)}
                          disabled={isPending}
                          className="mt-0.5 flex-shrink-0 disabled:cursor-not-allowed"
                        >
                          {isPending ? (
                            <Clock size={18} className="text-amber-500" />
                          ) : isSelected ? (
                            <CheckSquare size={18} className="text-[#0A2463]" />
                          ) : (
                            <Square size={18} className="text-gray-300 hover:text-[#0A2463] transition-colors" />
                          )}
                        </button>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {isOverdue ? (
                              <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                            ) : (
                              <Clock size={14} className="text-amber-500 flex-shrink-0" />
                            )}
                            <p className="text-gray-800 font-semibold text-sm">
                              Mensualidad {debt.mes_referencia} {debt.gestion_anio}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 mt-1.5">
                            {Number(debt.monto_original) !== Number(debt.monto_con_descuento) && (
                              <span className="text-gray-400 line-through text-xs">
                                Bs {Number(debt.monto_original).toLocaleString('es-BO')}
                              </span>
                            )}
                            <span className="text-[#0A2463] font-bold text-base">
                              Bs {Number(debt.monto_con_descuento).toLocaleString('es-BO')}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                isOverdue
                                  ? 'bg-red-100 text-red-600'
                                  : isUrgent
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {isOverdue
                                ? `Vencio hace ${Math.abs(daysLeft)} dias`
                                : `Vence en ${daysLeft} dias`}
                            </span>
                          </div>
                          {debt.fecha_vencimiento && (
                            <p className="text-gray-400 text-xs mt-1">
                              Vencimiento: {new Date(debt.fecha_vencimiento).toLocaleDateString('es-BO')}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => onPayMensualidad(debt.id)}
                        disabled={isPending}
                        className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition-transform active:scale-95 disabled:cursor-not-allowed disabled:bg-amber-500 ${
                          isOverdue ? 'bg-red-500' : 'bg-[#0A2463]'
                        }`}
                      >
                        {isPending ? 'Por confirmar' : 'Pagar'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {selectedIds.size > 0 && (
              <div className="sticky bottom-2 bg-white rounded-2xl shadow-lg border border-[#0A2463]/10 p-4 mt-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Layers size={18} className="text-[#0A2463]" />
                    <span className="text-gray-700 font-semibold text-sm">Pago masivo</span>
                  </div>
                  <span className="text-[#0A2463] font-extrabold text-lg">Bs {selectedTotal.toLocaleString('es-BO')}</span>
                </div>
                <button
                  onClick={() => onPayMensualidades(Array.from(selectedIds))}
                  className="w-full bg-[#0A2463] text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-[#1E4DB7] transition-colors active:scale-95"
                >
                  Pagar {selectedIds.size} mensualidad(es)
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Aranceles */}
      <div className="mx-4">
        <h3 className="text-[#0A2463] font-bold text-sm mb-3 uppercase tracking-wide">Aranceles Disponibles</h3>
        <div className="grid grid-cols-2 gap-3">
          {aranceles.map((arancel) => {
            const Icon = iconMap[arancel.categoria] ?? FileText;
            return (
              <button
                key={arancel.id}
                onClick={() => onPayArancel(arancel.id)}
                disabled={pagosPorConfirmar.has(`arancel:${arancel.id}`)}
                className="bg-white rounded-2xl p-4 shadow-sm text-left hover:shadow-md transition-all active:scale-95 group disabled:cursor-not-allowed disabled:opacity-75"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center mb-3 transition-colors">
                  <Icon size={20} className="text-[#0A2463]" />
                </div>
                <p className="text-gray-800 font-semibold text-xs leading-tight">{arancel.concepto}</p>
                <p className="text-gray-400 text-xs mt-0.5">{arancel.categoria}</p>
                <div className="flex items-center justify-between mt-2">
                  {pagosPorConfirmar.has(`arancel:${arancel.id}`) ? (
                    <span className="text-amber-600 font-bold text-xs">Por confirmar</span>
                  ) : (
                    <span className="text-[#0A2463] font-bold text-sm">
                      Bs {Number(arancel.monto).toLocaleString('es-BO')}
                    </span>
                  )}
                  <ChevronRight size={14} className="text-gray-300 group-hover:text-[#0A2463] transition-colors" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
