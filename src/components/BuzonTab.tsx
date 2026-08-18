import { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  BellOff,
  Mail,
  MailOpen,
  Loader2,
  Info,
  CreditCard,
  Award,
  PartyPopper,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import type { BuzonMensaje } from '../lib/supabase';

const tipoConfig: Record<string, { icon: React.ElementType; bg: string; color: string; label: string }> = {
  PAGO: { icon: CreditCard, bg: 'bg-blue-50', color: 'text-blue-600', label: 'Pago' },
  ARANCEL: { icon: Award, bg: 'bg-amber-50', color: 'text-amber-600', label: 'Arancel' },
  BIENVENIDA: { icon: PartyPopper, bg: 'bg-emerald-50', color: 'text-emerald-600', label: 'Bienvenida' },
  INFO: { icon: Info, bg: 'bg-gray-100', color: 'text-gray-500', label: 'Info' },
};

export default function BuzonTab() {
  const { alumno } = useAuth();
  const [mensajes, setMensajes] = useState<BuzonMensaje[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchMensajes = useCallback(async () => {
    if (!alumno) return;
    setLoading(true);
    const { data } = await supabase
      .from('buzon_mensajes')
      .select('*')
      .eq('alumno_id', alumno.id)
      .order('created_at', { ascending: false });
    setMensajes(data ?? []);
    setLoading(false);
  }, [alumno]);

  useEffect(() => { fetchMensajes(); }, [fetchMensajes]);

  const toggleMensaje = async (msg: BuzonMensaje) => {
    if (expandedId === msg.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(msg.id);
    if (!msg.leido) {
      await supabase
        .from('buzon_mensajes')
        .update({ leido: true })
        .eq('id', msg.id);
      setMensajes((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, leido: true } : m))
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Loader2 size={28} className="text-[#0A2463] animate-spin" />
      </div>
    );
  }

  const noLeidos = mensajes.filter((m) => !m.leido).length;

  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* Header */}
      <div className="mx-4 mt-4 bg-gradient-to-br from-[#0A2463] to-[#1E4DB7] rounded-2xl p-5 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center">
            <Bell size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold text-base">Buzon de Comunicados</h2>
            <p className="text-blue-200 text-xs mt-0.5">
              {noLeidos > 0 ? `${noLeidos} mensajes sin leer` : 'Todos los mensajes leidos'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="mx-4 flex flex-col gap-3">
        {mensajes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <BellOff size={28} className="text-gray-400" />
            </div>
            <p className="text-gray-400 text-sm font-medium">No tienes comunicados</p>
            <p className="text-gray-300 text-xs">Los mensajes sobre pagos y aranceles apareceran aqui</p>
          </div>
        ) : (
          mensajes.map((msg) => {
            const cfg = tipoConfig[msg.tipo] ?? tipoConfig.INFO;
            const Icon = cfg.icon;
            const isExpanded = expandedId === msg.id;
            return (
              <button
                key={msg.id}
                onClick={() => toggleMensaje(msg)}
                className={`bg-white rounded-2xl p-4 shadow-sm text-left transition-all active:scale-[0.99] ${
                  !msg.leido ? 'border-l-4 border-[#0A2463]' : 'border-l-4 border-transparent'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={18} className={cfg.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm font-semibold leading-tight ${msg.leido ? 'text-gray-600' : 'text-gray-800'}`}>
                        {msg.titulo}
                      </p>
                      {msg.leido ? (
                        <MailOpen size={14} className="text-gray-300 flex-shrink-0" />
                      ) : (
                        <Mail size={14} className="text-[#0A2463] flex-shrink-0" />
                      )}
                    </div>
                    <p className={`text-xs mt-1 ${isExpanded ? 'text-gray-600 leading-relaxed' : 'text-gray-400 truncate'}`}>
                      {msg.cuerpo}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.color}`}>
                        {cfg.label}
                      </span>
                      <span className="text-gray-300 text-xs">
                        {new Date(msg.created_at).toLocaleDateString('es-BO', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
