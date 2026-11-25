import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

export const SUPABASE_URL = "https://kbfcloehhlsrmkxlruzn.supabase.co";
// This is the project's public publishable key. Never use a service_role/secret key here.
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_V9dq0VI3wOhY4eTVPZMCfw_Qore4_F6";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
