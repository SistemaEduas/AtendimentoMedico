"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format, parseISO, isBefore, startOfDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ArrowLeft, User, UserPlus, Trash2, AlertTriangle } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function AgendamentosDiaPage({ params }: { params: { data: string } }) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [agendamentosDoDia, setAgendamentosDoDia] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [agendamentoParaExcluir, setAgendamentoParaExcluir] = useState<string | null>(null)
  const [excluindoAgendamento, setExcluindoAgendamento] = useState(false)
  const [instanciaId, setInstanciaId] = useState<string | null>(null)

  // Converter a data do parâmetro para um objeto Date
  const dataSelecionada = parseISO(params.data)

  // Verificar se a data é passada
  const isDataPassada = isBefore(dataSelecionada, startOfDay(new Date()))

  useEffect(() => {
    // Obter o ID da instância da sessão
    const id = sessionStorage.getItem("instanciaId")
    setInstanciaId(id)

    if (id) {
      carregarAgendamentosDoDia(id)
    }
  }, [params.data]) // Adicionando params.data como dependência para recarregar quando a data mudar

  const carregarAgendamentosDoDia = async (instId: string) => {
    setIsLoading(true)
    const dataFormatada = params.data

    try {
      // Limpar qualquer cache que possa estar causando problemas
      await supabase.auth.refreshSession()

      const { data: agendamentos, error } = await supabase
        .from("agendamentos")
        .select(`
        *,
        pacientes (id, nome, telefone, convenio, numero_identificacao),
        medicos (id, nome, especialidade)
      `)
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
      toast({
        title: "Erro ao carregar agendamentos",
        description: "Tente novamente ou contate o suporte.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const excluirAgendamento = async (id: string) => {
    setExcluindoAgendamento(true)
    try {
      const { error } = await supabase.from("agendamentos").delete().eq("id", id)

      if (error) {
        throw error
      }

      toast({
        title: "Agendamento excluído com sucesso",
        description: "O horário foi liberado.",
      })

      // Atualizar a lista de agendamentos
      if (instanciaId) {
        await carregarAgendamentosDoDia(instanciaId)
      }
    } catch (error: any) {
      console.error("Erro ao excluir agendamento:", error)
      toast({
        title: "Erro ao excluir agendamento",
        description: error.message || "Não foi possível excluir o agendamento.",
        variant: "destructive",
      })
    } finally {
      setExcluindoAgendamento(false)
      setAgendamentoParaExcluir(null)
    }
  }

  // Gerar todos os horários possíveis das 08:00 às 17:00 com intervalos de 30 minutos
  const gerarHorarios = () => {
    const horarios = []
    const inicio = 8 // 8:00
    const fim = 17 // 17:00
    const intervalo = 30 // 30 minutos

    for (let hora = inicio; hora <= fim; hora++) {
      for (let minuto = 0; minuto < 60; minuto += intervalo) {
        // Pular 17:30
        if (hora === fim && minuto > 0) continue

        const horarioFormatado = `${hora.toString().padStart(2, "0")}:${minuto.toString().padStart(2, "0")}`
        horarios.push(horarioFormatado)
      }
    }

    return horarios
  }

  const horarios = gerarHorarios()

  // Encontrar agendamento para um horário específico
  const encontrarAgendamento = (horario: string) => {
    return agendamentosDoDia.find((agendamento) => {
      const dataAgendamento = new Date(agendamento.data)
      const horaAgendamento = format(dataAgendamento, "HH:mm")
      return horaAgendamento === horario
    })
  }

  const handleNovoAgendamento = (horario: string) => {
    const [hora, minuto] = horario.split(":").map(Number)
    const dataAgendamento = new Date(dataSelecionada)
    dataAgendamento.setHours(hora, minuto, 0, 0)

    router.push(`/agendamentos/novo?data=${dataAgendamento.toISOString()}`)
  }

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
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">
          Agenda: {format(dataSelecionada, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </h1>
      </div>

      {isDataPassada && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <div>
            <p className="font-medium text-amber-800">Esta é uma data passada</p>
            <p className="text-amber-700">
              Você está visualizando uma agenda de uma data anterior. Não é possível criar novos agendamentos.
            </p>
          </div>
        </div>
      )}

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
                          <div className="flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            Dr(a). {agendamento.medicos?.nome}
                          </div>
                          <div>{agendamento.medicos?.especialidade}</div>
                          {agendamento.pacientes?.telefone && <div>Tel: {agendamento.pacientes?.telefone}</div>}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/pacientes/${agendamento.paciente_id}/editar`}>Editar Paciente</Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setAgendamentoParaExcluir(agendamento.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Excluir
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 ml-4 text-gray-500">
                        <div className="flex items-center">
                          <span>Horário disponível</span>
                          {!isDataPassada && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="ml-2"
                              onClick={() => handleNovoAgendamento(horario)}
                            >
                              <UserPlus className="h-4 w-4 mr-1" />
                              Agendar
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!agendamentoParaExcluir} onOpenChange={(open) => !open && setAgendamentoParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir agendamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita e o horário será
              liberado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluindoAgendamento}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => agendamentoParaExcluir && excluirAgendamento(agendamentoParaExcluir)}
              disabled={excluindoAgendamento}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {excluindoAgendamento ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
