import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!

let supabaseInstance: SupabaseClient | null = null

function getSupabaseClient() {
  if (supabaseInstance) {
    return supabaseInstance
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storage: window.localStorage,
      storageKey: 'supabase.auth.token',
    },
    global: {
      headers: {
        'X-Client-Info': 'stackroast-web',
      },
    },
  })

  return supabaseInstance
}

export const supabase = getSupabaseClient()

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    console.log('HMR: Preserving Supabase instance')
  })
}