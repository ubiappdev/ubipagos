import { useState } from 'react';
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
  Bell,
} from 'lucide-react';
import { student, activeDebts, aranceles, Arancel } from '../data/mockData';

const iconMap: Record<string, React.ElementType> = {
  BookOpen,
  FileText,
  GraduationCap,
  Award,
  ScrollText,
  CreditCard,
};

interface DashboardTabProps {
  onPayDebt: (debtId: string) => void;
  onPayArancel: (arancelId: string) => void;
}

export default function DashboardTab({ onPayDebt, onPayArancel }: DashboardTabProps) {
  const [notifDismissed, setNotifDismissed] = useState(false);

  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* Notification Banner */}
      {!notifDismissed && (
        <div className="mx-4 mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-start gap-3">
          <div className="bg-amber-100 rounded-full p-1.5 flex-shrink-0 mt-0.5">
            <Bell size={14} className="text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-amber-800">Instala la app en tu celular</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Accede rapidamente desde tu pantalla de inicio sin abrir el navegador.
            </p>
          </div>
          <button
            onClick={() => setNotifDismissed(true)}
            className="text-amber-400 hover:text-amber-600 flex-shrink-0 text-lg leading-none"
          >
            ×
          </button>
        </div>
      )}

      {/* Student Card */}
      <div className="mx-4 bg-gradient-to-br from-[#0A2463] to-[#1E4DB7] rounded-2xl p-5 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 border-2 border-white/30">
            <User size={26} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white/70 text-xs font-medium uppercase tracking-wide">Estudiante</p>
            <h2 className="text-white font-bold text-base leading-tight mt-0.5">
              {student.name}
            </h2>
            <p className="text-blue-200 text-xs mt-1">{student.career}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="bg-white/15 text-white/90 text-xs px-2.5 py-1 rounded-full font-mono">
                {student.ru}
              </span>
              <span className="text-white/60 text-xs">{student.semester}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between">
          <div>
            <p className="text-white/60 text-xs">Estado Financiero</p>
            <div className="flex items-center gap-1.5 mt-1">
              {student.financialStatus === 'al-dia' ? (
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
            <p className="text-white font-bold text-lg">
              Bs{' '}
              {activeDebts.reduce((sum, d) => sum + d.amount, 0).toLocaleString('es-BO')}
            </p>
          </div>
        </div>
      </div>

      {/* Active Debts */}
      <div className="mx-4">
        <h3 className="text-[#0A2463] font-bold text-sm mb-3 uppercase tracking-wide">
          Deudas Activas
        </h3>
        <div className="flex flex-col gap-3">
          {activeDebts.map((debt) => {
            const isOverdue = debt.daysLeft < 0;
            const isUrgent = debt.daysLeft >= 0 && debt.daysLeft <= 5;
            return (
              <div
                key={debt.id}
                className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 ${
                  isOverdue
                    ? 'border-red-500'
                    : isUrgent
                    ? 'border-amber-400'
                    : 'border-blue-400'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {isOverdue ? (
                        <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                      ) : (
                        <Clock size={14} className="text-amber-500 flex-shrink-0" />
                      )}
                      <p className="text-gray-800 font-semibold text-sm">{debt.concept}</p>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[#0A2463] font-bold text-base">
                        Bs {debt.amount.toLocaleString('es-BO')}
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
                          ? `Vencio hace ${Math.abs(debt.daysLeft)} dias`
                          : `Vence en ${debt.daysLeft} dias`}
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs mt-1">Vencimiento: {debt.dueDate}</p>
                  </div>
                  <button
                    onClick={() => onPayDebt(debt.id)}
                    className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition-transform active:scale-95 ${
                      isOverdue ? 'bg-red-500' : 'bg-[#0A2463]'
                    }`}
                  >
                    Pagar ahora
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Access - Aranceles */}
      <div className="mx-4">
        <h3 className="text-[#0A2463] font-bold text-sm mb-3 uppercase tracking-wide">
          Aranceles y Tramites
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {aranceles.map((arancel: Arancel) => {
            const Icon = iconMap[arancel.icon] ?? FileText;
            return (
              <button
                key={arancel.id}
                onClick={() => onPayArancel(arancel.id)}
                className="bg-white rounded-2xl p-4 shadow-sm text-left hover:shadow-md transition-all active:scale-95 group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center mb-3 transition-colors">
                  <Icon size={20} className="text-[#0A2463]" />
                </div>
                <p className="text-gray-800 font-semibold text-xs leading-tight">{arancel.name}</p>
                <p className="text-gray-400 text-xs mt-0.5">{arancel.description}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[#0A2463] font-bold text-sm">
                    Bs {arancel.amount.toLocaleString('es-BO')}
                  </span>
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
