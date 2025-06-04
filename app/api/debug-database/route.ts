import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  // Obter o ID da instância da URL
  const { searchParams } = new URL(request.url)
  const instanciaId = searchParams.get("instanciaId") || cookieStore.get("instanciaId")?.value

  if (!instanciaId) {
    return NextResponse.json({
      error: "ID da instância não fornecido",
    })
  }

  try {
    // Consultar todos os médicos da instância
    const { data: medicos, error: medicosError } = await supabase
      .from("medicos")
      .select("id, nome")
      .eq("instancia_id", instanciaId)

    if (medicosError) {
      return NextResponse.json({
        error: "Erro ao consultar médicos",
        details: medicosError.message,
      })
    }

    // Consultar todos os registros de medicos_auth para a instância
    const { data: medicosAuth, error: medicosAuthError } = await supabase
      .from("medicos_auth")
      .select("*")
      .eq("instancia_id", instanciaId)

    if (medicosAuthError) {
      return NextResponse.json({
        error: "Erro ao consultar medicos_auth",
        details: medicosAuthError.message,
      })
    }

    // Consultar a instância
    const { data: instancia, error: instanciaError } = await supabase
      .from("instancias")
      .select("*")
      .eq("id", instanciaId)
      .single()

    if (instanciaError) {
      return NextResponse.json({
        error: "Erro ao consultar instância",
        details: instanciaError.message,
      })
    }

    return NextResponse.json({
      instanciaId,
      instancia,
      medicos,
      medicosAuth,
    })
  } catch (error) {
    return NextResponse.json({
      error: "Erro ao consultar banco de dados",
      details: error,
    })
  }
}
