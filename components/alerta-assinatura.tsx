"use client"

import { AlertTriangle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface AlertaAssinaturaProps {
  titulo: string
  descricao: string
  medicoId?: string | null
}

export function AlertaAssinatura({ titulo, descricao, medicoId }: AlertaAssinaturaProps) {
  console.log("AlertaAssinatura renderizado com:", { titulo, descricao, medicoId })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-6 w-6 text-red-500" />
          <h2 className="text-xl font-bold text-red-500">{titulo}</h2>
        </div>

        <p className="mb-6 text-gray-700">{descricao}</p>

        <div className="flex flex-col gap-3">
          <Link href="/" className="w-full">
            <Button variant="default" size="lg" className="w-full">
              Voltar para o Início
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
