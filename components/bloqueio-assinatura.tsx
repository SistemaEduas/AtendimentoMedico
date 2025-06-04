"use client"

import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface BloqueioAssinaturaProps {
  children: ReactNode
  titulo?: string
  descricao?: string
}

export function BloqueioAssinatura({
  children,
  titulo = "Acesso Bloqueado",
  descricao = "Seu acesso está bloqueado. Por favor, entre em contato com o administrador para liberar seu acesso.",
}: BloqueioAssinaturaProps) {
  const router = useRouter()

  return (
    <div className="h-[calc(100vh-100px)] w-full flex items-center justify-center">
      <Card className="w-full max-w-md border shadow-sm mx-4">
        <CardHeader className="text-center pb-2">
          <CardTitle>{titulo}</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p>{descricao}</p>
        </CardContent>
        <CardFooter className="flex justify-center pt-2">
          <Button className="bg-[#0f172a] hover:bg-[#1e293b]" onClick={() => router.push("/medico/area/assinatura")}>
            Continuar para assinatura
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
