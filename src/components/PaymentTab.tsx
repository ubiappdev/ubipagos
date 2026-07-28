import { useState, useCallback } from 'react';
import {
  QrCode,
  Upload,
  CheckCircle2,
  X,
  AlertCircle,
  FileImage,
  Loader2,
  ChevronLeft,
  Smartphone,
  Building2,
  Pencil,
  ShoppingBag,
} from 'lucide-react';
import { activeDebts, aranceles } from '../data/mockData';

interface PaymentTabProps {
  selectedItemId: string | null;
  selectedItemType: 'debt' | 'arancel' | null;
  onBack: () => void;
}

type Step = 'detail' | 'qr' | 'upload' | 'processing' | 'success' | 'manual';

interface SuccessInfo {
  transactionNumber: string;
  amount: number;
  concept: string;
}

export default function PaymentTab({ selectedItemId, selectedItemType, onBack }: PaymentTabProps) {
  const [step, setStep] = useState<Step>('detail');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [successInfo, setSuccessInfo] = useState<SuccessInfo | null>(null);
  const [manualTx, setManualTx] = useState('');
  const [manualAmount, setManualAmount] = useState('');
  const [manualError, setManualError] = useState('');

  const item =
    selectedItemType === 'debt'
      ? activeDebts.find((d) => d.id === selectedItemId)
      : aranceles.find((a) => a.id === selectedItemId);

  const concept =
    selectedItemType === 'debt'
      ? (item as (typeof activeDebts)[0])?.concept
      : (item as (typeof aranceles)[0])?.name;

  const amount = item?.amount ?? 0;

  const handleFileSelect = useCallback(
    (file: File) => {
      const allowed = ['image/png', 'image/jpeg', 'application/pdf'];
      if (!allowed.includes(file.type)) return;
      setUploadedFile(file);
      setStep('processing');
      setTimeout(() => {
        const txNum = `#${Math.floor(8000000 + Math.random() * 999999)}`;
        setSuccessInfo({ transactionNumber: txNum, amount, concept: concept ?? '' });
        setStep('success');
      }, 3000);
    },
    [amount, concept]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleManualSubmit = () => {
    if (!manualTx.trim()) {
      setManualError('Ingresa el numero de transaccion.');
      return;
    }
    if (!manualAmount.trim() || isNaN(Number(manualAmount))) {
      setManualError('Ingresa un monto valido.');
      return;
    }
    setManualError('');
    setSuccessInfo({ transactionNumber: manualTx, amount: Number(manualAmount), concept: concept ?? '' });
    setStep('success');
  };

  const resetFlow = () => {
    setStep('detail');
    setUploadedFile(null);
    setSuccessInfo(null);
    setManualTx('');
    setManualAmount('');
    setManualError('');
    onBack();
  };

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-8 text-center">
        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center">
          <ShoppingBag size={36} className="text-[#0A2463]" />
        </div>
        <h2 className="text-[#0A2463] font-bold text-lg">Selecciona un pago</h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          Desde la pestana Inicio, selecciona una deuda activa o un arancel para iniciar el proceso de pago.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0A2463] to-[#1E4DB7] px-4 pt-4 pb-6">
        <button
          onClick={step === 'detail' ? onBack : () => setStep('detail')}
          className="flex items-center gap-1.5 text-white/70 hover:text-white mb-4 transition-colors text-sm"
        >
          <ChevronLeft size={18} />
          Volver
        </button>
        <h1 className="text-white font-bold text-lg">Realizar Pago</h1>
        <p className="text-blue-200 text-xs mt-1">{concept}</p>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mt-4">
          {['Detalle', 'Codigo QR', 'Comprobante'].map((label, i) => {
            const stepIndex = ['detail', 'qr', 'upload', 'processing', 'success', 'manual'].indexOf(step);
            const isActive = i === (stepIndex === 0 ? 0 : stepIndex <= 1 ? 1 : 2);
            const isDone = i < (stepIndex === 0 ? 0 : stepIndex <= 1 ? 1 : 2);
            return (
              <div key={label} className="flex items-center gap-1.5">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isDone
                      ? 'bg-emerald-400 text-white'
                      : isActive
                      ? 'bg-white text-[#0A2463]'
                      : 'bg-white/20 text-white/50'
                  }`}
                >
                  {isDone ? '✓' : i + 1}
                </div>
                <span
                  className={`text-xs ${
                    isActive ? 'text-white font-semibold' : 'text-white/50'
                  }`}
                >
                  {label}
                </span>
                {i < 2 && <div className="w-6 h-px bg-white/20 mx-1" />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* STEP: DETAIL */}
        {step === 'detail' && (
          <>
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-4">
                Resumen de Pago
              </h3>
              <div className="flex justify-between items-center py-2.5 border-b border-gray-50">
                <span className="text-gray-500 text-sm">Concepto</span>
                <span className="text-gray-800 font-medium text-sm text-right max-w-[55%]">{concept}</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-gray-50">
                <span className="text-gray-500 text-sm">Moneda</span>
                <span className="text-gray-800 font-medium text-sm">Bolivianos (Bs)</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-gray-50">
                <span className="text-gray-500 text-sm">Banco receptor</span>
                <div className="flex items-center gap-2">
                  <Building2 size={14} className="text-[#0A2463]" />
                  <span className="text-gray-800 font-medium text-sm">Banco Ganadero</span>
                </div>
              </div>
              <div className="flex justify-between items-center pt-3 mt-1">
                <span className="text-gray-700 font-bold text-sm">Total a Pagar</span>
                <span className="text-[#0A2463] font-extrabold text-2xl">
                  Bs {amount.toLocaleString('es-BO')}
                </span>
              </div>
            </div>

            <div className="bg-blue-50 rounded-2xl p-4 flex gap-3">
              <Smartphone size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-blue-700 text-xs leading-relaxed">
                Se generara un codigo QR del <strong>Banco Ganadero</strong> para realizar la transferencia rapida desde tu app bancaria. Luego deberas subir el comprobante para verificacion.
              </p>
            </div>

            <button
              onClick={() => setStep('qr')}
              className="bg-[#0A2463] text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-[#1E4DB7] transition-colors active:scale-95"
            >
              Generar Pago QR
            </button>
          </>
        )}

        {/* STEP: QR */}
        {step === 'qr' && (
          <>
            <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col items-center">
              <div className="flex items-center gap-2 mb-4">
                <Building2 size={18} className="text-[#0A2463]" />
                <span className="text-[#0A2463] font-bold text-sm">Banco Ganadero</span>
              </div>
              <p className="text-gray-500 text-xs mb-4 text-center">
                Escanea este codigo QR con tu app bancaria para transferir
              </p>

              {/* QR Code simulation */}
              <div className="relative p-3 border-2 border-[#0A2463] rounded-2xl bg-white shadow-inner">
                <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                  {/* QR simulation with geometric pattern */}
                  <rect width="200" height="200" fill="white" />
                  {/* Top-left finder */}
                  <rect x="10" y="10" width="60" height="60" fill="#0A2463" rx="4" />
                  <rect x="18" y="18" width="44" height="44" fill="white" rx="2" />
                  <rect x="26" y="26" width="28" height="28" fill="#0A2463" rx="2" />
                  {/* Top-right finder */}
                  <rect x="130" y="10" width="60" height="60" fill="#0A2463" rx="4" />
                  <rect x="138" y="18" width="44" height="44" fill="white" rx="2" />
                  <rect x="146" y="26" width="28" height="28" fill="#0A2463" rx="2" />
                  {/* Bottom-left finder */}
                  <rect x="10" y="130" width="60" height="60" fill="#0A2463" rx="4" />
                  <rect x="18" y="138" width="44" height="44" fill="white" rx="2" />
                  <rect x="26" y="146" width="28" height="28" fill="#0A2463" rx="2" />
                  {/* Data modules */}
                  {[80,90,100,110,120].map(x =>
                    [10,20,30,40,50,60].map(y => (
                      Math.sin(x * y * 0.03) > 0 && (
                        <rect key={`${x}-${y}`} x={x} y={y} width="8" height="8" fill="#0A2463" />
                      )
                    ))
                  )}
                  {[10,20,30,40,50,60,70,80,90,100,110,120,130,140,150,160,170,180].map(x =>
                    [80,90,100,110,120,130,140,150,160,170,180].map(y => (
                      Math.cos(x * 0.7 + y * 0.5) > 0.1 && !(x < 75 && y > 125) && (
                        <rect key={`d-${x}-${y}`} x={x} y={y} width="8" height="8" fill="#0A2463" />
                      )
                    ))
                  )}
                  {/* Center logo placeholder */}
                  <rect x="85" y="85" width="30" height="30" fill="white" rx="4" />
                  <rect x="88" y="88" width="24" height="24" fill="#0A2463" rx="3" />
                  <text x="100" y="104" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">UBI</text>
                </svg>

                <div className="absolute inset-0 rounded-2xl border-4 border-transparent" />
              </div>

              <div className="mt-5 w-full bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-gray-400 text-xs">Monto a transferir</p>
                <p className="text-[#0A2463] font-extrabold text-2xl mt-1">
                  Bs {amount.toLocaleString('es-BO')}
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  Cuenta: 1004-56789-0 · Banco Ganadero S.A.
                </p>
              </div>

              <div className="mt-4 flex items-center gap-2 text-amber-600 bg-amber-50 rounded-xl px-4 py-3 w-full">
                <AlertCircle size={14} className="flex-shrink-0" />
                <p className="text-xs">Guarda el comprobante de tu transferencia para el siguiente paso.</p>
              </div>
            </div>

            <button
              onClick={() => setStep('upload')}
              className="bg-[#0A2463] text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-[#1E4DB7] transition-colors active:scale-95"
            >
              Ya realice la transferencia
            </button>
          </>
        )}

        {/* STEP: UPLOAD */}
        {step === 'upload' && (
          <>
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Upload size={18} className="text-[#0A2463]" />
                <h3 className="text-[#0A2463] font-bold text-sm">Subir Comprobante</h3>
              </div>
              <p className="text-gray-400 text-xs mb-5">
                Sube la captura o PDF de tu comprobante bancario. Nuestro sistema validara el pago automaticamente.
              </p>

              <label
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center w-full h-44 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                  dragOver
                    ? 'border-[#0A2463] bg-blue-50 scale-[1.02]'
                    : 'border-gray-200 bg-gray-50 hover:border-[#0A2463] hover:bg-blue-50'
                }`}
              >
                <input
                  type="file"
                  className="hidden"
                  accept=".png,.jpg,.jpeg,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                />
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-colors ${
                  dragOver ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <FileImage size={26} className={dragOver ? 'text-[#0A2463]' : 'text-gray-400'} />
                </div>
                <p className="text-gray-600 font-semibold text-sm">
                  {dragOver ? 'Suelta el archivo aqui' : 'Arrastra tu comprobante aqui'}
                </p>
                <p className="text-gray-400 text-xs mt-1">o haz clic para seleccionar</p>
                <p className="text-gray-300 text-xs mt-3">PNG, JPG o PDF · Max. 10 MB</p>
              </label>
            </div>

            <button
              onClick={() => setStep('manual')}
              className="flex items-center justify-center gap-2 border-2 border-gray-200 text-gray-500 font-semibold py-3.5 rounded-2xl hover:border-[#0A2463] hover:text-[#0A2463] transition-all text-sm"
            >
              <Pencil size={15} />
              Activar Validacion Manual (Bypass)
            </button>
          </>
        )}

        {/* STEP: PROCESSING */}
        {step === 'processing' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 py-10">
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
              <div className="absolute inset-0 rounded-full border-4 border-[#0A2463] border-t-transparent animate-spin" />
              <div className="absolute inset-4 rounded-full bg-blue-50 flex items-center justify-center">
                <QrCode size={28} className="text-[#0A2463]" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-[#0A2463] font-bold text-lg">Analizando comprobante con IA...</h3>
              <p className="text-gray-400 text-sm mt-2">
                Verificando datos del comprobante
              </p>
              {uploadedFile && (
                <div className="mt-4 bg-gray-50 rounded-xl px-4 py-2.5 inline-flex items-center gap-2">
                  <FileImage size={14} className="text-gray-400" />
                  <span className="text-gray-500 text-xs truncate max-w-[180px]">{uploadedFile.name}</span>
                </div>
              )}
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div className="h-full bg-[#0A2463] rounded-full animate-progress-bar" />
            </div>
          </div>
        )}

        {/* STEP: SUCCESS */}
        {step === 'success' && successInfo && (
          <div className="flex flex-col items-center gap-5 py-4">
            <div className="relative">
              <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center">
                <CheckCircle2 size={52} className="text-emerald-500" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
                <span className="text-lg">🎉</span>
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-gray-800 font-extrabold text-xl">Pago en Verificacion</h2>
              <p className="text-gray-400 text-sm mt-2 leading-relaxed">
                Tu comprobante fue recibido exitosamente. El equipo financiero de la UBI lo verificara en breve.
              </p>
            </div>

            <div className="w-full bg-white rounded-2xl p-5 shadow-sm border border-emerald-100">
              <div className="flex justify-between py-2.5 border-b border-gray-50">
                <span className="text-gray-400 text-sm">Concepto</span>
                <span className="text-gray-700 font-medium text-sm text-right max-w-[55%]">{successInfo.concept}</span>
              </div>
              <div className="flex justify-between py-2.5 border-b border-gray-50">
                <span className="text-gray-400 text-sm">Monto</span>
                <span className="text-[#0A2463] font-bold text-sm">Bs {successInfo.amount.toLocaleString('es-BO')}</span>
              </div>
              <div className="flex justify-between py-2.5 border-b border-gray-50">
                <span className="text-gray-400 text-sm">N° Transaccion</span>
                <span className="text-gray-700 font-bold text-sm font-mono">{successInfo.transactionNumber}</span>
              </div>
              <div className="flex justify-between pt-2.5">
                <span className="text-gray-400 text-sm">Estado</span>
                <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">
                  En verificacion
                </span>
              </div>
            </div>

            <div className="w-full bg-blue-50 rounded-2xl p-4 flex gap-3">
              <AlertCircle size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-blue-700 text-xs leading-relaxed">
                Recibiras una notificacion por <strong>WhatsApp</strong> y <strong>correo electronico</strong> cuando tu pago sea aprobado.
              </p>
            </div>

            <button
              onClick={resetFlow}
              className="w-full bg-[#0A2463] text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-[#1E4DB7] transition-colors active:scale-95"
            >
              Volver al inicio
            </button>
          </div>
        )}

        {/* STEP: MANUAL */}
        {step === 'manual' && (
          <>
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Pencil size={18} className="text-[#0A2463]" />
                <h3 className="text-[#0A2463] font-bold text-sm">Validacion Manual</h3>
              </div>
              <p className="text-gray-400 text-xs mb-5">
                Ingresa manualmente los datos de tu transferencia bancaria para solicitar verificacion.
              </p>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-gray-600 text-xs font-semibold block mb-1.5">
                    Numero de Transaccion Bancaria
                  </label>
                  <input
                    type="text"
                    value={manualTx}
                    onChange={(e) => setManualTx(e.target.value)}
                    placeholder="Ej. 8472917"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0A2463] focus:ring-2 focus:ring-[#0A2463]/10 transition-all"
                  />
                </div>
                <div>
                  <label className="text-gray-600 text-xs font-semibold block mb-1.5">
                    Monto Transferido (Bs)
                  </label>
                  <input
                    type="number"
                    value={manualAmount}
                    onChange={(e) => setManualAmount(e.target.value)}
                    placeholder={`Ej. ${amount}`}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0A2463] focus:ring-2 focus:ring-[#0A2463]/10 transition-all"
                  />
                </div>
                <div>
                  <label className="text-gray-600 text-xs font-semibold block mb-1.5">
                    Concepto
                  </label>
                  <input
                    type="text"
                    value={concept}
                    disabled
                    className="w-full border border-gray-100 bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-400"
                  />
                </div>
                {manualError && (
                  <div className="flex items-center gap-2 text-red-500 bg-red-50 rounded-xl px-4 py-3">
                    <X size={14} className="flex-shrink-0" />
                    <p className="text-xs">{manualError}</p>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleManualSubmit}
              className="bg-[#0A2463] text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-[#1E4DB7] transition-colors active:scale-95"
            >
              Enviar para Verificacion
            </button>
            <button
              onClick={() => setStep('upload')}
              className="flex items-center justify-center gap-2 text-gray-400 text-sm py-2"
            >
              <ChevronLeft size={14} />
              Volver a subir comprobante
            </button>
          </>
        )}
      </div>
    </div>
  );
}
