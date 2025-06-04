import type React from "react"
import { Sidebar } from "@/components/sidebar"
import { InstanciaAuthCheck } from "@/components/instancia-auth-check"

export default function PacientesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <InstanciaAuthCheck>
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </InstanciaAuthCheck>
  )
}
