import { useState } from 'react';
import { Mail, Phone, Lock, Eye, EyeOff, Loader2, KeyRound, X, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [identifier, setIdentifier] = useState(''); // Puede ser correo o celular
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Estados para el modal de recuperación de contraseña (Magic Link / Reset)
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Detectar si el usuario ingresó un número de teléfono o un correo
  const isPhone = /^[0-9+\s-]{7,15}$/.test(identifier.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const loginIdentifier = isPhone ? `${identifier.trim()}@sms.ubi.edu.bo` : identifier.trim();

    const { error: err } = mode === 'login'
      ? await signIn(loginIdentifier, password)
      : await signUp(loginIdentifier, password);

    if (err) setError(err);
    setLoading(false);
  };

  // Función para enviar el enlace de recuperación de contraseña con Supabase
  const handlePasswordRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryMessage(null);

    const cleanInput = recoveryEmail.trim();
    if (!cleanInput) {
      setRecoveryMessage({ type: 'error', text: 'Por favor ingresa tu correo o número de celular.' });
      return;
    }

    // Si ingresó teléfono, adaptarlo al dominio interno de SMS
    const isRecoveryPhone = /^[0-9+\s-]{7,15}$/.test(cleanInput);
    const targetEmail = isRecoveryPhone ? `${cleanInput}@sms.ubi.edu.bo` : cleanInput;

    setRecoveryLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, {
        redirectTo: window.location.origin, // Redirige de vuelta a la app para cambiar la clave
      });

      if (error) throw error;

      setRecoveryMessage({
        type: 'success',
        text: '¡Enlace enviado! Revisa tu bandeja de entrada o correo institucional para restablecer tu contraseña.',
      });
      setRecoveryEmail('');
    } catch (err: any) {
      setRecoveryMessage({
        type: 'error',
        text: err.message || 'No se pudo enviar el correo de recuperación. Verifica los datos.',
      });
    } finally {
      setRecoveryLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-[#0A2463] via-[#143A8C] to-[#0A2463]">
      {/* Logo section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="w-20 h-28 bg-white rounded-3xl flex items-center justify-center mb-4 shadow-xl overflow-hidden border-2 border-white/30">
          <img 
            src="https://ahjgfwpqugokzksfoufu.supabase.co/storage/v1/object/public/configuracion-pagos/logo.png" 
            alt="Logo UBI" 
            className="w-full h-full object-cover"
          />
        </div>
        <h1 className="text-white font-extrabold text-2xl tracking-tight">Portal Financiero</h1>
        <p className="text-blue-200 text-sm mt-1">Universidad Boliviana de Informatica</p>
      </div>

      {/* Form section */}
      <div className="bg-white rounded-t-[2.5rem] px-6 pt-7 pb-8 flex-1 flex flex-col">
        <h2 className="text-[#0A2463] font-bold text-lg mb-1">
          {mode === 'login' ? 'Iniciar Sesion' : 'Crear Cuenta'}
        </h2>
        <p className="text-gray-400 text-xs mb-5">
          {mode === 'login'
            ? 'Ingresa con tu correo o número de celular'
            : 'Registra tus datos institucionales para acceder'}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-gray-600 text-xs font-semibold block mb-1.5">
              Correo Electronico o Celular
            </label>
            <div className="relative">
              {isPhone ? (
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              ) : (
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              )}
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="correo@ubi.edu.bo o 70000000"
                className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#0A2463] focus:ring-2 focus:ring-[#0A2463]/10 transition-all"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-gray-600 text-xs font-semibold">Contrasena</label>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => {
                    setRecoveryMessage(null);
                    setRecoveryEmail(identifier); // Pre-rellena si ya escribió algo
                    setShowForgotModal(true);
                  }}
                  className="text-xs text-[#0A2463] font-semibold hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:border-[#0A2463] focus:ring-2 focus:ring-[#0A2463]/10 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-500 bg-red-50 rounded-xl px-4 py-3">
              <span className="text-xs">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-[#0A2463] text-white font-bold py-3.5 rounded-2xl shadow-lg hover:bg-[#1E4DB7] transition-colors active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {mode === 'login' ? 'Ingresar' : 'Registrarme'}
          </button>
        </form>

        <div className="mt-5 text-center">
          <button
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login');
              setError('');
            }}
            className="text-[#0A2463] text-sm font-semibold hover:underline"
          >
            {mode === 'login'
              ? 'No tienes cuenta? Registrate'
              : 'Ya tienes cuenta? Inicia sesion'}
          </button>
        </div>

        <div className="mt-auto pt-5">
         </div>
      </div>

      {/* Modal para Recuperar Contraseña (Magic Link / Enlace de Restablecimiento) */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-[#0A2463]">
                <KeyRound size={20} />
              </div>
              <div>
                <h3 className="text-[#0A2463] font-bold text-base">Recuperar contraseña</h3>
                <p className="text-gray-400 text-xs">Te enviaremos un enlace de acceso seguro</p>
              </div>
            </div>

            {recoveryMessage && (
              <div
                className={`mb-4 p-3.5 rounded-2xl text-xs font-medium flex items-start gap-2.5 ${
                  recoveryMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-red-50 text-red-600 border border-red-200'
                }`}
              >
                {recoveryMessage.type === 'success' ? (
                  <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                ) : null}
                <span>{recoveryMessage.text}</span>
              </div>
            )}

            <form onSubmit={handlePasswordRecovery} className="flex flex-col gap-4">
              <div>
                <label className="block text-gray-700 text-xs font-semibold mb-1.5">
                  Correo electrónico o celular registrado
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    placeholder="correo@ubi.edu.bo o 70000000"
                    required
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-[#0A2463] focus:ring-2 focus:ring-[#0A2463]/10"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1.5">
                  Recibirás un enlace mágico para restablecer tu clave de forma segura.
                </p>
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl text-xs transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={recoveryLoading}
                  className="flex-1 bg-[#0A2463] hover:bg-[#1E4DB7] text-white font-bold py-3 rounded-xl text-xs transition-colors shadow-md disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {recoveryLoading && <Loader2 size={14} className="animate-spin" />}
                  Enviar enlace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}