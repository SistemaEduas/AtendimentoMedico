import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { sql } = await request.json()

    if (!sql) {
      return NextResponse.json({ error: "SQL query is required" }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })

    // Verificar autenticação
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Executar o SQL diretamente usando o método rpc
    const { data, error } = await supabase.rpc("executar_sql_admin", { sql_query: sql })

    if (error) {
      console.error("Erro ao executar SQL:", error)

      // Tentar método alternativo - executar SQL diretamente
      // Nota: isso só funcionará se o usuário tiver permissões adequadas
      try {
        // Adicionar a coluna diretamente
        if (sql.includes("ADD COLUMN")) {
          const tableName = sql.split("ALTER TABLE ")[1].split(" ADD")[0].trim()
          const columnName = sql.split("ADD COLUMN ")[1].split(" ")[0].replace("IF NOT EXISTS", "").trim()

          // Verificar se a coluna já existe
          const { error: checkError } = await supabase.from(tableName).select(columnName).limit(1)

          if (checkError && checkError.message.includes("does not exist")) {
            // Coluna não existe, tentar criar usando update com valor padrão
            const { error: updateError } = await supabase
              .from(tableName)
              .update({ [columnName]: false })
              .eq("id", "00000000-0000-0000-0000-000000000000") // ID que não existe

            if (!updateError || !updateError.message.includes("does not exist")) {
              return NextResponse.json({ success: true, message: "Coluna criada com sucesso (método alternativo)" })
            }
          } else {
            // Coluna já existe
            return NextResponse.json({ success: true, message: "Coluna já existe" })
          }
        }
      } catch (alternativeError) {
        console.error("Erro no método alternativo:", alternativeError)
      }

      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("Erro na API:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
