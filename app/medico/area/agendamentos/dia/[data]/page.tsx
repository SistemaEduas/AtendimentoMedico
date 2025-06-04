"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ArrowLeft, Stethoscope } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { gerarHorarios } from "@/lib/utils"

export default function MedicoAgendamentosDiaPage({ params }: { params: { data: string } }) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [agendamentosDoDia, setAgendamentosDoDia] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [medicoEmail, setMedicoEmail] = useState<string | null>(null)
  const [medicoId, setMedicoId] = useState<string | null>(null)
  const [medicoNome, setMedicoNome] = useState<string | null>(null)
  const [instanciaId, setInstanciaId] = useState<string | null>(null)

  // Converter a data do parâmetro para um objeto Date
  const dataSelecionada = parseISO(params.data)

  useEffect(() => {
    const email = sessionStorage.getItem("medicoEmail")
    const nome = sessionStorage.getItem("medicoNome")
    const id = sessionStorage.getItem("medicoId")
    const authId = sessionStorage.getItem("medicoAuthId")
    const instId = sessionStorage.getItem("instanciaId")

    setMedicoEmail(email)
    setMedicoNome(nome)
    setMedicoId(id)
    setInstanciaId(instId)

    if (id && instId) {
      carregarAgendamentosDoDia(id, instId)
    } else {
      // Se não tiver ID do médico na sessão, redirecionar para login
      toast({
        title: "Sessão expirada",
        description: "Por favor, faça login novamente.",
        variant: "destructive",
      })
      router.push("/login")
    }
  }, [params.data, router])

  const carregarAgendamentosDoDia = async (id: string, instId: string) => {
    setIsLoading(true)
    const dataFormatada = params.data

    try {
      const { data: agendamentos, error } = await supabase
        .from("agendamentos")
        .select(`
          *,
          pacientes (id, nome, telefone, convenio, numero_identificacao),
          medicos (id, nome, especialidade)
        `)
        .eq("medico_id", id)
        .eq("instancia_id", instId) // Filtrar por instância
        .gte("data", `${dataFormatada}T00:00:00`)
        .lt("data", `${dataFormatada}T23:59:59`)
        .order("data", { ascending: true })

      if (error) {
        console.error("Erro ao carregar agendamentos:", error)
        throw error
      }

      setAgendamentosDoDia(agendamentos || [])
    } catch (error) {
      console.error("Erro ao carregar agendamentos:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const encontrarAgendamento = (horario: string) => {
    return agendamentosDoDia.find((agendamento) => {
      const dataAgendamento = new Date(agendamento.data)
      const horaAgendamento = format(dataAgendamento, "HH:mm")
      return horaAgendamento === horario
    })
  }

  const horarios = gerarHorarios()

  function getStatusBadge(status: string) {
    switch (status) {
      case "agendado":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Agendado
          </Badge>
        )
      case "concluido":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Concluído
          </Badge>
        )
      case "cancelado":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Cancelado
          </Badge>
        )
      case "nao_compareceu":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            Não Compareceu
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <>
      {/* Cabeçalho */}
      <div className="flex justify-between items-center p-4 border-b">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push("/medico/area/agendamentos")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">
            Agenda: {format(dataSelecionada, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {medicoNome && <span className="text-gray-600 text-sm">Dr(a). {medicoNome}</span>}
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 p-4 overflow-auto">
        <Card>
          <CardHeader>
            <CardTitle>Horários</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">Carregando agendamentos...</div>
            ) : (
              <div className="space-y-1">
                {horarios.map((horario) => {
                  const agendamento = encontrarAgendamento(horario)
                  return (
                    <div
                      key={horario}
                      className={`p-3 rounded-md border flex items-center ${
                        agendamento ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="w-16 font-medium text-gray-700">{horario}</div>
                      {agendamento ? (
                        <div className="flex-1 ml-4">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">
                              {agendamento.pacientes?.nome}{" "}
                              {agendamento.pacientes?.numero_identificacao && (
                                <span className="text-sm text-gray-500">
                                  (ID: {agendamento.pacientes?.numero_identificacao})
                                </span>
                              )}
                            </div>
                            <div>{getStatusBadge(agendamento.status)}</div>
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-4 mt-1">
                            {agendamento.pacientes?.telefone && <div>Tel: {agendamento.pacientes?.telefone}</div>}
                          </div>
                          <div className="flex gap-2 mt-2">
                            {agendamento.status === "agendado" && (
                              <Button variant="default" size="sm" asChild>
                                <Link href={`/atendimentos/${agendamento.id}`}>
                                  <Stethoscope className="h-4 w-4 mr-1" />
                                  Atender
                                </Link>
                              </Button>
                            )}
                            {agendamento.status === "concluido" && (
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/atendimentos/${agendamento.id}`}>Ver Atendimento</Link>
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 ml-4 text-gray-500">
                          <span>Horário livre</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
