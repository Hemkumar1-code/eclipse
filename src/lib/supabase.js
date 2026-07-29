import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Dev-only guard: warn clearly if env vars are missing
if (import.meta.env.DEV) {
  if (!supabaseUrl || supabaseUrl === 'your_supabase_project_url') {
    console.warn(
      '[Eclipse] VITE_SUPABASE_URL is not set. ' +
      'Create a .env.local file in the project root with:\n' +
      '  VITE_SUPABASE_URL=https://your-project.supabase.co\n' +
      '  VITE_SUPABASE_ANON_KEY=your-anon-key'
    )
  }
  if (!supabaseAnonKey || supabaseAnonKey === 'your_supabase_anon_key') {
    console.warn('[Eclipse] VITE_SUPABASE_ANON_KEY is not set.')
  }
}

// Export a flag so other code can check if Supabase is configured
export const isSupabaseConfigured =
  Boolean(supabaseUrl) &&
  supabaseUrl.startsWith('https://') &&
  Boolean(supabaseAnonKey) &&
  supabaseAnonKey.length > 20

// Use fallback values so createClient() doesn't throw even when vars are missing.
// The isSupabaseConfigured flag lets UI code show a proper error instead.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key-replace-me'
)
