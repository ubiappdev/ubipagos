import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { Alumno, Carrera, Curso, TipoBeca } from './supabase';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  alumno: (Alumno & { carrera?: Carrera; curso?: Curso; tipo_beca?: TipoBeca }) | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [alumno, setAlumno] = useState<(Alumno & { carrera?: Carrera; curso?: Curso; tipo_beca?: TipoBeca }) | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAlumno = async (userId: string) => {
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('id')
      .eq('auth_id', userId)
      .maybeSingle();

    if (!perfil) {
      setAlumno(null);
      return;
    }

    const { data } = await supabase
      .from('alumnos')
      .select('*, carrera:carreras(*), curso:cursos(*), tipo_beca:tipos_beca(*)')
      .eq('perfil_id', perfil.id)
      .maybeSingle();

    setAlumno(data as (Alumno & { carrera?: Carrera; curso?: Curso; tipo_beca?: TipoBeca }) | null);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) {
        fetchAlumno(s.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        (async () => {
          await fetchAlumno(s.user.id);
        })();
      } else {
        setAlumno(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };

    if (data.user) {
      await supabase.rpc('vincular_perfil_auth', {
        p_correo: email,
        p_auth_id: data.user.id,
      });
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
