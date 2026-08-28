import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { Alumno } from './supabase';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  alumno: Alumno | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [alumno, setAlumno] = useState<Alumno | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAlumno = async (userId: string) => {
    try {
      const { data: perfil, error: perfilError } = await supabase
        .from('perfiles')
        .select('id')
        .eq('auth_id', userId)
        .maybeSingle();

      if (perfilError || !perfil) {
        setAlumno(null);
        return;
      }

      // Consulta completamente limpia sin relaciones a tipos_beca
      const { data, error: alumnoError } = await supabase
        .from('alumnos')
        .select('*')
        .eq('perfil_id', perfil.id)
        .maybeSingle();

      if (alumnoError) {
        console.error('Error al obtener los datos del alumno:', alumnoError.message);
        setAlumno(null);
        return;
      }

      setAlumno(data as Alumno | null);
    } catch (err) {
      console.error('Excepción inesperada al buscar el perfil del alumno:', err);
      setAlumno(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!mounted) return;
      setSession(s);
      if (s?.user) {
        fetchAlumno(s.user.id).finally(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    // Escuchar cambios de autenticación
    const { data: { subscription: listener } } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!mounted) return;
      setSession(s);
      if (s?.user) {
        fetchAlumno(s.user.id).finally(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setAlumno(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      listener.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };

    if (data.user) {
      const { error: rpcError } = await supabase.rpc('vincular_perfil_auth', {
        p_correo: email,
        p_auth_id: data.user.id,
      });

      if (rpcError) {
        console.error('Error al vincular el perfil:', rpcError.message);
        return { error: 'Cuenta creada, pero hubo un problema al vincular el perfil estudiantil.' };
      }
    }

    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setAlumno(null);
  };

  return (
    <AuthContext.Provider
      value={{ session, user: session?.user ?? null, alumno, loading, signUp, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}