import { useState } from 'react';
import { Home, CreditCard, Mail, Receipt, LogOut } from 'lucide-react';
import { AuthProvider, useAuth } from './lib/auth';
import AuthScreen from './components/AuthScreen';
import DashboardTab from './components/DashboardTab';
import PaymentTab from './components/PaymentTab';
import BuzonTab from './components/BuzonTab';
import HistoryTab from './components/HistoryTab';

type Tab = 'inicio' | 'pago' | 'buzon' | 'historial';

function AppContent() {
  const { user, loading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('inicio');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [selectedItemType, setSelectedItemType] = useState<'mensualidad' | 'arancel' | null>(null);

  const handlePayMensualidad = (id: string) => {
    handlePayMensualidades([id]);
  };

  const handlePayMensualidades = (ids: string[]) => {
    setSelectedItemId(ids[0] ?? null);
    setSelectedItemIds(ids);
    setSelectedItemType('mensualidad');
    setActiveTab('pago');
  };

  const handlePayArancel = (id: string) => {
    setSelectedItemId(id);
    setSelectedItemIds([]);
    setSelectedItemType('arancel');
    setActiveTab('pago');
  };

  const handleBackFromPayment = () => {
    setSelectedItemId(null);
    setSelectedItemType(null);
    setActiveTab('inicio');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-200 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#0A2463] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-200 flex items-center justify-center p-0 sm:p-6">
        <div className="relative w-full sm:w-[400px] h-screen sm:h-[850px] bg-gray-100 sm:rounded-[2.5rem] sm:border-[10px] sm:border-gray-900 sm:shadow-2xl overflow-hidden flex flex-col">
          <div className="hidden sm:block absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-2xl z-50" />
          <AuthScreen />
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'inicio', label: 'Inicio', icon: Home },
    { id: 'pago', label: 'Pago', icon: CreditCard },
    { id: 'buzon', label: 'Buzon', icon: Mail },
    { id: 'historial', label: 'Historial', icon: Receipt },
  ];

  return (
    <div className="min-h-screen bg-gray-200 flex items-center justify-center p-0 sm:p-6">
      <div className="relative w-full sm:w-[400px] h-screen sm:h-[850px] bg-gray-100 sm:rounded-[2.5rem] sm:border-[10px] sm:border-gray-900 sm:shadow-2xl overflow-hidden flex flex-col">
        <div className="hidden sm:block absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-2xl z-50" />

        {/* Status bar */}
        <div className="bg-[#0A2463] text-white flex items-center justify-between px-5 py-2 text-xs font-medium z-40">
          <span className="font-mono">9:41</span>
          <div className="flex items-center gap-1.5">
            <svg width="14" height="10" viewBox="0 0 14 10" fill="currentColor">
              <rect x="0" y="6" width="2" height="4" rx="0.5" />
              <rect x="3" y="4" width="2" height="6" rx="0.5" />
              <rect x="6" y="2" width="2" height="8" rx="0.5" />
              <rect x="9" y="0" width="2" height="10" rx="0.5" />
            </svg>
            <div className="flex items-center">
              <div className="w-6 h-3 border border-white rounded-sm relative">
                <div className="absolute inset-0.5 bg-white rounded-sm" style={{ width: '75%' }} />
              </div>
              <div className="w-0.5 h-1.5 bg-white rounded-r ml-0.5" />
            </div>
          </div>
        </div>

        {/* App Header */}
        <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between z-30">
          <div className="flex items-center gap-2.5">
            <img 
              src="https://ahjgfwpqugokzksfoufu.supabase.co/storage/v1/object/public/configuracion-pagos/ubi.jpeg" 
              alt="Logo UBI" 
              className="w-9 h-9 object-contain flex-shrink-0" 
            />
            <div>
              <p className="text-[#0A2463] font-bold text-sm leading-tight">Portal Financiero</p>
              <p className="text-gray-400 text-xs leading-tight">Universidad Boliviana de Informatica</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            title="Cerrar sesion"
          >
            <LogOut size={14} className="text-gray-500" />
          </button>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {activeTab === 'inicio' && (
            <DashboardTab onPayMensualidad={handlePayMensualidad} onPayMensualidades={handlePayMensualidades} onPayArancel={handlePayArancel} />
          )}
          {activeTab === 'pago' && (
            <PaymentTab
              selectedItemId={selectedItemId}
              selectedItemType={selectedItemType}
              selectedItemIds={selectedItemIds}
              onBack={handleBackFromPayment}
            />
          )}
          {activeTab === 'buzon' && <BuzonTab />}
          {activeTab === 'historial' && <HistoryTab />}
        </div>

        {/* Bottom Tab Bar */}
        <div className="bg-white border-t border-gray-100 flex items-center justify-around py-2 pb-3 z-40">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex flex-col items-center gap-1 px-4 py-1 transition-all"
              >
                <div className={`transition-all ${isActive ? 'scale-110' : 'scale-100'}`}>
                  <Icon size={20} className={isActive ? 'text-[#0A2463]' : 'text-gray-400'} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-xs font-semibold transition-colors ${isActive ? 'text-[#0A2463]' : 'text-gray-400'}`}>
                  {tab.label}
                </span>
                {isActive && <div className="w-1 h-1 bg-[#0A2463] rounded-full" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}