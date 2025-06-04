"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import {
  format,
  addDays,
  isBefore,
  startOfDay,
  isSameDay,
  addMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
} from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

export default function MedicoAgendamentosPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [diasComVagas, setDiasComVagas] = useState<Date[]>([])
  const [diasSemVagas, setDiasSemVagas] = useState<Date[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [medicoEmail, setMedicoEmail] = useState<string | null>(null)
  const [medicoId, setMedicoId] = useState<string | null>(null)
  const [medicoNome, setMedicoNome] = useState<string | null>(null)
  const [instanciaId, setInstanciaId] = useState<string | null>(null)
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [diasDoMes, setDiasDoMes] = useState<Date[]>([])

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
      carregarDisponibilidadeDias(id, instId)
    } else {
      // Se não tiver ID do médico na sessão, redirecionar para login
      toast({
        title: "Sessão expirada",
        description: "Por favor, faça login novamente.",
        variant: "destructive",
      })
      router.push("/login")
    }
  }, [router])

  useEffect(() => {
    // Atualizar os dias do mês quando o mês atual mudar
    const inicio = startOfMonth(currentMonth)
    const fim = endOfMonth(currentMonth)
    const dias = eachDayOfInterval({ start: inicio, end: fim })
    setDiasDoMes(dias)
  }, [currentMonth])

  // Desabilitar apenas finais de semana, permitindo datas passadas
  const desabilitarDatas = (date: Date) => {
    return date.getDay() === 0 || date.getDay() === 6
  }

  const carregarDisponibilidadeDias = async (id: string, instId: string) => {
    setIsLoading(true)
    const hoje = new Date()
    // Definir data inicial como 1º de janeiro de 5 anos atrás para ter acesso a todo o histórico
    const dataInicial = new Date(hoje.getFullYear() - 5, 0, 1)
    const dataFinal = addDays(hoje, 365)

    try {
      // Buscar todos os agendamentos no período, incluindo todo o histórico
      const { data: agendamentos, error } = await supabase
        .from("agendamentos")
        .select("data")
        .eq("medico_id", id)
        .eq("instancia_id", instId)
        .gte("data", dataInicial.toISOString())
        .lt("data", dataFinal.toISOString())

      if (error) throw error

      // Contar agendamentos por dia
      const contagemPorDia = new Map<string, number>()

      if (agendamentos) {
        agendamentos.forEach((agendamento) => {
          const data = new Date(agendamento.data)
          const dataFormatada = format(data, "yyyy-MM-dd")

          if (contagemPorDia.has(dataFormatada)) {
            contagemPorDia.set(dataFormatada, contagemPorDia.get(dataFormatada)! + 1)
          } else {
            contagemPorDia.set(dataFormatada, 1)
          }
        })
      }

      // Definir limite máximo de agendamentos por dia
      const limiteAgendamentosPorDia = 18

      // Separar dias com vagas e sem vagas
      const comVagas: Date[] = []
      const semVagas: Date[] = []

      // Calcular o número total de dias no período
      const diasTotais = Math.floor((dataFinal.getTime() - dataInicial.getTime()) / (1000 * 60 * 60 * 24))

      // Verificar cada dia no período
      for (let i = 0; i <= diasTotais; i++) {
        const data = new Date(dataInicial)
        data.setDate(dataInicial.getDate() + i)

        // Pular finais de semana
        if (data.getDay() === 0 || data.getDay() === 6) continue

        // Verificar se é uma data passada
        const isDataPassada = isBefore(data, startOfDay(hoje))

        // Não aplicar cores para datas passadas
        if (isDataPassada) continue

        const dataFormatada = format(data, "yyyy-MM-dd")
        const quantidadeAgendamentos = contagemPorDia.get(dataFormatada) || 0

        // Verificar se é o dia 2 de maio
        const isMaioDois = data.getDate() === 2 && data.getMonth() === 4 // Maio é mês 4 (0-indexed)

        // Dia 2 de maio sempre tem vagas
        if (isMaioDois) {
          comVagas.push(new Date(data))
        } else if (quantidadeAgendamentos >= limiteAgendamentosPorDia) {
          semVagas.push(new Date(data))
        } else {
          comVagas.push(new Date(data))
        }
      }

      setDiasComVagas(comVagas)
      setDiasSemVagas(semVagas)
    } catch (error) {
      console.error("Erro ao carregar disponibilidade:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectDate = (date: Date) => {
    // Permitir acesso a qualquer data, incluindo passadas
    router.push(`/medico/area/agendamentos/dia/${format(date, "yyyy-MM-dd")}`)
  }

  const verificarDisponibilidade = (data: Date) => {
    // Verificar se é final de semana
    if (desabilitarDatas(data)) return "desabilitado"

    // Verificar se está nos dias com vagas
    if (diasComVagas.some((d) => isSameDay(d, data))) return "disponivel"

    // Verificar se está nos dias sem vagas
    if (diasSemVagas.some((d) => isSameDay(d, data))) return "indisponivel"

    // Se não estiver em nenhuma lista, considerar como neutro
    return "neutro"
  }

  return (
    <>
      {/* Cabeçalho */}
      <div className="flex justify-between items-center p-4 border-b">
        <h1 className="text-xl font-bold">Meus Agendamentos</h1>
        <div className="flex items-center gap-2">
          {medicoNome && <span className="text-gray-600 text-sm">Dr(a). {medicoNome}</span>}
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col overflow-auto">
        <div className="flex items-center justify-center w-full py-2 border-b">
          <h2 className="text-lg font-medium">Selecione uma Data</h2>
        </div>

        {!isLoading && (
          <div className="flex-1 flex flex-col items-center p-2">
            <div className="w-full max-w-4xl mx-auto flex items-center justify-center space-x-3 mb-2 mt-1">
              <button
                onClick={() => {
                  setCurrentMonth(addMonths(currentMonth, -1))
                }}
                className="h-9 w-9 bg-transparent p-0 opacity-70 hover:opacity-100 flex items-center justify-center"
                aria-label="Mês anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <h2 className="text-lg font-medium">{format(currentMonth, "MMMM yyyy", { locale: ptBR })}</h2>

              <button
                onClick={() => {
                  setCurrentMonth(addMonths(currentMonth, 1))
                }}
                className="h-9 w-9 bg-transparent p-0 opacity-70 hover:opacity-100 flex items-center justify-center"
                aria-label="Próximo mês"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 w-full max-w-4xl mx-auto bg-white rounded-lg shadow p-3">
              <div className="grid grid-cols-7 gap-x-1 gap-y-0 mb-2 text-center">
                <div className="text-sm font-medium text-gray-500">Dom</div>
                <div className="text-sm font-medium text-gray-500">Seg</div>
                <div className="text-sm font-medium text-gray-500">Ter</div>
                <div className="text-sm font-medium text-gray-500">Qua</div>
                <div className="text-sm font-medium text-gray-500">Qui</div>
                <div className="text-sm font-medium text-gray-500">Sex</div>
                <div className="text-sm font-medium text-gray-500">Sáb</div>
              </div>

              <div className="grid grid-cols-7 gap-x-1 gap-y-2">
                {/* Espaços vazios para alinhar o primeiro dia do mês */}
                {Array.from({ length: diasDoMes[0]?.getDay() || 0 }).map((_, index) => (
                  <div key={`empty-${index}`} className="h-[3.5rem] rounded-md"></div>
                ))}

                {/* Dias do mês */}
                {diasDoMes.map((dia) => {
                  const disponibilidade = verificarDisponibilidade(dia)
                  const isHoje = isSameDay(dia, new Date())

                  return (
                    <Button
                      key={dia.toString()}
                      variant="outline"
                      className={`h-[3.5rem] flex flex-col items-center justify-center p-0 ${
                        isHoje ? "border-2 border-blue-500" : ""
                      } ${
                        disponibilidade === "disponivel"
                          ? "bg-green-50 hover:bg-green-100 text-green-800"
                          : disponibilidade === "indisponivel"
                            ? "bg-red-50 hover:bg-red-100 text-red-800"
                            : disponibilidade === "desabilitado"
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-white hover:bg-gray-50"
                      }`}
                      onClick={() => {
                        if (disponibilidade !== "desabilitado") {
                          handleSelectDate(dia)
                        }
                      }}
                      disabled={disponibilidade === "desabilitado"}
                    >
                      <span className="text-sm font-medium">{format(dia, "d")}</span>
                      {disponibilidade === "disponivel" && <span className="text-xs leading-tight"></span>}
                      {disponibilidade === "indisponivel" && <span className="text-xs leading-tight"></span>}
                    </Button>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
