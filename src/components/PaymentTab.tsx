import { useState, useCallback, useEffect } from 'react';
import {
  QrCode,
  Upload,
  CheckCircle2,
  X,
  AlertCircle,
  FileImage,
  ChevronLeft,
  Smartphone,
  Building2,
  Wallet,
  Banknote,
  MapPin,
  Clock,
  Landmark,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import type { Mensualidad, Arancel } from '../lib/supabase';

interface PaymentTabProps {
  selectedItemId: string | null;
  selectedItemIds: string[];
  selectedItemType: 'mensualidad' | 'arancel' | null;
  onBack: () => void;
}

type Step = 'detail' | 'method' | 'qr' | 'deposito' | 'efectivo' | 'transferencia' | 'upload' | 'processing' | 'success' | 'error';
type Method = 'QR' | 'DEPOSITO' | 'EFECTIVO' | 'TRANSFERENCIA';

const methodLabels: Record<Method, string> = {
  QR: 'Pago QR',
  DEPOSITO: 'Deposito Bancario',
  EFECTIVO: 'Pago en Efectivo',
  TRANSFERENCIA: 'Transferencia Interbancaria',
};

export default function PaymentTab({ selectedItemId, selectedItemIds, selectedItemType, onBack }: PaymentTabProps) {
  const { alumno } = useAuth();
  const [step, setStep] = useState<Step>('detail');
  const [selectedMethod, setSelectedMethod] = useState<Method | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<{ id: string; concept: string; amount: number } | null>(null);
  const [, setPagoId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const monthlyIds = selectedItemIds.length ? selectedItemIds : selectedItemId ? [selectedItemId] : [];
    if (!alumno || !selectedItemType || (selectedItemType === 'mensualidad' ? monthlyIds.length === 0 : !selectedItemId)) return;
    const fetch = async () => {
      setLoading(true);
      if (selectedItemType === 'mensualidad') {
        const { data } = await supabase
          .from('alumnos_mensualidades')
          .select('*')
          .in('id', monthlyIds)
          .order('nro_cuota', { ascending: true });
        const mensualidades = (data ?? []) as Mensualidad[];
        if (mensualidades.length) {
          setItem({
            id: monthlyIds.join(','),
            concept: `Mensualidades: ${mensualidades.map((m) => `${m.mes_referencia} ${m.gestion_anio}`).join(', ')}`,
            amount: mensualidades.reduce((total, mensualidad) => total + Number(mensualidad.monto_con_descuento), 0),
          });
        }
      } else {
        const { data } = await supabase
          .from('aranceles_conceptos')
          .select('*')
          .eq('id', selectedItemId)
          .maybeSingle();
        if (data) {
          const a = data as Arancel;
          setItem({ id: a.id, concept: a.concepto, amount: Number(a.monto) });
        }
      }
      setLoading(false);
    };
    fetch();
  }, [alumno, selectedItemId, selectedItemIds, selectedItemType]);

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!alumno || !item || !selectedMethod) return;
      const allowed = ['image/png', 'image/jpeg', 'image/jpg'];
      if (!allowed.includes(file.type)) {
        setErrorMsg('Solo se aceptan imagenes PNG o JPG.');
        return;
      }
      setUploadedFile(file);
      setStep('processing');

      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${alumno.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('comprobantes')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const txNum = `#${Math.floor(8000000 + Math.random() * 999999)}`;

        const insertData: Record<string, unknown> = {
          alumno_id: alumno.id,
          monto_pagado: item.amount,
          canal_pago: selectedMethod,
          numero_transaccion: txNum,
          fecha_pago: new Date().toISOString(),
          comprobante_url: fileName,
          concepto: item.concept,
          estado_conciliacion: 'PENDIENTE',
        };

        if (selectedItemType === 'mensualidad') {
          const monthlyIds = selectedItemIds.length ? selectedItemIds : [item.id];
          insertData.mensualidad_id = monthlyIds[0];
          insertData.mensualidad_ids = monthlyIds;
        } else {
          insertData.arancel_id = item.id;
        }

        const { data: pagoData, error: insertError } = await supabase
          .from('alumnos_pagos')
          .insert(insertData)
          .select('id')
          .maybeSingle();

        if (insertError) throw insertError;
        setPagoId(pagoData?.id ?? null);

        try {
          const validationResponse = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/validar-comprobante`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              },
              body: JSON.stringify({ pagoId: pagoData?.id }),
            }
          );
          if (!validationResponse.ok) {
            console.warn('El comprobante quedo pendiente de validacion.');
          }
        } catch {
          console.warn('El comprobante quedo pendiente de validacion.');
        }

        setStep('success');
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Error al subir el comprobante');
        setStep('error');
      }
    },
    [alumno, item, selectedMethod, selectedItemType, selectedItemIds]
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

  const resetFlow = () => {
    setStep('detail');
    setSelectedMethod(null);
    setUploadedFile(null);
    setPagoId(null);
    setErrorMsg('');
    onBack();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Loader2 size={28} className="text-[#0A2463] animate-spin" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-8 text-center">
        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center">
          <Wallet size={36} className="text-[#0A2463]" />
        </div>
        <h2 className="text-[#0A2463] font-bold text-lg">Selecciona un pago</h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          Desde la pestana Inicio, selecciona una mensualidad o arancel para iniciar el proceso de pago.
        </p>
      </div>
    );
  }

  const stepIndex = ['detail', 'method', 'qr', 'deposito', 'efectivo', 'transferencia', 'upload', 'processing', 'success', 'error'].indexOf(step);
  const currentStepLabel = stepIndex <= 1 ? 0 : stepIndex <= 5 ? 1 : 2;

  const goBack = () => {
    if (step === 'detail') { onBack(); return; }
    if (step === 'method') { setStep('detail'); return; }
    if (['qr', 'deposito', 'efectivo', 'transferencia'].includes(step)) { setStep('method'); return; }
    if (['upload', 'processing', 'success', 'error'].includes(step)) {
      setStep(selectedMethod === 'QR' ? 'qr' : selectedMethod === 'DEPOSITO' ? 'deposito' : selectedMethod === 'EFECTIVO' ? 'efectivo' : 'transferencia');
      return;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0A2463] to-[#1E4DB7] px-4 pt-4 pb-6">
        <button onClick={goBack} className="flex items-center gap-1.5 text-white/70 hover:text-white mb-4 transition-colors text-sm">
          <ChevronLeft size={18} />
          Volver
        </button>
        <h1 className="text-white font-bold text-lg">Realizar Pago</h1>
        <p className="text-blue-200 text-xs mt-1">{item.concept}</p>

        <div className="flex items-center gap-2 mt-4">
          {['Detalle', 'Metodo', 'Comprobante'].map((label, i) => {
            const isActive = i === currentStepLabel;
            const isDone = i < currentStepLabel;
            return (
              <div key={label} className="flex items-center gap-1.5">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isDone ? 'bg-emerald-400 text-white' : isActive ? 'bg-white text-[#0A2463]' : 'bg-white/20 text-white/50'
                  }`}
                >
                  {isDone ? '✓' : i + 1}
                </div>
                <span className={`text-xs ${isActive ? 'text-white font-semibold' : 'text-white/50'}`}>{label}</span>
                {i < 2 && <div className="w-4 h-px bg-white/20 mx-0.5" />}
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
              <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-4">Resumen de Pago</h3>
              <div className="flex justify-between items-center py-2.5 border-b border-gray-50">
                <span className="text-gray-500 text-sm">Concepto</span>
                <span className="text-gray-800 font-medium text-sm text-right max-w-[55%]">{item.concept}</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-gray-50">
                <span className="text-gray-500 text-sm">Moneda</span>
                <span className="text-gray-800 font-medium text-sm">Bolivianos (Bs)</span>
              </div>
              <div className="flex justify-between items-center pt-3 mt-1">
                <span className="text-gray-700 font-bold text-sm">Total a Pagar</span>
                <span className="text-[#0A2463] font-extrabold text-2xl">Bs {item.amount.toLocaleString('es-BO')}</span>
              </div>
            </div>
            <button
              onClick={() => setStep('method')}
              className="bg-[#0A2463] text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-[#1E4DB7] transition-colors active:scale-95"
            >
              Elegir Metodo de Pago
            </button>
          </>
        )}

        {/* STEP: METHOD SELECTOR */}
        {step === 'method' && (
          <>
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h3 className="text-[#0A2463] font-bold text-sm mb-4">Selecciona un Metodo de Pago</h3>
              <div className="flex flex-col gap-3">
                {([
                  { method: 'QR' as Method, icon: QrCode, bg: 'bg-blue-50', color: 'text-[#0A2463]', label: 'Pago QR', desc: 'Escanea con tu app del banco' },
                  { method: 'DEPOSITO' as Method, icon: Building2, bg: 'bg-emerald-50', color: 'text-emerald-600', label: 'Deposito Bancario', desc: 'Transferencia a cuentas autorizadas' },
                  { method: 'EFECTIVO' as Method, icon: Banknote, bg: 'bg-amber-50', color: 'text-amber-600', label: 'Pago en Efectivo', desc: 'Caja presencial en campus universitario' },
                  { method: 'TRANSFERENCIA' as Method, icon: Landmark, bg: 'bg-violet-50', color: 'text-violet-600', label: 'Transferencia Interbancaria', desc: 'Desde cualquier banco del pais' },
                ]).map(({ method, icon: Icon, bg, color, label, desc }) => (
                  <button
                    key={method}
                    onClick={() => { setSelectedMethod(method); setStep(method === 'QR' ? 'qr' : method === 'DEPOSITO' ? 'deposito' : method === 'EFECTIVO' ? 'efectivo' : 'transferencia'); }}
                    className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-100 hover:border-[#0A2463] hover:bg-blue-50 transition-all text-left active:scale-[0.98]"
                  >
                    <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon size={24} className={color} />
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-800 font-semibold text-sm">{label}</p>
                      <p className="text-gray-400 text-xs mt-0.5">{desc}</p>
                    </div>
                    <ChevronLeft size={16} className="text-gray-300 rotate-180" />
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-blue-50 rounded-2xl p-4 flex gap-3">
              <Smartphone size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-blue-700 text-xs leading-relaxed">
                Tras realizar el pago, deberas subir el comprobante en imagen para su verificacion automatica.
              </p>
            </div>
          </>
        )}

        {/* STEP: QR */}
        {step === 'qr' && (
          <>
            <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col items-center">
              <div className="flex items-center gap-2 mb-4">
                <QrCode size={18} className="text-[#0A2463]" />
                <span className="text-[#0A2463] font-bold text-sm">Pago QR</span>
              </div>
              <p className="text-gray-500 text-xs mb-4 text-center">Escanea este codigo QR con tu app bancaria para transferir</p>
              <div className="relative p-3 border-2 border-[#0A2463] rounded-2xl bg-white shadow-inner">
                <img
                  src="https://ahjgfwpqugokzksfoufu.supabase.co/storage/v1/object/public/configuracion-pagos/qr_ubi.JPG"
                  alt="Codigo QR para realizar el pago"
                  onError={(event) => { event.currentTarget.src = '/storage/WhatsApp_Image_2026-08-13_at_16.23.30.jpeg'; }}
                  className="w-[200px] h-[200px] object-contain"
                />
              </div>
              <div className="mt-5 w-full bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-gray-400 text-xs">Monto a transferir</p>
                <p className="text-[#0A2463] font-extrabold text-2xl mt-1">Bs {item.amount.toLocaleString('es-BO')}</p>
                <p className="text-gray-500 text-xs mt-2 font-semibold">UBI - RECAUDACIONES</p>
                <p className="text-gray-400 text-xs mt-1">Cuenta: 201-50504007-3-30 · BCP</p>
              </div>
              <div className="mt-4 flex items-center gap-2 text-amber-600 bg-amber-50 rounded-xl px-4 py-3 w-full">
                <AlertCircle size={14} className="flex-shrink-0" />
                <p className="text-xs">Guarda el comprobante de tu transferencia para el siguiente paso.</p>
              </div>
            </div>
            <button onClick={() => setStep('upload')} className="bg-[#0A2463] text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-[#1E4DB7] transition-colors active:scale-95">
              Ya realice la transferencia
            </button>
          </>
        )}

        {/* STEP: DEPOSITO */}
        {step === 'deposito' && (
          <>
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Building2 size={18} className="text-emerald-600" />
                <h3 className="text-[#0A2463] font-bold text-sm">Cuentas Autorizadas</h3>
              </div>
              <div className="flex flex-col gap-3">
                <div className="border border-gray-100 rounded-xl p-3.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-500 text-xs">Cuenta de ahorros</span>
                    <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-semibold">Activa</span>
                  </div>
                  <p className="text-gray-800 font-mono font-bold text-sm">101-50215262-3-85</p>
                  <p className="text-gray-500 text-xs mt-1 font-semibold">Javier Pinto Gallo</p>
                </div>
              </div>
              <div className="mt-4 bg-amber-50 rounded-xl p-3 flex gap-2">
                <AlertCircle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-amber-700 text-xs leading-relaxed">
                  Realiza la transferencia por el monto exacto de <strong>Bs {item.amount.toLocaleString('es-BO')}</strong> y guarda el voucher.
                </p>
              </div>
            </div>
            <button onClick={() => setStep('upload')} className="bg-[#0A2463] text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-[#1E4DB7] transition-colors active:scale-95">
              Subir Voucher de Deposito
            </button>
          </>
        )}

        {/* STEP: EFECTIVO */}
        {step === 'efectivo' && (
          <>
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Banknote size={18} className="text-amber-600" />
                <h3 className="text-[#0A2463] font-bold text-sm">Pago en Efectivo</h3>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-3 bg-amber-50 rounded-xl p-3.5">
                  <MapPin size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-gray-800 font-semibold text-sm">Caja Central - Campus La Paz</p>
                    <p className="text-gray-400 text-xs mt-0.5">Edificio Principal, Piso 1 · Av. 6 de Agosto N° 1234</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-blue-50 rounded-xl p-3.5">
                  <Clock size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-gray-800 font-semibold text-sm">Horario de Atencion</p>
                    <p className="text-gray-400 text-xs mt-0.5">Lunes a Viernes · 08:00 - 16:00</p>
                    <p className="text-gray-400 text-xs">Sabados · 09:00 - 12:00</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-3.5">
                  <Banknote size={18} className="text-gray-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-gray-800 font-semibold text-sm">Monto a Cancelar</p>
                    <p className="text-[#0A2463] font-bold text-lg mt-0.5">Bs {item.amount.toLocaleString('es-BO')}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 bg-blue-50 rounded-xl p-3 flex gap-2">
                <Smartphone size={14} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-blue-700 text-xs leading-relaxed">
                  Solicita el recibo fisico al cajero y sube una foto legible del mismo.
                </p>
              </div>
            </div>
            <button onClick={() => setStep('upload')} className="bg-[#0A2463] text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-[#1E4DB7] transition-colors active:scale-95">
              Subir Foto del Recibo
            </button>
          </>
        )}

        {/* STEP: TRANSFERENCIA */}
        {step === 'transferencia' && (
          <>
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Landmark size={18} className="text-violet-600" />
                <h3 className="text-[#0A2463] font-bold text-sm">Transferencia Interbancaria</h3>
              </div>
              <div className="flex flex-col gap-3">
                <div className="border border-gray-100 rounded-xl p-3.5">
                  <p className="text-gray-500 text-xs mb-1">Cuenta de ahorros</p>
                  <p className="text-gray-800 font-mono font-bold text-sm">101-50215262-3-85</p>
                  <p className="text-gray-500 text-xs mt-1 font-semibold">Javier Pinto Gallo</p>
                </div>
              </div>
              <div className="mt-4 bg-violet-50 rounded-xl p-3 flex gap-2">
                <AlertCircle size={14} className="text-violet-600 flex-shrink-0 mt-0.5" />
                <p className="text-violet-700 text-xs leading-relaxed">
                  Realiza la transferencia interbancaria por <strong>Bs {item.amount.toLocaleString('es-BO')}</strong> desde cualquier banco. Guarda el comprobante.
                </p>
              </div>
            </div>
            <button onClick={() => setStep('upload')} className="bg-[#0A2463] text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-[#1E4DB7] transition-colors active:scale-95">
              Subir Comprobante
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
              <p className="text-gray-400 text-xs mb-1">
                Metodo seleccionado: <span className="font-semibold text-gray-600">{selectedMethod && methodLabels[selectedMethod]}</span>
              </p>
              <p className="text-gray-400 text-xs mb-5">
                Sube una foto de tu comprobante. El sistema validara el pago automaticamente con OCR + IA.
              </p>
              <label
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center w-full h-44 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                  dragOver ? 'border-[#0A2463] bg-blue-50 scale-[1.02]' : 'border-gray-200 bg-gray-50 hover:border-[#0A2463] hover:bg-blue-50'
                }`}
              >
                <input type="file" className="hidden" accept="image/png,image/jpeg,image/jpg" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileSelect(file); }} />
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-colors ${dragOver ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  <FileImage size={26} className={dragOver ? 'text-[#0A2463]' : 'text-gray-400'} />
                </div>
                <p className="text-gray-600 font-semibold text-sm">{dragOver ? 'Suelta la imagen aqui' : 'Arrastra tu comprobante aqui'}</p>
                <p className="text-gray-400 text-xs mt-1">o haz clic para seleccionar</p>
                <p className="text-gray-300 text-xs mt-3">PNG o JPG · Max. 10 MB</p>
              </label>
            </div>
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
              <h3 className="text-[#0A2463] font-bold text-lg">Subiendo comprobante...</h3>
              <p className="text-gray-400 text-sm mt-2">Guardando y enviando a verificacion OCR + IA</p>
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
        {step === 'success' && (
          <div className="flex flex-col items-center gap-5 py-4">
            <div className="relative">
              <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center">
                <CheckCircle2 size={52} className="text-emerald-500" />
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-gray-800 font-extrabold text-xl">Comprobante Enviado</h2>
              <p className="text-gray-400 text-sm mt-2 leading-relaxed">
                Tu comprobante fue recibido y quedo registrado como Por confirmar.
              </p>
            </div>
            <div className="w-full bg-white rounded-2xl p-5 shadow-sm border border-emerald-100">
              <div className="flex justify-between py-2.5 border-b border-gray-50">
                <span className="text-gray-400 text-sm">Concepto</span>
                <span className="text-gray-700 font-medium text-sm text-right max-w-[55%]">{item.concept}</span>
              </div>
              <div className="flex justify-between py-2.5 border-b border-gray-50">
                <span className="text-gray-400 text-sm">Monto</span>
                <span className="text-[#0A2463] font-bold text-sm">Bs {item.amount.toLocaleString('es-BO')}</span>
              </div>
              <div className="flex justify-between py-2.5 border-b border-gray-50">
                <span className="text-gray-400 text-sm">Metodo</span>
                <span className="text-gray-700 font-medium text-sm">{selectedMethod && methodLabels[selectedMethod]}</span>
              </div>
              <div className="flex justify-between pt-2.5">
                <span className="text-gray-400 text-sm">Estado</span>
                <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">Enviado</span>
              </div>
            </div>
            <div className="w-full bg-blue-50 rounded-2xl p-4 flex gap-3">
              <AlertCircle size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-blue-700 text-xs leading-relaxed">
                Recibiras una notificacion en el <strong>Buzon</strong> cuando tu pago sea aprobado o rechazado.
              </p>
            </div>
            <button onClick={resetFlow} className="w-full bg-[#0A2463] text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-[#1E4DB7] transition-colors active:scale-95">
              Volver al inicio
            </button>
          </div>
        )}

        {/* STEP: ERROR */}
        {step === 'error' && (
          <div className="flex flex-col items-center gap-5 py-4">
            <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center">
              <X size={52} className="text-red-500" />
            </div>
            <div className="text-center">
              <h2 className="text-gray-800 font-extrabold text-xl">Error</h2>
              <p className="text-gray-400 text-sm mt-2">{errorMsg}</p>
            </div>
            <button onClick={() => setStep('upload')} className="w-full bg-[#0A2463] text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-[#1E4DB7] transition-colors active:scale-95">
              Reintentar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}