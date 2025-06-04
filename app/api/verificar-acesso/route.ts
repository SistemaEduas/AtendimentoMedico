import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  // Obter o ID da instância atual
  const instanciaId = cookieStore.get("instanciaId")?.value

  if (!instanciaId) {
    return NextResponse.json({
      error: "ID da instância não encontrado nos cookies",
      acessoLiberado: false,
    })
  }

  try {
    // Verificar se algum médico da instância tem acesso liberado
    const { data, error } = await supabase
      .from("medicos_auth")
      .select("acesso_liberado")
      .eq("instancia_id", instanciaId)
      .eq("acesso_liberado", true)
      .limit(1)

    if (error) {
      return NextResponse.json({
        error: error.message,
        acessoLiberado: false,
      })
    }

    // Se encontrou pelo menos um médico com acesso liberado
    const acessoLiberado = data && data.length > 0

    return NextResponse.json({
      instanciaId,
      acessoLiberado,
      medicos: data,
    })
  } catch (error) {
    return NextResponse.json({
      error: "Erro ao verificar acesso",
      acessoLiberado: false,
    })
  }
}
