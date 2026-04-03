import React, { createContext, useContext, useEffect, useState, startTransition } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useNotificacoesPush } from '@/hooks/useNotificacoesPush';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Registrar token FCM automaticamente após login
  useNotificacoesPush();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        startTransition(() => {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        });
        
        // Sincronizar avatar do Google com a tabela profiles (se vier do Google OAuth)
        if (session?.user && event === 'SIGNED_IN') {
          const googleAvatar = session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture;
          if (googleAvatar) {
            setTimeout(() => {
              supabase
                .from('profiles')
                .update({ avatar_url: googleAvatar })
                .eq('id', session.user.id)
                .is('avatar_url', null) // Só atualiza se não tiver avatar ainda
                .then(() => {});
            }, 0);
          }
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      startTransition(() => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    setUser(null);
    setSession(null);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
