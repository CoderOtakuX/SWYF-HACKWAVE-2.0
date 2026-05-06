import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'vendor' | 'admin' | 'user';
  created_at?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, role: 'vendor' | 'admin') => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true, // start loading while we check session
  error: null,
  login: async () => false,
  register: async () => false,
  logout: () => {},
  clearError: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async (authId: string, authEmail: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', authId).single();
      if (error) {
        if (error.code === 'PGRST116') {
          // Self-heal: user exists in Auth but not in profiles table
          const fallbackName = authEmail.split('@')[0];
          const { error: insertErr } = await supabase.from('profiles').insert([{ id: authId, name: fallbackName, role: 'user' }]);
          if (insertErr) console.error('Profile self-heal insert failed:', insertErr.message);
          return { id: authId, name: fallbackName, email: authEmail, role: 'user' };
        }
        console.error('Error fetching profile:', error);
        return null;
      }
      return { ...data, email: authEmail } as UserProfile;
    } catch (err) {
      console.error('fetchProfile exception:', err);
      return null;
    }
  };

  // On mount: check for existing session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email || '').then(profile => {
          setUser(profile);
          setIsLoading(false);
        });
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    // Listen to auth state changes (handles token refresh, external signouts, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsLoading(false);
      }
      // We intentionally do NOT handle SIGNED_IN here to avoid race conditions
      // with our login() function. login() handles setting the user directly.
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      const authUser = data.user;
      if (!authUser) throw new Error('Login succeeded but no user data returned.');

      // Directly fetch profile instead of relying on onAuthStateChange
      const profile = await fetchProfile(authUser.id, authUser.email || '');
      if (profile) {
        setUser(profile);
      } else {
        // Profile fetch failed but auth succeeded - create a minimal user anyway
        setUser({ id: authUser.id, name: email.split('@')[0], email, role: 'user' });
      }
      setIsLoading(false);
      return true;
    } catch (err: any) {
      setError(err.message || 'Login failed.');
      setIsLoading(false);
      return false;
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, role: 'vendor' | 'admin'): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: { data: { name, role } } 
      });
      if (error) throw error;
      
      const newUser = data.user;
      if (!newUser) throw new Error('Missing user ID after signup.');

      // If email confirmation is required, session will be null
      if (!data.session) {
        setError('Please check your email to confirm your account, then sign in.');
        setIsLoading(false);
        return false;
      }

      // Insert into profiles
      const { error: profileError } = await supabase.from('profiles').insert([
        { id: newUser.id, name, role }
      ]);
      if (profileError) console.error('Profile insert failed:', profileError.message);

      // Set user directly
      setUser({ id: newUser.id, name, email, role });
      setIsLoading(false);
      return true;
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
      setIsLoading(false);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    setError(null);
    setIsLoading(false);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Logout error:', err);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, register, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};
