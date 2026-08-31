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
  FileCheck,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import type { Mensualidad, Arancel } from '../lib/supabase';

interface Tramite {
  id: number;
  categoria: string | null;
  tramite: string;
  costo: number;
  activo: boolean;
}

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
  onPayTramite?: (tramiteId: number) => void;
}

export default function DashboardTab({
  onPayMensualidad,
  onPayMensualidades,
  onPayArancel,
  onPayTramite,
}: DashboardTabProps) {
  const { alumno } = useAuth();
  const [mensualidades, setMensualidades] = useState<Mensualidad[]>([]);
  const [aranceles, setAranceles] = useState<Arancel[]>([]);
  const [tramites, setTramites] = useState<Tramite[]>([]);
  const [pagosPorConfirmar, setPagosPorConfirmar] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!alumno?.id) {
      console.log('Esperando información del alumno en el contexto...');
      return;
    }

    setLoading(true);
    console.log('Cargando datos para el alumno ID:', alumno.id);

    try {
      // 1. Cargar todas las mensualidades del alumno (sin filtrar por estado para poder mostrar las pagadas)
      const { data: mensData, error: mensError } = await supabase
        .from('alumnos_mensualidades')
        .select('*')
        .eq('alumno_id', alumno.id)
        .order('nro_cuota', { ascending: true });

      if (mensError) {
        console.error('Error al cargar mensualidades:', mensError.message);
      } else {
        setMensualidades(mensData ?? []);
      }

      // 2. Cargar aranceles activos
      const { data: aranData, error: aranError } = await supabase
        .from('aranceles_conceptos')
        .select('*')
        .eq('activo', true)
        .order('categoria', { ascending: true });

      if (aranError) {
        console.error('Error al cargar aranceles:', aranError.message);
      } else {
        const sortedAranceles = [...(aranData ?? [])].sort((a, b) => {
          if (a.categoria === 'MATRICULA' && b.categoria !== 'MATRICULA') return -1;
          if (a.categoria !== 'MATRICULA' && b.categoria === 'MATRICULA') return 1;
          return (a.categoria || '').localeCompare(b.categoria || '');
        });
        setAranceles(sortedAranceles);
      }

      // 3. Cargar pagos pendientes de confirmación
      const { data: pagosData, error: pagosError } = await supabase
        .from('alumnos_pagos')
        .select('mensualidad_id, arancel_id, estado_conciliacion')
        .eq('alumno_id', alumno.id)
        .eq('estado_conciliacion', 'PENDIENTE');

      if (!pagosError && pagosData) {
        const pending = new Set<string>();
        pagosData.forEach((pago) => {
          if (pago.mensualidad_id) pending.add(`mensualidad:${pago.mensualidad_id}`);
          if (pago.arancel_id) pending.add(`arancel:${pago.arancel_id}`);
        });
        setPagosPorConfirmar(pending);
      }

      // 4. Cargar trámites institucionales
      const { data: tramData } = await supabase
        .from('tramites')
        .select('*')
        .eq('activo', true)
        .order('tramite', { ascending: true });

      setTramites(tramData ?? []);

    } catch (err) {
      console.error('Error general en fetchData:', err);
    } finally {
      setLoading(false);
    }
  }, [alumno?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading || !alumno) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 gap-3">
        <Loader2 size={32} className="text-[#0A2463] animate-spin" />
        <p className="text-gray-400 text-xs font-medium">Cargando información del estudiante...</p>
      </div>
    );
  }

  // Deuda total solo considera las que están estrictamente pendientes y no tienen pago en proceso
  const totalDeuda = mensualidades
    .filter((m) => m.estado === 'PENDIENTE' && !pagosPorConfirmar.has(`mensualidad:${m.id}`))
    .reduce((s, m) => s + Number(m.monto_con_descuento || 0), 0);

  const pendientesReales = mensualidades.filter(
    (m) => m.estado === 'PENDIENTE' && !pagosPorConfirmar.has(`mensualidad:${m.id}`)
  );

  const alDia = pendientesReales.length === 0;

  const toggleSelect = (id: string, estado: string, isPending: boolean) => {
    if (estado === 'PAGADO' || isPending) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectablesPendientes = mensualidades.filter(
    (m) => m.estado === 'PENDIENTE' && !pagosPorConfirmar.has(`mensualidad:${m.id}`)
  );
  
  const selectedMensualidades = selectablesPendientes.filter((m) => selectedIds.has(m.id));
  const selectedTotal = selectedMensualidades.reduce((s, m) => s + Number(m.monto_con_descuento || 0), 0);
  
  const allSelected =
    selectablesPendientes.length > 0 &&
    selectablesPendientes.every((m) => selectedIds.has(m.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectablesPendientes.map((m) => m.id)));
    }
  };

  const fullName = `${alumno.nombres || ''} ${alumno.apellidos || ''}`.trim() || 'Estudiante';
  const carreraName = alumno.carrera_id || '';
  const cursoName = typeof alumno.curso === 'string' ? alumno.curso : (alumno.curso as any)?.nombre_curso || '';
  const turnoName = typeof alumno.turno === 'string' ? alumno.turno : '';
  const gestion = `Gestión ${new Date().getFullYear()}`;

  const getDaysLeft = (fecha: string | null) => {
    if (!fecha) return 0;
    const due = new Date(fecha);
    const now = new Date();
    return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* Credencial / Tarjeta del Estudiante */}
      <div className="mx-4 mt-4 bg-gradient-to-br from-[#0A2463] to-[#1E4DB7] rounded-2xl p-5 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 border-2 border-white/30">
            <User size={26} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white/70 text-xs font-medium uppercase tracking-wide">Estudiante</p>
            <h2 className="text-white font-bold text-base leading-tight mt-0.5">{fullName}</h2>
            {carreraName && <p className="text-blue-200 text-xs mt-1">{carreraName}</p>}
            
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {cursoName && (
                <span className="text-white/80 text-xs bg-white/10 px-2 py-0.5 rounded">
                  Curso: {cursoName}
                </span>
              )}
              {turnoName && (
                <span className="text-white/80 text-xs bg-white/10 px-2 py-0.5 rounded">
                  Turno: {turnoName}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="bg-white/15 text-white/90 text-xs px-2.5 py-1 rounded-full font-mono">
                {gestion}
              </span>
              
              {alumno?.ci && (
                <span className="bg-white/15 text-white/90 text-xs px-2.5 py-1 rounded-full font-mono">
                  CI: {alumno.ci}
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
                  <span className="text-emerald-400 font-semibold text-sm">Al día</span>
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

      {/* Historial / Listado de Mensualidades */}
      <div className="mx-4">
        <h3 className="text-[#0A2463] font-bold text-sm mb-3 uppercase tracking-wide">
          Plan de Mensualidades
        </h3>
        {mensualidades.length === 0 ? (
          <div className="bg-gray-50 rounded-2xl p-5 text-center">
            <p className="text-gray-500 text-xs">No se encontraron mensualidades registradas.</p>
          </div>
        ) : (
          <>
            {selectablesPendientes.length > 0 && (
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-2 text-[#0A2463] text-xs font-semibold hover:text-[#1E4DB7] transition-colors"
                >
                  {allSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                  {allSelected ? 'Quitar selección' : 'Seleccionar pendientes'}
                </button>
                {selectedIds.size > 0 && (
                  <span className="text-gray-400 text-xs">{selectedIds.size} seleccionada(s)</span>
                )}
              </div>
            )}
            <div className="flex flex-col gap-3">
              {mensualidades.map((debt) => {
                const isPaid = debt.estado === 'PAGADO';
                const isPending = pagosPorConfirmar.has(`mensualidad:${debt.id}`);
                const daysLeft = getDaysLeft(debt.fecha_vencimiento);
                const isOverdue = !isPaid && !isPending && daysLeft < 0;
                const isUrgent = !isPaid && !isPending && daysLeft >= 0 && daysLeft <= 5;
                const isSelected = selectedIds.has(debt.id);

                let borderColor = 'border-blue-400';
                if (isPaid) borderColor = 'border-emerald-500';
                else if (isPending) borderColor = 'border-amber-400';
                else if (isOverdue) borderColor = 'border-red-500';
                else if (isUrgent) borderColor = 'border-amber-400';

                return (
                  <div
                    key={debt.id}
                    className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 ${borderColor} ${
                      isPaid ? 'opacity-85 bg-gray-50/50' : ''
                    } ${isSelected ? 'ring-2 ring-[#0A2463]/30' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 flex-1">
                        <button
                          onClick={() => toggleSelect(debt.id, debt.estado, isPending)}
                          disabled={isPaid || isPending}
                          className="mt-0.5 flex-shrink-0 disabled:cursor-not-allowed"
                        >
                          {isPaid ? (
                            <CheckCircle2 size={18} className="text-emerald-500" />
                          ) : isPending ? (
                            <Clock size={18} className="text-amber-500" />
                          ) : isSelected ? (
                            <CheckSquare size={18} className="text-[#0A2463]" />
                          ) : (
                            <Square size={18} className="text-gray-300 hover:text-[#0A2463] transition-colors" />
                          )}
                        </button>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {isPaid ? (
                              <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
                            ) : isPending ? (
                              <Clock size={14} className="text-amber-500 flex-shrink-0" />
                            ) : isOverdue ? (
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
                                isPaid
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : isPending
                                  ? 'bg-amber-100 text-amber-700'
                                  : isOverdue
                                  ? 'bg-red-100 text-red-600'
                                  : isUrgent
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {isPaid
                                ? 'Pagado'
                                : isPending
                                ? 'Pago en revisión'
                                : isOverdue
                                ? `Venció hace ${Math.abs(daysLeft)} días`
                                : `Vence en ${daysLeft} días`}
                            </span>
                          </div>
                          {debt.fecha_vencimiento && !isPaid && (
                            <p className="text-gray-400 text-xs mt-1">
                              Vencimiento: {new Date(debt.fecha_vencimiento).toLocaleDateString('es-BO')}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Botón de acción adaptado al estado */}
                      {!isPaid && (
                        <button
                          onClick={() => onPayMensualidad(debt.id)}
                          disabled={isPending}
                          className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition-transform active:scale-95 disabled:cursor-not-allowed disabled:bg-amber-500 disabled:opacity-90 ${
                            isPending ? 'bg-amber-500' : isOverdue ? 'bg-red-500' : 'bg-[#0A2463]'
                          }`}
                        >
                          {isPending ? 'Por confirmar' : 'Pagar'}
                        </button>
                      )}
                      {isPaid && (
                        <span className="text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1">
                          <CheckCircle2 size={13} />
                          Completado
                        </span>
                      )}
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
                  <span className="text-[#0A2463] font-extrabold text-lg">
                    Bs {selectedTotal.toLocaleString('es-BO')}
                  </span>
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
        <h3 className="text-[#0A2463] font-bold text-sm mb-3 uppercase tracking-wide">
          Aranceles Disponibles
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {aranceles.map((arancel) => {
            const Icon = iconMap[arancel.categoria || ''] ?? FileText;
            const isPending = pagosPorConfirmar.has(`arancel:${arancel.id}`);
            return (
              <button
                key={arancel.id}
                onClick={() => onPayArancel(arancel.id)}
                disabled={isPending}
                className="bg-white rounded-2xl p-4 shadow-sm text-left hover:shadow-md transition-all active:scale-95 group disabled:cursor-not-allowed disabled:opacity-90"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center mb-3 transition-colors">
                  <Icon size={20} className="text-[#0A2463]" />
                </div>
                <p className="text-gray-800 font-semibold text-xs leading-tight">{arancel.concepto}</p>
                <p className="text-gray-400 text-xs mt-0.5">{arancel.categoria}</p>
                <div className="flex items-center justify-between mt-2">
                  {isPending ? (
                    <span className="text-amber-600 font-bold text-xs">Por confirmar</span>
                  ) : (
                    <span className="text-[#0A2463] font-bold text-sm">
                      Bs {Number(arancel.monto || 0).toLocaleString('es-BO')}
                    </span>
                  )}
                  <ChevronRight size={14} className="text-gray-300 group-hover:text-[#0A2463] transition-colors" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Trámites Institucionales */}
      {tramites.length > 0 && (
        <div className="mx-4">
          <h3 className="text-[#0A2463] font-bold text-sm mb-3 uppercase tracking-wide">
            Trámites y Costos
          </h3>
          <div className="grid grid-cols-1 gap-2.5">
            {tramites.map((tramite) => (
              <div
                key={tramite.id}
                className="bg-white rounded-xl p-3.5 shadow-sm flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-[#0A2463] flex-shrink-0">
                    <FileCheck size={18} />
                  </div>
                  <div>
                    <p className="text-gray-800 font-medium text-xs leading-snug">{tramite.tramite}</p>
                    <p className="text-gray-400 text-[10px] mt-0.5">Costo institucional</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#0A2463] font-bold text-xs whitespace-nowrap">
                    Bs {Number(tramite.costo || 0).toLocaleString('es-BO')}
                  </span>
                  {onPayTramite && (
                    <button
                      onClick={() => onPayTramite(tramite.id)}
                      className="bg-[#0A2463] text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-lg hover:bg-[#1E4DB7] transition-colors"
                    >
                      Solicitar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}