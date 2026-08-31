import { useState } from 'react';
import { Mail, Phone, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../lib/auth';

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [identifier, setIdentifier] = useState(''); // Puede ser correo o celular
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
            <label className="text-gray-600 text-xs font-semibold block mb-1.5">Contrasena</label>
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
          <div className="bg-blue-50 rounded-xl p-3.5 flex gap-2.5">
            <Mail size={14} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-blue-700 text-xs font-semibold">Cuenta de prueba</p>
              <p className="text-blue-600/70 text-xs mt-0.5">demo@ubi.edu.bo · Demo1234!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}