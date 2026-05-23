import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://yhbmdekzbjdljeusqdxs.supabase.co'
const SUPABASE_KEY = 'sb_publishable_VRxfwPPQzRh1HomWXaEhVA_av-e9eHO'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)