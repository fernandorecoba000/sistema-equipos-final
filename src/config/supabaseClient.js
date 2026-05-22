import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ddnhnmnysycmjakarmbv.supabase.co';

// Y esta es tu clave pública real:
const supabaseAnonKey = 'sb_publishable_FliUUqxcpHyyrlbLkX5W_w_SGFWCyJ_';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);