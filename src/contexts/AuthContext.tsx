import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'admin' | 'teacher' | 'student' | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole;
  profile: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const [{ data: profileData }, { data: teacher }, { data: student }] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('teachers').select('id').eq('user_id', userId).maybeSingle(),
      supabase.from('students').select('id').eq('user_id', userId).maybeSingle(),
    ]);

    setProfile(profileData ?? null);

    if (profileData?.role === 'admin') {
      setRole('admin');
      return;
    }

    if (teacher) {
      setRole('teacher');
      return;
    }

    if (student) {
      setRole('student');
      return;
    }

    setRole((profileData?.role as UserRole) ?? 'student');
  };

  useEffect(() => {
    const syncSession = async (nextSession: Session | null) => {
      setLoading(true);
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user) {
        try {
          await fetchProfile(nextSession.user.id);
        } finally {
          setLoading(false);
        }
        return;
      }

      setProfile(null);
      setRole(null);
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => {
        void syncSession(session);
      }, 0);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      void syncSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, metadata?: Record<string, any>) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, role, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
