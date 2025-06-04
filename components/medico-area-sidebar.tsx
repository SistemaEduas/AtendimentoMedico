"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LogOut, CreditCard, CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function MedicoAreaSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    // Limpar dados da sessão do médico
    sessionStorage.removeItem("medicoId")
    sessionStorage.removeItem("medicoNome")
    sessionStorage.removeItem("medicoEmail")
    sessionStorage.removeItem("medicoAutenticado")
    sessionStorage.removeItem("medicoAuthId")

    // Redirecionar para a página de login geral
    router.push("/login")
  }

  return (
    <aside className="w-64 bg-white border-r h-screen flex flex-col">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold">Área do Médico</h1>
      </div>
      <div className="flex-1 py-4">
        <nav className="space-y-2 px-2">
          <Link
            href="/medico/area/agendamentos"
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              pathname.includes("/medico/area/agendamentos")
                ? "bg-gray-900 text-white"
                : "text-gray-700 hover:bg-gray-100",
            )}
          >
            <CalendarDays className="h-4 w-4" />
            Agendamentos
          </Link>

          <Link
            href="/medico/area/assinatura"
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              pathname === "/medico/area/assinatura" ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100",
            )}
          >
            <CreditCard className="h-4 w-4" />
            Assinatura
          </Link>
        </nav>
      </div>
      <div className="p-4 border-t">
        <Button variant="outline" className="w-full justify-start" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>
    </aside>
  )
}
