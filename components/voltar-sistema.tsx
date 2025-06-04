"use client"

import { Button } from "@/components/ui/button"
import { Home } from "lucide-react"
import Link from "next/link"

export function VoltarSistema() {
  return (
    <div className="fixed top-4 right-4">
      <Button variant="outline" size="sm" asChild>
        <Link href="/agendamentos">
          <Home className="h-4 w-4 mr-2" />
          Voltar ao Sistema
        </Link>
      </Button>
    </div>
  )
}
