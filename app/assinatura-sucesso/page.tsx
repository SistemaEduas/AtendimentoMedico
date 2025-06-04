"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Loader2 } from "lucide-react"

export default function AssinaturaSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [verificado, setVerificado] = useState(false)
  const [tipo, setTipo] = useState<"medico" | "instancia">("instancia")
  const [id, setId] = useState<string | null>(null)

  useEffect(() => {
    // Obter parâmetros da URL
    const tipoParam = searchParams.get("type") as "medico" | "instancia" | null
    const idParam = searchParams.get("id")

    if (tipoParam) {
      setTipo(tipoParam)
    }

    if (idParam) {
      setId(idParam)
    } else {
      // Se não tiver ID na URL, tenta pegar da sessão
      const sessionId =
        tipoParam === "medico" ? sessionStorage.getItem("medicoId") : sessionStorage.getItem("instanciaId")
      setId(sessionId)
    }

    // Verificar status da assinatura
    if (id || idParam) {
      verificarAssinatura(idParam || id, tipoParam || tipo)
    } else {
      setIsLoading(false)
    }
  }, [searchParams])

  const verificarAssinatura = async (entityId: string | null, entityType: "medico" | "instancia" | null) => {
    if (!entityId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      // Verificar status da assinatura no servidor
      const response = await fetch("/api/verify-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: entityId,
          type: entityType || "instancia",
        }),
      })

      if (!response.ok) {
        throw new Error("Erro ao verificar status da assinatura")
      }

      const data = await response.json()

      if (data.success) {
        setVerificado(true)

        // Armazenar status da assinatura na sessão
        sessionStorage.setItem("assinaturaAtiva", "true")

        // Aguardar 3 segundos e redirecionar
        setTimeout(() => {
          if (entityType === "medico") {
            router.push("/medico/area")
          } else {
            router.push("/")
          }
        }, 3000)
      } else {
        // Tentar novamente após 2 segundos (webhook pode demorar para processar)
        setTimeout(() => {
          verificarAssinatura(entityId, entityType)
        }, 2000)
      }
    } catch (error) {
      console.error("Erro ao verificar assinatura:", error)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {verificado ? "Assinatura confirmada!" : "Verificando assinatura..."}
          </CardTitle>
          <CardDescription>
            {verificado
              ? "Sua assinatura foi processada com sucesso."
              : "Estamos verificando o status da sua assinatura."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6">
          {isLoading ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-center text-sm text-gray-500">
                Aguarde enquanto verificamos o status da sua assinatura...
              </p>
            </div>
          ) : verificado ? (
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <div className="text-center">
                <p className="font-medium">Parabéns! Sua assinatura está ativa.</p>
                <p className="text-sm text-gray-500 mt-1">
                  Você agora tem acesso completo a todas as funcionalidades do sistema.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm text-gray-500">
                Não foi possível verificar sua assinatura. Por favor, entre em contato com o suporte.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            onClick={() => {
              if (tipo === "medico") {
                router.push("/medico/area")
              } else {
                router.push("/")
              }
            }}
            disabled={isLoading && !verificado}
          >
            {verificado ? "Continuar para o sistema" : "Voltar para o início"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
