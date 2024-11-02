import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

const supabaseUrl = 'https://your-project.supabase.co'
const supabaseKey = 'your-anon-key'

export const supabase = createClient<Database>(supabaseUrl, supabaseKey)