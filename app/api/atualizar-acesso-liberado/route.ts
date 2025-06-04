import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET() {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  try {
    // Ler o script SQL do arquivo
    const sqlPath = path.join(process.cwd(), "verificar-e-atualizar-acesso-liberado.sql")
    const sqlScript = fs.readFileSync(sqlPath, "utf8")

    // Executar o script SQL
    const { data, error } = await supabase.rpc("executar_sql", {
      sql_query: sqlScript,
    })

    if (error) {
      return NextResponse.json({
        error: "Erro ao executar o script SQL",
        details: error.message,
      })
    }

    return NextResponse.json({
      message: "Script SQL executado com sucesso",
      data,
    })
  } catch (error) {
    return NextResponse.json({
      error: "Erro ao executar o script SQL",
      details: error,
    })
  }
}
