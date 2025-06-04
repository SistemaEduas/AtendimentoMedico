"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { CalendarDays, Users, UserCog, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

// Corrigindo os links para usar a estrutura de pastas correta
const menuItems = [
  { name: "Agendamentos", href: "/agendamentos", icon: CalendarDays },
  { name: "Pacientes", href: "/pacientes", icon: Users },
  { name: "Médico", href: "/medico/login", icon: UserCog },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  // Adicionar função de logout
  const handleLogout = () => {
    // Limpar dados da sessão
    sessionStorage.removeItem("instanciaId")
    sessionStorage.removeItem("instanciaNome")
    sessionStorage.removeItem("instanciaSlug")
    sessionStorage.removeItem("instanciaAutenticada")

    // Redirecionar para a página de login geral
    router.push("/login")
  }

  return (
    <div className="w-64 border-r bg-background h-screen flex flex-col">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold">Clínica Médica</h1>
      </div>
      <div className="flex-1 py-4 px-2">
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="p-4 border-t">
        <Button variant="outline" className="w-full justify-start" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  )
}
