import type React from "react"
import { MedicoAuthCheck } from "@/components/medico-auth-check"
import { MedicoAreaSidebar } from "@/components/medico-area-sidebar"
import { AssinaturaGlobalCheck } from "@/components/assinatura-global-check"

export default function MedicoAreaLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <MedicoAuthCheck>
      <AssinaturaGlobalCheck>
        <div className="h-screen flex overflow-hidden">
          <MedicoAreaSidebar />
          <div className="flex-1 flex flex-col overflow-hidden">{children}</div>
        </div>
      </AssinaturaGlobalCheck>
    </MedicoAuthCheck>
  )
}
