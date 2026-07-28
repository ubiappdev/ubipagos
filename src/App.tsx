import { useState } from 'react';
import { Home, CreditCard, Receipt, Download } from 'lucide-react';
import DashboardTab from './components/DashboardTab';
import PaymentTab from './components/PaymentTab';
import HistoryTab from './components/HistoryTab';

type Tab = 'inicio' | 'pago' | 'historial';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('inicio');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedItemType, setSelectedItemType] = useState<'debt' | 'arancel' | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(true);

  const handlePayDebt = (debtId: string) => {
    setSelectedItemId(debtId);
    setSelectedItemType('debt');
    setActiveTab('pago');
  };

  const handlePayArancel = (arancelId: string) => {
    setSelectedItemId(arancelId);
    setSelectedItemType('arancel');
    setActiveTab('pago');
  };

  const handleBackFromPayment = () => {
    setSelectedItemId(null);
    setSelectedItemType(null);
    setActiveTab('inicio');
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'inicio', label: 'Inicio', icon: Home },
    { id: 'pago', label: 'Pago', icon: CreditCard },
    { id: 'historial', label: 'Historial', icon: Receipt },
  ];

  return (
    <div className="min-h-screen bg-gray-200 flex items-center justify-center p-0 sm:p-6">
      {/* Phone Frame */}
      <div className="relative w-full sm:w-[400px] h-screen sm:h-[850px] bg-gray-100 sm:rounded-[2.5rem] sm:border-[10px] sm:border-gray-900 sm:shadow-2xl overflow-hidden flex flex-col">
        {/* Notch (web only) */}
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
            <svg width="14" height="10" viewBox="0 0 14 10" fill="currentColor">
              <path d="M7 0C4.5 0 2.2 1 .5 2.5l1 1C3 2.3 5 1.5 7 1.5s4 .8 5.5 2l1-1C11.8 1 9.5 0 7 0z" />
              <path d="M7 3C5.3 3 3.7 3.7 2.5 4.7l1 1C4.4 5 5.7 4.5 7 4.5s2.6.5 3.5 1.2l1-1C10.3 3.7 8.7 3 7 3z" />
              <circle cx="7" cy="8" r="1.5" />
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
            <div className="w-9 h-9 bg-[#0A2463] rounded-xl flex items-center justify-center">
              <span className="text-white font-extrabold text-sm">UBI</span>
            </div>
            <div>
              <p className="text-[#0A2463] font-bold text-sm leading-tight">Portal Financiero</p>
              <p className="text-gray-400 text-xs leading-tight">Universidad Boliviana de Informatica</p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <span className="text-gray-500 font-bold text-xs">CE</span>
          </div>
        </div>

        {/* Install Banner */}
        {showInstallBanner && (
          <div className="bg-gradient-to-r from-[#0A2463] to-[#1E4DB7] text-white px-4 py-2.5 flex items-center gap-3 z-30">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Download size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold">Instalar App en tu celular</p>
              <p className="text-blue-200 text-xs truncate">Para acceso rapido desde tu pantalla de inicio</p>
            </div>
            <button className="bg-white text-[#0A2463] text-xs font-bold px-3 py-1.5 rounded-lg flex-shrink-0 active:scale-95 transition-transform">
              Instalar
            </button>
            <button
              onClick={() => setShowInstallBanner(false)}
              className="text-white/60 hover:text-white flex-shrink-0 text-lg leading-none"
            >
              ×
            </button>
          </div>
        )}

        {/* Content area */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {activeTab === 'inicio' && (
            <DashboardTab onPayDebt={handlePayDebt} onPayArancel={handlePayArancel} />
          )}
          {activeTab === 'pago' && (
            <PaymentTab
              selectedItemId={selectedItemId}
              selectedItemType={selectedItemType}
              onBack={handleBackFromPayment}
            />
          )}
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
                className="flex flex-col items-center gap-1 px-6 py-1 transition-all"
              >
                <div
                  className={`transition-all ${
                    isActive ? 'scale-110' : 'scale-100'
                  }`}
                >
                  <Icon
                    size={22}
                    className={isActive ? 'text-[#0A2463]' : 'text-gray-400'}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>
                <span
                  className={`text-xs font-semibold transition-colors ${
                    isActive ? 'text-[#0A2463]' : 'text-gray-400'
                  }`}
                >
                  {tab.label}
                </span>
                {isActive && (
                  <div className="w-1 h-1 bg-[#0A2463] rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default App;
