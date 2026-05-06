import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const disabledError = {
  message: 'Supabase is not configured for this local session.',
};

const createLocalSupabaseFallback = () => {
  const query = {
    select: () => query,
    eq: () => query,
    update: () => query,
    insert: async () => ({ data: null, error: disabledError }),
    single: async () => ({ data: null, error: { ...disabledError, code: 'PGRST116' } }),
  };

  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: async () => ({ data: { user: null }, error: disabledError }),
      signUp: async () => ({ data: { user: null, session: null }, error: disabledError }),
      signOut: async () => ({ error: null }),
    },
    from: () => query,
    storage: {
      from: () => ({
        upload: async () => ({ data: null, error: disabledError }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
      }),
    },
  };
};

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : createLocalSupabaseFallback() as ReturnType<typeof createClient>;
