"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { format, isBefore, isSameDay, addMonths, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

export default function AgendamentosPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [diasComVagas, setDiasComVagas] = useState<Date[]>([])
  const [diasSemVagas, setDiasSemVagas] = useState<Date[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [instanciaId, setInstanciaId] = useState<string | null>(null)
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [diasDoMes, setDiasDoMes] = useState<Date[]>([])
  const [erro, setErro] = useState<string | null>(null)

  // Inicializar dias do mês atual e dados de demonstração
  useEffect(() => {
    const inicio = startOfMonth(currentMonth)
    const fim = endOfMonth(currentMonth)
    const dias = eachDayOfInterval({ start: inicio, end: fim })
    setDiasDoMes(dias)

    // Adicionar dados de demonstração enquanto a consulta ao banco de dados é processada
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0) // Normalizar para início do dia

    const diasDisponiveis: Date[] = []
    const diasIndisponiveis: Date[] = []

    dias.forEach((dia) => {
      // Pular finais de semana
      if (dia.getDay() === 0 || dia.getDay() === 6) return

      // Verificar se é uma data passada
      const isDataPassada = isBefore(dia, hoje)

      // Não aplicar cores para datas passadas
      if (isDataPassada) return

      // Todas as datas futuras que não são finais de semana são marcadas como disponíveis (verde)
      diasDisponiveis.push(new Date(dia))
    })

    setDiasComVagas(diasDisponiveis)
    setDiasSemVagas(diasIndisponiveis) // Array vazio, nenhuma data sem vagas

    // Carregar dados reais do banco de dados
    if (instanciaId) {
      carregarDisponibilidadeDias(instanciaId)
    }
  }, [currentMonth, instanciaId])

  // Carregar dados da instância
  useEffect(() => {
    const carregarDados = async () => {
      try {
        // Primeiro, tente obter o ID da instância do sessionStorage
        const id = sessionStorage.getItem("instanciaId")
        if (id) {
          console.log("ID da instância obtido do sessionStorage:", id)
          setInstanciaId(id)
          return
        }

        // Se não encontrar no sessionStorage, tente obter da sessão do usuário
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          console.log("Usuário não autenticado")
          setErro("Usuário não autenticado. Faça login para continuar.")
          return
        }

        const instId = session?.user?.user_metadata?.instancia_id
        if (instId) {
          console.log("ID da instância obtido dos metadados do usuário:", instId)
          setInstanciaId(instId)
          // Salvar no sessionStorage para uso futuro
          sessionStorage.setItem("instanciaId", instId)
        } else {
          console.log("ID da instância não encontrado nos metadados do usuário")
          setErro("Não foi possível identificar a instância. Tente fazer login novamente.")
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
        setErro("Erro ao carregar dados. Tente novamente mais tarde.")
      }
    }

    carregarDados()
  }, [supabase])

  // Desabilitar apenas finais de semana, permitindo datas passadas
  const desabilitarDatas = (date: Date) => {
    return date.getDay() === 0 || date.getDay() === 6
  }

  const carregarDisponibilidadeDias = async (instId: string) => {
    setIsLoading(true)
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0) // Normalizar para início do dia

    // Definir data inicial como o primeiro dia do mês atual
    const dataInicial = startOfMonth(currentMonth)
    // Definir data final como o último dia do mês atual
    const dataFinal = endOfMonth(currentMonth)

    try {
      // Usar a função RPC que criamos para contar agendamentos por dia
      const { data: agendamentosPorDia, error } = await supabase.rpc("contar_agendamentos_por_dia", {
        instancia_id_param: instId,
        data_inicial_param: dataInicial.toISOString().split("T")[0],
        data_final_param: dataFinal.toISOString().split("T")[0],
      })

      if (error) {
        console.error("Erro ao buscar agendamentos:", error)

        // Se a função RPC falhar, tentar uma consulta direta
        console.log("Função RPC falhou, tentando consulta direta")

        const { data: agendamentosSimples, error: erroSimples } = await supabase
          .from("agendamentos")
          .select("data")
          .eq("instancia_id", instId)
          .gte("data", dataInicial.toISOString().split("T")[0])
          .lte("data", dataFinal.toISOString().split("T")[0])

        if (erroSimples) {
          console.error("Erro na consulta direta:", erroSimples)
          setErro("Erro ao buscar agendamentos. Usando dados de demonstração.")
          setIsLoading(false)
          return
        }

        // Contar manualmente os agendamentos por dia
        const contagemPorDia = new Map<string, number>()

        if (agendamentosSimples && agendamentosSimples.length > 0) {
          agendamentosSimples.forEach((agendamento) => {
            // Extrair apenas a data (sem a hora) do timestamp
            const dataCompleta = new Date(agendamento.data)
            const dataFormatada = format(dataCompleta, "yyyy-MM-dd")

            if (contagemPorDia.has(dataFormatada)) {
              contagemPorDia.set(dataFormatada, contagemPorDia.get(dataFormatada)! + 1)
            } else {
              contagemPorDia.set(dataFormatada, 1)
            }
          })
        }

        // Processar os dados contados manualmente
        processarContagemPorDia(contagemPorDia)
        setIsLoading(false)
        return
      }

      // Processar os resultados da função RPC
      if (agendamentosPorDia && agendamentosPorDia.length > 0) {
        const contagemPorDia = new Map<string, number>()

        agendamentosPorDia.forEach((item) => {
          // Extrair apenas a data (sem a hora) do timestamp
          const dataCompleta = new Date(item.data)
          const dataFormatada = format(dataCompleta, "yyyy-MM-dd")
          contagemPorDia.set(dataFormatada, Number(item.contagem))
        })

        processarContagemPorDia(contagemPorDia)
      } else {
        console.log("Nenhum agendamento encontrado para o período")
      }
    } catch (error) {
      console.error("Erro ao carregar disponibilidade:", error)
      setErro("Erro ao carregar disponibilidade. Usando dados de demonstração.")
    } finally {
      setIsLoading(false)
    }
  }

  // Função para processar a contagem de agendamentos por dia
  const processarContagemPorDia = (contagemPorDia: Map<string, number>) => {
    // Definir limite máximo de agendamentos por dia
    const limiteAgendamentosPorDia = 18

    // Separar dias com vagas e sem vagas
    const comVagas: Date[] = []
    const semVagas: Date[] = []

    // Verificar cada dia do mês
    const dataInicial = startOfMonth(currentMonth)
    const dataFinal = endOfMonth(currentMonth)
    const diasDoMesAtual = eachDayOfInterval({ start: dataInicial, end: dataFinal })
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0) // Normalizar para início do dia

    diasDoMesAtual.forEach((dia) => {
      // Pular finais de semana
      if (dia.getDay() === 0 || dia.getDay() === 6) return

      // Verificar se é uma data passada
      const isDataPassada = isBefore(dia, hoje)

      // Não aplicar cores para datas passadas
      if (isDataPassada) return

      const dataFormatada = format(dia, "yyyy-MM-dd")
      const quantidadeAgendamentos = contagemPorDia.get(dataFormatada) || 0

      if (quantidadeAgendamentos >= limiteAgendamentosPorDia) {
        // Dia sem vagas (vermelho)
        semVagas.push(new Date(dia))
      } else {
        // Dia com vagas (verde)
        comVagas.push(new Date(dia))
      }
    })

    setDiasComVagas(comVagas)
    setDiasSemVagas(semVagas)
  }

  const handleSelectDate = (date: Date) => {
    // Permitir acesso a qualquer data, incluindo passadas
    router.push(`/agendamentos/dia/${format(date, "yyyy-MM-dd")}`)
  }

  const verificarDisponibilidade = (data: Date) => {
    // Verificar se é final de semana
    if (desabilitarDatas(data)) return "desabilitado"

    // Verificar se é uma data passada
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0) // Normalizar para início do dia
    const isDataPassada = isBefore(data, hoje)

    // Datas passadas não têm cor
    if (isDataPassada) return "neutro"

    // Verificar se está nos dias sem vagas
    if (diasSemVagas.some((d) => isSameDay(d, data))) return "indisponivel"

    // Verificar se está nos dias com vagas
    if (diasComVagas.some((d) => isSameDay(d, data))) return "disponivel"

    // Se não estiver em nenhuma lista, considerar como neutro
    return "neutro"
  }

  if (erro) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center p-6 max-w-md">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Erro</h2>
          <p className="mb-4">{erro}</p>
          <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Cabeçalho - Ajustado para alinhar com "Clínica Médica" */}
      <div className="border-b">
        <div className="container mx-auto px-6">
          <h1 className="text-xl font-semibold py-3">Agendamentos</h1>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center w-full py-2 border-b">
          <h2 className="text-lg font-medium mb-2">Selecione uma Data</h2>

          <div className="flex justify-center gap-8 mb-2">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-green-50 border border-green-800 mr-2"></div>
              <span className="text-sm">Dias com vagas disponíveis</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-red-50 border border-red-800 mr-2"></div>
              <span className="text-sm">Dias sem vagas disponíveis</span>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <p>Carregando calendário...</p>
          </div>
        ) : (
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
                {diasDoMes.map((dia, index) => {
                  const disponibilidade = verificarDisponibilidade(dia)
                  const isHoje = isSameDay(dia, new Date())

                  // Verificar se é uma data passada
                  const hoje = new Date()
                  hoje.setHours(0, 0, 0, 0) // Normalizar para início do dia
                  const isDataPassada = isBefore(dia, hoje)

                  return (
                    <Button
                      key={`dia-${index}-${dia.toISOString()}`}
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
                      {disponibilidade === "disponivel" && !isDataPassada && (
                        <span className="text-xs leading-tight">Disponível</span>
                      )}
                    </Button>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
