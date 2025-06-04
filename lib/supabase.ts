import { createClient } from "@supabase/supabase-js"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/supabase"

// Cria um cliente Supabase para uso no lado do servidor
export const createServerSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient<Database>(supabaseUrl, supabaseKey)
}

// Singleton para o cliente Supabase no lado do cliente
let clientSingleton: ReturnType<typeof createClientComponentClient<Database>>

export const createBrowserSupabaseClient = () => {
  if (clientSingleton) return clientSingleton

  // Verificar se as variáveis de ambiente estão definidas
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error("Variáveis de ambiente do Supabase não encontradas")
    // Fornecer valores padrão para evitar erros de runtime
    const fallbackUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://sua-instancia.supabase.co"
    const fallbackKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sua-chave-anonima"
    clientSingleton = createClient<Database>(fallbackUrl, fallbackKey) as any
  } else {
    clientSingleton = createClientComponentClient<Database>()
  }

  return clientSingleton
}
