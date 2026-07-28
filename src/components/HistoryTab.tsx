import { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  XCircle,
  Download,
  FileText,
  X,
} from 'lucide-react';
import { transactions, Transaction } from '../data/mockData';
import { student } from '../data/mockData';

const statusConfig = {
  aprobado: {
    label: 'Aprobado',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    dot: 'bg-emerald-500',
    icon: CheckCircle2,
  },
  pendiente: {
    label: 'Pendiente',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    dot: 'bg-amber-500',
    icon: Clock,
  },
  rechazado: {
    label: 'Rechazado',
    color: 'text-red-600',
    bg: 'bg-red-50',
    dot: 'bg-red-500',
    icon: XCircle,
  },
};

type FilterType = 'todos' | 'aprobado' | 'pendiente' | 'rechazado';

export default function HistoryTab() {
  const [filter, setFilter] = useState<FilterType>('todos');
  const [receiptTx, setReceiptTx] = useState<Transaction | null>(null);

  const filtered = filter === 'todos'
    ? transactions
    : transactions.filter((t) => t.status === filter);

  const totalAprobado = transactions
    .filter((t) => t.status === 'aprobado')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* Summary */}
      <div className="mx-4 mt-4 bg-gradient-to-br from-[#0A2463] to-[#1E4DB7] rounded-2xl p-5 shadow-lg">
        <p className="text-white/70 text-xs uppercase tracking-wide">Total Pagado (Aprobado)</p>
        <p className="text-white font-extrabold text-3xl mt-1">
          Bs {totalAprobado.toLocaleString('es-BO')}
        </p>
        <div className="flex gap-4 mt-4 pt-4 border-t border-white/20">
          <div className="flex-1">
            <p className="text-white/60 text-xs">Transacciones</p>
            <p className="text-white font-bold text-lg">{transactions.length}</p>
          </div>
          <div className="flex-1">
            <p className="text-white/60 text-xs">Aprobadas</p>
            <p className="text-emerald-400 font-bold text-lg">
              {transactions.filter((t) => t.status === 'aprobado').length}
            </p>
          </div>
          <div className="flex-1">
            <p className="text-white/60 text-xs">Pendientes</p>
            <p className="text-amber-400 font-bold text-lg">
              {transactions.filter((t) => t.status === 'pendiente').length}
            </p>
          </div>
        </div>
      </div>

      {/* Filter pills */}
      <div className="mx-4 flex gap-2 overflow-x-auto pb-1">
        {([
          { key: 'todos', label: 'Todos' },
          { key: 'aprobado', label: 'Aprobados' },
          { key: 'pendiente', label: 'Pendientes' },
          { key: 'rechazado', label: 'Rechazados' },
        ] as { key: FilterType; label: string }[]).map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              filter === f.key
                ? 'bg-[#0A2463] text-white shadow-md'
                : 'bg-white text-gray-500 border border-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Transaction list */}
      <div className="mx-4 flex flex-col gap-3">
        {filtered.length === 0 && (
          <div className="text-center py-10 text-gray-400 text-sm">
            No hay transacciones en esta categoria.
          </div>
        )}
        {filtered.map((tx) => {
          const cfg = statusConfig[tx.status];
          const StatusIcon = cfg.icon;
          return (
            <div
              key={tx.id}
              className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3"
            >
              <div className={`w-11 h-11 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                <StatusIcon size={20} className={cfg.color} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-800 font-semibold text-sm truncate">{tx.concept}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-gray-400 text-xs">{tx.date}</span>
                  <span className="text-gray-300">·</span>
                  <span className="text-gray-400 text-xs font-mono">{tx.transactionNumber}</span>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[#0A2463] font-bold text-sm">
                    Bs {tx.amount.toLocaleString('es-BO')}
                  </span>
                  <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                </div>
              </div>
              {tx.status === 'aprobado' && (
                <button
                  onClick={() => setReceiptTx(tx)}
                  className="flex-shrink-0 w-9 h-9 rounded-xl bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors active:scale-90"
                  title="Descargar Constancia"
                >
                  <Download size={16} className="text-[#0A2463]" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Receipt Modal */}
      {receiptTx && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setReceiptTx(null)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-sm max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Receipt header */}
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
              <button
                onClick={() => setReceiptTx(null)}
                className="text-gray-300 hover:text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            {/* Receipt body */}
            <div className="p-5 flex flex-col gap-3">
              <div className="text-center pb-3 border-b border-dashed border-gray-200">
                <p className="text-[#0A2463] font-extrabold text-lg">UNIVERSIDAD BOLIVIANA DE INFORMATICA</p>
                <p className="text-gray-400 text-xs mt-0.5">NIT: 1023456789 · La Paz, Bolivia</p>
              </div>

              <div className="flex justify-between py-1.5">
                <span className="text-gray-400 text-xs">N° Transaccion:</span>
                <span className="text-gray-700 font-mono text-xs font-bold">{receiptTx.transactionNumber}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-gray-400 text-xs">Fecha:</span>
                <span className="text-gray-700 text-xs">{receiptTx.date}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-gray-400 text-xs">Estudiante:</span>
                <span className="text-gray-700 text-xs font-medium text-right">{student.name}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-gray-400 text-xs">RU:</span>
                <span className="text-gray-700 text-xs font-mono">{student.ru}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-gray-400 text-xs">Carrera:</span>
                <span className="text-gray-700 text-xs">{student.career}</span>
              </div>

              <div className="border-t border-dashed border-gray-200 pt-3 mt-1">
                <div className="flex justify-between py-1.5">
                  <span className="text-gray-400 text-xs">Concepto:</span>
                  <span className="text-gray-700 text-xs text-right max-w-[60%]">{receiptTx.concept}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-gray-400 text-xs">Metodo:</span>
                  <span className="text-gray-700 text-xs">Transferencia QR · Banco Ganadero</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-gray-400 text-xs">Estado:</span>
                  <span className="text-emerald-600 text-xs font-bold">APROBADO</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mt-2 flex justify-between items-center">
                <span className="text-gray-500 font-semibold text-sm">Total Pagado</span>
                <span className="text-[#0A2463] font-extrabold text-xl">
                  Bs {receiptTx.amount.toLocaleString('es-BO')}
                </span>
              </div>

              <div className="text-center pt-3">
                <p className="text-gray-300 text-xs italic">
                  Este documento es una constancia electronica generada automaticamente.
                </p>
                <p className="text-gray-300 text-xs italic mt-1">
                  Verifica la autenticidad en portal.ubi.edu.bo
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 flex gap-3">
              <button
                onClick={() => setReceiptTx(null)}
                className="flex-1 border border-gray-200 text-gray-500 font-semibold py-3 rounded-xl text-sm hover:bg-gray-50 transition-colors"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  alert('Descargando constancia...');
                }}
                className="flex-1 bg-[#0A2463] text-white font-bold py-3 rounded-xl text-sm hover:bg-[#1E4DB7] transition-colors flex items-center justify-center gap-2"
              >
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
