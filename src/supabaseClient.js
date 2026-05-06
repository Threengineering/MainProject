// import { createClient } from '@supabase/supabase-js'


// const supabaseUrl = "https://ofzmypalaihwmjhdsods.supabase.co/rest/v1/"
// const supabaseAnonKey ="sb_publishable_m40PPxd1aT3hKAcKTNBZPQ_IkHWcfDW"

// export const supabase = createClient(supabaseUrl, supabaseAnonKey)
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 만약 변수가 비어있으면 경고를 띄웁니다.
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL 또는 Anon Key가 설정되지 않았습니다. .env 파일을 확인하세요.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)