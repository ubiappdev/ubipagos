import { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  Clock,
  XCircle,
  Download,
  FileText,
  X,
  Loader2,
  ScanLine,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import type { Pago } from '../lib/supabase';

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  APROBADO: { label: 'Aprobado', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2 },
  PENDIENTE: { label: 'Pendiente', color: 'text-amber-600', bg: 'bg-amber-50', icon: Clock },
  RECHAZADO: { label: 'Rechazado', color: 'text-red-600', bg: 'bg-red-50', icon: XCircle },
};

const canalLabels: Record<string, string> = {
  QR: 'Pago QR',
  DEPOSITO: 'Deposito Bancario',
  EFECTIVO: 'Efectivo',
  TRANSFERENCIA: 'Transferencia Interbancaria',
};

type FilterType = 'todos' | 'mensualidad' | 'arancel';

export default function HistoryTab() {
  const { alumno } = useAuth();
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('todos');
  const [receiptPago, setReceiptPago] = useState<Pago | null>(null);

  const fetchPagos = useCallback(async () => {
    if (!alumno) return;
    setLoading(true);
    const { data } = await supabase
      .from('alumnos_pagos')
      .select('*')
      .eq('alumno_id', alumno.id)
      .order('fecha_pago', { ascending: false });
    setPagos((data as Pago[]) ?? []);
    setLoading(false);
  }, [alumno]);

  useEffect(() => { fetchPagos(); }, [fetchPagos]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Loader2 size={28} className="text-[#0A2463] animate-spin" />
      </div>
    );
  }

  const getConcept = (p: Pago) => {
    if (p.mensualidad_id) return 'Mensualidad';
    if (p.arancel_id) return 'Arancel';
    return 'Pago';
  };

  const filtered = pagos.filter((p) => {
    if (filter === 'todos') return true;
    if (filter === 'mensualidad') return !!p.mensualidad_id;
    if (filter === 'arancel') return !!p.arancel_id;
    return true;
  });

  const totalAprobado = pagos
    .filter((p) => p.estado_conciliacion === 'APROBADO')
    .reduce((s, p) => s + Number(p.monto_pagado), 0);

  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* Summary */}
      <div className="mx-4 mt-4 bg-gradient-to-br from-[#0A2463] to-[#1E4DB7] rounded-2xl p-5 shadow-lg">
        <p className="text-white/70 text-xs uppercase tracking-wide">Total Pagado (Aprobado)</p>
        <p className="text-white font-extrabold text-3xl mt-1">Bs {totalAprobado.toLocaleString('es-BO')}</p>
        <div className="flex gap-4 mt-4 pt-4 border-t border-white/20">
          <div className="flex-1">
            <p className="text-white/60 text-xs">Transacciones</p>
            <p className="text-white font-bold text-lg">{pagos.length}</p>
          </div>
          <div className="flex-1">
            <p className="text-white/60 text-xs">Aprobadas</p>
            <p className="text-emerald-400 font-bold text-lg">{pagos.filter((p) => p.estado_conciliacion === 'APROBADO').length}</p>
          </div>
          <div className="flex-1">
            <p className="text-white/60 text-xs">Pendientes</p>
            <p className="text-amber-400 font-bold text-lg">{pagos.filter((p) => p.estado_conciliacion === 'PENDIENTE').length}</p>
          </div>
        </div>
      </div>

      {/* Filter pills */}
      <div className="mx-4 flex gap-2 overflow-x-auto pb-1">
        {([
          { key: 'todos', label: 'Todos' },
          { key: 'mensualidad', label: 'Mensualidades' },
          { key: 'arancel', label: 'Aranceles' },
        ] as { key: FilterType; label: string }[]).map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              filter === f.key ? 'bg-[#0A2463] text-white shadow-md' : 'bg-white text-gray-500 border border-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Transaction list */}
      <div className="mx-4 flex flex-col gap-3">
        {filtered.length === 0 && (
          <div className="text-center py-10 text-gray-400 text-sm">No hay transacciones en esta categoria.</div>
        )}
        {filtered.map((tx) => {
          const cfg = statusConfig[tx.estado_conciliacion] ?? statusConfig.PENDIENTE;
          const StatusIcon = cfg.icon;
          return (
            <div key={tx.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                <StatusIcon size={20} className={cfg.color} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-800 font-semibold text-sm truncate">{getConcept(tx)}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-gray-400 text-xs">
                    {new Date(tx.fecha_pago).toLocaleDateString('es-BO')}
                  </span>
                  <span className="text-gray-300">·</span>
                  <span className="text-gray-400 text-xs font-mono">{tx.numero_transaccion}</span>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[#0A2463] font-bold text-sm">Bs {Number(tx.monto_pagado).toLocaleString('es-BO')}</span>
                  <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                </div>
                <span className="text-gray-300 text-xs mt-0.5 inline-block">
                  {canalLabels[tx.canal_pago] ?? tx.canal_pago}
                </span>
              </div>
              {tx.estado_conciliacion === 'APROBADO' && (
                <button
                  onClick={() => setReceiptPago(tx)}
                  className="flex-shrink-0 w-9 h-9 rounded-xl bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors active:scale-90"
                  title="Ver Constancia"
                >
                  <Download size={16} className="text-[#0A2463]" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Receipt Modal */}
      {receiptPago && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setReceiptPago(null)}>
          <div className="bg-white rounded-3xl w-full max-w-sm max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white rounded-t-3xl px-5 pt-5 pb-3 border-b border-dashed border-gray-200 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-[#0A2463] rounded-xl flex items-center justify-center">
                  <FileText size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="text-[#0A2463] font-bold text-sm">Constancia de Pago</h3>
                  <p className="text-gray-400 text-xs">Universidad Boliviana de Informatica</p>
                </div>
              </div>
              <button onClick={() => setReceiptPago(null)} className="text-gray-300 hover:text-gray-500">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-3">
              <div className="text-center pb-3 border-b border-dashed border-gray-200">
                <p className="text-[#0A2463] font-extrabold text-lg">UNIVERSIDAD BOLIVIANA DE INFORMATICA</p>
                <p className="text-gray-400 text-xs mt-0.5">NIT: 1023456789 · La Paz, Bolivia</p>
              </div>

              <div className="flex justify-between py-1.5">
                <span className="text-gray-400 text-xs">N° Transaccion:</span>
                <span className="text-gray-700 font-mono text-xs font-bold">{receiptPago.numero_transaccion}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-gray-400 text-xs">Fecha:</span>
                <span className="text-gray-700 text-xs">{new Date(receiptPago.fecha_pago).toLocaleDateString('es-BO')}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-gray-400 text-xs">Estudiante:</span>
                <span className="text-gray-700 text-xs font-medium text-right">{alumno?.nombres} {alumno?.apellidos}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-gray-400 text-xs">Gestion:</span>
                <span className="text-gray-700 text-xs">Gestion {new Date().getFullYear()}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-gray-400 text-xs">Carrera:</span>
                <span className="text-gray-700 text-xs">{alumno?.carrera_id}</span>
              </div>

              <div className="border-t border-dashed border-gray-200 pt-3 mt-1">
                <div className="flex justify-between py-1.5">
                  <span className="text-gray-400 text-xs">Concepto:</span>
                  <span className="text-gray-700 text-xs text-right max-w-[60%]">{getConcept(receiptPago)}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-gray-400 text-xs">Metodo:</span>
                  <span className="text-gray-700 text-xs">{canalLabels[receiptPago.canal_pago] ?? receiptPago.canal_pago}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-gray-400 text-xs">Estado:</span>
                  <span className="text-emerald-600 text-xs font-bold">APROBADO</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mt-2 flex justify-between items-center">
                <span className="text-gray-500 font-semibold text-sm">Total Pagado</span>
                <span className="text-[#0A2463] font-extrabold text-xl">Bs {Number(receiptPago.monto_pagado).toLocaleString('es-BO')}</span>
              </div>

              {receiptPago.ocr_data && (
                <div className="bg-blue-50 rounded-xl p-3 mt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <ScanLine size={14} className="text-blue-600" />
                    <span className="text-blue-700 text-xs font-bold">Verificacion OCR + IA</span>
                  </div>
                  {(() => {
                    const ocr = receiptPago.ocr_data as Record<string, unknown>;
                    const banco = ocr.banco ? String(ocr.banco) : null;
                    const referencia = ocr.referencia ? String(ocr.referencia) : null;
                    const titular = ocr.titular ? String(ocr.titular) : null;
                    const fechaComp = ocr.fecha_comprobante ? String(ocr.fecha_comprobante) : null;
                    const montoDet = ocr.monto_detectado != null ? Number(ocr.monto_detectado) : null;
                    return (
                      <div className="flex flex-col gap-1">
                        {banco && <div className="flex justify-between"><span className="text-gray-400 text-xs">Banco:</span><span className="text-gray-600 text-xs">{banco}</span></div>}
                        {referencia && <div className="flex justify-between"><span className="text-gray-400 text-xs">Referencia:</span><span className="text-gray-600 text-xs font-mono">{referencia}</span></div>}
                        {titular && <div className="flex justify-between"><span className="text-gray-400 text-xs">Titular:</span><span className="text-gray-600 text-xs">{titular}</span></div>}
                        {fechaComp && <div className="flex justify-between"><span className="text-gray-400 text-xs">Fecha comprobante:</span><span className="text-gray-600 text-xs">{fechaComp}</span></div>}
                        {montoDet != null && <div className="flex justify-between"><span className="text-gray-400 text-xs">Monto detectado:</span><span className="text-gray-600 text-xs">Bs {montoDet.toLocaleString('es-BO')}</span></div>}
                      </div>
                    );
                  })()}
                </div>
              )}

              <div className="text-center pt-3">
                <p className="text-gray-300 text-xs italic">Este documento es una constancia electronica generada automaticamente.</p>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 flex gap-3">
              <button onClick={() => setReceiptPago(null)} className="flex-1 border border-gray-200 text-gray-500 font-semibold py-3 rounded-xl text-sm hover:bg-gray-50 transition-colors">
                Cerrar
              </button>
              <button onClick={() => window.print()} className="flex-1 bg-[#0A2463] text-white font-bold py-3 rounded-xl text-sm hover:bg-[#1E4DB7] transition-colors flex items-center justify-center gap-2">
                <Download size={16} />
                Descargar PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}