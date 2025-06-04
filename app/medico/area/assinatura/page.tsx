"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { loadStripe } from "@stripe/stripe-js"
import { AlertCircle, Clock } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Inicializar Stripe com a chave pública
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "")

export default function AssinaturaPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [isLoading, setIsLoading] = useState(false)
  const [medicoId, setMedicoId] = useState<string | null>(null)
  const [medicoNome, setMedicoNome] = useState<string | null>(null)
  const [assinaturaInfo, setAssinaturaInfo] = useState<any>(null)
  const [statusAssinatura, setStatusAssinatura] = useState<
    "sem_assinatura" | "ativa" | "cancelada_periodo_valido" | "expirada"
  >("sem_assinatura")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const id = sessionStorage.getItem("medicoId")
    const nome = sessionStorage.getItem("medicoNome")

    setMedicoId(id)
    setMedicoNome(nome)

    if (id) {
      verificarAssinatura(id)
    } else {
      router.push("/medico/login")
    }

    // Verificar parâmetros de URL para mensagens de sucesso/cancelamento
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get("success") === "true") {
      toast({
        title: "Assinatura realizada com sucesso!",
        description: "Sua assinatura foi processada com sucesso.",
      })
      // Atualizar o status da assinatura após o sucesso
      if (id) {
        verificarAssinatura(id)
      }
    } else if (urlParams.get("canceled") === "true") {
      toast({
        title: "Assinatura cancelada",
        description: "O processo de assinatura foi cancelado.",
        variant: "destructive",
      })
    }
  }, [router])

  const periodoAssinaturaValido = (assinatura: any): boolean => {
    if (!assinatura.current_period_end) return false

    const periodoFinal = new Date(assinatura.current_period_end)
    const agora = new Date()

    return agora <= periodoFinal
  }

  const verificarAssinatura = async (id: string) => {
    setIsLoading(true)
    setError(null)
    try {
      // Buscar todas as assinaturas do médico para verificar se já teve alguma
      const { data: todasAssinaturas, error: errorTodas } = await supabase
        .from("assinaturas")
        .select("*")
        .eq("medico_id", id)
        .order("created_at", { ascending: false })

      if (errorTodas) {
        throw errorTodas
      }

      // Se não tem nenhuma assinatura, é "sem_assinatura"
      if (!todasAssinaturas || todasAssinaturas.length === 0) {
        setStatusAssinatura("sem_assinatura")
        setAssinaturaInfo(null)
        setIsLoading(false)
        return
      }

      // Pegar a assinatura mais recente
      const assinaturaRecente = todasAssinaturas[0]
      setAssinaturaInfo(assinaturaRecente)

      // Verificar se tem alguma assinatura ativa (não cancelada e não expirada)
      const assinaturaAtiva = todasAssinaturas.find(
        (assinatura) =>
          assinatura.status === "active" && !assinatura.canceled_at && periodoAssinaturaValido(assinatura),
      )

      if (assinaturaAtiva) {
        setStatusAssinatura("ativa")
        setAssinaturaInfo(assinaturaAtiva)
        setIsLoading(false)
        return
      }

      // Verificar se tem alguma assinatura cancelada mas ainda no período válido
      const assinaturaCancelada = todasAssinaturas.find(
        (assinatura) => assinatura.status === "active" && assinatura.canceled_at && periodoAssinaturaValido(assinatura),
      )

      if (assinaturaCancelada) {
        setStatusAssinatura("cancelada_periodo_valido")
        setAssinaturaInfo(assinaturaCancelada)
        setIsLoading(false)
        return
      }

      // Se chegou até aqui, verificar se a assinatura mais recente realmente expirou
      if (assinaturaRecente.status === "active" && !periodoAssinaturaValido(assinaturaRecente)) {
        // Período expirou, atualizar no banco
        await supabase
          .from("assinaturas")
          .update({
            status: "expired",
            updated_at: new Date().toISOString(),
          })
          .eq("id", assinaturaRecente.id)

        setStatusAssinatura("expirada")
      } else if (assinaturaRecente.status === "expired" || assinaturaRecente.status === "canceled") {
        setStatusAssinatura("expirada")
      } else {
        // Fallback para sem assinatura se não se encaixar em nenhuma categoria
        setStatusAssinatura("sem_assinatura")
      }
    } catch (error) {
      console.error("Erro ao verificar assinatura:", error)
      setError("Não foi possível verificar o status da sua assinatura.")
      setStatusAssinatura("sem_assinatura")
    } finally {
      setIsLoading(false)
    }
  }

  const iniciarAssinatura = async () => {
    if (!medicoId) {
      toast({
        title: "Erro",
        description: "Sessão expirada. Por favor, faça login novamente.",
        variant: "destructive",
      })
      router.push("/medico/login")
      return
    }

    // Verificar se pode assinar (não tem assinatura ativa ou período válido)
    if (statusAssinatura === "ativa" || statusAssinatura === "cancelada_periodo_valido") {
      toast({
        title: "Não é possível assinar",
        description: "Você já possui uma assinatura ativa ou ainda está no período contratado.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setError(null)

    console.log("Iniciando assinatura para médico:", medicoId)

    try {
      // 1. Criar uma sessão de checkout no servidor
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          medicoId,
          plano: "mensal",
        }),
      })

      // Verificar o status da resposta antes de tentar analisá-la como JSON
      if (!response.ok) {
        if (response.status === 500) {
          throw new Error("Erro interno do servidor. Por favor, tente novamente mais tarde.")
        }

        // Para outros erros, tente obter detalhes do JSON se possível
        try {
          const errorData = await response.json()
          throw new Error(errorData.error || errorData.details || `Erro ${response.status}`)
        } catch (jsonError) {
          // Se não conseguir analisar como JSON, use o texto da resposta
          const errorText = await response.text()
          throw new Error(errorText || `Erro ${response.status}`)
        }
      }

      // Se chegou aqui, a resposta está OK, então podemos analisar como JSON
      let data
      try {
        data = await response.json()
      } catch (e) {
        console.error("Resposta não é JSON válido:", e)
        throw new Error("O servidor retornou uma resposta inválida. Por favor, tente novamente mais tarde.")
      }

      if (!data.sessionId) {
        throw new Error("ID da sessão não encontrado na resposta")
      }

      // Redirecionar para o checkout do Stripe usando o método redirectToCheckout
      const stripe = await stripePromise
      if (!stripe) {
        throw new Error("Falha ao carregar Stripe")
      }

      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      })

      if (stripeError) {
        throw new Error(stripeError.message || "Erro ao redirecionar para o checkout")
      }
    } catch (error: any) {
      console.error("Erro ao iniciar assinatura:", error)
      setError(error.message || "Ocorreu um erro ao processar sua solicitação.")
      toast({
        title: "Erro ao iniciar assinatura",
        description: error.message || "Ocorreu um erro ao processar sua solicitação.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  const cancelarAssinatura = async () => {
    if (!medicoId || !assinaturaInfo?.id) {
      toast({
        title: "Erro",
        description: "Informações de assinatura não encontradas.",
        variant: "destructive",
      })
      return
    }

    // Confirmar cancelamento
    const confirmar = window.confirm(
      "Tem certeza que deseja cancelar sua assinatura? Você manterá acesso até o final do período contratado, mas não poderá assinar novamente até que o período expire.",
    )

    if (!confirmar) {
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      // Marcar como cancelada no banco de dados (não cancelar no Stripe ainda)
      const { error: updateError } = await supabase
        .from("assinaturas")
        .update({
          canceled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", assinaturaInfo.id)

      if (updateError) {
        throw updateError
      }

      toast({
        title: "Assinatura cancelada",
        description: "Sua assinatura foi cancelada. Você manterá acesso até o final do período contratado.",
      })

      // Atualizar estado
      await verificarAssinatura(medicoId)
    } catch (error: any) {
      console.error("Erro ao cancelar assinatura:", error)
      setError(error.message || "Ocorreu um erro ao processar sua solicitação.")
      toast({
        title: "Erro ao cancelar assinatura",
        description: error.message || "Ocorreu um erro ao processar sua solicitação.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatarData = (dataString: string) => {
    const data = new Date(dataString)
    return data.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const calcularDiasRestantes = (dataString: string) => {
    const dataFinal = new Date(dataString)
    const agora = new Date()
    const diffTime = dataFinal.getTime() - agora.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

  const renderBotaoAcao = () => {
    switch (statusAssinatura) {
      case "ativa":
        return (
          <Button variant="destructive" className="w-full" onClick={cancelarAssinatura} disabled={isLoading}>
            {isLoading ? "Processando..." : "Cancelar Assinatura"}
          </Button>
        )
      case "cancelada_periodo_valido":
        return (
          <Button
            variant="secondary"
            className="w-full bg-gray-400 hover:bg-gray-400 text-gray-700 cursor-not-allowed"
            disabled
          >
            Assinatura Cancelada - Aguarde o Período Expirar
          </Button>
        )
      case "sem_assinatura":
      case "expirada":
        return (
          <Button className="w-full" onClick={iniciarAssinatura} disabled={isLoading}>
            {isLoading ? "Processando..." : "Assinar Agora"}
          </Button>
        )
      default:
        return null
    }
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center p-4 border-b">
        <h1 className="text-xl font-bold">Assinatura</h1>
        <div className="flex items-center gap-2">
          {medicoNome && <span className="text-gray-600 text-sm">Dr(a). {medicoNome}</span>}
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {statusAssinatura === "cancelada_periodo_valido" && assinaturaInfo && (
            <Alert className="mb-6">
              <Clock className="h-4 w-4" />
              <AlertTitle>Assinatura Cancelada</AlertTitle>
              <AlertDescription>
                Sua assinatura foi cancelada, mas você ainda tem acesso até{" "}
                <strong>{formatarData(assinaturaInfo.current_period_end)}</strong> (
                {calcularDiasRestantes(assinaturaInfo.current_period_end)} dias restantes). Após essa data, você poderá
                assinar novamente.
              </AlertDescription>
            </Alert>
          )}

          <h2 className="text-2xl font-bold mb-6">Plano Premium</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Plano Mensal</CardTitle>
                <CardDescription>Acesso completo a todas as funcionalidades do sistema por 1 mês</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">
                  R$ 99,90<span className="text-sm font-normal">/mês</span>
                </div>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Agendamento ilimitado
                  </li>
                  <li className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Histórico completo de pacientes
                  </li>
                  <li className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Prescrições e exames
                  </li>
                  <li className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Suporte prioritário
                  </li>
                  <li className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Acesso garantido por 1 mês completo
                  </li>
                </ul>
              </CardContent>
              <CardFooter>{renderBotaoAcao()}</CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status da Assinatura</CardTitle>
                <CardDescription>Informações sobre sua assinatura atual</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-4">Carregando informações...</div>
                ) : (
                  <div className="space-y-4">
                    {statusAssinatura === "ativa" && (
                      <>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="font-medium">Assinatura Ativa</span>
                        </div>
                        <div className="border rounded-md p-4 space-y-2">
                          <div className="grid grid-cols-2">
                            <span className="text-gray-500">Plano:</span>
                            <span>Premium Mensal</span>
                          </div>
                          <div className="grid grid-cols-2">
                            <span className="text-gray-500">Valor:</span>
                            <span>R$ 99,90/mês</span>
                          </div>
                          <div className="grid grid-cols-2">
                            <span className="text-gray-500">Acesso até:</span>
                            <span>
                              {assinaturaInfo?.current_period_end
                                ? formatarData(assinaturaInfo.current_period_end)
                                : "Não disponível"}
                            </span>
                          </div>
                          <div className="grid grid-cols-2">
                            <span className="text-gray-500">Dias restantes:</span>
                            <span>
                              {assinaturaInfo?.current_period_end
                                ? calcularDiasRestantes(assinaturaInfo.current_period_end)
                                : "N/A"}{" "}
                              dias
                            </span>
                          </div>
                          <div className="grid grid-cols-2">
                            <span className="text-gray-500">Método de pagamento:</span>
                            <span>•••• •••• •••• {assinaturaInfo?.last_4 || "****"}</span>
                          </div>
                        </div>
                      </>
                    )}

                    {statusAssinatura === "cancelada_periodo_valido" && (
                      <>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          <span className="font-medium">Assinatura Cancelada (Período Ativo)</span>
                        </div>
                        <div className="border rounded-md p-4 space-y-2">
                          <div className="grid grid-cols-2">
                            <span className="text-gray-500">Status:</span>
                            <span>Cancelada</span>
                          </div>
                          <div className="grid grid-cols-2">
                            <span className="text-gray-500">Acesso até:</span>
                            <span>
                              {assinaturaInfo?.current_period_end
                                ? formatarData(assinaturaInfo.current_period_end)
                                : "Não disponível"}
                            </span>
                          </div>
                          <div className="grid grid-cols-2">
                            <span className="text-gray-500">Dias restantes:</span>
                            <span>
                              {assinaturaInfo?.current_period_end
                                ? calcularDiasRestantes(assinaturaInfo.current_period_end)
                                : "N/A"}{" "}
                              dias
                            </span>
                          </div>
                          <div className="grid grid-cols-2">
                            <span className="text-gray-500">Cancelada em:</span>
                            <span>
                              {assinaturaInfo?.canceled_at
                                ? formatarData(assinaturaInfo.canceled_at)
                                : "Não disponível"}
                            </span>
                          </div>
                        </div>
                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                          <p className="text-sm text-yellow-800">
                            <strong>Importante:</strong> Você poderá assinar novamente apenas após o período atual
                            expirar em{" "}
                            {assinaturaInfo?.current_period_end
                              ? formatarData(assinaturaInfo.current_period_end)
                              : "data não disponível"}
                            .
                          </p>
                        </div>
                      </>
                    )}

                    {statusAssinatura === "sem_assinatura" && (
                      <>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                          <span className="font-medium">Sem Assinatura Ativa</span>
                        </div>
                        <p className="text-gray-500">
                          Você não possui uma assinatura ativa no momento. Assine agora para ter acesso completo a todas
                          as funcionalidades do sistema por 1 mês completo.
                        </p>
                      </>
                    )}

                    {statusAssinatura === "expirada" && (
                      <>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span className="font-medium">Assinatura Expirada</span>
                        </div>
                        <p className="text-gray-500">
                          Sua assinatura anterior expirou. Você pode assinar novamente para ter acesso completo ao
                          sistema.
                        </p>
                        {assinaturaInfo && (
                          <div className="border rounded-md p-4 space-y-2">
                            <div className="grid grid-cols-2">
                              <span className="text-gray-500">Última assinatura:</span>
                              <span>Premium Mensal</span>
                            </div>
                            <div className="grid grid-cols-2">
                              <span className="text-gray-500">Expirou em:</span>
                              <span>
                                {assinaturaInfo?.current_period_end
                                  ? formatarData(assinaturaInfo.current_period_end)
                                  : "Não disponível"}
                              </span>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
