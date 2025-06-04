"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function MedicoAreaPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirecionar para a página de agendamentos
    router.push("/medico/area/agendamentos")
  }, [router])

  return (
    <div className="p-6">
      <div className="text-center">Redirecionando...</div>
    </div>
  )
}
