import type React from "react"
import { Sidebar } from "@/components/sidebar"
import { BloqueioAgendamentos } from "@/components/bloqueio-agendamentos"

export default function AgendamentosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Forçar bloqueio para teste
  const mostrarBloqueio = true

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
        {mostrarBloqueio && <BloqueioAgendamentos />}
      </div>
    </div>
  )
}
