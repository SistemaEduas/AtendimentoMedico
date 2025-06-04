import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    const supabase = createClient(process.env.SUPABASE_URL || "", process.env.SUPABASE_ANON_KEY || "")

    const { id, type = "instancia" } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "ID não fornecido" }, { status: 400 })
    }

    let assinaturaAtiva = false

    if (type === "medico") {
      // Verificar assinatura de médico
      const { data, error } = await supabase
        .from("assinaturas")
        .select("*")
        .eq("medico_id", id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        console.error("Erro ao verificar assinatura de médico:", error)
      } else {
        assinaturaAtiva = !!data
      }
    } else {
      // Verificar se a tabela assinaturas_instancia existe
      const { error: tableCheckError } = await supabase
        .from("assinaturas_instancia")
        .select("id")
        .limit(1)
        .maybeSingle()

      if (!tableCheckError || !tableCheckError.message.includes("does not exist")) {
        // Verificar assinatura de instância
        const { data, error } = await supabase
          .from("assinaturas_instancia")
          .select("*")
          .eq("instancia_id", id)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()

        if (error) {
          console.error("Erro ao verificar assinatura de instância:", error)
        } else {
          assinaturaAtiva = !!data
        }
      } else {
        // Se a tabela não existir, verificar se algum médico da instância tem assinatura ativa
        const { data: medicos, error: medicosError } = await supabase
          .from("medicos")
          .select("id")
          .eq("instancia_id", id)

        if (medicosError) {
          console.error("Erro ao buscar médicos da instância:", medicosError)
        } else if (medicos && medicos.length > 0) {
          const medicoIds = medicos.map((m) => m.id)

          const { data: assinaturas, error: assinaturasError } = await supabase
            .from("assinaturas")
            .select("*")
            .in("medico_id", medicoIds)
            .eq("status", "active")
            .limit(1)

          if (assinaturasError) {
            console.error("Erro ao verificar assinaturas dos médicos:", assinaturasError)
          } else {
            assinaturaAtiva = assinaturas && assinaturas.length > 0
          }
        }
      }
    }

    return NextResponse.json({ success: assinaturaAtiva })
  } catch (error) {
    console.error("Erro ao verificar checkout:", error)
    return NextResponse.json(
      {
        error: "Erro ao verificar checkout",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
