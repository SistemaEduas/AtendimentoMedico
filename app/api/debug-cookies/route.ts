import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  const cookieStore = cookies()
  const allCookies = cookieStore.getAll()

  // Obter o ID da instância
  const instanciaId = cookieStore.get("instanciaId")?.value

  return NextResponse.json({
    cookies: allCookies.map((cookie) => ({
      name: cookie.name,
      value: cookie.value,
    })),
    instanciaId,
  })
}
