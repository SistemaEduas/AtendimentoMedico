"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AssinaturaNecessariaPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const redirecionarParaLoginMedico = () => {
    // Armazenar na sessão que o usuário deve ser redirecionado para a página de assinatura após o login
    sessionStorage.setItem("redirecionarAposLogin", "/medico/area/assinatura")

    // Redirecionar para a página de login do médico
    router.push("/medico/login")
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Assinatura Necessária</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center">Para acessar esta funcionalidade, é necessário ter uma assinatura ativa.</p>

          <Button className="w-full" size="lg" onClick={redirecionarParaLoginMedico} disabled={isLoading}>
            {isLoading ? "Processando..." : "Continuar para assinatura"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
